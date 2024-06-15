import { GUARDS_METADATA } from '../../constants';
import { CanActivate } from '../../interfaces';
import { extendArrayMetadata } from '../../utils/extend-metadata.util';
import { isFunction } from '../../utils/shared.utils';
import { validateEach } from '../../utils/validate-each.util';

/**
 * Decorator that binds guards to the scope of the controller or method,
 * depending on its context.
 *
 * When `@UseGuards` is used at the controller level, the guard will be
 * applied to every handler (method) in the controller.
 *
 * When `@UseGuards` is used at the individual handler level, the guard
 * will apply only to that specific method.
 *
 * @param guards a single guard instance or class, or a list of guard instances
 * or classes.
 *
 * @see [Guards](https://docs.nestjs.com/guards)
 *
 * @usageNotes
 * Guards can also be set up globally for all controllers and routes
 * using `app.useGlobalGuards()`.  [See here for details](https://docs.nestjs.com/guards#binding-guards)
 *
 * @publicApi
 * 用于将守卫（Guards）应用于控制器或特定的路由处理方法。守卫是nest中用于实现授权
 * 和认证逻辑的组件，UseGuards可以在类级别或方法级别使用，从而提供灵活的权限控制
 * 
 */
export function UseGuards(
  ...guards: (CanActivate | Function)[]
): MethodDecorator & ClassDecorator {
  return (
    target: any,
    key?: string | symbol,
    descriptor?: TypedPropertyDescriptor<any>,
  ) => {
    /**验证每一个守卫是否有效，有效的守卫应该是一个类或者是一个实例，并且实例的canActivate
     * 是一个函数
     */
    const isGuardValid = <T extends Function | Record<string, any>>(guard: T) =>
      guard &&
      (isFunction(guard) ||
        isFunction((guard as Record<string, any>).canActivate));
    /**
     * 如果descriptor存在，那么装饰器用于方法，则将守卫信息添加到
     * 方法的元数据中；如果不存在，那么装饰器用于类上，则将守卫信息添加到类的
     * 元数据中。
     */
    if (descriptor) {
      validateEach(
        target.constructor,
        guards,
        isGuardValid,
        '@UseGuards',
        'guard',
      );
      extendArrayMetadata(GUARDS_METADATA, guards, descriptor.value);
      return descriptor;
    }
    validateEach(target, guards, isGuardValid, '@UseGuards', 'guard');
    extendArrayMetadata(GUARDS_METADATA, guards, target);
    return target;
  };
}
