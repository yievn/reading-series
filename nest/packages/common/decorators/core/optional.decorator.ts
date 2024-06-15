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

/** 
 * 参数修饰器：参数修饰器用于构造函数的参数。在这种情况下，装饰器函数接受的target参数
 * 是类的原型对象。这是因为构造函数本身是类的一部分，而参数是构造函数调用时传入的，因为
 * 它们直接关联到类的实例化过程。在Optional装饰器中，当它作为参数装饰器使用时，它将
 * 参数的索引和其他相关信息存储在类的原型对象上的元数据中。这样做是因为构造函数参数的依赖
 * 注入是在类的实例化是处理的，所以需要在类的原型尚记录这些信息，以便在创建类的实例时正确
 * 处理依赖注入。
 * 
 * 属性修饰器：属性修饰器用于类的属性。虽然属性是定义在类的每个实例上，单在装饰器
 * 的实现中，属性的依赖信息需要记录在类的构造函数上（通过target.constructor）。这是因为
 * 属性虽然在每个实例上都有独立的副本，但属性的元数据（包括依赖注入的信息）是在类定义阶段就
 * 确定的，并且是共享给所有实例的。因此，当Optional装饰器用作属性装饰器时，它将相关的元数据
 * 存储在target.constructor上。这样，无论创建多少个实例，所有实例都会共享同样的依赖注入配置，
 * 而这些配置实在类被定义时就已经确定的。
 * 
*/