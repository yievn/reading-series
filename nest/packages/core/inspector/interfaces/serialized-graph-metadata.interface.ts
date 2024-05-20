import { InjectorDependencyContext } from '../../injector/injector';

/**
 * 主要用于记录依赖图中节点（如模块、控制器、服务等）之间的关系出现问题时的上下文信息。
 * 这些信息对于问题诊断依赖注入错误非常有用
 */
export interface SerializedGraphMetadata {
  /**描述导致错误或问题的原因的对象 */
  cause: {
    /**错误类型，unknown-dependencies表示存在无法解析的依赖
     * unknown表示更一般的错误
     */
    type: 'unknown-dependencies' | 'unknown';
    /**提供关于依赖注入上下文的详细信息，如依赖是如何被请求的，以及在依赖树中的位置 */
    context?: InjectorDependencyContext;
    /**出现问题的模块的ID，帮助定位问题发生在哪个模块 */
    moduleId?: string;
    /**出现问题的节点的ID，通常是指具体的提供者或控制器，有助于精确地定位问题 */
    nodeId?: string;
    /**捕获的错误对象，提供关于问题的更多细节 */
    error?: any;
  };
}
