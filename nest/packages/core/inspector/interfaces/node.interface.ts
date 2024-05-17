import { InjectionToken, Scope } from '@nestjs/common';
import { EnhancerSubtype } from '@nestjs/common/constants';

/**
 * 代表一个Nestjs模块，它是应用架构中的一个基本单元，用于组织和封装相关功能
 */
export type ModuleNode = {
  metadata: {
    /**固定为module，标识这是一个模块节点 */
    type: 'module';
    /**指示模块是否为全局模块。全局模块在整个应用中可见，无需在其他模块中导入 */
    global: boolean;
    /**指示模块是否为动态模块。动态模块可以在运行时动态配置其提供的服务 */
    dynamic: boolean;
    /**指示模块是否为内部模块，通常用于框架内部使用，不应由应用代码直接访问 */
    internal: boolean;
  };
};
/**ClassNode代表一个类，这个类可以是控制器、服务提供者或其它可注入的类 */
export type ClassNode = {
  /**表示该类所属的模块名称 */
  parent: string;
  metadata: {
    /**类依赖节点可以是provider提供者、控制器、中间件 */
    type: 'provider' | 'controller' | 'middleware' | 'injectable';
    /**可选的子类型，用于进一步区分类的特性或行为 */
    subtype?: EnhancerSubtype;
    /**表示定义该类的模块的名称 */
    sourceModuleName: string;
    /**是否持久 */
    durable: boolean;
    /**是否静态 */
    static: boolean;
    /**是否短暂 */
    transient: boolean;
    exported: boolean;
    scope: Scope;
    /**用于依赖注入系统中标识这个类 */
    token: InjectionToken;
    /**初始化时间，常用于性能分析 */
    initTime: number;
    /**
     * Enhancers metadata collection
     * 增强器的元数据集合，用于描述附加到类上的增强器
     */
    enhancers?: Array<
      | { id: string; subtype: EnhancerSubtype }
      | { name: string; methodKey?: string; subtype: EnhancerSubtype }
    >;
    /**
     * If true, node is a globally registered enhancer
     * 指示是否为全局注册的增强器
     */
    global?: boolean;
    /**
     * If true, indicates that this node represents an internal provider
     * 指示该节点是否代表一个内部提供者，内部提供者通常是框架内部使用的，不应由应用代码直接访问
     */
    internal?: boolean;
  };
};

export type Node = {
  id: string;
  label: string;
} & (ClassNode | ModuleNode);
