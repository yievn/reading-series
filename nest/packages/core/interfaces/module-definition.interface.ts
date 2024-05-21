import { DynamicModule, ForwardReference } from '@nestjs/common';
import { Type } from '@nestjs/common/interfaces';

/**用于定义一个模块的可能形式，描述一个模块可是哪些类型的实体。 */
export type ModuleDefinition =
  /**允许模块在还没完全定义钱就被引用，这对于处理循环依赖非常有用 */
  | ForwardReference
  /**表示一个普通的类，这个类通过@Module()装饰器被定义为一个nest模块 */
  | Type<unknown>
  /**表示一个动态模块，这种模块可以在运行时动态地配置其提供者、控制器等。 */
  | DynamicModule
  /**表示一个异步解析的动态模块，允许模块的配置依赖于异步操作的结果 */
  | Promise<DynamicModule>;
