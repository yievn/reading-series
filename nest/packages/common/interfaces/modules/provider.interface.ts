import { Scope } from '../scope-options.interface';
import { Type } from '../type.interface';
import { InjectionToken } from './injection-token.interface';
import { OptionalFactoryDependency } from './optional-factory-dependency.interface';

/**
 *
 * @publicApi
 */
export type Provider<T = any> =
  | Type<any>
  | ClassProvider<T>
  | ValueProvider<T>
  | FactoryProvider<T>
  | ExistingProvider<T>;

/**
 * Interface defining a *Class* type provider.
 *
 * For example:
 * ```typescript
 * const configServiceProvider = {
 * provide: ConfigService,
 * useClass:
 *   process.env.NODE_ENV === 'development'
 *     ? DevelopmentConfigService
 *     : ProductionConfigService,
 * };
 * ```
 *ClassProvider提供了强大的依赖注入机制，它提供了灵活性和控制力，使得开发者可以根据应用的需要灵活地配置和替换
 依赖的视线。通过使用ClassProvider，开发者可以确保应用的各个部分能够以一种可预测和可管理的方式获取其依赖项。
 * @see [Class providers](https://docs.nestjs.com/fundamentals/custom-providers#class-providers-useclass)
 * @see [Injection scopes](https://docs.nestjs.com/fundamentals/injection-scopes)
 *
 * @publicApi
 */
export interface ClassProvider<T = any> {
  /**
   * Injection token  标识符，用于在依赖注入系统中唯一标识这个提供者。他可以是一个字符串、符号
   * 或者一个类。当其他部分的代码请求这个依赖时，将使用这个标识符来查找对应的提供者
   */
  provide: InjectionToken;
  /**
   * Type (class name) of provider (instance to be injected).
   * 这是一个类，nestjs将实例化这个类来满足依赖。这意味着每次依赖被注入时，都会使用这个类创建一个新的实例，除非指定
   * 了作用域
   */
  useClass: Type<T>;
  /**
   * Optional enum defining lifetime of the provider that is injected.
   * 这定义了提供者的作用域。例如，如果设置为Scope.REQUEST，则每个请求都会创建一个新的实例。如果没有指定，
   * 将使用默认的单例作用域
   */
  scope?: Scope;
  /**
   * This option is only available on factory providers!
   *  
   * @see [Use factory](https://docs.nestjs.com/fundamentals/custom-providers#factory-providers-usefactory)
   */
  inject?: never;
  /**
   * Flags provider as durable. This flag can be used in combination with custom context id
   * factory strategy to construct lazy DI subtrees.
   *
   * This flag can be used only in conjunction with scope = Scope.REQUEST.
   */
  durable?: boolean;
}

/**
 * Interface defining a *Value* type provider.
 *
 * For example:
 * ```typescript
 * const connectionProvider = {
 *   provide: 'CONNECTION',
 *   useValue: connection,
 * };
 * ```
 *ValueProvider是一种特定类型的提供者，用于在依赖注入系统中直接注册一个具体的值
 作为服务。这种提供者类型允许开发者讲一个已经存在的值或对象直接注入到需要它的类中，而不需要框架去实例化
 或创建这个值。

 ValueProvider是实现依赖注入的一种方式，特别适用于那些不需要实例化的常量、配置对象或任何其他类型的静态数据。


 alueProvider 在多种场景下非常有用，特别是在以下情况：
1. 配置数据：将配置数据或常量直接注入到应用的不同部分。例如，数据库连接字符串、应用密钥等。
2. 外部库或框架的实例：如果你已经有了一个由外部库创建的实例（如数据库连接），你可以通过 ValueProvider 将其注入到你的 NestJS 应用中。
3. 测试替代：在测试时，可以使用 ValueProvider 来提供模拟的值或对象，以便于测试。
 
 * @see [Value providers](https://docs.nestjs.com/fundamentals/custom-providers#value-providers-usevalue)
 *
 * @publicApi
 */
export interface ValueProvider<T = any> {
  /**
   * Injection token
   * 这是一个标识符，用于在依赖注入系统中唯一标识这个提供者。它可以是一个字符串、符号或者一个类。当其他部分的代码请求
   * 这个依赖时，将使用这个标识符来查找对应的提供者。
   */
  provide: InjectionToken;
  /**
   * Instance of a provider to be injected.
   * 这是要注入的具体值。它可以是任何类型的对象、基本数据类型、数组等。
   */
  useValue: T;
  /**
   * This option is only available on factory providers!
   * 这个选项只在useValue为工厂函数的时候可用，用于作为工厂函数的注入参数
   *
   * @see [Use factory](https://docs.nestjs.com/fundamentals/custom-providers#factory-providers-usefactory)
   */
  inject?: never;
}

