import { DynamicModule, ForwardReference, Provider } from '@nestjs/common';
import {
  CATCH_WATERMARK,
  CONTROLLER_WATERMARK,
  ENHANCER_KEY_TO_SUBTYPE_MAP,
  EXCEPTION_FILTERS_METADATA,
  EnhancerSubtype,
  GUARDS_METADATA,
  INJECTABLE_WATERMARK,
  INTERCEPTORS_METADATA,
  MODULE_METADATA,
  PIPES_METADATA,
  ROUTE_ARGS_METADATA,
} from '@nestjs/common/constants';
import {
  CanActivate,
  ClassProvider,
  Controller,
  ExceptionFilter,
  ExistingProvider,
  FactoryProvider,
  Injectable,
  InjectionToken,
  NestInterceptor,
  PipeTransform,
  Scope,
  Type,
  ValueProvider,
} from '@nestjs/common/interfaces';
import {
  isFunction,
  isNil,
  isUndefined,
} from '@nestjs/common/utils/shared.utils';
import { iterate } from 'iterare';
import { ApplicationConfig } from './application-config';
import {
  APP_FILTER,
  APP_GUARD,
  APP_INTERCEPTOR,
  APP_PIPE,
  ENHANCER_TOKEN_TO_SUBTYPE_MAP,
} from './constants';
import { CircularDependencyException } from './errors/exceptions/circular-dependency.exception';
import { InvalidClassModuleException } from './errors/exceptions/invalid-class-module.exception';
import { InvalidModuleException } from './errors/exceptions/invalid-module.exception';
import { UndefinedModuleException } from './errors/exceptions/undefined-module.exception';
import { getClassScope } from './helpers/get-class-scope';
import { NestContainer } from './injector/container';
import { InstanceWrapper } from './injector/instance-wrapper';
import { InternalCoreModuleFactory } from './injector/internal-core-module/internal-core-module-factory';
import { Module } from './injector/module';
import { GraphInspector } from './inspector/graph-inspector';
import { UuidFactory } from './inspector/uuid-factory';
import { ModuleDefinition } from './interfaces/module-definition.interface';
import { ModuleOverride } from './interfaces/module-override.interface';
import { MetadataScanner } from './metadata-scanner';

/**
 * 用于封装与应用程序提供者相关的信息，这些提供者可能是全局拦截器、守卫、管道
 * 或过滤器等
 */
interface ApplicationProviderWrapper {
  /**标识提供者所属的模块 */
  moduleKey: string;
  /**提供者的唯一标识符，通常结合类型和可能的uuid来确保唯一性 */
  providerKey: string;
  /**提供者的类型，如APP_INTERCEPTOR 或 APP_GUARD 等。 */
  type: InjectionToken;
  /**定义提供者作用域，如单例或请求级别 */
  scope?: Scope;
}
/**
 * 用于在扫描和注册模块时传递必要的参数，这些参数控制模块的加载和处理方式
 */
interface ModulesScanParameters {
  /**当前要扫描的模块定义，可以是一个类、动态模块或通过forwardRef 引用的模块 */
  moduleDefinition: ModuleDefinition;
   /**
     * 记录依赖顺序，用于在错误处理时提供上下文信息，使得错误
     * 更加易于理解和调试，因为它提供了一个清晰的模块加载和依赖调用链，
     * 显示了错误发生时的具体位置和路径。
    */
  scope?: Type<unknown>[];
  /**包含已处理的模块的上下文，用于避免重复处理同一个模块 */
  ctxRegistry?: (ForwardReference | DynamicModule | Type<unknown>)[];
  /**包含模块覆盖的定义，这在测试或特定环境下替换模块的实现时非常有用 */
  overrides?: ModuleOverride[];
  /**指示是否应延迟加载模块 */
  lazy?: boolean;
}

export class DependenciesScanner {
  private readonly applicationProvidersApplyMap: ApplicationProviderWrapper[] =
    [];

  constructor(
    private readonly container: NestContainer,
    private readonly metadataScanner: MetadataScanner,
    private readonly graphInspector: GraphInspector,
    private readonly applicationConfig = new ApplicationConfig(),
  ) {}

