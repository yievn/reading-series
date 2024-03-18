/**
1. 'http'
类型：'http'
含义：表示当前执行上下文是基于 HTTP 请求的。
作用：用于指示某些操作或处理是基于 HTTP 请求的特定场景，例如处理 HTTP 请求和响应。
2. 'ws'
类型：'ws'
含义：表示当前执行上下文是基于 WebSocket 的。
作用：用于指示某些操作或处理是基于 WebSocket 连接的特定场景，例如处理 WebSocket 数据和事件。
. 'rpc'
类型：'rpc'
含义：表示当前执行上下文是基于远程过程调用Remote Procedure Call（RPC）的。
作用：用于指示某些操作或处理是基于远程过程调用的特定场景，例如处理远程服务之间的调用和通信。
 */
export type ContextType = 'http' | 'ws' | 'rpc';

/**
 * Methods to obtain request and response objects.
 *
 * @publicApi
 */
export interface HttpArgumentsHost {
  /**
   * Returns the in-flight `request` object.
   */
  getRequest<T = any>(): T;
  /**
   * Returns the in-flight `response` object.
   */
  getResponse<T = any>(): T;
  getNext<T = any>(): T;
}

/**
 * Methods to obtain WebSocket data and client objects.
 *
 * @publicApi
 */
export interface WsArgumentsHost {
  /**
   * Returns the data object.
   */
  getData<T = any>(): T;
  /**
   * Returns the client object.
   */
  getClient<T = any>(): T;
  /**
   * Returns the pattern for the event
   */
  getPattern(): string;
}

/**
 * Methods to obtain RPC data object.
 *
 * @publicApi
 */
export interface RpcArgumentsHost {
  /**
   * Returns the data object.
   */
  getData<T = any>(): T;

  /**
   * Returns the context object.
   */
  getContext<T = any>(): T;
}

/**
 * 提供用于检索传递给处理程序的参数的方法。 
 * 允许选择适当的执行上下文（例如，HTTP、RPC或 WebSockets）从中检索参数。
 * 
 * 通过ArgumentsHost接口，可以根据不同的执行上下文（如HTTP、RPC、WebSockets）
 * 来获取相应的参数，从而实现根据不同执行上下文的需求来处理传递给处理程序的参数。
 * 这样可以使处理程序更具有灵活性，能够根据不同的执行上下文来获取和处理参数，从而
 * 更好地使用不同的场景和需求。
 *
 * @publicApi
 */
export interface ArgumentsHost {
  /**
   * 这个方法用于获取传递给处理程序的参数数组，
   * 可以包含任意类型的参数。通过调用这个方法，
   * 处理程序可以访问并处理传递给它的所有参数。
   */
  getArgs<T extends Array<any> = any[]>(): T;
  /**
   * 通过指定参数在参数数组中的索引，
   * 可以获取特定位置的参数值，
   * 以便在处理程序中针对特定参数进行操作。
   * @param index 要获取的参数在参数数组中的索引。
   */
  getArgByIndex<T = any>(index: number): T;
  /**
   * 通过调用这个方法，可以切换上下文到 RPC 执行上下文，
   * 并获取一个具有获取 RPC 参数的方法的接口，
   * 以便处理远程服务之间的调用和通信。
   * @returns 返回一个具有获取 RPC 参数方法的接口 RpcArgumentsHost。
   */
  switchToRpc(): RpcArgumentsHost;
  /**
   * 这个方法用于切换上下文到 HTTP 执行上下文，
   * 并返回一个具有获取 HTTP 参数的方法的接口，以便处理 HTTP 请求和响应。
   * @returns 返回一个具有获取 HTTP 参数方法的接口 HttpArgumentsHost。
   */
  switchToHttp(): HttpArgumentsHost;
  /**
   * 通过调用这个方法，可以切换上下文到 WebSockets 执行上下文，
   * 并返回一个具有获取 WebSockets 参数的方法的接口，
   * 以便处理 WebSocket 数据和事件。
   * @returns 返回一个具有获取 WebSockets 参数方法的接口 WsArgumentsHost。
   */
  switchToWs(): WsArgumentsHost;
  /**
   * Returns the current execution context type (string)
   * 返回当前执行上下文的类型，通常是字符串类型。
   * 
   * 这个方法用于获取当前执行上下文的类型，
   * 可以是 'http'、'ws' 或 'rpc' 等。
   * 通过这个方法，可以根据当前执行上下文的类型来执行相应的逻辑。
   */
  getType<TContext extends string = ContextType>(): TContext;
}
