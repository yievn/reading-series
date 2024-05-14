import {
  PROPERTY_DEPS_METADATA,
  SELF_DECLARED_DEPS_METADATA,
} from '../../constants';
import { isUndefined } from '../../utils/shared.utils';

/**
 * Decorator that marks a constructor parameter as a target for
 * [Dependency Injection (DI)](https://docs.nestjs.com/providers#dependency-injection).
 * 这个装饰器将构造函数的参数标记为目标，可以用于依赖注入
 *
 * Any injected provider must be visible within the module scope (loosely
 * speaking, the containing module) of the class it is being injected into. This
 * can be done by:
 * 任何被注入的提供者必须在类被注入的模块范围内可见（泛指包含该类的模块）。可以通过以下方式实现：
 *
 * - defining the provider in the same module scope 在相同模块范围内定义提供者
 * - exporting the provider from one module scope and importing that module into the
 *   module scope of the class being injected into 将提供者从一个模块范围导出，并将模块导入到被注入类的模块范围内
 * - exporting the provider from a module that is marked as global using the
 *   `@Global()` decorator将提供者从一个用@Global()标记为全局的模块中导出
 *
 * #### Injection tokens
 * Can be *types* (class names), *strings* or *symbols*. This depends on how the
 * provider with which it is associated was defined. Providers defined with the
 * `@Injectable()` decorator use the class name. Custom Providers may use strings
 * or symbols as the injection token.
 * 注入token，可以使类型（类名）、字符串或符号，这取决于与之关联的提供者是如何定义的。使用@Injectable()
 * 装饰器定义的提供者使用类名作为注入token，自定义提供者可能使用字符串或符号作为注入token
 *
 * @param token lookup key for the provider to be injected (assigned to the constructor
 * parameter).
 *
 * @see [Providers](https://docs.nestjs.com/providers)
 * @see [Custom Providers](https://docs.nestjs.com/fundamentals/custom-providers)
 * @see [Injection Scopes](https://docs.nestjs.com/fundamentals/injection-scopes)
 *
 * @publicApi
 */
export function Inject<T = any>(
  token?: T,
): PropertyDecorator & ParameterDecorator {
  return (target: object, key: string | symbol | undefined, index?: number) => {
    const type = token || Reflect.getMetadata('design:type', target, key);
    /**作为参数装饰器 */
    if (!isUndefined(index)) {
      /**获取自声明依赖集合 */
      let dependencies =
        Reflect.getMetadata(SELF_DECLARED_DEPS_METADATA, target) || [];

      dependencies = [...dependencies, { index, param: type }];
      Reflect.defineMetadata(SELF_DECLARED_DEPS_METADATA, dependencies, target);
      return;
    }
    let properties =
      Reflect.getMetadata(PROPERTY_DEPS_METADATA, target.constructor) || [];

    properties = [...properties, { key, type }];
    Reflect.defineMetadata(
      PROPERTY_DEPS_METADATA,
      properties,
      target.constructor,
    );
  };
}

/**
 * 如果在构造函数中使用类型作为参数而没有显式使用@Inject()装饰器，nestjs依然可以自动处理依赖注入
 * 前提是这些类型是通过Typescript的类型系统可识别的。这种自动注入依赖于Typescript的反射功能和nestjs的内部
 * 机制，他们共同工作来解析依赖关系。
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 */