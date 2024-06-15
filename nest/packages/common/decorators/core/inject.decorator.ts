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
 * Inject 装饰器在 NestJS 中设计用于构造函数参数和类属性的依赖注入，它不是为了用在普通方法上的。
 * 在方法参数上使用Inject装饰器将不会有效。如果需要再方法中访问依赖，那么应该通过构造函数注入这些依赖，
 * 并将它们存储为类的成员变量，然后再方法中使用这些成员变量。
 */
export function Inject<T = any>(
  /**提供者标识符，可以是类、字符串或符号 */
  token?: T,
): PropertyDecorator & ParameterDecorator {
  return (target: object, key: string | symbol | undefined, index?: number) => {
    const type = token || Reflect.getMetadata('design:type', target, key);
    /**作为构造函数参数装饰器 */
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

1、框架自动注入的依赖

当你在构造函数中使用类类型作为参数时，nestjs默认尝试自动注入该依赖。这种自动注入的前提是：

（1）依赖的类型（即类）必须在当前模块或者导入的模块中注册为提供者。
（2）类型必须通过Typescript的类型系统在编译时可识别，这依赖于Typescript的装饰器和反射元数据。

如果一个类已经在模块的提供者集合中注册，nest会默认认为这个类是一个依赖，并尝试自动注入它，这不需要显示的@Inject()装饰器


2、自声明依赖

对于那些不直接通过类类型注入的情况，比如当使用 字符串或符号作为标识符来请求依赖时，你需要使用@Inject()装饰器来显示指定
依赖。这通常用于以下情况：

（1）当依赖的提供者是以非类形式定义的，如使用usevalue、useFactory或useExisting等形式定义的自定义提供者
（2）当同一个类型有多个实例，且需要特定实例时。

总结来说，是否需要使用 @Inject() 装饰器取决于依赖的类型和如何在系统中注册这些依赖。
如果依赖是通过类自动可识别并且已经注册为提供者，NestJS 会尝试自动注入；
如果依赖是通过非类标识符（如字符串或符号）或需要特定配置的实例，就需要显式使用 @Inject()。


 */