  public async scan(
    module: Type<any>,
    options?: { overrides?: ModuleOverride[] },
  ) {
    /**注册应用的核心模块，确保应用的基础服务可以在后续使用 */
    await this.registerCoreModule(options?.overrides);
    /**递归地扫描和注册所有模块，这个方法接受一个模块定义，通常是跟模块，并递归处理所有导入的模块 */
    await this.scanForModules({
      moduleDefinition: module,
      overrides: options?.overrides,
    });
    /**一旦所有模块都被扫描，则调用scanModulesForDependencies来扫描每个模块的依赖、提供者、控制器等依赖 */
    await this.scanModulesForDependencies();
    /**计算模块之间的距离，这有助于确定模块加载和初始化的顺序 */
    this.calculateModulesDistance();
    /**
     * 
     */
    this.addScopedEnhancersMetadata();
    /**绑定全局作用域 */
    this.container.bindGlobalScope();
  }
  /**
   * 
   * @param param0 
   * @returns 
   * scanForModules用于递归扫描和注册应用中的所有模块，处理
   * 模块的导入、依赖解析，并确保模块按正确的顺序和方式被加载和初始化。
   */
  public async scanForModules({
    /**当前要扫描的模块 */
    moduleDefinition,
    /**指示是否延迟加载模块 */
    lazy,
    /**
     * 记录依赖顺序，用于在错误处理时提供上下文信息，使得错误
     * 更加易于理解和调试，因为它提供了一个清晰的模块加载和依赖调用链，
     * 显示了错误发生时的具体位置和路径。
    */
    scope = [],
    /**一个包含已经处理过的模块的上下文注册表，防止重复处理同一个模块 */
    ctxRegistry = [],
    /**可选的模块覆盖定义，用于在测试或特定环境下替换模块的实现 */
    overrides = [],
  }: ModulesScanParameters): Promise<Module[]> {
    /**
     * 如果模块存在于覆盖定义中，使用覆盖的新模块替换原有模块。如果没有，就将模块类
     * 添加到moduleContainer中，并且返回Module实例，以及inserted标志（表示
     * 模块是新添加还是替换）
     */
    const { moduleRef: moduleInstance, inserted: moduleInserted } =
      (await this.insertOrOverrideModule(moduleDefinition, overrides, scope)) ??
      {};

    /**如果模块存在于覆盖定义中，则从覆盖定义获取替换模块定义，否则用原先的模块定义 */
    moduleDefinition =
      this.getOverrideModuleByModule(moduleDefinition, overrides)?.newModule ??
      moduleDefinition;
    /**如果模块定义是一个Promise实例，则使用await获取结果 */
    moduleDefinition =
      moduleDefinition instanceof Promise
        ? await moduleDefinition
        : moduleDefinition;
    /**将模块定义添加到ctxRegistry， 防止重复注册 */
    ctxRegistry.push(moduleDefinition);
    /**如果模块定义是正向引用的，则通过执行forwardRef获取实际指向的模块定义 */
    if (this.isForwardReference(moduleDefinition)) {
      moduleDefinition = (moduleDefinition as ForwardReference).forwardRef();
    }
    /**从元数据或者模块定义中获取导入（imports）的模块 */
    const modules = !this.isDynamicModule(
      moduleDefinition as Type<any> | DynamicModule,
    )
    /**如果不是动态模块，那就从@Module()中获取imports的模块 */
      ? this.reflectMetadata(
          MODULE_METADATA.IMPORTS,
          moduleDefinition as Type<any>,
        )
      : [
         /**
          * 如果是动态模块，除了从@Module()中获取imports的模块，
          * 还从模块定义中获取imports */
          ...this.reflectMetadata(
            MODULE_METADATA.IMPORTS,
            (moduleDefinition as DynamicModule).module,
          ),
          ...((moduleDefinition as DynamicModule).imports || []),
        ];
    /**已注册的Module实例 */
    let registeredModuleRefs = [];
    /**遍历导入imports的模块定义 */
    for (const [index, innerModule] of modules.entries()) {
      // In case of a circular dependency (ES module system), JavaScript will resolve the type to `undefined`.
      /**
       * 在循环依赖(ES模块系统)的情况下，JavaScript会将类型解析为' undefined '
       */
      if (innerModule === undefined) {
        throw new UndefinedModuleException(moduleDefinition, index, scope);
      }
      if (!innerModule) {
        throw new InvalidModuleException(moduleDefinition, index, scope);
      }
      /**如果innerModule已经存在ctxRegistry，则跳过忽略 */
      if (ctxRegistry.includes(innerModule)) {
        continue;
      }
      /**递归扫描innerModule */
      const moduleRefs = await this.scanForModules({
        moduleDefinition: innerModule,
        /**更新作用域链 */
        scope: [].concat(scope, moduleDefinition),
        ctxRegistry,
        overrides,
        lazy,
      });
      /**更新registeredModuleRefs */
      registeredModuleRefs = registeredModuleRefs.concat(moduleRefs);
    }
    /**
     * 防出错判断
     */
    if (!moduleInstance) {
      return registeredModuleRefs;
    }
    /**如果lazy为true并且moduleInserted为true（表示该模块已被添加），
     * 方法的作用是将全局模块（如全局提供者、守卫、拦截器等）绑定到当前模块的导入列表中。
     * 这确保了全局模块的功能可以在当前模块的上下文中被访问和使用。
     */
    if (lazy && moduleInserted) {
      this.container.bindGlobalsToImports(moduleInstance);
    }
    return [moduleInstance].concat(registeredModuleRefs);
  }
  /**
   * 负责将一个模块定义插入到nest应用的模块容器中，确保模块被正确
   * 添加到系统中，并出来相关的依赖和作用域
   * @param moduleDefinition 当前即将要被插入的模块的类
   * @param scope 这是一个类型数组（Type<unknown>[]），表示当前模块的依赖路径或作用域链。
   * 它用于处理模块间的依赖关系和确保正确的模块加载顺序。
   * @returns 
   */
  public async insertModule(
    moduleDefinition: any,
    scope: Type<unknown>[],
  ): Promise<
    | {
        moduleRef: Module;
        inserted: boolean;
      }
    | undefined
  > {
    /**
     * 如果moduleDefinition是一个正向引用，那么调用moduleDefinition.forwardRef()获取
     * 引用指向的模块类
     */
    const moduleToAdd = this.isForwardReference(moduleDefinition)
      ? moduleDefinition.forwardRef()
      : moduleDefinition;
    /**
     * 如果moduleToAdd是@Injectable、@Contriller()、@Catch()标记的类
     * 那么抛出无效类模块的异常，因为这些类型不能作为模块被注册
     */
    if (
      this.isInjectable(moduleToAdd) ||
      this.isController(moduleToAdd) ||
      this.isExceptionFilter(moduleToAdd)
    ) {
      throw new InvalidClassModuleException(moduleDefinition, scope);
    }
    /**将模块插入模块容器中 */
    return this.container.addModule(moduleToAdd, scope);
  }
  /**
   * 
   * @param modules 从模块容器中获取应用中已注册的所有Module实例
   */
  public async scanModulesForDependencies(
    modules: Map<string, Module> = this.container.getModules(),
  ) {
    /**遍历所有Module实例 */
    for (const [token, { metatype }] of modules) {
      await this.reflectImports(metatype, token, metatype.name);
      this.reflectProviders(metatype, token);
      this.reflectControllers(metatype, token);
      this.reflectExports(metatype, token);
    }
  }
  /**反射导入的模块，将导入模块插到module模块类对应的Module实例中的_imports集合 */
  public async reflectImports(
    module: Type<unknown>,
    token: string,
    context: string,
  ) {
    const modules = [
      /**从module的元数据（@Module({imports: []})）中获取imports */
      ...this.reflectMetadata(MODULE_METADATA.IMPORTS, module),
      /**使用token从container中的dynamicModulesMetadata属性中获取动态元数据，并返回元数据中的imports数组（假如有的话）*/
      ...this.container.getDynamicMetadataByToken(
        token,
        MODULE_METADATA.IMPORTS as 'imports',
      ),
    ];
    /**遍历导入的模块 */
    for (const related of modules) {
      await this.insertImport(related, token, context);
    }
  }

