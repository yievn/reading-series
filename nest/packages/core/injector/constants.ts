import { ContextId } from './instance-wrapper';
/**
 * 这个常量通常用于一个元数据键，用于标记和检索与控制器相关联的唯一标识符。
 * 在nest中，控制器与其他提供者可以通过依赖注入系进行管理。
 */
export const CONTROLLER_ID_KEY = 'CONTROLLER_ID';
/**
 * 这个常量定义了一个静态上下文的ID，通常用于标识那些不依赖于特定数据的提供者的声明周期。
 * 在nest中，依赖注入可以有不同的作用域（如单例、请求作用域等），而STATIC_CONTEXT_ID用于
 * 标识全局单例作用域
 * 
 * 场景：对于那些只需要被实例化一次，并在整个应用声明周期内共享的服务（如配置服务、数据库
 * 链接服务等），STATIC_CONTEXT_ID提供了一种方式来确保这些服务以单例模式进行；
 */
const STATIC_CONTEXT_ID = 1;
/**
 * 这个常量是一个对象，它封装了STATIC_CONTEXT_ID，提供了一个冻结的（不可变得）
 * 上下文对象，这个对象用于在依赖注入系统重标识静态（全局单例）的作用域。
 * 
 * 场景：在注册和解析依赖项时，STATIC_CONTEXT作为一个标识，告诉依赖注入系统该依赖
 * 项应该在全局单例作用域中被管理
 * 
*/
export const STATIC_CONTEXT: ContextId = Object.freeze({
  id: STATIC_CONTEXT_ID,
});
