import { PIPES_METADATA } from '../../constants';
import { PipeTransform } from '../../interfaces/index';
import { extendArrayMetadata } from '../../utils/extend-metadata.util';
import { isFunction } from '../../utils/shared.utils';
import { validateEach } from '../../utils/validate-each.util';

/**
 * Decorator that binds pipes to the scope of the controller or method,
 * depending on its context.
 *
 * When `@UsePipes` is used at the controller level, the pipe will be
 * applied to every handler (method) in the controller.
 *
 * When `@UsePipes` is used at the individual handler level, the pipe
 * will apply only to that specific method.
 *
 * @param pipes a single pipe instance or class, or a list of pipe instances or
 * classes.
 *
 * @see [Pipes](https://docs.nestjs.com/pipes)
 *
 * @usageNotes
 * Pipes can also be set up globally for all controllers and routes
 * using `app.useGlobalPipes()`.  [See here for details](https://docs.nestjs.com/pipes#class-validator)
 *
 * @publicApi
 * 用于将管道应用于控制器或特定的控制器方法。管道主要用于处理输入数据的验证和
 * 转换，确保传入的数据符合预期的格式，并进行适当的处理。
 */

export function UsePipes(
  ...pipes: (PipeTransform | Function)[]
): ClassDecorator & MethodDecorator {
  return (
    target: any,
    key?: string | symbol,
    descriptor?: TypedPropertyDescriptor<any>,
  ) => {
    const isPipeValid = <T extends Function | Record<string, any>>(pipe: T) =>
      pipe &&
      (isFunction(pipe) || isFunction((pipe as Record<string, any>).transform));
    /**描述符对象存在，说明该修饰符是应用在控制器方法上 */
    if (descriptor) {
      extendArrayMetadata(PIPES_METADATA, pipes, descriptor.value);
      return descriptor;
    }
    validateEach(target, pipes, isPipeValid, '@UsePipes', 'pipe');
    extendArrayMetadata(PIPES_METADATA, pipes, target);
    return target;
  };
}
