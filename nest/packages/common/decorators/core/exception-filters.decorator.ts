/* eslint-disable @typescript-eslint/no-use-before-define */
import { EXCEPTION_FILTERS_METADATA } from '../../constants';
import { ExceptionFilter } from '../../index';
import { extendArrayMetadata } from '../../utils/extend-metadata.util';
import { isFunction } from '../../utils/shared.utils';
import { validateEach } from '../../utils/validate-each.util';

/**
 * Decorator that binds exception filters to the scope of the controller or
 * method, depending on its context.
 * 
 * 根据上下文将异常过滤器绑定到控制器或方法的作用域的装饰器。
 *
 * When `@UseFilters` is used at the controller level, the filter will be
 * applied to every handler (method) in the controller.
 *
 * When `@UseFilters` is used at the individual handler level, the filter
 * will apply only to that specific method.
 *
 * @param filters exception filter instance or class, or a list of exception
 * filter instances or classes.
 *
 * @see [Exception filters](https://docs.nestjs.com/exception-filters)
 *
 * @usageNotes
 * Exception filters can also be set up globally for all controllers and routes
 * using `app.useGlobalFilters()`.  [See here for details](https://docs.nestjs.com/exception-filters#binding-filters)
 *
 * @publicApi
 * 
 * 
 */

export const UseFilters = (...filters: (ExceptionFilter | Function)[]) =>
  addExceptionFiltersMetadata(...filters);
/**
 * 添加异常过滤器
 */
function addExceptionFiltersMetadata(
  ...filters: (Function | ExceptionFilter)[]
): MethodDecorator & ClassDecorator {
  return (
    target: any,
    key?: string | symbol,
    descriptor?: TypedPropertyDescriptor<any>,
  ) => {
    /**
     * 校验过滤器是否有效，filter可以为类（但是如果不是继承过滤器接口，会报错），这时由框架承担实例化责任并启用依赖注入，也可以是
     * 继承自过滤器接口的类的实例
     */
    const isFilterValid = <T extends Function | Record<string, any>>(
      filter: T,
    ) => 
      filter &&
      (isFunction(filter) || isFunction((filter as Record<string, any>).catch));
    /**描述符对象存在，说明过滤器使用在方法上 */
    if (descriptor) {
      /**校验传入参数，校验filters中过滤是否是有效过滤器 */
      validateEach(
        target.constructor,
        filters,
        isFilterValid,
        '@UseFilters',
        'filter',
      );
      /**将过滤器添加到descriptor.value方法对象元数据中 */
      extendArrayMetadata(
        EXCEPTION_FILTERS_METADATA,
        filters,
        descriptor.value,
      );
      return descriptor;
    }
    validateEach(target, filters, isFilterValid, '@UseFilters', 'filter');
    extendArrayMetadata(EXCEPTION_FILTERS_METADATA, filters, target);
    return target;
  };
}
