import {
  EnhancerSubtype,
  ENTRY_PROVIDER_WATERMARK,
} from '@nestjs/common/constants';
import {
  ClassProvider,
  Controller,
  DynamicModule,
  ExistingProvider,
  FactoryProvider,
  Injectable,
  InjectionToken,
  NestModule,
  Provider,
  Type,
  ValueProvider,
} from '@nestjs/common/interfaces';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import {
  isFunction,
  isNil,
  isObject,
  isString,
  isSymbol,
  isUndefined,
} from '@nestjs/common/utils/shared.utils';
import { iterate } from 'iterare';
import { ApplicationConfig } from '../application-config';
import {
  InvalidClassException,
  RuntimeException,
  UnknownExportException,
} from '../errors/exceptions';
import { createContextId } from '../helpers/context-id-factory';
import { getClassScope } from '../helpers/get-class-scope';
import { isDurable } from '../helpers/is-durable';
import { UuidFactory } from '../inspector/uuid-factory';
import { CONTROLLER_ID_KEY } from './constants';
import { NestContainer } from './container';
import { ContextId, InstanceWrapper } from './instance-wrapper';
import { ModuleRef, ModuleRefGetOrResolveOpts } from './module-ref';
import { Injector } from './injector';

/**
 * Module用于表示和管理应用中的一个模块，每个模块可以包含控制器、提供者、导入和导出等，是组织和
 * 封装功能的基本单元。
 * 
 1、封装功能：Module类通过封装控制器、服务（提供者）、导入的模块等，提供了一个清晰的结构来组织相关的功能和业务逻辑。
 2、依赖注入容器：每个Module实例作为一个依赖注入（DI）容器，管理和实例化其内部定义的提供者，以及处理这些提供者之间
 的依赖关系
 3、模块隔离：通过模块化的方法，Module类帮助实现了功能的隔离和重用，使得应用更加模块化，易于扩展和维护
 */
export class Module {
  /**每个模块实例的唯一标识符，这个ID通常用于调试和追中模块，帮助开发者在复杂的应用中快速定位问题 */
  private readonly _id: string;
  /**出该模块导入的其他模块的集合。通过导入，一个模块可以使用另一个模块公开的提供者或
   * 控制器，这是实现模块间依赖和功能服用的基础
   */
  private readonly _imports = new Set<Module>();
  /**一个Map，其中键是提供者注入标记（InjectionToken），值是包装了提供者实例的InstanceWrapper。这些
   * 提供者包括服务、工厂、值等，是模块功能实现的基础
   */
  private readonly _providers = new Map<
    InjectionToken,
    InstanceWrapper<Injectable>
  >();
  /**存储那些不直接作为提供者，但需要依赖注入的类的映射，这些通常是那些被 
   *  @Injectable() 装饰但未在任何 providers 或 exports 数组中列出的类。
  */
  private readonly _injectables = new Map<
    InjectionToken,
    InstanceWrapper<Injectable>
  >();
  /**存储模块中定义的所有中间件的映射。中间件用于处理请求的前置和后置逻辑，如身份验证、日志记录 */
  private readonly _middlewares = new Map<
    InjectionToken,
    InstanceWrapper<Injectable>
  >();
  /**存储模块中定义的所有控制器的映射。控制器负责处理应用中的请求，并返回相应。每个控制器都被封装在InstanceWrapper中，
   * 以便管理器生命周期和依赖注入
   */
  private readonly _controllers = new Map<
    InjectionToken,
    InstanceWrapper<Controller>
  >();
  /**特别标记的一组提供者，这写提供者在模块初始化时需要特别处理，例如，他们可能是动态模块的入口点。 */
  private readonly _entryProviderKeys = new Set<InjectionToken>();
  /**定义了可以被其他模块导入的提供者或控制器的集合。只有被列在exports中的提供者或控制器才可以在其他模块中被
   * 使用，这提供了一种封装和控制模块间交互的方式。
   */
  private readonly _exports = new Set<InjectionToken>();
  /**表示莫夸在依赖图中的距离，用于解析依赖注入时的优先级和顺序 */
  private _distance = 0;
  /** */
  private _initOnPreview = false;
  /**标记模块是否为全局模块。全局模块一旦被设置，其提供的提供者可以在任何其他模块中被访问，无需显式导入。 */
  private _isGlobal = false;
  private _token: string;

