/**
 * Function that returns a new decorator that applies all decorators provided by param
 *
 * Useful to build new decorators (or a decorator factory) encapsulating multiple decorators related with the same feature
 *
 * @param decorators one or more decorators (e.g., `ApplyGuard(...)`)
 *
 * @publicApi
 * 用于构建新的装饰器(或装饰器工厂)，封装与相同特性相关的多个装饰器
 */
export function applyDecorators(
  ...decorators: Array<ClassDecorator | MethodDecorator | PropertyDecorator>
) {
  return <TFunction extends Function, Y>(
    target: TFunction | object,
    propertyKey?: string | symbol,
    descriptor?: TypedPropertyDescriptor<Y>,
  ) => {
    /**遍历修饰器 */
    for (const decorator of decorators) {
      /**应用在类上面的装饰器，遍历调用，并将类传入 */
      if (target instanceof Function && !descriptor) {
        (decorator as ClassDecorator)(target);
        continue;
      }
      // 方法或者属性修饰器
      (decorator as MethodDecorator | PropertyDecorator)(
        target,
        propertyKey,
        descriptor,
      );
    }
  };
}
