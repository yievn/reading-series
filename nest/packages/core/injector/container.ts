import { DynamicModule, Provider } from '@nestjs/common';
import {
  EnhancerSubtype,
  GLOBAL_MODULE_METADATA,
} from '@nestjs/common/constants';
import { Injectable, Type } from '@nestjs/common/interfaces';
import { ApplicationConfig } from '../application-config';
import { DiscoverableMetaHostCollection } from '../discovery/discoverable-meta-host-collection';
import {
  CircularDependencyException,
  UndefinedForwardRefException,
  UnknownModuleException,
} from '../errors/exceptions';
import { InitializeOnPreviewAllowlist } from '../inspector/initialize-on-preview.allowlist';
import { SerializedGraph } from '../inspector/serialized-graph';
import { REQUEST } from '../router/request/request-constants';
import { ModuleCompiler, ModuleFactory } from './compiler';
import { ContextId } from './instance-wrapper';
import { InternalCoreModule } from './internal-core-module/internal-core-module';
import { InternalProvidersStorage } from './internal-providers-storage';
import { Module } from './module';
import { ModuleTokenFactory } from './module-token-factory';
import { ModulesContainer } from './modules-container';

type ModuleMetatype = Type<any> | DynamicModule | Promise<DynamicModule>;
/**
 * 是一个类型定义，通常用来表示模块的作用域或者依赖模块的上下文，具体来说它是一个包含
 * 类型（通常是类）的数组，这些类型代表了模块的依赖关系或者是模块在应用中层次结构。
 * 
 * ModuleScope用于定义一个模块在依赖注入系统中的上下文，在nest中，模块可以imports其他模块，形成一个层次化的结构。
 * ModuleScope通常用来追踪这种结构，确保依赖注入时能正确解析依赖项。
 */
type ModuleScope = Type<any>[];

/**
 * NestContainer类是Nest框架的核心部分，负责管理和维护整个应用的模块、提供者、控制器等。
 * 它是一个依赖注入容器，用于实例化和存储应用中的所有依赖项
 */
export class NestContainer {
  /**存储全局模块的集合。全局模块在整个应用中共享无需在每个模块中单独导入 */
  private readonly globalModules = new Set<Module>();
  /**用于生成模块标识符的工厂实例 */
  private readonly moduleTokenFactory = new ModuleTokenFactory();
  /**编译模块的实例，用于提取模块的类和元数据和token */
  private readonly moduleCompiler = new ModuleCompiler(this.moduleTokenFactory);
  /**存储所有模块的容器，一个继承自Map的类的实例 */
  private readonly modules = new ModulesContainer();
  /**存储动态模块元数据的映射 */
  private readonly dynamicModulesMetadata = new Map<
    string,
    Partial<DynamicModule>
  >();
  /**用于访问和配置内部http适配器 */
  private readonly internalProvidersStorage = new InternalProvidersStorage();
  /**存储序列化的依赖图 */
  private readonly _serializedGraph = new SerializedGraph();
  /**存储内部核心模块的引用 */
  private internalCoreModule: Module;

  constructor(
    /**存储应用配置 */
    private readonly _applicationConfig: ApplicationConfig = undefined,
  ) {}
/**返回序列化的依赖图 */
  get serializedGraph(): SerializedGraph {
    return this._serializedGraph;
  }
  // 返回应用配置
  get applicationConfig(): ApplicationConfig | undefined {
    return this._applicationConfig;
  }
  // 设置HTTP适配器
  public setHttpAdapter(httpAdapter: any) {
    /**设置当前适配器 */
    this.internalProvidersStorage.httpAdapter = httpAdapter;

    /**确保在调用以下host.httpAdapter时不会出错 */
    if (!this.internalProvidersStorage.httpAdapterHost) {
      return;
    }
    const host = this.internalProvidersStorage.httpAdapterHost;
    host.httpAdapter = httpAdapter;
  }
  /**获取当前适配器引用 */
  public getHttpAdapterRef() {
    return this.internalProvidersStorage.httpAdapter;
  }