  constructor(
    private readonly _metatype: Type<any>,
    private readonly container: NestContainer,
  ) {  
    this.addCoreProviders();
    this._id = this.generateUuid();
  }

  get id(): string {
    return this._id;
  }

  get token(): string {
    return this._token;
  }

  set token(token: string) {
    this._token = token;
  }

  get name() {
    return this.metatype.name;
  }

  get isGlobal() {
    return this._isGlobal;
  }

  set isGlobal(global: boolean) {
    this._isGlobal = global;
  }

  get initOnPreview() {
    return this._initOnPreview;
  }

  set initOnPreview(initOnPreview: boolean) {
    this._initOnPreview = initOnPreview;
  }

  get providers(): Map<InjectionToken, InstanceWrapper<Injectable>> {
    return this._providers;
  }

  get middlewares(): Map<InjectionToken, InstanceWrapper<Injectable>> {
    return this._middlewares;
  }

  get imports(): Set<Module> {
    return this._imports;
  }

  get injectables(): Map<InjectionToken, InstanceWrapper<Injectable>> {
    return this._injectables;
  }

  get controllers(): Map<InjectionToken, InstanceWrapper<Controller>> {
    return this._controllers;
  }

  get entryProviders(): Array<InstanceWrapper<Injectable>> {
    return Array.from(this._entryProviderKeys).map(token =>
      this.providers.get(token),
    );
  }

  get exports(): Set<InjectionToken> {
    return this._exports;
  }
  /** */
  get instance(): NestModule {
    if (!this._providers.has(this._metatype)) {
      throw new RuntimeException();
    }
    const module = this._providers.get(this._metatype);
    return module.instance as NestModule;
  }
  /** */
  get metatype(): Type<any> {
    return this._metatype;
  }
  /** */
  get distance(): number {
    return this._distance;
  }
  /** */
  set distance(value: number) {
    this._distance = value;
  }
  /** */
  public addCoreProviders() {
    this.addModuleAsProvider();
    this.addModuleRef();
    this.addApplicationConfig();
  }
  /** */
  public addModuleRef() {
    const moduleRef = this.createModuleReferenceType();
    this._providers.set(
      ModuleRef,
      new InstanceWrapper({
        token: ModuleRef,
        name: ModuleRef.name,
        metatype: ModuleRef as any,
        isResolved: true,
        instance: new moduleRef(),
        host: this,
      }),
    );
  }

  public addModuleAsProvider() {
    this._providers.set(
      this._metatype,
      new InstanceWrapper({
        token: this._metatype,
        name: this._metatype.name,
        metatype: this._metatype,
        isResolved: false,
        instance: null,
        host: this,
      }),
    );
  }

  public addApplicationConfig() {
    this._providers.set(
      ApplicationConfig,
      new InstanceWrapper({
        token: ApplicationConfig,
        name: ApplicationConfig.name,
        isResolved: true,
        instance: this.container.applicationConfig,
        host: this,
      }),
    );
  }

  public addInjectable<T extends Injectable>(
    injectable: Provider,
    enhancerSubtype: EnhancerSubtype,
    host?: Type<T>,
  ) {
    if (this.isCustomProvider(injectable)) {
      return this.addCustomProvider(
        injectable,
        this._injectables,
        enhancerSubtype,
      );
    }
    let instanceWrapper = this.injectables.get(injectable);
    if (!instanceWrapper) {
      instanceWrapper = new InstanceWrapper({
        token: injectable,
        name: injectable.name,
        metatype: injectable,
        instance: null,
        isResolved: false,
        scope: getClassScope(injectable),
        durable: isDurable(injectable),
        subtype: enhancerSubtype,
        host: this,
      });
      this._injectables.set(injectable, instanceWrapper);
    }
    if (host) {
      const hostWrapper =
        this._controllers.get(host) || this._providers.get(host);
      hostWrapper && hostWrapper.addEnhancerMetadata(instanceWrapper);
    }
    return instanceWrapper;
  }

