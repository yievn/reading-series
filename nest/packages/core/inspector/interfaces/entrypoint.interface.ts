import { RequestMethod } from '@nestjs/common';
import { VersionValue } from '@nestjs/common/interfaces';

/**用于描述HTTP入口点，通常是控制器方法，这些方法处理来自客户端的HTTP请求 */
export type HttpEntrypointMetadata = {
  /**表示HTTP请求的路径 */
  path: string;
  /**HTTP的请求方法 */
  requestMethod: keyof typeof RequestMethod;
  /**制定方法的版本 */
  methodVersion?: VersionValue;
  /**制定控制器的版本，也用于版本控制 */
  controllerVersion?: VersionValue;
};
/**用于描述中间件的配置，中间件处理在请求处理流程中的特定阶段 */
export type MiddlewareEntrypointMetadata = {
  /**中间件应用的路径 */
  path: string;
  /**中间件应用的HTTP方法 */
  requestMethod: keyof typeof RequestMethod;
  /**中间件的版本 */
  version?: VersionValue;
};
/**在nestjs中，入口点通常指的是模块的导出部分，这些导出部分可以被其他模块导入和使用。
 * 每个模块可以有多个入口点，这些入口点定义了模块对外提供的接口或服务。
*/
export type Entrypoint<T> = {
  /**入口点的唯一标识符 */
  id?: string;
  /**入口点的类型，如controller、middleware等 */
  type: string;  
  /**关联的方法名 */
  methodName: string;
  /**关联的类名 */
  className: string;
  /**类节点的唯一标识符，用于追踪和管理依赖 */
  classNodeId: string;
  /**包含关键信息的对象，与泛型参数T结合使用，可以包含任何额外的元数据 */
  metadata: { key: string } & T;
};

/**
 * 层级关系：在nestjs中，每个模块都可以被视为一个节点，
 * 这些几点通过导入和导出建立起层级和依赖关系，
 * 父节点ID在这里代表特定模块的唯一标识符
 * 
 * 组织和管理：使用父节点ID可以有效地组织和管理每个模块的入口点，这样做可以确保入口点的添加
 * 和检索都是在正确的模块上下文中进行，避免了混淆和错误。
 * 
 * 依赖追踪：通过关联入口点到特定的父节点（模块），nest可以更容易地追踪模块间的依赖关系。这对于解析
 * 依赖、优化加载和执行以及进行错误检查都是非常重要嘚。
 * 
 * 模块封装：模块的封装新是nest设计的一个重要方面，通过将入口点与特定的模块ID关联，可以保持模块的封装性，使得
 * 模块的内部实现细节不被外部直接访问，而只通过定义好的入口点暴露必要的功能
 */