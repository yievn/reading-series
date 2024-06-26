import { Logger, LoggerService, Provider, Scope, Type } from '@nestjs/common';
import { EnhancerSubtype } from '@nestjs/common/constants';
import { FactoryProvider, InjectionToken } from '@nestjs/common/interfaces';
import { clc } from '@nestjs/common/utils/cli-colors.util';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import {
  isNil,
  isString,
  isUndefined,
} from '@nestjs/common/utils/shared.utils';
import { iterate } from 'iterare';
import { UuidFactory } from '../inspector/uuid-factory';
import { STATIC_CONTEXT } from './constants';
import {
  isClassProvider,
  isFactoryProvider,
  isValueProvider,
} from './helpers/provider-classifier';
import { Module } from './module';
import { SettlementSignal } from './settlement-signal';

/**实例元数据缓存键 */
export const INSTANCE_METADATA_SYMBOL = Symbol.for('instance_metadata:cache');
/**实例元数据ID键 */
export const INSTANCE_ID_SYMBOL = Symbol.for('instance_metadata:id');

export interface HostComponentInfo {
  /**
   * Injection token (or class reference)
   */
  token: InjectionToken;
  /**
   * Flag that indicates whether DI subtree is durable
   */
  isTreeDurable: boolean;
}
/**
 * 用于标识特定请求或其他执行上下文，在nest中，每个请求可以有自己的依赖实例，这是通过与每个请求关联一个唯一的ContextId来实现的
 * 
 */
export interface ContextId {
  /**唯一的标识符，通常是一个数字 */
  readonly id: number;
  /**用于存储于上下文相关的额外数据 */
  payload?: unknown;
  /**用于获取父上下文的ContextID，这在处理嵌套的请求或依赖时非常有用 */
  getParent?(info: HostComponentInfo): ContextId;
}
/**
 * 用于存储和管理在特定上下文（如请求作用域）中创建的实例
 */
export interface InstancePerContext<T> {
  /**存储的实例对象 */
  instance: T;
  /**标记实例是否已经完全解析和初始化 */
  isResolved?: boolean;
  /**标记实例的解析是否正在进行 */
  isPending?: boolean;
  /**如果实例是异步解析的，这里会存储一个promise，用于跟踪实例的解析状态 */
  donePromise?: Promise<unknown>;
}
/**
 * 用于存储关于类属性注入的元数据
 */
export interface PropertyMetadata {
  /**属性的名称或符号 */
  key: symbol | string;
  /**与属性关联的 InstanceWrapper对象，它封装了应该注入到该属性的依赖实例*/
  wrapper: InstanceWrapper;
}
/**
 * 它作为一个容器，用于存储于一个实例相关搞得所有元数据，包括依赖、属性注入和增强器（如拦截器和过滤器）
 * 
 * 有关某个实例的元数据
 */
interface InstanceMetadataStore {
  /**一个InstanceWrapper实例数组，存储实例的构造函数依赖 */
  dependencies?: InstanceWrapper[];
  /**一个PropertyMetadata数组，存储需要通过属性注入的依赖 */
  properties?: PropertyMetadata[];
  /**一个InstanceWrapper数组，存储应用于该实例的增强器 */
  enhancers?: InstanceWrapper[];
}

/**
 * 用于封装和管理单个实例（如提供者、控制器等）的元数据和生命周期
 * 
 * 1、封装实例：InstanceWrapper封装了一个特定的实例及其相关的元数据，如依赖、属性和是否是异步提供者等；
 * 2、依赖管理：它管理实例的依赖，确保在创建实例之前，所有必须的依赖都已正确解析和注入。
 * 3、生命周期管理：管理实例的生命周期时间，如初始化和销毁。
 * 4、作用域处理：处理不同作用域（如单例、请求作用域）下的实例创建和缓存 
 */
