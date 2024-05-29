import { ShutdownSignal } from '../enums/shutdown-signal.enum';
import { LoggerService, LogLevel } from '../services/logger.service';
import { DynamicModule } from './modules';
import { Type } from './type.interface';

/**用于定义在获取或解析依赖项时可以使用的配置选项，这个接口
 * 主要用于get和resolve方法，允许开发者在请求特定服务或组件时
 * 提供额外的指示，以控制如何获取或解析这些依赖依赖项。
 */
export interface GetOrResolveOptions {
  /**
   * If enabled, lookup will only be performed in the host module.
   * @default false
   * 当设置为true时，这个选项指示依赖注入系统仅在当前模块（即发起请求的模块）
   * 中查找依赖项。这有助于确保依赖项的查找范围被限制在一个特定的模块内，从而
   * 避免潜在的命名冲突或错误的依赖解析。
   */
  strict?: boolean;
  /**
   * If enabled, instead of returning a first instance registered under a given token,
   * a list of instances will be returned.
   * @default false
   * 当设置为true时，这个选项指示依赖注入系统返回所有匹配实例，而不仅仅是第一个找到的实例。
   * 这适用于需要对所有实例执行操作的场景，如初始化或批量处理
   */
  each?: boolean;
}

/**
 * Interface defining NestApplicationContext.
 *
 * @publicApi
 */
export interface INestApplicationContext {
  /**
   * Allows navigating through the modules tree, for example, to pull out a specific instance from the selected module.
   * @returns {INestApplicationContext}
   */
  select<T>(module: Type<T> | DynamicModule): INestApplicationContext;

  /**
   * Retrieves an instance of either injectable or controller, otherwise, throws exception.
   * @returns {TResult}
   */
  get<TInput = any, TResult = TInput>(
    typeOrToken: Type<TInput> | Function | string | symbol,
  ): TResult;
  /**
   * Retrieves an instance of either injectable or controller, otherwise, throws exception.
   * @returns {TResult}
   */
  get<TInput = any, TResult = TInput>(
    typeOrToken: Type<TInput> | Function | string | symbol,
    options: { strict?: boolean; each?: undefined | false },
  ): TResult;
  /**
   * Retrieves a list of instances of either injectables or controllers, otherwise, throws exception.
   * @returns {Array<TResult>}
   */
  get<TInput = any, TResult = TInput>(
    typeOrToken: Type<TInput> | Function | string | symbol,
    options: { strict?: boolean; each: true },
  ): Array<TResult>;
  /**
   * Retrieves an instance (or a list of instances) of either injectable or controller, otherwise, throws exception.
   * @returns {TResult | Array<TResult>}
   */
  get<TInput = any, TResult = TInput>(
    typeOrToken: Type<TInput> | Function | string | symbol,
    options?: GetOrResolveOptions,
  ): TResult | Array<TResult>;

  /**
   * Resolves transient or request-scoped instance of either injectable or controller, otherwise, throws exception.
   * @returns {Array<TResult>}
   */
  resolve<TInput = any, TResult = TInput>(
    typeOrToken: Type<TInput> | Function | string | symbol,
  ): Promise<TResult>;
  /**
   * Resolves transient or request-scoped instance of either injectable or controller, otherwise, throws exception.
   * @returns {Array<TResult>}
   */
  resolve<TInput = any, TResult = TInput>(
    typeOrToken: Type<TInput> | Function | string | symbol,
    contextId?: { id: number },
  ): Promise<TResult>;
  /**
   * Resolves transient or request-scoped instance of either injectable or controller, otherwise, throws exception.
   * @returns {Array<TResult>}
   */
  resolve<TInput = any, TResult = TInput>(
    typeOrToken: Type<TInput> | Function | string | symbol,
    contextId?: { id: number },
    options?: { strict?: boolean; each?: undefined | false },
  ): Promise<TResult>;
  /**
   * Resolves transient or request-scoped instances of either injectables or controllers, otherwise, throws exception.
   * @returns {Array<TResult>}
   */
  resolve<TInput = any, TResult = TInput>(
    typeOrToken: Type<TInput> | Function | string | symbol,
    contextId?: { id: number },
    options?: { strict?: boolean; each: true },
  ): Promise<Array<TResult>>;
  /**
   * Resolves transient or request-scoped instance (or a list of instances) of either injectable or controller, otherwise, throws exception.
   * @returns {Promise<TResult | Array<TResult>>}
   */
  resolve<TInput = any, TResult = TInput>(
    typeOrToken: Type<TInput> | Function | string | symbol,
    contextId?: { id: number },
    options?: GetOrResolveOptions,
  ): Promise<TResult | Array<TResult>>;

  /**
   * Registers the request/context object for a given context ID (DI container sub-tree).
   * @returns {void}
   */
  registerRequestByContextId<T = any>(
    request: T,
    contextId: { id: number },
  ): void;

  /**
   * Terminates the application
   * @returns {Promise<void>}
   */
  close(): Promise<void>;

  /**
   * Sets custom logger service.
   * Flushes buffered logs if auto flush is on.
   * @returns {void}
   */
  useLogger(logger: LoggerService | LogLevel[] | false): void;

  /**
   * Prints buffered logs and detaches buffer.
   * @returns {void}
   */
  flushLogs(): void;

  /**
   * Enables the usage of shutdown hooks. Will call the
   * `onApplicationShutdown` function of a provider if the
   * process receives a shutdown signal.
   *
   * @returns {this} The Nest application context instance
   */
  enableShutdownHooks(signals?: ShutdownSignal[] | string[]): this;

  /**
   * Initializes the Nest application.
   * Calls the Nest lifecycle events.
   * It isn't mandatory to call this method directly.
   *
   * @returns {Promise<this>} The NestApplicationContext instance as Promise
   */
  init(): Promise<this>;
}