  /**将导入的模块加入到指定模块的Modules实例的_imports集合中 */
  public async insertImport(related: any, token: string, context: string) {
    /**related模块为undefined，抛出异常 */
    if (isUndefined(related)) {
      throw new CircularDependencyException(context);
    } 
    /**
     * related模块为正向引用，则通过forwardRef()获取到实际的模块类，
     * 并调用container的addImport方法，
     * 最后添加到Modules实例的_imports集合中 
     * */
    if (this.isForwardReference(related)) {
      return this.container.addImport(related.forwardRef(), token);
    }
    await this.container.addImport(related, token);
  }
  /**
   * 反射模块的提供者
   * @param module 
   * @param token 
   */
  public reflectProviders(module: Type<any>, token: string) {
    const providers = [
      /**从module类（有@Module()装饰的类）的元数据中获取提供者数据 */
      ...this.reflectMetadata(MODULE_METADATA.PROVIDERS, module),
      /**从动态模块数据中获取提供者数据（假如动态数据有providers） */
      ...this.container.getDynamicMetadataByToken(
        token,
        MODULE_METADATA.PROVIDERS as 'providers',
      ),
    ];
    providers.forEach(provider => {
      this.insertProvider(provider, token);
      this.reflectDynamicMetadata(provider, token);
    });
  }
  /**
   * @param provider 
   * @param token 
   * @returns 
   * 用于将提供者（providers）插入到特定模块的容器中，这个方法处理不同
   * 类型的提供者，包括类提供者（ClassProvider）、
   * 值提供者（ValueProvider）、工厂提供者（FactoryProvider）
   * 和已存在的提供者（ExistingProvider）
   */
  public insertProvider(provider: Provider, token: string) {
    const isCustomProvider = this.isCustomProvider(provider);
    /**
     * 检查提供者是否为自定义提供者（即具有 provide 属性的提供者）。
     * 这是通过 isCustomProvider 方法实现的。
     */
    if (!isCustomProvider) {
      /**不是自定义提供者（@Injectable装饰的类），那么直接加入到modules的_providers集合中 */
      return this.container.addProvider(provider as Type<any>, token);
    }
    /**
     * 其中每个键是一个增强器类型（如 APP_INTERCEPTOR, APP_PIPE, APP_GUARD, APP_FILTER），
     * 每个值是一个函数，这个函数负责将对应的增强器添加到全局配置中
     * 
     * 因为使用useGlobalPipe等全局增强器注册函数注册的
     * 增强器并没有办法向增强器里面注入依赖，因为它不属于任何一个模块，
     * 所以为了解决这个问题，可以使用提供者的方式进行声明全局增强器，例如：
     * 
     * {
     *    provide: 'APP_PIPE',
     *    useClass: ...
     * }
     */
    const applyProvidersMap = this.getApplyProvidersMap();
    /**[APP_INTERCEPTOR, APP_PIPE, APP_GUARD, APP_FILTER] */
    const providersKeys = Object.keys(applyProvidersMap);
    const type = (
      provider as
        | ClassProvider
        | ValueProvider
        | FactoryProvider
        | ExistingProvider
    ).provide;
    /**是自定义提供者，但是非apply提供者 */
    if (!providersKeys.includes(type as string)) {
      return this.container.addProvider(provider as any, token);
    }
    /**以下处理apply提供者 */
    /**生成uuid */
    const uuid = UuidFactory.get(type.toString());
    /**生成唯一标识符 */
    const providerToken = `${type as string} (UUID: ${uuid})`;
    /**
     * 确定提供者的作用域（如单例、请求级别等）
     */
    let scope = (provider as ClassProvider | FactoryProvider).scope;
    if (isNil(scope) && (provider as ClassProvider).useClass) {
      /**通过装饰器标记获取元数据中的作用域配置 */
      scope = getClassScope((provider as ClassProvider).useClass);
    }
    /** */
    this.applicationProvidersApplyMap.push({
      /**[APP_INTERCEPTOR, APP_PIPE, APP_GUARD, APP_FILTER] */
      type,
      /**增强器所依附的模块 */
      moduleKey: token,
      /**增强器的标识符 */
      providerKey: providerToken,
      /**增强器的作用域 */
      scope,
    });
    /**构建一个新的提供者对象，使用providerToken替换掉原
     * 先的provide值 (APP_INTERCEPTOR, APP_PIPE, APP_GUARD, APP_FILTER) */
    const newProvider = {
      ...provider,
      provide: providerToken,
      scope,
    } as Provider;
    /**设置增强器子类型"guard" | "interceptor" | "pipe" | "filter" */
    const enhancerSubtype =
      ENHANCER_TOKEN_TO_SUBTYPE_MAP[
        type as
          | typeof APP_GUARD
          | typeof APP_PIPE
          | typeof APP_FILTER
          | typeof APP_INTERCEPTOR
      ];
    const factoryOrClassProvider = newProvider as
      | FactoryProvider
      | ClassProvider;
    /**
     * 如果提供者的作用域为请求作用域或者瞬态作用域，因为只有在这两种
     * 作用域的情况下，才能对newProvider进行依赖注入
     */
    if (this.isRequestOrTransient(factoryOrClassProvider.scope)) {
      return this.container.addInjectable(newProvider, token, enhancerSubtype);
    }
    /**将新提供者添加到Module实例的_providers集合中 */
    this.container.addProvider(newProvider, token, enhancerSubtype);
  }
  /**
   * 
   * @param module 
   * @param token 
   */
  public reflectControllers(module: Type<any>, token: string) {
    const controllers = [
      ...this.reflectMetadata(MODULE_METADATA.CONTROLLERS, module),
      ...this.container.getDynamicMetadataByToken(
        token,
        MODULE_METADATA.CONTROLLERS as 'controllers',
      ),
    ];
    controllers.forEach(item => {
      this.insertController(item, token);
      this.reflectDynamicMetadata(item, token);
    });
  }
  /**
   * 
   * @param cls 
   * @param token 
   * @returns 
   * 这个方法主要作用是从类的装饰器中提取与依赖注入相关的元数据，并将这些元数据
   * 应用到依赖注入容器中，以便正确地配置和实例化依赖。
   */
  public reflectDynamicMetadata(cls: Type<Injectable>, token: string) {
    if (!cls || !cls.prototype) {
      return;
    }
    this.reflectInjectables(cls, token, GUARDS_METADATA);
    this.reflectInjectables(cls, token, INTERCEPTORS_METADATA);
    this.reflectInjectables(cls, token, EXCEPTION_FILTERS_METADATA);
    this.reflectInjectables(cls, token, PIPES_METADATA);
    this.reflectParamInjectables(cls, token, ROUTE_ARGS_METADATA);
  }
  /**
   * 
   * @param module 
   * @param token 
   */