export class InstanceWrapper<T = any> {
  /**实例的名称 */
  public readonly name: any;
  /**实例的唯一标识符，用于在依赖注入容器中索引和检索实例 */
  public readonly token: InjectionToken;
  /**标记实例是否是异步提供者 */
  public readonly async?: boolean;
  /**指向包含此实例的模块的引用 */
  public readonly host?: Module;
  /**标记此实例是否作为别名提供 */
  public readonly isAlias: boolean = false;
  /**实例的子类型，用于进一步分类实例类型 */
  public readonly subtype?: EnhancerSubtype;
  /**实例的作用域（如DEFAULT、REQUEST） */
  public scope?: Scope = Scope.DEFAULT;
  /**实例的元类型，即类本身 */
  public metatype: Type<T> | Function;
  /**如果实例是通过工厂函数创建的，则此属性包含工厂函数的依赖 */
  public inject?: FactoryProvider['inject'];
  /**实例是否存在正向引用，用于处理循环依赖 */
  public forwardRef?: boolean;
  /**标记实例是否持久化 */
  public durable?: boolean;
  /**实例初始化的时间戳 */
  public initTime?: number;
  /**用于处理异步实例初始化的信号 */
  public settlementSignal?: SettlementSignal;

  private static logger: LoggerService = new Logger(InstanceWrapper.name);
  /**
   * 
   */
  private readonly values = new WeakMap<ContextId, InstancePerContext<T>>();
  /**存储了与实例相关的所有元数据，包括依赖、属性注入的元数据和增强器（拦截器和过滤器）。
   * 通过使用Symbol作为键，可以确保这个元数据存储不会与实例的其它属性冲突或被意外访问，从而提供了一种
   * 安全的方式来封装和管理这些内部信息
   */
  private readonly [INSTANCE_METADATA_SYMBOL]: InstanceMetadataStore = {};
  /**INSTANCE_ID_SYMBOL作为属性键，用来指向实例的唯一标识符（通常是一个字符串）。这个唯一标识符用于在依赖注入
   * 容器中索引和检索实例，使用Symbol作为键同样提供了一种安全的封装方式，防止实例的唯一标识符被外部访问或修改，确保了实例
   * 管理的一致性和安全性。
   */
  private readonly [INSTANCE_ID_SYMBOL]: string;
  /**transientMap是一个用于管理瞬态（TRANSIENT）作用域实例的数据结构
   * 瞬态作用域意味着每次依赖注入时都会创建一个新的实例，而不是共享一个单例，这种作用域对于那些需要
   * 独立状态或多个实例的服务非常有用
   * 
   * 
   */
  private transientMap?:
    | Map<string, WeakMap<ContextId, InstancePerContext<T>>>
    | undefined;
  /**用于判断当前实例的依赖树是否是静态的，在nest中，静态依赖树意味着一旦实例被创建，它将在应用的整个生命周期内保持
   * 不变，这通常适用于单例作用域的服务。
   */
  private isTreeStatic: boolean | undefined;
  /**
   * 用于判断当前实例的依赖树是否是持久的。持久性在这里指的是实例及其依赖是否能够跨越多个请求或上下文持续存在，通
   * 常与请求作用于或瞬态作用域相关
   */
  private isTreeDurable: boolean | undefined;

  constructor(
    metadata: Partial<InstanceWrapper<T>> & Partial<InstancePerContext<T>> = {},
  ) {
    this.initialize(metadata);
    this[INSTANCE_ID_SYMBOL] =
      metadata[INSTANCE_ID_SYMBOL] ?? this.generateUuid();
  }

  get id(): string {
    return this[INSTANCE_ID_SYMBOL];
  }

  set instance(value: T) {
    this.values.set(STATIC_CONTEXT, { instance: value });
  }

  get instance(): T {
    const instancePerContext = this.getInstanceByContextId(STATIC_CONTEXT);
    return instancePerContext.instance;
  }

  get isNotMetatype(): boolean {
    return !this.metatype || this.isFactory;
  }

  get isFactory(): boolean {
    return this.metatype && !isNil(this.inject);
  }

  get isTransient(): boolean {
    return this.scope === Scope.TRANSIENT;
  }
  
