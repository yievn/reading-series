import { PARAMTYPES_METADATA } from '../../constants';

/**嵌套数组扁平化 */
export function flatten<T extends Array<unknown> = any>(
  arr: T,
): T extends Array<infer R> ? R : never {
  /**
   * [].concat(1,2,3,[3,4,5], [[4,32,5], 3])
   * =>   [1,2,3,3,4,5, [4,32,5], 3]]
   */
  const flat = [].concat(...arr);
  return flat.some(Array.isArray) ? flatten(flat) : flat;
}

/**
 * Decorator that sets required dependencies (required with a vanilla JavaScript objects)
 * 用于显示地声明类的依赖项，特别是在使用纯JavaScript而非Typescript时，或者在某些特殊情况下，类型信息可能无法自动
 * 推断。这个装饰器允许开发者手动指定一个类的构造函数依赖，这些依赖随后由nest的依赖注入系统解析和注入。
 * 
 * 
 *
 * @publicApi
 */
export const Dependencies = (
  ...dependencies: Array<unknown>
): ClassDecorator => {
  const flattenDeps = flatten(dependencies);
  /**使用defineMetadata将处理后的依赖项数组作为元数据附加到目标类上，这里使用的元数据键是PARAMTYPES_METADATA
   * 这是nest内部用于存储构造函数参数类型的键。
   */
  return (target: object) => {
    Reflect.defineMetadata(PARAMTYPES_METADATA, flattenDeps, target);
  };
};