  public reflectExports(module: Type<unknown>, token: string) {
    const exports = [
      ...this.reflectMetadata(MODULE_METADATA.EXPORTS, module),
      ...this.container.getDynamicMetadataByToken(
        token,
        MODULE_METADATA.EXPORTS as 'exports',
      ),
    ];
    exports.forEach(exportedProvider =>
      this.insertExportedProvider(exportedProvider, token),
    );
  }
  /**
   * @param component 
   * @param token 
   * @param metadataKey 
   */
  public reflectInjectables(
    component: Type<Injectable>,
    token: string,
    metadataKey: string,
  ) {
    /**获取component中有关metadataKey的元数据 */
    const controllerInjectables = this.reflectMetadata<Type<Injectable>>(
      metadataKey,
      component,
    );
    const methodInjectables = this.metadataScanner
      .getAllMethodNames(component.prototype)
      .reduce((acc, method) => {
        const methodInjectable = this.reflectKeyMetadata(
          component,
          metadataKey,
          method,
        );

        if (methodInjectable) {
          acc.push(methodInjectable);
        }

        return acc;
      }, []);

    controllerInjectables.forEach(injectable =>
      this.insertInjectable(
        injectable,
        token,
        component,
        ENHANCER_KEY_TO_SUBTYPE_MAP[metadataKey],
      ),
    );
    methodInjectables.forEach(methodInjectable => {
      methodInjectable.metadata.forEach(injectable =>
        this.insertInjectable(
          injectable,
          token,
          component,
          ENHANCER_KEY_TO_SUBTYPE_MAP[metadataKey],
          methodInjectable.methodKey,
        ),
      );
    });
  }
  /**
   * 
   * @param component 
   * @param token 
   * @param metadataKey 
   */
  public reflectParamInjectables(
    component: Type<Injectable>,
    token: string,
    metadataKey: string,
  ) {
    const paramsMethods = this.metadataScanner.getAllMethodNames(
      component.prototype,
    );

    paramsMethods.forEach(methodKey => {
      const metadata: Record<
        string,
        {
          index: number;
          data: unknown;
          pipes: Array<Type<PipeTransform> | PipeTransform>;
        }
      > = Reflect.getMetadata(metadataKey, component, methodKey);

      if (!metadata) {
        return;
      }

      const params = Object.values(metadata);
      params
        .map(item => item.pipes)
        .flat(1)
        .forEach(injectable =>
          this.insertInjectable(
            injectable,
            token,
            component,
            'pipe',
            methodKey,
          ),
        );
    });
  }