  /**
   * 
   * @param contextId 上下文对象
   * @param inquirerId 访问者标识符，如果传入，那么可以通过它获取实例
   * 
   * inquirerId 的主要用途是在瞬态作用域中管理依赖实例。
   * 在瞬态作用域下，每次依赖注入时都应该创建一个新的实例。
   * 然而，如果一个服务被多个不同的组件依赖，
   * 而这些组件又可能在同一个请求的上下文中多次请求该服务，
   * 那么 inquirerId 就可以用来确保每个请求者获得其独立的服务实例。
   * 
   * 意思就是说，当前包装着实例中服务类被多个控制类所依赖时，如果没有inquirerId，那么多个控制类
   * 访问到的可能是同一个服务类实例，而通过inquirerId，便可以获取独立的服务类实例
   * @returns 
   */
  public getInstanceByContextId(
    contextId: ContextId,
    inquirerId?: string,
  ): InstancePerContext<T> {
    /**如果当前包装实例中设置的作用域为瞬态作用域并且查询者标识符有传入  */
    if (this.scope === Scope.TRANSIENT && inquirerId) {
      return this.getInstanceByInquirerId(contextId, inquirerId);
    }
    const instancePerContext = this.values.get(contextId);
    return instancePerContext
      ? instancePerContext
      : this.cloneStaticInstance(contextId);
  }

  public getInstanceByInquirerId(
    contextId: ContextId,
    inquirerId: string,
  ): InstancePerContext<T> {
    /**获取inquirerId对应的实例上下文集合 */
    let collectionPerContext = this.transientMap.get(inquirerId);
    if (!collectionPerContext) {
      /**如果该inquirerId对应的映射表不存在，那么创建一个新的，并存到 transientMap映射中*/
      collectionPerContext = new WeakMap();
      this.transientMap.set(inquirerId, collectionPerContext);
    }
    /**从对应的实例上下文集合合获取contextId对应的实例上下文对象 */
    const instancePerContext = collectionPerContext.get(contextId);
    /**存在则直接返回获取到的实例上下文对象，不存在则 */
    return instancePerContext
      ? instancePerContext
      : this.cloneTransientInstance(contextId, inquirerId);
  }

  public setInstanceByContextId(
    contextId: ContextId,
    value: InstancePerContext<T>,
    inquirerId?: string,
  ) {
    if (this.scope === Scope.TRANSIENT && inquirerId) {
      return this.setInstanceByInquirerId(contextId, inquirerId, value);
    }
    this.values.set(contextId, value);
  }

  public setInstanceByInquirerId(
    contextId: ContextId,
    inquirerId: string,
    value: InstancePerContext<T>,
  ) {
    let collection = this.transientMap.get(inquirerId);
    if (!collection) {
      collection = new WeakMap();
      this.transientMap.set(inquirerId, collection);
    }
    collection.set(contextId, value);
  }

  public addCtorMetadata(index: number, wrapper: InstanceWrapper) {
    if (!this[INSTANCE_METADATA_SYMBOL].dependencies) {
      this[INSTANCE_METADATA_SYMBOL].dependencies = [];
    }
    this[INSTANCE_METADATA_SYMBOL].dependencies[index] = wrapper;
  }

  public getCtorMetadata(): InstanceWrapper[] {
    return this[INSTANCE_METADATA_SYMBOL].dependencies;
  }

  public addPropertiesMetadata(key: symbol | string, wrapper: InstanceWrapper) {
    if (!this[INSTANCE_METADATA_SYMBOL].properties) {
      this[INSTANCE_METADATA_SYMBOL].properties = [];
    }
    this[INSTANCE_METADATA_SYMBOL].properties.push({
      key,
      wrapper,
    });
  }

  public getPropertiesMetadata(): PropertyMetadata[] {
    return this[INSTANCE_METADATA_SYMBOL].properties;
  }

  public addEnhancerMetadata(wrapper: InstanceWrapper) {
    if (!this[INSTANCE_METADATA_SYMBOL].enhancers) {
      this[INSTANCE_METADATA_SYMBOL].enhancers = [];
    }
    this[INSTANCE_METADATA_SYMBOL].enhancers.push(wrapper);
  }

  public getEnhancersMetadata(): InstanceWrapper[] {
    return this[INSTANCE_METADATA_SYMBOL].enhancers;
  }

