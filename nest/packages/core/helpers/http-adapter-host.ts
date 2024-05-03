import { AbstractHttpAdapter } from '../adapters/http-adapter';

/**
 * Defines the `HttpAdapterHost` object.
 *
 * `HttpAdapterHost` wraps the underlying
 * platform-specific `HttpAdapter`.  The `HttpAdapter` is a wrapper around the underlying
 * native HTTP server library (e.g., Express).  The `HttpAdapterHost` object
 * provides methods to `get` and `set` the underlying HttpAdapter.
 *
 * @see [Http adapter](https://docs.nestjs.com/faq/http-adapter)
 *
 * @publicApi
 * 用于管理和提供对底层HTTP服务器适配器的访问。这个设计的主要目的是为了提供一个统一的接口来
 * 访问底层HTTP服务器功能，无论实际使用的事Express、Fastify还是其他任何HTTP服务器
 */
export class HttpAdapterHost<
  T extends AbstractHttpAdapter = AbstractHttpAdapter,
> {
  /**存放当前HTTP适配器 */
  private _httpAdapter?: T;

  /**
   * Accessor for the underlying `HttpAdapter`
   *
   * @param httpAdapter reference to the `HttpAdapter` to be set
   * 设置HTTTP适配器
   */
  set httpAdapter(httpAdapter: T) {
    this._httpAdapter = httpAdapter;
  }

  /**
   * Accessor for the underlying `HttpAdapter`
   *
   * @example
   * `const httpAdapter = adapterHost.httpAdapter;`
   * 获取当前HTTP适配器
   */
  get httpAdapter(): T {
    return this._httpAdapter;
  }
}