  public getHttpAdapterHostRef() {
    return this.internalProvidersStorage.httpAdapterHost;
  }
  /**
   * 
   * @param metatype 这是要添加的模块的类型，它可以是一个类（Type<any>），一个动态模块（DynamicModule），
   * 或者一个返回DynamicModule的Promise
   * @param scope 这是一个数组，表示当前模块的作用域或依赖路径。它通常用于处理模块间依赖关系和确保正确的模块加载顺序
   * @returns 
   * 
   * 本质上，addModule添加模块的过程可能存在一个递归调用的过程（当模块是动态模块的时候），模块可能
   * 导入其他模块，这在处理动态元数据时因为存在imports，会调用addModule进一步处理imports
   * 中的模块。
   * 
   * 相当于当前模块为根节点，通过imports的方式向子孙节点扩散，不断addModule，直到
   * 每个分支的叶子节点才结束（也就是无imports），这是所有存在直接或间接依赖的模块到会
   * 被添加到模块容器moduleContainer中。
   */
  public async addModule(
    metatype: ModuleMetatype,
    scope: ModuleScope,
  ): Promise<
    | {
        moduleRef: Module;
        inserted: boolean;
      }
    | undefined
  > {
    // In DependenciesScanner#scanForModules we already check for undefined or invalid modules
    // We still need to catch the edge-case of `forwardRef(() => undefined)`
    /**检查metatype，如果不存在，抛出异常，表示前向引用未定义 */
    if (!metatype) {
      throw new UndefinedForwardRefException(scope);
    }
    /**
     * 使用moduleCompiler.compile解析metatype，解析得到模块的元数据和相关动态模块数据，生成一个包含
     * 模块类型、动态元数据和模块标识符的对象
     * 
     * 
     * 动态模块存在dynamicMetadata，如果是@Module()装饰的类，
     * 那么dynamicMetadata会是undefined
    */
    const { type, dynamicMetadata, token } =
      await this.moduleCompiler.compile(metatype);
    /**在模块容器中存在token对应的模块时，那就直接返回已经缓存过的模块引用 */
    if (this.modules.has(token)) {
      return {
        /**模块实例引用 */
        moduleRef: this.modules.get(token),
        /**表示已经被插入 */
        inserted: true,
      };
    }
    /**
     * 如果模块未被缓存，调用 setModule方法创建一个新的Module实例，
     * 并将其添加到ModulesContainer中。然后更新模块作用域，添加动态模块元数据，并处理全局模块的注册
     * 
     * 返回一个包含新模块引用和inserted标志的对象。如果模块是新插入的，inserted为true。
    */
    return {
      moduleRef: await this.setModule(
        {
          token,
          type,
          dynamicMetadata,
        },
        scope,
      ),
      inserted: true,
    };
  }
  /**
   * 
   * @param metatypeToReplace 要被替换的模块的类型。这可以是一个类（Type<any>），一个动态模块（DynamicModule），
   * 或者一个返回 DynamicModule 的 Promise。
   * @param newMetatype 新模块的类型，用于替换旧模块。
   * @param scope 模块的作用域，这是一个数组，表示当前模块的依赖路径。
   * 它通常用于处理模块间的依赖关系和确保正确的模块加载顺序。
   * @returns 
   */
  public async replaceModule(
    metatypeToReplace: ModuleMetatype,
    newMetatype: ModuleMetatype,
    scope: ModuleScope,
  ): Promise<
    | {
        moduleRef: Module;
        inserted: boolean;
      }
    | undefined
  > {
    // In DependenciesScanner#scanForModules we already check for undefined or invalid modules
    // We still need to catch the edge-case of `forwardRef(() => undefined)`
    if (!metatypeToReplace || !newMetatype) {
      throw new UndefinedForwardRefException(scope);
    }
    /**
     * 使用moduleCompiler.compile解析metatypeToReplace和newMetatype，
     * 解析得到模块的元数据和相关动态模块数据，生成一个包含
     * 模块类型、动态元数据和模块标识符的对象
    */
    const { token } = await this.moduleCompiler.compile(metatypeToReplace);
    const { type, dynamicMetadata } =
      await this.moduleCompiler.compile(newMetatype);
    /**使用新的模块创建module实例，替换掉在模块容器中token对应的值 */
    return {
      moduleRef: await this.setModule(
        {
          token,
          type,
          dynamicMetadata,
        },
        scope,
      ),
      /**
       * inserted始终为false，表示这是一个替换模块而不是新插入的模块 
       * 
       * inserted 可以用来区分一个模块是被添加还是被替换。这对于调试、
       * 日志记录或执行后续的操作逻辑（如触发事件或回调）非常有用。
       * 
       * inserted 可以作为一个条件标志，帮助决定是否需要执行
       * 某些只有在新插入模块时才需要的操作，例如初始化或配置。
       * */
      inserted: false,
    };
  }
  /**
   * 创建Module实例，将实例添加到moduleContainer中，并且处理动态
   * 元数据中的imports
   */
  private async setModule(
    { token, dynamicMetadata, type }: ModuleFactory,
    scope: ModuleScope,
  ): Promise<Module | undefined> {
    /**创建Module实例，Module用于对我们的模块定义进一步的管理*/
    const moduleRef = new Module(type, this);
    moduleRef.token = token;
    /**标记该类在预览模式下是否会被初始化 */
    moduleRef.initOnPreview = this.shouldInitOnPreview(type);
    /**将新的Module实例缓存到moduleContainer中 */
    this.modules.set(token, moduleRef);
    /**更新模块作用域 
     * [].concat([1,2,3], [4,5,6], 7) => [1,2,3,4,5,6,7]
    */
    const updatedScope = [].concat(scope, type);
    /**将动态元数据添加到dynamicModulesMetadata中 */
    await this.addDynamicMetadata(token, dynamicMetadata, updatedScope);
    /**如果当前模块还是一个全局模块 */
    if (this.isGlobalModule(type, dynamicMetadata)) {
      /**标记模块实例的isGlobal为true */
      moduleRef.isGlobal = true;
      /**将Module实例添加到全局模块容器dynamicModulesMetadata中 */
      this.addGlobalModule(moduleRef);
    }
    /**返回新建的Module实例 */
    return moduleRef;
  }
  /**
   * 将当前模块的动态元数据添加到dynamicModulesMetadata中，如果里面还有导入的模块
   * imports，那么进一步执行addDynamicModules，将imports中的模块也一起添加到模块
   * 容器中
   * @param token 模块标识符
   * @param dynamicModuleMetadata 动态模块元数据
   * @param scope 当前模块的作用域或依赖路径
   * @returns 
   */
  public async addDynamicMetadata(
    token: string,
    dynamicModuleMetadata: Partial<DynamicModule>,
    scope: Type<any>[],
  ) {
    /**如果没有动态模块元数据，那么不继续执行，
     * 一般出现在只有@Module()装饰的模块类上 */
    if (!dynamicModuleMetadata) {
      return;
    }
    /**将动态模块元数据添加到dynamicModulesMetadata中 */
    this.dynamicModulesMetadata.set(token, dynamicModuleMetadata);

    const { imports } = dynamicModuleMetadata;
    /**将导入的模块imports也通过 addDynamicModules最后添加到模块容器中*/
    await this.addDynamicModules(imports, scope);
  }

