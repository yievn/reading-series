import { ModuleMetadata, Type } from '@nestjs/common';

/**定义了认证模块的配置选项 */
export interface IAuthModuleOptions<T = any> {
  /**指定默认的认证策略，可以是一个字符串或字符串数组 */
  defaultStrategy?: string | string[];
  /**指示是否启用会话支持 */
  session?: boolean;
  /**指定认证信息存储的属性名称 */
  property?: string;
  /**允许添加其他任意属性，提供灵活性 */
  [key: string]: any;
}
/**定义了一个工厂接口，用于创建认证模块的配置选项 */
export interface AuthOptionsFactory {
  /** 定义了一个方法，用于创建认证模块的配置选项，
   * 返回值可以是同步的或异步的
  */
  createAuthOptions(): Promise<IAuthModuleOptions> | IAuthModuleOptions;
}
/**定义了异步加载认证模块的配置选项 */
export interface AuthModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  /**使用现有的AuthOptionsFactory类型 */
  useExisting?: Type<AuthOptionsFactory>;
  /**使用指定的AuthOptionsFactory类型 */
  useClass?: Type<AuthOptionsFactory>;
  /**使用工厂函数创建配置选项，返回值可以是同步的或者异步的 */
  useFactory?: (
    ...args: any[]
  ) => Promise<IAuthModuleOptions> | IAuthModuleOptions;
  /**依赖注入的参数数组 */
  inject?: any[];
}
/**实现了IAuthModuleOptions接口的类 */
export class AuthModuleOptions implements IAuthModuleOptions {
  defaultStrategy?: string | string[];
  session?: boolean;
  property?: string;
}
