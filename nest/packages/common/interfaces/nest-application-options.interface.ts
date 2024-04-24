import {
  CorsOptions,
  CorsOptionsDelegate,
} from './external/cors-options.interface';
import { HttpsOptions } from './external/https-options.interface';
import { NestApplicationContextOptions } from './nest-application-context-options.interface';

/**
 * @publicApi
 */
export interface NestApplicationOptions extends NestApplicationContextOptions {
  /**
   * CORS options from [CORS package](https://github.com/expressjs/cors#configuration-options)
   * 控制跨域资源共享的设置。如果设置为true，则启用默认的CORS配置。
   * 也可以提供一个CorsOptions或者CorsOptionsDelegate来进行更详细的配置，如允许的源、方法、头部等。
   */
  cors?: boolean | CorsOptions | CorsOptionsDelegate<any>;
  /**
   * Whether to use underlying platform body parser.
   * 决定是否启用内置的请求体解析中间件。默认情况下，Nest会解析JSON和URL编码的请求体。如果设置为false，则需要手动配置请求体解析
   */
  bodyParser?: boolean;
  /**
   * Set of configurable HTTPS options
   * 提供HTTPS服务器的配置选项。这包括证书（cert）、秘钥（key）和其他HTTPS模块支持的选项。仅在创建HTTPS服务器时使用。
   */
  httpsOptions?: HttpsOptions;
  /**
   * Whether to register the raw request body on the request. Use `req.rawBody`.
   * 是否在请求对象上注册原始请求体。这对于需要访问未解析请求体的场景（如炎症webhook请求）非常有用
   */
  rawBody?: boolean;
  /**
   * Force close open HTTP connections. Useful if restarting your application hangs due to
   * keep-alive connections in the HTTP adapter.
   * 在应用关闭时强制关闭所有开放的HTTP链接。这对于重启应用时避免因为保持活动（keep-alive）链接导致的挂起非常有用
   */
  forceCloseConnections?: boolean;
}
