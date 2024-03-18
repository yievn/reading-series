import { Type } from '../index';
import { ArgumentsHost } from './arguments-host.interface';

/**
 * Interface describing details about the current request pipeline.
 *
 * @see [Execution Context](https://docs.nestjs.com/guards#execution-context)
 *
 * @publicApi
 * ExecutionContext 接口通常用于 NestJS 中的请求处理过程中，
 * 提供了一种标准化的方式来访问和操作请求处理的上下文信息，
 * 包括处理器类、下一个处理器等。
 */
export interface ExecutionContext extends ArgumentsHost {
  /**
   * Returns the *type* of the controller class which the current handler belongs to.
   * 返回当前处理器所属的构造器类型
   */
  getClass<T = any>(): Type<T>;
  /**
   * Returns a reference to the handler (method) that will be invoked next in the
   * request pipeline.
   *  通过 getHandler 方法可以获取将在请求处理管道中调用的下一个处理器，有助于执行下一个处理器的逻辑。
   */
  getHandler(): Function;
}
