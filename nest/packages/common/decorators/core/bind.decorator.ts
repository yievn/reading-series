/**
 * Decorator that binds *parameter decorators* to the method that follows.
 *
 * Useful when the language doesn't provide a 'Parameter Decorator' feature
 * (i.e., vanilla JavaScript).
 *
 * @param decorators one or more parameter decorators (e.g., `Req()`)
 *
 * @publicApi
 * Bind装饰器是用于绑定方法参数装饰器到方法上的工具。这个装饰器主要用于场景，其中语言本身（JavaScript）不直接支持
 * 参数装饰器，或者在Typescript中需要显式地将参数装饰器的行为应用到方法上。
 * 
 * bind装饰器接受一个或多个参数装饰器作为输入，他们用于处理方法参数的元数据
 */
export function Bind(...decorators: any[]): MethodDecorator {
  /**Bind本身是一个工厂函数，它返回一个方法装饰器。 */
  return <T>(
    target: object,
    key: string | symbol,
    descriptor: TypedPropertyDescriptor<T>,
  ) => {
    /**遍历所有参数装饰器，逐一调用装饰器函数 */
    decorators.forEach((fn, index) => fn(target, key, index));
    /**返回原始的方法描述符，意味着方法的行为没被修改，只添加或修改参数的元数据 */
    return descriptor;
  }; 
}
