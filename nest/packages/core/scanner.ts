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

interface ApplicationProviderWrapper {
  moduleKey: string;
  providerKey: string;
  type: InjectionToken;
  scope?: Scope;
}

interface ModulesScanParameters {
  moduleDefinition: ModuleDefinition;
  scope?: Type<unknown>[];
  ctxRegistry?: (ForwardReference | DynamicModule | Type<unknown>)[];
  overrides?: ModuleOverride[];
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
    /**当前模块的作用域链，或者说依赖顺序链 */
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
    /** */
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
     * 那么无效类模块的异常，因为这些类型不能作为模块被注册
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
   * @param modules 
   */
  public async scanModulesForDependencies(
    modules: Map<string, Module> = this.container.getModules(),
  ) {
    for (const [token, { metatype }] of modules) {
      await this.reflectImports(metatype, token, metatype.name);
      this.reflectProviders(metatype, token);
      this.reflectControllers(metatype, token);
      this.reflectExports(metatype, token);
    }
  }

  public async reflectImports(
    module: Type<unknown>,
    token: string,
    context: string,
  ) {
    const modules = [
      ...this.reflectMetadata(MODULE_METADATA.IMPORTS, module),
      ...this.container.getDynamicMetadataByToken(
        token,
        MODULE_METADATA.IMPORTS as 'imports',
      ),
    ];
    for (const related of modules) {
      await this.insertImport(related, token, context);
    }
  }

  public reflectProviders(module: Type<any>, token: string) {
    const providers = [
      ...this.reflectMetadata(MODULE_METADATA.PROVIDERS, module),
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

  public reflectInjectables(
    component: Type<Injectable>,
    token: string,
    metadataKey: string,
  ) {
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

  public async insertImport(related: any, token: string, context: string) {
    if (isUndefined(related)) {
      throw new CircularDependencyException(context);
    }
    if (this.isForwardReference(related)) {
      return this.container.addImport(related.forwardRef(), token);
    }
    await this.container.addImport(related, token);
  }

  public isCustomProvider(
    provider: Provider,
  ): provider is
    | ClassProvider
    | ValueProvider
    | FactoryProvider
    | ExistingProvider {
    return provider && !isNil((provider as any).provide);
  }

  public insertProvider(provider: Provider, token: string) {
    const isCustomProvider = this.isCustomProvider(provider);
    if (!isCustomProvider) {
      return this.container.addProvider(provider as Type<any>, token);
    }
    const applyProvidersMap = this.getApplyProvidersMap();
    const providersKeys = Object.keys(applyProvidersMap);
    const type = (
      provider as
        | ClassProvider
        | ValueProvider
        | FactoryProvider
        | ExistingProvider
    ).provide;

    if (!providersKeys.includes(type as string)) {
      return this.container.addProvider(provider as any, token);
    }
    const uuid = UuidFactory.get(type.toString());
    const providerToken = `${type as string} (UUID: ${uuid})`;

    let scope = (provider as ClassProvider | FactoryProvider).scope;
    if (isNil(scope) && (provider as ClassProvider).useClass) {
      scope = getClassScope((provider as ClassProvider).useClass);
    }
    this.applicationProvidersApplyMap.push({
      type,
      moduleKey: token,
      providerKey: providerToken,
      scope,
    });

    const newProvider = {
      ...provider,
      provide: providerToken,
      scope,
    } as Provider;

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
    if (this.isRequestOrTransient(factoryOrClassProvider.scope)) {
      return this.container.addInjectable(newProvider, token, enhancerSubtype);
    }
    this.container.addProvider(newProvider, token, enhancerSubtype);
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

  public getApplyProvidersMap(): { [type: string]: Function } {
    return {
      [APP_INTERCEPTOR]: (interceptor: NestInterceptor) =>
        this.applicationConfig.addGlobalInterceptor(interceptor),
      [APP_PIPE]: (pipe: PipeTransform) =>
        this.applicationConfig.addGlobalPipe(pipe),
      [APP_GUARD]: (guard: CanActivate) =>
        this.applicationConfig.addGlobalGuard(guard),
      [APP_FILTER]: (filter: ExceptionFilter) =>
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

  private isRequestOrTransient(scope: Scope): boolean {
    return scope === Scope.REQUEST || scope === Scope.TRANSIENT;
  }
}
