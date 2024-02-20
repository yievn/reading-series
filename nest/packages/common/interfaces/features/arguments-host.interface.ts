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
   * Returns the array of arguments being passed to the handler.
   * 获取传递给处理程序的参数数组
   */
  getArgs<T extends Array<any> = any[]>(): T;
  /**
   * Returns a particular argument by index.
   * 返回在传递给处理程序的参数数组中指定索引对应的参数
   * @param index index of argument to retrieve
   */
  getArgByIndex<T = any>(index: number): T;
  /**
   * Switch context to RPC.
   * 切换上下文到RPC，返回一个具有获取RPC参数方法的接口
   * @returns interface with methods to retrieve RPC arguments
   */
  switchToRpc(): RpcArgumentsHost;
  /**
   * Switch context to HTTP.
   * 切换上下文到HTTP，返回一个具有获取HTTP参数方法的接口
   * @returns interface with methods to retrieve HTTP arguments
   */
  switchToHttp(): HttpArgumentsHost;
  /**
   * Switch context to WebSockets.
   * 切换上下文到WebSockets，返回一个具有获取WebSockets参数方法的接口
   * @returns interface with methods to retrieve WebSockets arguments
   */
  switchToWs(): WsArgumentsHost;
  /**
   * Returns the current execution context type (string)
   * 返回当前上下文的类型
   */
  getType<TContext extends string = ContextType>(): TContext;
}