  public reflectKeyMetadata(
    component: Type<Injectable>,
    key: string,
    methodKey: string,
  ): { methodKey: string; metadata: any } | undefined {
    let prototype = component.prototype;
    do {
      const descriptor = Reflect.getOwnPropertyDescriptor(prototype, methodKey);
      if (!descriptor) {
        continue;
      }
      const metadata = Reflect.getMetadata(key, descriptor.value);
      if (!metadata) {
        return;
      }
      return { methodKey, metadata };
    } while (
      (prototype = Reflect.getPrototypeOf(prototype)) &&
      prototype !== Object.prototype &&
      prototype
    );
    return undefined;
  }

  public calculateModulesDistance() {
    const modulesGenerator = this.container.getModules().values();

    // Skip "InternalCoreModule" from calculating distance
    modulesGenerator.next();

    const modulesStack = [];
    const calculateDistance = (moduleRef: Module, distance = 1) => {
      if (!moduleRef || modulesStack.includes(moduleRef)) {
        return;
      }
      modulesStack.push(moduleRef);

      const moduleImports = moduleRef.imports;
      moduleImports.forEach(importedModuleRef => {
        if (importedModuleRef) {
          if (distance > importedModuleRef.distance) {
            importedModuleRef.distance = distance;
          }
          calculateDistance(importedModuleRef, distance + 1);
        }
      });
    };

    const rootModule = modulesGenerator.next().value as Module;
    calculateDistance(rootModule);
  }
  /**是否为自定义提供者 */
  public isCustomProvider(
    provider: Provider,
  ): provider is
    | ClassProvider
    | ValueProvider
    | FactoryProvider
    | ExistingProvider {
    return provider && !isNil((provider as any).provide);
  }


