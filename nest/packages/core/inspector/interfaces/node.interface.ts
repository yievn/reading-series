import { InjectionToken, Scope } from '@nestjs/common';
import { EnhancerSubtype } from '@nestjs/common/constants';

export type ModuleNode = {
  metadata: {
    type: 'module';
    /**是否全局模块 */
    global: boolean;
    /**是否动态模块 */
    dynamic: boolean;
    /**是否内部模块 */
    internal: boolean;
  };
};

export type ClassNode = {
  parent: string;
  metadata: {
    /**类依赖节点可以是provider提供者、控制器、中间件 */
    type: 'provider' | 'controller' | 'middleware' | 'injectable';
    /**子类型 */
    subtype?: EnhancerSubtype;
    /**元模块名称 */
    sourceModuleName: string;
    durable: boolean;
    static: boolean;
    transient: boolean;
    exported: boolean;
    scope: Scope;
    token: InjectionToken;
    initTime: number;
    /**
     * Enhancers metadata collection
     */
    enhancers?: Array<
      | { id: string; subtype: EnhancerSubtype }
      | { name: string; methodKey?: string; subtype: EnhancerSubtype }
    >;
    /**
     * If true, node is a globally registered enhancer
     */
    global?: boolean;
    /**
     * If true, indicates that this node represents an internal provider
     */
    internal?: boolean;
  };
};

export type Node = {
  id: string;
  label: string;
} & (ClassNode | ModuleNode);
