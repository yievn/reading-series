import { AbstractHttpAdapter } from '../adapters';
import { HttpAdapterHost } from '../helpers/http-adapter-host';
/**
 * 
 */
export class InternalProvidersStorage {
  /**存储HttpAdapterHost的实力，它提供了一个封装层，使得访问底层HTTP适配器更加安全和一致 */
  private readonly _httpAdapterHost = new HttpAdapterHost();
  /**存储当前使用的HTTP适配器实例。这个适配器处理所有的HTTP通信 */
  private _httpAdapter: AbstractHttpAdapter;
  /**返回_httpAdapterHost实例，允许其他框架部分安全地访问HTTP适配器宿主 */
  get httpAdapterHost(): HttpAdapterHost {
    return this._httpAdapterHost;
  }
  /**返回当前HTTP适配器实例 */
  get httpAdapter(): AbstractHttpAdapter {
    return this._httpAdapter;
  }
  /**设置新的HTTP适配器实例，这在更新底层HTTP服务器或进行测试时非常有用 */
  set httpAdapter(httpAdapter: AbstractHttpAdapter) {
    this._httpAdapter = httpAdapter;
  }
}

/**
 * _httpAdapterHost是一个封装层，其主要职责是提供一个安全和一致的方式来访问底层的HTTP适配器。
 * HttpAdapterHost本身不执行任何HTTP逻辑，而是作为一个访问点，通过它可以获取或设置底层的HTTP适配器。
 * 
 * _httpAdapter存储了当前使用的HTTP适配器实例。这个适配器是实际处理所有HTTP请求和响应的组件。在Nest中，这
 * 可以是任何实现AbstractHttpAdapter接口的适配器，如基于Express或fastify的适配器。
 * 
 * 
 * 区别：_httpAdapterHost主要负责提供对_httpAdapter的访问，而_httpAdapter则是实际执行HTTP操作的对象。这种分离
 * 确保了访问控制和实际操作的解耦，提高了系统的灵活性和安全性。
 * 
 */