  public insertInjectable(
    injectable: Type<Injectable> | object,
    token: string,
    host: Type<Injectable>,
    subtype: EnhancerSubtype,
    methodKey?: string,
  ) {
    if (isFunction(injectable)) {
      const instanceWrapper = this.container.addInjectable(
        injectable as Type,
        token,
        subtype,
        host,
      ) as InstanceWrapper;

      this.graphInspector.insertEnhancerMetadataCache({
        moduleToken: token,
        classRef: host,
        enhancerInstanceWrapper: instanceWrapper,
        targetNodeId: instanceWrapper.id,
        subtype,
        methodKey,
      });
      return instanceWrapper;
    } else {
      this.graphInspector.insertEnhancerMetadataCache({
        moduleToken: token,
        classRef: host,
        enhancerRef: injectable,
        methodKey,
        subtype,
      });
    }
  }

  public insertExportedProvider(
    exportedProvider: Type<Injectable>,
    token: string,
  ) {
    this.container.addExportedProvider(exportedProvider, token);
  }

  public insertController(controller: Type<Controller>, token: string) {
    this.container.addController(controller, token);
  }
  /**将一个模块定义插入到应用的模块容器中，或者如果存在覆盖定义，则替换现有的模块 */
  private insertOrOverrideModule(
    moduleDefinition: ModuleDefinition,
    /**一个包含模块覆盖信息的数组 */
    overrides: ModuleOverride[],
    /**当前模块的作用域链，用于处理模块间的依赖和继承 */
    scope: Type<unknown>[],
  ): Promise<
    | {
        moduleRef: Module;
        inserted: boolean;
      }
    | undefined
  > {
    /**在模块覆盖列表overrides中匹配moduleDefinition，存在则返回覆盖模块 */
    const overrideModule = this.getOverrideModuleByModule(
      moduleDefinition,
      overrides,
    );
    /**如果moduleDefinition存在覆盖定义列表中，则使用覆盖定义中指定的新模块来替换原有的模块 */
    if (overrideModule !== undefined) {
      return this.overrideModule(
        moduleDefinition,
        overrideModule.newModule,
        scope,
      );
    }
    /**如果没有找到覆盖或者不需要覆盖，将模块定义插入到容器中。
     * 返回一个包含模块引用和插入状态的对象，这有助于后续的处理逻辑判断模块是否
     * 是新插入的
     */
    return this.insertModule(moduleDefinition, scope);
  }
  /**
   * 主要作用是在一个模块覆盖列表中查找与给定模块匹配的覆盖定义。
   * 这是实现模块动态替换的关键步骤，允许在不修改原始模块代码的情况下，改变模块的行为或依赖。
   */
  private getOverrideModuleByModule(
    /**要查找覆盖的模块定义 */
    module: ModuleDefinition,
    /**一个包含覆盖信息的数组 */
    overrides: ModuleOverride[],
  ): ModuleOverride | undefined {
    /**
     * 检查传入的module是否是一个正向引用ForwardReference（正向引用是一种特殊的模块定义，
     * 允许模块在定义时引用尚未完全定义的模块，这在处理循环依赖时非常有用）
     */
    if (this.isForwardReference(module)) {
      return overrides.find(moduleToOverride => {
        /**
         * 如果 module 是正向引用，查找 moduleToReplace
         *  属性等于 module.forwardRef() 返回的模块，
         * 或者 moduleToReplace 也是正向引用且与 
         * module.forwardRef() 相等的覆盖定义。
         */

        return (
          moduleToOverride.moduleToReplace === module.forwardRef() ||
          (
            moduleToOverride.moduleToReplace as ForwardReference
          ).forwardRef?.() === module.forwardRef()
        );
      });
    }
    /**如果 module 不是正向引用，直接查找 moduleToReplace 属性等于 module 的覆盖定义。 */
    return overrides.find(
      moduleToOverride => moduleToOverride.moduleToReplace === module,
    );
  }
  /**
   * 
   * @param moduleToOverride 即将要被替换的模块
   * @param newModule 作为替换的新模块
   * @param scope 
   * @returns 
   */
  private async overrideModule(
    moduleToOverride: ModuleDefinition,
    newModule: ModuleDefinition,
    scope: Type<unknown>[],
  ): Promise<
    | {
        moduleRef: Module;
        inserted: boolean;
      }
    | undefined
  > {
    return this.container.replaceModule(
      this.isForwardReference(moduleToOverride)
        ? moduleToOverride.forwardRef()
        : moduleToOverride,
      this.isForwardReference(newModule) ? newModule.forwardRef() : newModule,
      scope,
    );
  }

