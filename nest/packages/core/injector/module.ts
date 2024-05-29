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
   * 
   * 统一的处理方式：模块类（@module()）也可以作为一个提供者放到_providers中，
   * 模块自身可以像其他服务或提供者一样被管理和处理，
   * 这种统一的处理方式简化了模块和服务的管理，因为框架可以使用相同的机制
   * 来处理所有类型的依赖项，无论他们是普通服务、控制器还是模块本身。
   * 
   * 便于依赖注入：通过将模块类（@module()）放到）也可以作为一个提供者放到_providers中，
   * 模块的实例可以被依赖注入系统管理，这意味着模块本身也可以作为依赖被注入到其他
   * 提供者或模块中。比如，一个模块需要引用另一个模块的实例进行某些操作
   * 
   * 模块的生命周期：在nest中，每个提供者（包括模块本身）都被封装在一个InstanceWrapper中，
   * 这个封装不仅包含了实例本身，还包含了关于实例的元数据，如是否已解析、依赖关系等。
   * 将模块类放入_providers允许模块利用现有的机制来管理模块的声明周期，包括其初始化和销毁。
   * 
   * 反射和元数据访问：在nest中，模块和服务的元数据是通过Typescript的反射API
   * 来访问的，将模块类_metatype作为提供者存储，使得可以在运行时通过_metatype访问
   * 和修改模块的元数据。
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
  /**表示模块在依赖图中的距离，用于解析依赖注入时的优先级和顺序 */
  private _distance = 0;
  /** */
  private _initOnPreview = false;
  /**标记模块是否为全局模块。全局模块一旦被设置，其提供的提供者可以在任何其他模块中被访问，无需显式导入。 */
  private _isGlobal = false;
  /**是模块在依赖注入容器中的标识符。它用于在模块间建立链接和依赖关系，确保
   * 正确的模块实例呗注入到需要他们的地方
   */
  private _token: string;

  constructor(
    /**
     * 用于定义和引用模块的类本身，这个属性通常用于反射和元数据操作，以及在
     * 依赖注入系统中标识和处理模块。
     * 
     * 在Typescript中，Type是一个泛型接口，用于表示类的类型。_metatype通常是
     * 一个类的构造函数，这意味着它是一个可以被new关键实例化的对象。在nest中，这通常
     * 指向一个用@module()装饰器的类
     * 
     * 1、依赖注入。_metatype用于依赖注入容器中注册的和解析模块，它作为一个一个标识符，帮助
     * 容器识别和实例化模块，以及处理模块间的依赖关系
     * 
     * 2、nest使用Typescript的反射（Reflect）功能来读取和操作类的元数据。
     * _metatype作为类的直接引用，允许框架查询模块的元数据，如模块的导入、提供者、
     * 控制器等。
     * 
     * 3、模块实例化：在模块的声明周期中，_metatype用于创建模块的实例，这是通过
     * 调用_metatype作为构造函数来完成，通常在模块的初始化阶段进行。
     */
    private readonly _metatype: Type<any>,
    private readonly container: NestContainer,
  ) {  
    this.addCoreProviders();
    this._id = this.generateUuid();
  }
  /**获取唯一标识符 */
  get id(): string {
    return this._id;
  }
  /**获取 */
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
  /**获取入口提供者 */
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
    /**
     * 检查模块类 _metatype在_providers中是否存在（模块类也会被放到_providers中）
     * 不错在则抛出错误
    */
    if (!this._providers.has(this._metatype)) {
      throw new RuntimeException();
    }
    /**存在于_providers，获取到后返回 */
    const module = this._providers.get(this._metatype);
    return module.instance as NestModule;
  }
  /**返回模块类（就是使用@Module装饰的类定义） */
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
  /**
   * addCoreProviders的主要目的是确保每个模块都具备处理其内部逻辑和与其他模块
   * 交互所需的基本服务，这包括但不限于模块自身的引用、模块引用的处理器、以及应用配置。
   */
  public addCoreProviders() {
    /**
     * 通过addModuleAsProvider方法，将模块的_matatype添加到_providers映射中
     * 这使得模块可以子啊依赖注入系统中被自引用，支持模块内部的依赖关系和自我管理
     */
    this.addModuleAsProvider();
    /**
     * 通过addModuleRef方法，创建并注册一个ModuleRef实例。ModuleRef是一个特殊的服务，
     * 提供了对模块实例的引用和操作能力，如获取和解析模块内的提供者和控制器。
    */
    this.addModuleRef();
    /**
     * 通过addApplicationConfig方法，将应用配置注册为一个提供者。应用配置
     * 包含了全局配置信息，如全局中间件、过滤器等，这对于模块执行其功能是必要的。
     */
    this.addApplicationConfig();
  }
  /**
   * addModuleRef 方法的主要目的是创建并注册一个 ModuleRef 实例到模块的 _providers 映射中。ModuleRef 作为一个核心服务，它允许：
   * 1、获取和解析模块内的提供者和控制器。
   * 2、动态地添加或替换提供者。
   * 3、访问模块的上下文和状态。
  */
  public addModuleRef() {
    /**
     * 创建一个 ModuleRef 类的实例。
     */
    const moduleRef = this.createModuleReferenceType();
    /**
     * 创建的 ModuleRef 实例随后被封装在一个 InstanceWrapper 中，
     * 并设置为已解析（isResolved: true）。
     * 这个 InstanceWrapper 随后被添加到模块的 _providers 映射中，
     * 使用 ModuleRef 作为键。
     */
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
  /**
   * 将模块类（_metatype）注册为一个提供者，这样模块就可以在
   * 其自身或其他模块中作为依赖被注入，这对于实现模块间的通信、共享服务或实现模块
   * 级的单例模式等功能非常有用。
   */
  public addModuleAsProvider() {
    /**
     * 将模块的_metatype作为键，创建一个新的InstanceWrapper实例作为值，添加
     * 到_providers映射中。
     * 
     * InstanceWrapper是一个封装类，用于存储关于提供者的各种信息，包括其类型、实例
     * 、解析状态等。
     * 
     * 在 InstanceWrapper 中，token 设置为模块的 _metatype，name 设置为模块类的名称，metatype 也设置为模块的 _metatype。
     * 初始时，instance 设置为 null，isResolved 设置为 false，表示该模块尚未实例化或解析。
     * 
     */
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
  /**
   * 将全局应用配置注册为模块的一个提供者，这一步确保模块能够访问到全局配置信息，
   * 如中间件、过滤器、管道等。
   * 
   */
  public addApplicationConfig() {
    /**首先从容器实例获取到中ApplicationConfig的实例，这个实例
     * 在应用启动时创建，并且包含了全局的配置信息。
     * 
     * 
     */
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
/**
 * 用于向模块的依赖注入系统中添加一个可注入的服务或提供者，它允许模块动态地
 * 注册新的服务或增强现有服务的功能。
 * 
 * addInjectable的主要目的是将一个新的或现有的服务（injectable）注册到
 * 模块的_injectables映射中，这使得服务可以在模块内部或通过依赖注入在其他模块
 * 中访问和使用。
 */
  public addInjectable<T extends Injectable>(
    injectable: Provider,
    enhancerSubtype: EnhancerSubtype,
    host?: Type<T>,
  ) {
    /** 判断injectable是否是自定义提供者（拥有provide属性）*/
    if (this.isCustomProvider(injectable)) {
      /**如果是自定义提供者，addCustomProvider来处理自定义提供者，并将
       * 其添加到_injectables映射中
       */
      return this.addCustomProvider(
        injectable,
        this._injectables,
        enhancerSubtype,
      );
    }
    /**
     * 如果injectable不是自定义提供者，那么先检查_injectables中是否已存在
     * 该提供者的instanceWrapper实例
     */
    let instanceWrapper = this.injectables.get(injectable);
    if (!instanceWrapper) {
      /**如果不存在，那么创建一个新的InstanceWrapper实例， 
       * InstanceWrapper实例包含了提供者的类型、实例、j
      */
      instanceWrapper = new InstanceWrapper({
        token: injectable,
        name: injectable.name,
        metatype: injectable,
        instance: null,
        isResolved: false, // 未被解析
        scope: getClassScope(injectable),
        /**该提供者实例是否为持久的 */
        durable: isDurable(injectable),
        subtype: enhancerSubtype,
        host: this, // 该提供者的宿主为当前模块
      });
      this._injectables.set(injectable, instanceWrapper);
    }
    /**如果提供了host参数（通常是一个模块或控制器），将尝试在_controllers或者_providers
     * 中找到对应的InstanceWrapper实例，如果找到host对应的InstanceWrapper实例，
     * 那么会将当前injectable的instanceWrapper实例添加到宿主instanceWrapper
     * 实例上的enhandlers上。
     * 
     * 
     */
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
    collection: Map<Function | string | symbol, any>, // _providers
    enhancerSubtype?: EnhancerSubtype,
  ) {
    if (this.isCustomClass(provider)) {
      /**如果是类提供者（拥有useClass） */
      this.addCustomClass(provider, collection, enhancerSubtype);
    } else if (this.isCustomValue(provider)) {
      /**如果是值提供者（拥有useValue） */
      this.addCustomValue(provider, collection, enhancerSubtype);
    } else if (this.isCustomFactory(provider)) {
      /**如果是工厂函数提供者（拥有useFactory） */
      this.addCustomFactory(provider, collection, enhancerSubtype);
    } else if (this.isCustomUseExisting(provider)) {
      /**如果是现有提供者*（ 拥有useExisting）*/
      this.addCustomUseExisting(provider, collection, enhancerSubtype);
    }
    return provider.provide;
  }

  /**判断是否为类提供者，拥有useClass */
  public isCustomClass(provider: any): provider is ClassProvider {
    return !isUndefined((provider as ClassProvider).useClass);
  }
  /**判断是否为值提供者，拥有过useValue */
  public isCustomValue(provider: any): provider is ValueProvider {
    return (
      isObject(provider) &&
      Object.prototype.hasOwnProperty.call(provider, 'useValue')
    );
  }
  /**判断是否为工厂函数提供者，拥有useFactory */
  public isCustomFactory(provider: any): provider is FactoryProvider {
    return !isUndefined((provider as FactoryProvider).useFactory);
  }
  /**判断是否为现有提供者，拥有useExisting */
  public isCustomUseExisting(provider: any): provider is ExistingProvider {
    return !isUndefined((provider as ExistingProvider).useExisting);
  }
  /**判断是否为动态模块，拥有module */
  public isDynamicModule(exported: any): exported is DynamicModule {
    return exported && exported.module;
  }
  /**将自定义类提供者添加到_providers中 */
  public addCustomClass(
    provider: ClassProvider,
    collection: Map<InjectionToken, InstanceWrapper>, // _providers
    enhancerSubtype?: EnhancerSubtype,
  ) {
    /**从自定义类提供者中获取到作用域以及是否持久的配置 */
    let { scope, durable } = provider;

    const { useClass } = provider;
    if (isUndefined(scope)) {
      /**获取类的元数据，从中拿到scope */
      scope = getClassScope(useClass);
    }
    if (isUndefined(durable)) {
      /**从类的元数据中的scopeOption中，判断scopeOption.durable */
      durable = isDurable(useClass);
    }
    /**获取提供者的唯一标识符 */
    const token = provider.provide;
    /**将自定义提供者添加到_providers中 */
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
  /**将自定义值提供者添加到_providers中 */
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
        /**是否为异步提供者 */
        async: value instanceof Promise,
        host: this,
        subtype: enhancerSubtype,
      }),
    );
  }
  /**将自定义工厂函数提供者添加到_providers中 */
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
  /**
   * 用于在模块的依赖注入系统中添加一个新的提供者，这个提供者不创建新的实例，而是引用
   * 一个已经存在的实例。
   */
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
        /**
         * 将 metatype赋成函数形式，在解析的时候，
         * inject中的值会被当做参数传进来
         * 最后解析结果会是useExisting指向的提供者
        */
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
  /**根据实例ID获取提供者实例 */
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
  /**
   * 
   */
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
