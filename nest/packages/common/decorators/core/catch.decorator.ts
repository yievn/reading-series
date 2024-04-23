import { CATCH_WATERMARK, FILTER_CATCH_EXCEPTIONS } from '../../constants';
import { Type, Abstract } from '../../interfaces';

/**
 * Decorator that marks a class as a Nest exception filter. An exception filter
 * handles exceptions thrown by or not handled by your application code.
 *
 * 将类标记为异常过滤器的装饰器，一个异常过滤器处理那些应用代码中未处理或者抛出的错误异常
 * 
 * The decorated class must implement the `ExceptionFilter` interface.
 * 被装饰的类必须实现ExceptionFilter接口
 *
 * @param exceptions one or more exception *types* specifying
 * the exceptions to be caught and handled by this filter.
 *
 * @see [Exception Filters](https://docs.nestjs.com/exception-filters)
 *
 * @usageNotes
 * Exception filters are applied using the `@UseFilters()` decorator, or (globally)
 * with `app.useGlobalFilters()`.
 *
 * @publicApi
 */
export function Catch(
  ...exceptions: Array<Type<any> | Abstract<any>>
): ClassDecorator {
  return (target: object) => {
    Reflect.defineMetadata(CATCH_WATERMARK, true, target);
    Reflect.defineMetadata(FILTER_CATCH_EXCEPTIONS, exceptions, target);
  };
}