  public reflectMetadata<T = any>(
    metadataKey: string,
    metatype: Type<any>,
  ): T[] {
    return Reflect.getMetadata(metadataKey, metatype) || [];
  }

  public async registerCoreModule(overrides?: ModuleOverride[]) {
    /**返回一个包含内部核心提供者的动态模块 */
    const moduleDefinition = InternalCoreModuleFactory.create(
      this.container,
      this,
      this.container.getModuleCompiler(),
      this.container.getHttpAdapterHostRef(),
      this.graphInspector,
      overrides,
    );
    const [instance] = await this.scanForModules({
      moduleDefinition,
      overrides,
    });
    this.container.registerCoreModuleRef(instance);
  }

  /**
   * Add either request or transient globally scoped enhancers
   * to all controllers metadata storage
   */
  public addScopedEnhancersMetadata() {
    iterate(this.applicationProvidersApplyMap)
      .filter(wrapper => this.isRequestOrTransient(wrapper.scope))
      .forEach(({ moduleKey, providerKey }) => {
        const modulesContainer = this.container.getModules();
        const { injectables } = modulesContainer.get(moduleKey);
        const instanceWrapper = injectables.get(providerKey);

        const iterableIterator = modulesContainer.values();
        iterate(iterableIterator)
          .map(moduleRef =>
            Array.from<InstanceWrapper>(moduleRef.controllers.values()).concat(
              moduleRef.entryProviders,
            ),
          )
          .flatten()
          .forEach(controllerOrEntryProvider =>
            controllerOrEntryProvider.addEnhancerMetadata(instanceWrapper),
          );
      });
  }

