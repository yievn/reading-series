/**
 * @publicApi
 */
export enum Scope {
  /**
   * The provider can be shared across multiple classes. The provider lifetime
   * is strictly tied to the application lifecycle. Once the application has
   * bootstrapped, all providers have been instantiated.
   * 单例作用域（默认）：在整个应用程序中，提供者只会被实例化一次。无论请求多少次，都会使用同一个实例。
   */
  DEFAULT,
  /**
   * A new private instance of the provider is instantiated for every use
   * 瞬态作用域：瞬态作用域提供者在每次微任务队列（例如，异步操作或定时器）被清空时被实例化。这种作用域在处理特定类型的异步操作时很有用
   */
  TRANSIENT,
  /**
   * A new instance is instantiated for each request processing pipeline
   * 对于每个进入的请求，Nest会创建一个新的提供者实例。这对处理请求特定的数据很有用，
   * 但可能会增加内存使用和处理时间
   */
  REQUEST,
}

/**
 * @publicApi
 *
 * @see [Injection Scopes](https://docs.nestjs.com/fundamentals/injection-scopes)
 */
export interface ScopeOptions {
  /**
   * Specifies the lifetime of an injected Provider or Controller.
   */
  scope?: Scope;
  /**
   * Flags provider as durable. This flag can be used in combination with custom context id
   * factory strategy to construct lazy DI subtrees.
   *
   * This flag can be used only in conjunction with scope = Scope.REQUEST.
   * 用于标记一个提供者是否为持久的，这个选项只能与Scope.REQUEST作用域一起使用
   * 
   * 当durable设置为true时，它允许在请求作用域的提供者中构建延迟的依赖注入（DI）子树。这意味着即使在请求处理完成后，
   * 这些特定的提供者实例也不会立即被销毁，而是可以持续存在更长的时间，直到它们不再被需要。
   * 
   * 应用场景：这种机制特别适合于那些需要跨多个请求保持状态，或者其创建和销毁成本较高的资源。例如，可以用于管理
   * 数据库连接、大型数据结构、或者其他需要显著初始化开销的服务。
   */
  durable?: boolean;
}
