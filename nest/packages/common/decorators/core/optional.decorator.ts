import {
  OPTIONAL_DEPS_METADATA,
  OPTIONAL_PROPERTY_DEPS_METADATA,
} from '../../constants';
import { isUndefined } from '../../utils/shared.utils';

/**
 * Parameter decorator for an injected dependency marking the
 * dependency as optional.
 *
 * For example:
 * ```typescript
 * constructor(@Optional() @Inject('HTTP_OPTIONS')private readonly httpClient: T) {}
 * ```
 *
 * @see [Optional providers](https://docs.nestjs.com/providers#optional-providers)
 *
 * @publicApi
 * 
 * 用于标记一个类的依赖项为可选。这意味着如果依赖项无法被解析或提供，程序不会抛出错误，而是会将该
 * 依赖项设置为undefined。这在处理不确定是否可用的依赖时非常有用，提高了的挨骂的灵活性和健壮性
 */
export function Optional(): PropertyDecorator & ParameterDecorator {
  return (target: object, key: string | symbol | undefined, index?: number) => {
    /**作为参数修饰器 */
    if (!isUndefined(index)) {
      const args = Reflect.getMetadata(OPTIONAL_DEPS_METADATA, target) || [];
      /**将当前参数的索引添加到元数据数组中，依赖注入系统在处理时会知道这个参数是可选的 */
      Reflect.defineMetadata(OPTIONAL_DEPS_METADATA, [...args, index], target);
      return;
    }
    /**作为属性修饰器 */
    const properties =
      Reflect.getMetadata(
        OPTIONAL_PROPERTY_DEPS_METADATA,
        target.constructor,
      ) || [];
    // 将当前属性的键添加到数据数组中，一来注入系统在处理时会知道这个属性是可选的
    Reflect.defineMetadata(
      OPTIONAL_PROPERTY_DEPS_METADATA,
      [...properties, key],
      target.constructor,
    );
  };
}