  public addProvider(provider: Provider): InjectionToken;
  public addProvider(
    provider: Provider,
    enhancerSubtype: EnhancerSubtype,
  ): InjectionToken;
  public addProvider(provider: Provider, enhancerSubtype?: EnhancerSubtype) {
    /**如果是自定义提供者 */
    if (this.isCustomProvider(provider)) {
      if (this.isEntryProvider(provider.provide)) {
        this._entryProviderKeys.add(provider.provide);
      }
      return this.addCustomProvider(provider, this._providers, enhancerSubtype);
    }

    this._providers.set(
      provider,
      new InstanceWrapper({
        token: provider,
        name: (provider as Type<Injectable>).name,
        metatype: provider as Type<Injectable>,
        instance: null,
        isResolved: false,
        scope: getClassScope(provider),
        durable: isDurable(provider),
        host: this,
      }),
    );
    /**判断是不是一个入口提供者，是的话添加到 _entryProviderKeys集合中*/
    if (this.isEntryProvider(provider)) {
      this._entryProviderKeys.add(provider);
    }

    return provider as Type<Injectable>;
  }
  /**
   * 自定义提供者是指那些不直接使用类本身作为提供者，
   * 而是通过一些特定的配置来定义如何提供依赖的对象。
   * 这些配置包括使用工厂函数、已存在的实例、值或者通过别的类来提供实例。
   * 
   * ClassProvider、ValueProvider、FactoryProvider、ExistingProvider
   * 
   * 如果存在provide，说明是自定义提供者
   */
  public isCustomProvider(
    provider: Provider,
  ): provider is
    | ClassProvider
    | FactoryProvider
    | ValueProvider
    | ExistingProvider {
    return !isNil(
      (
        provider as
          | ClassProvider
          | FactoryProvider
          | ValueProvider
          | ExistingProvider
      ).provide,
    );
  }

  public addCustomProvider(
    provider:
      | ClassProvider
      | FactoryProvider
      | ValueProvider
      | ExistingProvider,
    collection: Map<Function | string | symbol, any>,
    enhancerSubtype?: EnhancerSubtype,
  ) {
    if (this.isCustomClass(provider)) {
      this.addCustomClass(provider, collection, enhancerSubtype);
    } else if (this.isCustomValue(provider)) {
      this.addCustomValue(provider, collection, enhancerSubtype);
    } else if (this.isCustomFactory(provider)) {
      this.addCustomFactory(provider, collection, enhancerSubtype);
    } else if (this.isCustomUseExisting(provider)) {
      this.addCustomUseExisting(provider, collection, enhancerSubtype);
    }
    return provider.provide;
  }

  public isCustomClass(provider: any): provider is ClassProvider {
    return !isUndefined((provider as ClassProvider).useClass);
  }

  public isCustomValue(provider: any): provider is ValueProvider {
    return (
      isObject(provider) &&
      Object.prototype.hasOwnProperty.call(provider, 'useValue')
    );
  }

  public isCustomFactory(provider: any): provider is FactoryProvider {
    return !isUndefined((provider as FactoryProvider).useFactory);
  }

  public isCustomUseExisting(provider: any): provider is ExistingProvider {
    return !isUndefined((provider as ExistingProvider).useExisting);
  }

  public isDynamicModule(exported: any): exported is DynamicModule {
    return exported && exported.module;
  }

  public addCustomClass(
    provider: ClassProvider,
    collection: Map<InjectionToken, InstanceWrapper>,
    enhancerSubtype?: EnhancerSubtype,
  ) {
    let { scope, durable } = provider;

    const { useClass } = provider;
    if (isUndefined(scope)) {
      scope = getClassScope(useClass);
    }
    if (isUndefined(durable)) {
      durable = isDurable(useClass);
    }

    const token = provider.provide;
    collection.set(
      token,
      new InstanceWrapper({
        token,
        name: useClass?.name || useClass,
        metatype: useClass,
        instance: null,
        isResolved: false,
        scope,
        durable,
        host: this,
        subtype: enhancerSubtype,
      }),
    );
  }

