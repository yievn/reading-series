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
   * 转换作用域：转换作用域提供者在每次微任务队列（例如，异步操作或定时器）被清空时被实例化。这种作用域在处理特定类型的异步操作时很有用
   */
  TRANSIENT,
  /**
   * A new instance is instantiated for each request processing pipeline
   * 对于每个进入的请求，Nest回创建一个新的提供者实例。这对处理请求特定的数据很有用，但可能会增加内存使用和处理时间
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
   */
  durable?: boolean;
}