  public isDependencyTreeDurable(lookupRegistry: string[] = []): boolean {
    if (!isUndefined(this.isTreeDurable)) {
      return this.isTreeDurable;
    }
    if (this.scope === Scope.REQUEST) {
      this.isTreeDurable = this.durable === undefined ? false : this.durable;
      if (this.isTreeDurable) {
        this.printIntrospectedAsDurable();
      }
      return this.isTreeDurable;
    }
    const isStatic = this.isDependencyTreeStatic();
    if (isStatic) {
      return false;
    }

    const isTreeNonDurable = this.introspectDepsAttribute(
      (collection, registry) =>
        collection.some(
          (item: InstanceWrapper) =>
            !item.isDependencyTreeStatic() &&
            !item.isDependencyTreeDurable(registry),
        ),
      lookupRegistry,
    );
    this.isTreeDurable = !isTreeNonDurable;
    if (this.isTreeDurable) {
      this.printIntrospectedAsDurable();
    }
    return this.isTreeDurable;
  }

  public introspectDepsAttribute(
    callback: (
      collection: InstanceWrapper[],
      lookupRegistry: string[],
    ) => boolean,
    lookupRegistry: string[] = [],
  ): boolean {
    if (lookupRegistry.includes(this[INSTANCE_ID_SYMBOL])) {
      return false;
    }
    lookupRegistry = lookupRegistry.concat(this[INSTANCE_ID_SYMBOL]);

    const { dependencies, properties, enhancers } =
      this[INSTANCE_METADATA_SYMBOL];

    let introspectionResult = dependencies
      ? callback(dependencies, lookupRegistry)
      : false;

    if (introspectionResult || !(properties || enhancers)) {
      return introspectionResult;
    }
    introspectionResult = properties
      ? callback(
          properties.map(item => item.wrapper),
          lookupRegistry,
        )
      : false;
    if (introspectionResult || !enhancers) {
      return introspectionResult;
    }
    return enhancers ? callback(enhancers, lookupRegistry) : false;
  }
  
  public isDependencyTreeStatic(lookupRegistry: string[] = []): boolean {
    if (!isUndefined(this.isTreeStatic)) {
      return this.isTreeStatic;
    }
    if (this.scope === Scope.REQUEST) {
      this.isTreeStatic = false;
      this.printIntrospectedAsRequestScoped();
      return this.isTreeStatic;
    }
    this.isTreeStatic = !this.introspectDepsAttribute(
      (collection, registry) =>
        collection.some(
          (item: InstanceWrapper) => !item.isDependencyTreeStatic(registry),
        ),
      lookupRegistry,
    );
    if (!this.isTreeStatic) {
      this.printIntrospectedAsRequestScoped();
    }
    return this.isTreeStatic;
  }

  public cloneStaticInstance(contextId: ContextId): InstancePerContext<T> {
    const staticInstance = this.getInstanceByContextId(STATIC_CONTEXT);
    if (this.isDependencyTreeStatic()) {
      return staticInstance;
    }
    const instancePerContext: InstancePerContext<T> = {
      ...staticInstance,
      instance: undefined,
      isResolved: false,
      isPending: false,
    };
    if (this.isNewable()) {
      instancePerContext.instance = Object.create(this.metatype.prototype);
    }
    this.setInstanceByContextId(contextId, instancePerContext);
    return instancePerContext;
  }

  public cloneTransientInstance(
    contextId: ContextId,
    inquirerId: string,
  ): InstancePerContext<T> {
    const staticInstance = this.getInstanceByContextId(STATIC_CONTEXT);
    const instancePerContext: InstancePerContext<T> = {
      ...staticInstance,
      instance: undefined,
      isResolved: false,
      isPending: false,
    };
    if (this.isNewable()) {
      instancePerContext.instance = Object.create(this.metatype.prototype);
    }
    this.setInstanceByInquirerId(contextId, inquirerId, instancePerContext);
    return instancePerContext;
  }
  /**
   * 
   * @param contextId 上下文对象，没有特殊指定的话默认为全局单例
   * @returns 
   */
  public createPrototype(contextId: ContextId) {
    const host = this.getInstanceByContextId(contextId);
    /**如果metatype不能被构造或者isResolved为true(表示已被解析)，则直接返回 */
    if (!this.isNewable() || host.isResolved) {
      return;
    }
    /**返回一个新对象，它的原型为metatype.prototype */
    return Object.create(this.metatype.prototype);
  }

