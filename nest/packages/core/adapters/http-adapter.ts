import { HttpServer, RequestMethod, VersioningOptions } from '@nestjs/common';
import { RequestHandler, VersionValue } from '@nestjs/common/interfaces';
import {
  CorsOptions,
  CorsOptionsDelegate,
} from '@nestjs/common/interfaces/external/cors-options.interface';
import { NestApplicationOptions } from '@nestjs/common/interfaces/nest-application-options.interface';

/**
 * @publicApi
 * HTTP服务适配器。Nest默认使用Express作为其HTTP服务器，但通过适配器模式，开发者可以轻松
 * 切换到其他HTTP服务器，如Fastify。这种适配器封装了底层HTTP服务器的具体实现，提供了一个统一的接口
 * 供Nest应用使用。这样，无论使用哪个HTTP服务器，应用其余部分都不需要修改
 */
export abstract class AbstractHttpAdapter<
  TServer = any,
  TRequest = any,
  TResponse = any,
> implements HttpServer<TRequest, TResponse>
{
  /** */
  protected httpServer: TServer;

  constructor(protected instance?: any) {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  /**
   * 异步初始化方法，用于进行任何必要的启动配置
   */
  public async init() {}
  /**
   * 用于添加中间件到HTTP服务器
   * @param args 
   * @returns 
   */
  public use(...args: any[]) {
    return this.instance.use(...args);
  }

  /**
   * 以下get(), post(), head(), delete(), put(), patch(), all(), options()用于定义路由处理器，
   * 对应HTTP请求的不同方法（GET, POST, HEAD, DELETE, PUT, PATCH, ALL, OPTIONS）。它们支持重载，可以只传递处理器或者同时传递路径和处理器。
   */
  public get(handler: RequestHandler);
  public get(path: any, handler: RequestHandler);
  public get(...args: any[]) {
    return this.instance.get(...args);
  }

  public post(handler: RequestHandler);
  public post(path: any, handler: RequestHandler);
  public post(...args: any[]) {
    return this.instance.post(...args);
  }

  public head(handler: RequestHandler);
  public head(path: any, handler: RequestHandler);
  public head(...args: any[]) {
    return this.instance.head(...args);
  }

  public delete(handler: RequestHandler);
  public delete(path: any, handler: RequestHandler);
  public delete(...args: any[]) {
    return this.instance.delete(...args);
  }

  public put(handler: RequestHandler);
  public put(path: any, handler: RequestHandler);
  public put(...args: any[]) {
    return this.instance.put(...args);
  }

  public patch(handler: RequestHandler);
  public patch(path: any, handler: RequestHandler);
  public patch(...args: any[]) {
    return this.instance.patch(...args);
  }

  public all(handler: RequestHandler);
  public all(path: any, handler: RequestHandler);
  public all(...args: any[]) {
    return this.instance.all(...args);
  }

  public search(port: string | number, callback?: () => void);
  public search(port: string | number, hostname: string, callback?: () => void);
  public search(port: any, hostname?: any, callback?: any) {
    return this.instance.search(port, hostname, callback);
  }

  public options(handler: RequestHandler);
  public options(path: any, handler: RequestHandler);
  public options(...args: any[]) {
    return this.instance.options(...args);
  }

  public listen(port: string | number, callback?: () => void);
  public listen(port: string | number, hostname: string, callback?: () => void);
  public listen(port: any, hostname?: any, callback?: any) {
    return this.instance.listen(port, hostname, callback);
  }

  public getHttpServer(): TServer {
    return this.httpServer as TServer;
  }
  /**设置底层的HTTP服务器 */
  public setHttpServer(httpServer: TServer) {
    this.httpServer = httpServer;
  }

  /**设置或更新底层HTTP服务器的实例 */
  public setInstance<T = any>(instance: T) {
    this.instance = instance;
  }

  public getInstance<T = any>(): T {
    return this.instance as T;
  }
  /**关闭HTTP服务器 */
  abstract close();
  /**根据Nest应用选项初始化HTTP服务器 */
  abstract initHttpServer(options: NestApplicationOptions);
  /**设置静态资源的服务 */
  abstract useStaticAssets(...args: any[]);
  /**设置视图引擎 */
  abstract setViewEngine(engine: string);
  /**获取请求的主机名 */
  abstract getRequestHostname(request: any);
  /**获取请求的方法 */
  abstract getRequestMethod(request: any);
  /**获取请求的URL */
  abstract getRequestUrl(request: any);
  /**设置响应的状态码 */
  abstract status(response: any, statusCode: number);
  /**发送响应
   * response 底层HTTP服务器的响应对象。在Express中，这将是一个Response对象，在Fastify中，这将是一个Reply对象。这个对象提供了发送响应到客户端的方法
   * 
   * 通常用于向客户端发送响应体，并可选的设置状态码。
   */
  abstract reply(response: any, body: any, statusCode?: number);
  /**结束响应
   * 用于结束响应，可选地发送一些数据，他通常用于那些不需要返回大量数据，或者当已经通过其他方式（如流）发送数据，只需要关闭链接的场景
   */
  abstract end(response: any, message?: string);
  /**渲染视图模板 */
  abstract render(response: any, view: string, options: any);
  /**重定向响应 */
  abstract redirect(response: any, statusCode: number, url: string);
  /**设置错误处理器 */
  abstract setErrorHandler(handler: Function, prefix?: string);
  /**设置404处理器 */
  abstract setNotFoundHandler(handler: Function, prefix?: string);
  /**检查响应头是否已发送 */
  abstract isHeadersSent(response: any);
  /**设置响应头 */
  abstract setHeader(response: any, name: string, value: string);
  /**注册请求解析的中间件 */
  abstract registerParserMiddleware(prefix?: string, rawBody?: boolean);
  /**启用CORS */
  abstract enableCors(
    options: CorsOptions | CorsOptionsDelegate<TRequest>,
    prefix?: string,
  );
  /**创建中间件工厂函数 */
  abstract createMiddlewareFactory(
    requestMethod: RequestMethod,
  ):
    | ((path: string, callback: Function) => any)
    | Promise<(path: string, callback: Function) => any>;
    /**获取HTTP服务器类型 */
  abstract getType(): string;
    /**应用版本过滤器 */
  abstract applyVersionFilter(
    handler: Function,
    version: VersionValue,
    versioningOptions: VersioningOptions,
  ): (req: TRequest, res: TResponse, next: () => void) => Function;
}
