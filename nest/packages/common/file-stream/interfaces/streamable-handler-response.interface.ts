/**
 * StreamableHandlerResponse 接口提供了一个
 * 用于处理文件流的标准化响应对象，使得在 NestJS 
 * 应用中处理文件传输变得更加简单和可控。
 */
export interface StreamableHandlerResponse {
  /** `true` if the connection is destroyed, `false` otherwise.
   * 表示连接是否已销毁
   * 当 destroyed 为 true 时，表示连接已经被销毁，
   * 能是由于文件传输完成或发生错误等情况。在处理文件流时，
   * 可以根据这个属性来判断连接的状态，以便进行相应的处理。
   */
  destroyed: boolean;
  /** `true` if headers were sent, `false` otherwise. 
   * 表示是否已发送响应头
   * headersSent 为 true 时，表示响应头已经被发送。在处理文件流时，
   * 通常需要在发送文件内容之前先发送响应头，
   * 这个属性可以用来确保响应头只发送一次。
  */
  headersSent: boolean;
  /** The status code that will be sent to the client when the headers get flushed. 
   * 表示将发送给客户端的状态码
   * statusCode 属性指定了在向客户端发送响应时要使用的状态码。根据 HTTP 协议，
   * 不同的状态码表示不同的响应状态，如成功、重定向、客户端错误等
  */
  statusCode: number;
  /** Sends the HTTP response. 
   * 用于发送 HTTP 响应体
   * send 方法接受一个字符串参数 body，用于发送 HTTP 响应体给客户端。
   * 通过调用这个方法，可以将文件内容或其他数据发送给客户端。
  */
  send: (body: string) => void;
  /** Signals to the server that all of the response headers and body have been sent.
   * 用于结束 HTTP 响应
   * end 方法用于向客户端发送信号，
   * 表示所有的响应头和响应体都已经发送完，
   * 可以结束 HTTP 响应。在处理文件流时，通常在发送完文
   */
  end: () => void;
}