  public async addDynamicModules(modules: any[], scope: Type<any>[]) {
    /**没有导入模块，直接返回 */
    if (!modules) {
      return;
    }
    /**遍历imports中的模块，调用addModule将模块添加到模块容器 */
    await Promise.all(modules.map(module => this.addModule(module, scope)));
  }
  /**检查一个模块是否为一个全局模块 */
  public isGlobalModule(
    metatype: Type<any>,
    dynamicMetadata?: Partial<DynamicModule>,
  ): boolean {
    if (dynamicMetadata && dynamicMetadata.global) {
      return true;
    }
    return !!Reflect.getMetadata(GLOBAL_MODULE_METADATA, metatype);
  }
  /**将模块添加到全局模块的集合中 */
  public addGlobalModule(module: Module) {
    this.globalModules.add(module);
  }
  /**返回存储所有模块的容器实例 */
  public getModules(): ModulesContainer {
    return this.modules;
  }
  /**返回模块元数据提取器
   */
  public getModuleCompiler(): ModuleCompiler {
    return this.moduleCompiler;
  }
  /**根据键值拿到模块实例（Modules的实例） */
  public getModuleByKey(moduleKey: string): Module {
    return this.modules.get(moduleKey);
  }
  /**获取内部核心模块 */
  public getInternalCoreModuleRef(): Module | undefined {
    return this.internalCoreModule;
  }
  /**将导入添加到 moduleRef中的_imports集合中*/
  public async addImport(
    relatedModule: Type<any> | DynamicModule,
    token: string,
  ) {
    /**当前模块不存在，那么就没必要进行下去了*/
    /**理论上，一旦一个模块通过正常的启动和注册流程被加载，它就应该存在于modules，
     * 但是为了代码的健壮性，这种防御性检查是必不可少的，可以防止在未来的变动中减少
     * 错误的发生
     */
    if (!this.modules.has(token)) {
      return;
    }
    /**获取Module实例的引用 */
    const moduleRef = this.modules.get(token);
    /**通过relatedModule解析出该模块类的token */
    const { token: relatedModuleToken } =
      await this.moduleCompiler.compile(relatedModule);
    /**通过token从模块容器中获取Module实例 */
    const related = this.modules.get(relatedModuleToken);
    /**调用Module实例中的addImport方法，将relatedModuleToken对应的Module实例加入到_imports */
    moduleRef.addImport(related);
  }
  /**
   * 
   * @param provider 提供者
   * @param token 
   * @param enhancerSubtype 
   * @returns 
   * 将provider添加到Module实例的_providers集合中
   */
  public addProvider(
    provider: Provider,
    token: string,
    enhancerSubtype?: EnhancerSubtype,
  ): string | symbol | Function {
    /**通过token拿到Module实例 */
    const moduleRef = this.modules.get(token);
    /**当出现循环依赖时，provider为undefined */
    if (!provider) {
      throw new CircularDependencyException(moduleRef?.metatype.name);
    }
    /**该模块还没被扫描 */
    if (!moduleRef) {
      throw new UnknownModuleException();
    }
    /**为提供者创建InstanceWrapper实例，并添加到_providers集合中 */
    const providerKey = moduleRef.addProvider(provider, enhancerSubtype);
    /**通过providerKey从_providers集合获取该提供者对应的InstanceWrapper实例*/
    const providerRef = moduleRef.getProviderByKey(providerKey);

    DiscoverableMetaHostCollection.inspectProvider(this.modules, providerRef);

    return providerKey as Function;
  }
  /**用于向特定模块的依赖注入容器中添加一个可注入的提供者（如服务、拦截器、守卫）等 */
  public addInjectable(
    injectable: Provider,
    token: string,
    enhancerSubtype: EnhancerSubtype,
    host?: Type<Injectable>,
  ) {
    if (!this.modules.has(token)) {
      throw new UnknownModuleException();
    }
    const moduleRef = this.modules.get(token);
    return moduleRef.addInjectable(injectable, enhancerSubtype, host);
  }

