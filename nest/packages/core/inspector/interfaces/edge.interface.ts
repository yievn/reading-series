import { InjectionToken } from '@nestjs/common';

/**基础类型，为其他边类型提供共有的属性 */
type CommonEdgeMetadata = {
  /**表示依赖关系的起始模块名称 */
  sourceModuleName: string;
  /**表示依赖关系的目标模块名称 */
  targetModuleName: string;
};

/**用于描述模块到模块之间的依赖关系 */
type ModuleToModuleEdgeMetadata = {
  /**标识这是一个模块到模块的依赖关系 */
  type: 'module-to-module';
} & CommonEdgeMetadata;

/**
 * 这个类型描述了类到类之间的依赖关系，这些类可能是提供者、控制器
 */
type ClassToClassEdgeMetadata = {
  /**标识这是一个类到类的依赖关系*/
  type: 'class-to-class';
  /**依赖关系的起始类*/
  sourceClassName: string;
  /**依赖关系的模块类 */
  targetClassName: string;
  /**以下两个用于标识源类和目标类，这些Token是依赖注入系统中用于查找和实例化类的关键。 */
  sourceClassToken: InjectionToken;
  targetClassToken: InjectionToken;
  /**描述注入的类型，可以是constructor（构造函数注入）、properry（属性注入）、decorator（通过装饰器注入） */
  injectionType: 'constructor' | 'property' | 'decorator';
  /**用于指定属性注入的属性名或构造函数注入的参数索引 */
  keyOrIndex?: string | number | symbol;
  /**
   * If true, indicates that this edge represents an internal providers connection
   * 表示这条边代表的是内部提供者之间的连接
   */
  internal?: boolean;
} & CommonEdgeMetadata;

export interface Edge {
  id: string;
  source: string;
  target: string;
  metadata: ModuleToModuleEdgeMetadata | ClassToClassEdgeMetadata;
}