/**
 * Interface defining a *Factory* type provider.
 *
 * For example:
 * ```typescript
 * const connectionFactory = {
 *   provide: 'CONNECTION',
 *   useFactory: (optionsProvider: OptionsProvider) => {
 *     const options = optionsProvider.get();
 *     return new DatabaseConnection(options);
 *   },
 *   inject: [OptionsProvider],
 * };
 * ```
 * FactoryProvider是一种灵活的提供者类型，它允许开发者通过一个工厂函数来动态创建依赖项，这种提供者类型特别使用
 * 预依赖项的创建需要一些复杂逻辑或者依赖于其他服务时。
 * 
 * 
 * FactoryProvider 在多种场景下非常有用，特别是在以下情况：
1. 动态配置：当服务的创建依赖于运行时决定的配置或条件时。
2. 依赖注入：当服务的创建需要依赖其他服务时。
3. 资源管理：例如，数据库连接或第三方服务的客户端，这些可能需要在创建时进行特定的配置。
 *
 * @see [Factory providers](https://docs.nestjs.com/fundamentals/custom-providers#factory-providers-usefactory)
 * @see [Injection scopes](https://docs.nestjs.com/fundamentals/injection-scopes)
 *
 * @publicApi
 */
export interface FactoryProvider<T = any> {
  /**
   * Injection token
   * 这是一个标识符，用于在依赖注入系统中唯一标识这个提供者。它可以是一个字符串、符号或者一个类。当其他部分的
   * 代码请求这个依赖时，将使用这个标识符来查找对应的提供者。
   */
  provide: InjectionToken;
  /**
   * Factory function that returns an instance of the provider to be injected.
   * 这是一个工厂函数，返回需要注入的依赖项的实例。这个函数可以是同步的或异步的，允许在创建实例时
   * 执行复杂的初始化逻辑。
   */
  useFactory: (...args: any[]) => T | Promise<T>;
  /**
   * Optional list of providers to be injected into the context of the Factory function.
   * 这是一个数组，列出了工厂函数中需要注入的依赖项的标识符。这些依赖项将被注入到工厂函数中，作为参数传递。
   * 
   * 工厂参数的每个参数应该对应inject数组中的一个条目。nestjs依赖注入系统会按照inject数组中的顺序，将相应
   * 的依赖项注入到工厂函数的参数中。
   * 
   * 
   */
  inject?: Array<InjectionToken | OptionalFactoryDependency>;
  /**
   * Optional enum defining lifetime of the provider that is returned by the Factory function.
   * 定义了提供者实例的生命周期。
   */
  scope?: Scope;
  /**
   * Flags provider as durable. This flag can be used in combination with custom context id
   * factory strategy to construct lazy DI subtrees.
   *
   * This flag can be used only in conjunction with scope = Scope.REQUEST.
   */
  durable?: boolean;
}

/**
 * Interface defining an *Existing* (aliased) type provider.
 *
 * For example:
 * ```typescript
 * const loggerAliasProvider = {
 *   provide: 'AliasedLoggerService',
 *   useExisting: LoggerService
 * };
 * ```
 *ExistingProvider是一种特定类型的提供者，用于在依赖注入系统重创建别名或重用现有的提供
 者实例。这种提供者类型允许开发者通过一个新的标识符引用已经存在的提供者，从而避免创建新的实例，实现
 资源的共享和重用。
 * 

 ExistingProvider 在多种场景下非常有用，特别是在以下情况：
1. 别名提供：当你想为同一个实例提供多个访问点时，可以使用 ExistingProvider 来创建别名。
2. 配置共享：在多个模块或组件之间共享同一个配置对象或服务实例时，可以使用 ExistingProvider 来避免重复实例化。
3. 接口实现共享：如果多个服务依赖于同一个接口的实现，可以通过 ExistingProvider 来确保所有服务都使用同一个实例，从而保持状态的一致性。
 * 
 * @see [Alias providers](https://docs.nestjs.com/fundamentals/custom-providers#alias-providers-useexisting)
 *
 * @publicApi
 */
export interface ExistingProvider<T = any> {
  /**
   * Injection token
   * 这是一个标识符用于在依赖注入系统中唯一标识这个新的提供者，它可以是一个字符串、符号或者一个类。
   */
  provide: InjectionToken;
  /**
   * Provider to be aliased by the Injection token.
   * 这是一个已经存在的提供者的标识符，指向要重用的实例。当请求provide指定的依赖时，系统将返回useExsting指定
   * 的现有实例。
   */
  useExisting: any;
}