  public addCustomValue(
    provider: ValueProvider,
    collection: Map<Function | string | symbol, InstanceWrapper>,
    enhancerSubtype?: EnhancerSubtype,
  ) {
    const { useValue: value, provide: providerToken } = provider;
    collection.set(
      providerToken,
      new InstanceWrapper({
        token: providerToken,
        name: (providerToken as Function)?.name || providerToken,
        metatype: null,
        instance: value,
        isResolved: true,
        async: value instanceof Promise,
        host: this,
        subtype: enhancerSubtype,
      }),
    );
  }

  public addCustomFactory(
    provider: FactoryProvider,
    collection: Map<Function | string | symbol, InstanceWrapper>,
    enhancerSubtype?: EnhancerSubtype,
  ) {
    const {
      useFactory: factory,
      inject,
      scope,
      durable,
      provide: providerToken,
    } = provider;

    collection.set(
      providerToken,
      new InstanceWrapper({
        token: providerToken,
        name: (providerToken as Function)?.name || providerToken,
        metatype: factory as any,
        instance: null,
        isResolved: false,
        inject: inject || [],
        scope,
        durable,
        host: this,
        subtype: enhancerSubtype,
      }),
    );
  }

  public addCustomUseExisting(
    provider: ExistingProvider,
    collection: Map<Function | string | symbol, InstanceWrapper>,
    enhancerSubtype?: EnhancerSubtype,
  ) {
    const { useExisting, provide: providerToken } = provider;
    collection.set(
      providerToken,
      new InstanceWrapper({
        token: providerToken,
        name: (providerToken as Function)?.name || providerToken,
        metatype: (instance => instance) as any,
        instance: null,
        isResolved: false,
        inject: [useExisting],
        host: this,
        isAlias: true,
        subtype: enhancerSubtype,
      }),
    );
  }

  public addExportedProvider(
    provider: Provider | string | symbol | DynamicModule,
  ) {
    const addExportedUnit = (token: InjectionToken) =>
      this._exports.add(this.validateExportedProvider(token));

    if (this.isCustomProvider(provider as any)) {
      return this.addCustomExportedProvider(provider as any);
    } else if (isString(provider) || isSymbol(provider)) {
      return addExportedUnit(provider);
    } else if (this.isDynamicModule(provider)) {
      const { module: moduleClassRef } = provider;
      return addExportedUnit(moduleClassRef);
    }
    addExportedUnit(provider as Type<any>);
  }

  public addCustomExportedProvider(
    provider:
      | FactoryProvider
      | ValueProvider
      | ClassProvider
      | ExistingProvider,
  ) {
    const provide = provider.provide;
    if (isString(provide) || isSymbol(provide)) {
      return this._exports.add(this.validateExportedProvider(provide));
    }
    this._exports.add(this.validateExportedProvider(provide));
  }

  public validateExportedProvider(token: InjectionToken) {
    if (this._providers.has(token)) {
      return token;
    }
    const imports = iterate(this._imports.values())
      .filter(item => !!item)
      .map(({ metatype }) => metatype)
      .filter(metatype => !!metatype)
      .toArray();

    if (!imports.includes(token as Type<unknown>)) {
      const { name } = this.metatype;
      const providerName = isFunction(token) ? (token as Function).name : token;
      throw new UnknownExportException(providerName as string, name);
    }
    return token;
  }

  public addController(controller: Type<Controller>) {
    this._controllers.set(
      controller,
      new InstanceWrapper({
        token: controller,
        name: controller.name,
        metatype: controller,
        instance: null,
        isResolved: false,
        scope: getClassScope(controller),
        durable: isDurable(controller),
        host: this,
      }),
    );

    this.assignControllerUniqueId(controller);
  }

  public assignControllerUniqueId(controller: Type<Controller>) {
    Object.defineProperty(controller, CONTROLLER_ID_KEY, {
      enumerable: false,
      writable: false,
      configurable: true,
      value: randomStringGenerator(),
    });
  }