  public isInRequestScope(
    contextId: ContextId,
    inquirer?: InstanceWrapper | undefined,
  ): boolean {
    const isDependencyTreeStatic = this.isDependencyTreeStatic();

    return (
      !isDependencyTreeStatic &&
      contextId !== STATIC_CONTEXT &&
      (!this.isTransient || (this.isTransient && !!inquirer))
    );
  }

  public isLazyTransient(
    contextId: ContextId,
    inquirer: InstanceWrapper | undefined,
  ): boolean {
    const isInquirerRequestScoped =
      inquirer && !inquirer.isDependencyTreeStatic();

    return (
      this.isDependencyTreeStatic() &&
      contextId !== STATIC_CONTEXT &&
      this.isTransient &&
      isInquirerRequestScoped
    );
  }

  public isExplicitlyRequested(
    contextId: ContextId,
    inquirer?: InstanceWrapper,
  ): boolean {
    const isSelfRequested = inquirer === this;
    return (
      this.isDependencyTreeStatic() &&
      contextId !== STATIC_CONTEXT &&
      (isSelfRequested || (inquirer && inquirer.scope === Scope.TRANSIENT))
    );
  }

  public isStatic(
    contextId: ContextId,
    inquirer: InstanceWrapper | undefined,
  ): boolean {
    const isInquirerRequestScoped =
      inquirer && !inquirer.isDependencyTreeStatic();
    const isStaticTransient = this.isTransient && !isInquirerRequestScoped;

    return (
      this.isDependencyTreeStatic() &&
      contextId === STATIC_CONTEXT &&
      (!this.isTransient ||
        (isStaticTransient && !!inquirer && !inquirer.isTransient))
    );
  }

  public getStaticTransientInstances() {
    if (!this.transientMap) {
      return [];
    }
    const instances = [...this.transientMap.values()];
    return iterate(instances)
      .map(item => item.get(STATIC_CONTEXT))
      .filter(item => !!item)
      .toArray();
  }

  public mergeWith(provider: Provider) {
    if (isValueProvider(provider)) {
      this.metatype = null;
      this.inject = null;

      this.scope = Scope.DEFAULT;

      this.setInstanceByContextId(STATIC_CONTEXT, {
        instance: provider.useValue,
        isResolved: true,
        isPending: false,
      });
    } else if (isClassProvider(provider)) {
      this.inject = null;
      this.metatype = provider.useClass;
    } else if (isFactoryProvider(provider)) {
      this.metatype = provider.useFactory;
      this.inject = provider.inject || [];
    }
  }

  private isNewable(): boolean {
    /**inject为null或undefined，metatype和metatype.prototype都存在，说明是一个构造函数 */
    return isNil(this.inject) && this.metatype && this.metatype.prototype;
  }

  private initialize(
    metadata: Partial<InstanceWrapper<T>> & Partial<InstancePerContext<T>>,
  ) {
    const { instance, isResolved, ...wrapperPartial } = metadata;
    /**为InstanceWrapper实例属性赋值 */
    Object.assign(this, wrapperPartial);
    /** */
    this.setInstanceByContextId(STATIC_CONTEXT, {
      instance,
      isResolved,
    });
    this.scope === Scope.TRANSIENT && (this.transientMap = new Map());
  }

  private printIntrospectedAsRequestScoped() {
    if (!this.isDebugMode() || this.name === 'REQUEST') {
      return;
    }
    if (isString(this.name)) {
      InstanceWrapper.logger.log(
        `${clc.cyanBright(this.name)}${clc.green(
          ' introspected as ',
        )}${clc.magentaBright('request-scoped')}`,
      );
    }
  }

  private printIntrospectedAsDurable() {
    if (!this.isDebugMode()) {
      return;
    }
    if (isString(this.name)) {
      InstanceWrapper.logger.log(
        `${clc.cyanBright(this.name)}${clc.green(
          ' introspected as ',
        )}${clc.magentaBright('durable')}`,
      );
    }
  }

  private isDebugMode(): boolean {
    return !!process.env.NEST_DEBUG;
  }
  /**生成一个唯一的uuid，通常用于为实例生成一个唯一标识符 */
  private generateUuid(): string {
    let key = this.name?.toString() ?? this.token?.toString();
    key += this.host?.name ?? '';

    return key ? UuidFactory.get(key) : randomStringGenerator();
  }
}