  public applyApplicationProviders() {
    const applyProvidersMap = this.getApplyProvidersMap();
    const applyRequestProvidersMap = this.getApplyRequestProvidersMap();

    const getInstanceWrapper = (
      moduleKey: string,
      providerKey: string,
      collectionKey: 'providers' | 'injectables',
    ) => {
      const modules = this.container.getModules();
      const collection = modules.get(moduleKey)[collectionKey];
      return collection.get(providerKey);
    };

    // Add global enhancers to the application config
    this.applicationProvidersApplyMap.forEach(
      ({ moduleKey, providerKey, type, scope }) => {
        let instanceWrapper: InstanceWrapper;
        if (this.isRequestOrTransient(scope)) {
          instanceWrapper = getInstanceWrapper(
            moduleKey,
            providerKey,
            'injectables',
          );

          this.graphInspector.insertAttachedEnhancer(instanceWrapper);
          return applyRequestProvidersMap[type as string](instanceWrapper);
        }
        instanceWrapper = getInstanceWrapper(
          moduleKey,
          providerKey,
          'providers',
        );
        this.graphInspector.insertAttachedEnhancer(instanceWrapper);
        applyProvidersMap[type as string](instanceWrapper.instance);
      },
    );
  }
  /**
   * 用于获取一个映射，该映射定义了不同类型的全局增强器（如拦截器、守卫、管道和过滤器）如何被应用到整个应用中
   * 这个方法是框架内部用于配置和管理全局增强器的一部分，确保这些增强器能够在应用的所有上下文中正确地工作
   */
  public getApplyProvidersMap(): { [type: string]: Function } {
    /**
     * 方法返回一个对象，其中每个键是一个增强器类型（如 APP_INTERCEPTOR, APP_PIPE, APP_GUARD, APP_FILTER），
     * 每个值是一个函数，这个函数负责将对应的增强器添加到全局配置中。
     */
    return {
      [APP_INTERCEPTOR]: (interceptor: NestInterceptor) =>
      /**全局拦截器，用于拦截和处理应用中的请求。 */
        this.applicationConfig.addGlobalInterceptor(interceptor),

      [APP_PIPE]: (pipe: PipeTransform) =>
      /**全局管道，用于处理和转换请求数据 */
        this.applicationConfig.addGlobalPipe(pipe),
      [APP_GUARD]: (guard: CanActivate) =>
      /**全局守卫，用于在请求被处理前进行权限检查。 */
        this.applicationConfig.addGlobalGuard(guard),
      [APP_FILTER]: (filter: ExceptionFilter) =>
      /**全局异常过滤器，用于捕获和处理异常。 */
        this.applicationConfig.addGlobalFilter(filter),
    };
  }

  public getApplyRequestProvidersMap(): { [type: string]: Function } {
    return {
      [APP_INTERCEPTOR]: (interceptor: InstanceWrapper<NestInterceptor>) =>
        this.applicationConfig.addGlobalRequestInterceptor(interceptor),
      [APP_PIPE]: (pipe: InstanceWrapper<PipeTransform>) =>
        this.applicationConfig.addGlobalRequestPipe(pipe),
      [APP_GUARD]: (guard: InstanceWrapper<CanActivate>) =>
        this.applicationConfig.addGlobalRequestGuard(guard),
      [APP_FILTER]: (filter: InstanceWrapper<ExceptionFilter>) =>
        this.applicationConfig.addGlobalRequestFilter(filter),
    };
  }

  public isDynamicModule(
    module: Type<any> | DynamicModule,
  ): module is DynamicModule {
    return module && !!(module as DynamicModule).module;
  }

  /**
   * @param metatype
   * @returns `true` if `metatype` is annotated with the `@Injectable()` decorator.
   */
  private isInjectable(metatype: Type<any>): boolean {
    return !!Reflect.getMetadata(INJECTABLE_WATERMARK, metatype);
  }

  /**
   * @param metatype
   * @returns `true` if `metatype` is annotated with the `@Controller()` decorator.
   */
  private isController(metatype: Type<any>): boolean {
    return !!Reflect.getMetadata(CONTROLLER_WATERMARK, metatype);
  }

  /**
   * @param metatype
   * @returns `true` if `metatype` is annotated with the `@Catch()` decorator.
   */
  private isExceptionFilter(metatype: Type<any>): boolean {
    return !!Reflect.getMetadata(CATCH_WATERMARK, metatype);
  }

  /**模块是否为正向引用 */
  private isForwardReference(
    module: ModuleDefinition,
  ): module is ForwardReference {
    return module && !!(module as ForwardReference).forwardRef;
  }
  /**
   * 生命周期策略
   * 1. Singleton:单例模式下，提供者的实例在整个应用程序中是共享的。
   * 一旦被创建，相同的实例会在每次注入时被复用。
   * 2. Request:
   * 请求级别的提供者为每个请求创建一个新的实例。
   * 这对于处理请求特定的数据非常有用，例如，用户身份验证或在请求期间保持状态。
   * 3. Transient:
   * 瞬态提供者每次注入时都会创建一个新的实例。这提供了最大的灵活性，
   * 但也可能导致更高的性能开销，因为每次依赖解析时都需要实例化。
   */

  private isRequestOrTransient(scope: Scope): boolean {
    return scope === Scope.REQUEST || scope === Scope.TRANSIENT;
  }
}