  public addImport(moduleRef: Module) {
    this._imports.add(moduleRef);
  }

  /**
   * @deprecated
   */
  public addRelatedModule(module: Module) {
    this._imports.add(module);
  }

  public replace(toReplace: InjectionToken, options: any) {
    if (options.isProvider && this.hasProvider(toReplace)) {
      const originalProvider = this._providers.get(toReplace);

      return originalProvider.mergeWith({ provide: toReplace, ...options });
    } else if (!options.isProvider && this.hasInjectable(toReplace)) {
      const originalInjectable = this._injectables.get(toReplace);

      return originalInjectable.mergeWith({
        provide: toReplace,
        ...options,
      });
    }
  }

  public hasProvider(token: InjectionToken): boolean {
    return this._providers.has(token);
  }

  public hasInjectable(token: InjectionToken): boolean {
    return this._injectables.has(token);
  }

  public getProviderByKey<T = any>(name: InjectionToken): InstanceWrapper<T> {
    return this._providers.get(name) as InstanceWrapper<T>;
  }

  public getProviderById<T = any>(id: string): InstanceWrapper<T> | undefined {
    return Array.from(this._providers.values()).find(
      item => item.id === id,
    ) as InstanceWrapper<T>;
  }

  public getControllerById<T = any>(
    id: string,
  ): InstanceWrapper<T> | undefined {
    return Array.from(this._controllers.values()).find(
      item => item.id === id,
    ) as InstanceWrapper<T>;
  }

  public getInjectableById<T = any>(
    id: string,
  ): InstanceWrapper<T> | undefined {
    return Array.from(this._injectables.values()).find(
      item => item.id === id,
    ) as InstanceWrapper<T>;
  }

  public getMiddlewareById<T = any>(
    id: string,
  ): InstanceWrapper<T> | undefined {
    return Array.from(this._middlewares.values()).find(
      item => item.id === id,
    ) as InstanceWrapper<T>;
  }

  public getNonAliasProviders(): Array<
    [InjectionToken, InstanceWrapper<Injectable>]
  > {
    return [...this._providers].filter(([_, wrapper]) => !wrapper.isAlias);
  }

  public createModuleReferenceType(): Type<ModuleRef> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return class extends ModuleRef {
      constructor() {
        super(self.container);
      }

      public get<TInput = any, TResult = TInput>(
        typeOrToken: Type<TInput> | string | symbol,
        options: ModuleRefGetOrResolveOpts = {},
      ): TResult | Array<TResult> {
        options.strict ??= true;
        options.each ??= false;

        return this.find<TInput, TResult>(
          typeOrToken,
          options.strict
            ? {
                moduleId: self.id,
                each: options.each,
              }
            : options,
        );
      }

      public resolve<TInput = any, TResult = TInput>(
        typeOrToken: Type<TInput> | string | symbol,
        contextId = createContextId(),
        options: ModuleRefGetOrResolveOpts = {},
      ): Promise<TResult | Array<TResult>> {
        options.strict ??= true;
        options.each ??= false;

        return this.resolvePerContext<TInput, TResult>(
          typeOrToken,
          self,
          contextId,
          options,
        );
      }

      public async create<T = any>(
        type: Type<T>,
        contextId?: ContextId,
      ): Promise<T> {
        if (!(type && isFunction(type) && type.prototype)) {
          throw new InvalidClassException(type);
        }
        return this.instantiateClass<T>(type, self, contextId);
      }
    };
  }
/**
 * 用于判断一个提供者是否被标记为入口提供者，入口提供者通常是指那些在模块初始化时需要特别处理的提供者，他们可能是模块
 * 的关键部分，如配置加载器、数据库链接初始化等。
 */
  private isEntryProvider(metatype: InjectionToken): boolean {
    return typeof metatype === 'function'
      ? !!Reflect.getMetadata(ENTRY_PROVIDER_WATERMARK, metatype)
      : false;
  }

  private generateUuid(): string {
    const prefix = 'M_';
    const key = this.name?.toString() ?? this.token?.toString();
    return key ? UuidFactory.get(`${prefix}_${key}`) : randomStringGenerator();
  }
}