  public addExportedProvider(provider: Type<any>, token: string) {
    if (!this.modules.has(token)) {
      throw new UnknownModuleException();
    }
    const moduleRef = this.modules.get(token);
    moduleRef.addExportedProvider(provider);
  }
  /**
   * 
   * @param controller 要被插入集合的控制器类
   * @param token 当前模块Token
   */
  public addController(controller: Type<any>, token: string) {
    if (!this.modules.has(token)) {
      throw new UnknownModuleException();
    }
    /**获取Module实例引用 */
    const moduleRef = this.modules.get(token);
    /**将controller加入到Module实例中的_controllers集合中 */
    moduleRef.addController(controller);
    /**获取controller的InstanceWrapper包装器实例 */
    const controllerRef = moduleRef.controllers.get(controller);
    DiscoverableMetaHostCollection.inspectController(
      this.modules,
      controllerRef,
    );
  }
  
  /**清空模块容器 */
  public clear() {
    this.modules.clear();
  }

  public replace(toReplace: any, options: any & { scope: any[] | null }) {
    this.modules.forEach(moduleRef => moduleRef.replace(toReplace, options));
  }

  public bindGlobalScope() {
    this.modules.forEach(moduleRef => this.bindGlobalsToImports(moduleRef));
  }

  public bindGlobalsToImports(moduleRef: Module) {
    this.globalModules.forEach(globalModule =>
      this.bindGlobalModuleToModule(moduleRef, globalModule),
    );
  }

  public bindGlobalModuleToModule(target: Module, globalModule: Module) {
    if (target === globalModule || target === this.internalCoreModule) {
      return;
    }
    target.addImport(globalModule);
  }

  public getDynamicMetadataByToken(token: string): Partial<DynamicModule>;
  public getDynamicMetadataByToken<
    K extends Exclude<keyof DynamicModule, 'global' | 'module'>,
  >(token: string, metadataKey: K): DynamicModule[K];
  public getDynamicMetadataByToken(
    token: string,
    metadataKey?: Exclude<keyof DynamicModule, 'global' | 'module'>,
  ) {
    const metadata = this.dynamicModulesMetadata.get(token);
    return metadataKey ? metadata?.[metadataKey] ?? [] : metadata;
  }

  public registerCoreModuleRef(moduleRef: Module) {
    this.internalCoreModule = moduleRef;
    this.modules[InternalCoreModule.name] = moduleRef;
  }

  public getModuleTokenFactory(): ModuleTokenFactory {
    return this.moduleTokenFactory;
  }

  public registerRequestProvider<T = any>(request: T, contextId: ContextId) {
    const wrapper = this.internalCoreModule.getProviderByKey(REQUEST);
    wrapper.setInstanceByContextId(contextId, {
      instance: request,
      isResolved: true,
    });
  }
  /**type是否在allowList中，在的话，表示该类在预览模式下会被初始化，否则不会 */
  private shouldInitOnPreview(type: Type) {
    return InitializeOnPreviewAllowlist.has(type);
  }
}
