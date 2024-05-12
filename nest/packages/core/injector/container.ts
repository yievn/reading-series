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
  /**编译模块的实例，用于处理模块的元数据和依赖 */
  private readonly moduleCompiler = new ModuleCompiler(this.moduleTokenFactory);
  /**存储所有模块的容器 */
  private readonly modules = new ModulesContainer();
  /**存储动态模块元数据的映射 */
  private readonly dynamicModulesMetadata = new Map<
    string,
    Partial<DynamicModule>
  >();
  /** */
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
    if (!metatype) {
      throw new UndefinedForwardRefException(scope);
    }
    const { type, dynamicMetadata, token } =
      await this.moduleCompiler.compile(metatype);
    if (this.modules.has(token)) {
      return {
        moduleRef: this.modules.get(token),
        inserted: true,
      };
    }

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

    const { token } = await this.moduleCompiler.compile(metatypeToReplace);
    const { type, dynamicMetadata } =
      await this.moduleCompiler.compile(newMetatype);

    return {
      moduleRef: await this.setModule(
        {
          token,
          type,
          dynamicMetadata,
        },
        scope,
      ),
      inserted: false,
    };
  }

  private async setModule(
    { token, dynamicMetadata, type }: ModuleFactory,
    scope: ModuleScope,
  ): Promise<Module | undefined> {
    const moduleRef = new Module(type, this);
    moduleRef.token = token;
    moduleRef.initOnPreview = this.shouldInitOnPreview(type);
    this.modules.set(token, moduleRef);

    const updatedScope = [].concat(scope, type);
    await this.addDynamicMetadata(token, dynamicMetadata, updatedScope);

    if (this.isGlobalModule(type, dynamicMetadata)) {
      moduleRef.isGlobal = true;
      this.addGlobalModule(moduleRef);
    }

    return moduleRef;
  }

  public async addDynamicMetadata(
    token: string,
    dynamicModuleMetadata: Partial<DynamicModule>,
    scope: Type<any>[],
  ) {
    if (!dynamicModuleMetadata) {
      return;
    }
    this.dynamicModulesMetadata.set(token, dynamicModuleMetadata);

    const { imports } = dynamicModuleMetadata;
    await this.addDynamicModules(imports, scope);
  }

  public async addDynamicModules(modules: any[], scope: Type<any>[]) {
    if (!modules) {
      return;
    }
    await Promise.all(modules.map(module => this.addModule(module, scope)));
  }

  public isGlobalModule(
    metatype: Type<any>,
    dynamicMetadata?: Partial<DynamicModule>,
  ): boolean {
    if (dynamicMetadata && dynamicMetadata.global) {
      return true;
    }
    return !!Reflect.getMetadata(GLOBAL_MODULE_METADATA, metatype);
  }

  public addGlobalModule(module: Module) {
    this.globalModules.add(module);
  }

  public getModules(): ModulesContainer {
    return this.modules;
  }

  public getModuleCompiler(): ModuleCompiler {
    return this.moduleCompiler;
  }

  public getModuleByKey(moduleKey: string): Module {
    return this.modules.get(moduleKey);
  }

  public getInternalCoreModuleRef(): Module | undefined {
    return this.internalCoreModule;
  }

  public async addImport(
    relatedModule: Type<any> | DynamicModule,
    token: string,
  ) {
    if (!this.modules.has(token)) {
      return;
    }
    const moduleRef = this.modules.get(token);
    const { token: relatedModuleToken } =
      await this.moduleCompiler.compile(relatedModule);
    const related = this.modules.get(relatedModuleToken);
    moduleRef.addImport(related);
  }

  public addProvider(
    provider: Provider,
    token: string,
    enhancerSubtype?: EnhancerSubtype,
  ): string | symbol | Function {
    const moduleRef = this.modules.get(token);
    if (!provider) {
      throw new CircularDependencyException(moduleRef?.metatype.name);
    }
    if (!moduleRef) {
      throw new UnknownModuleException();
    }
    const providerKey = moduleRef.addProvider(provider, enhancerSubtype);
    const providerRef = moduleRef.getProviderByKey(providerKey);

    DiscoverableMetaHostCollection.inspectProvider(this.modules, providerRef);

    return providerKey as Function;
  }

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

  public addController(controller: Type<any>, token: string) {
    if (!this.modules.has(token)) {
      throw new UnknownModuleException();
    }
    const moduleRef = this.modules.get(token);
    moduleRef.addController(controller);

    const controllerRef = moduleRef.controllers.get(controller);
    DiscoverableMetaHostCollection.inspectController(
      this.modules,
      controllerRef,
    );
  }

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

  private shouldInitOnPreview(type: Type) {
    return InitializeOnPreviewAllowlist.has(type);
  }
}
