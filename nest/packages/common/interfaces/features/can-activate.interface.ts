import { Observable } from 'rxjs';
import { ExecutionContext } from './execution-context.interface';

/**
 * Interface defining the `canActivate()` function that must be implemented
 * by a guard.  Return value indicates whether or not the current request is
 * allowed to proceed.  Return can be either synchronous (`boolean`)
 * or asynchronous (`Promise` or `Observable`).
 *
 * @see [Guards](https://docs.nestjs.com/guards)
 *
 * @publicApi
 * 用于定义 NestJS 中守卫（Guard）的规范，一个守卫类必须实现方法canActivate，用于
 * 判断当前请求是否允许继续执行。守卫可以
 * 根据请求的上下文、权限、状态等信息来决定是否允许通过守卫
 * 
 */
export interface CanActivate {
  /**
   * @param context Current execution context. Provides access to details about
   * the current request pipeline.
   * context 是一个执行上下文对象，提供了关于当前请求的详细信息，
   * 包括请求对象、响应对象、路由处理器等。
   * 通过执行上下文，守卫可以访问和操作当前请求的各个部分。
   * 
   *
   * @returns Value indicating whether or not the current request is allowed to
   * proceed.
   * 可以是布尔值、Promise 或 Observable，表示当前请求是否允许通过守卫。
   */
  /**
   * 守卫类必须实现这个方法，根据具体的业务逻辑判断当前请求是否允许通过守卫。
   * 返回 true 表示允许通过，返回 false 表示拒绝请求。
   */
  canActivate(
    、
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean>;
}

/**
1. 作用
定义守卫规范：CanActivate 接口定义了一个守卫类必须实现的方法 canActivate，
用于判断当前请求是否允许继续执行。守卫可以根据请求的上下文、
权限、状态等信息来决定是否允许通过守卫。

2. 方法
canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean>：
参数：context，当前执行上下文，提供了关于当前请求的详细信息。
返回值：可以是布尔值、Promise 或 Observable，表示当前请求是否允许通过守卫。
作用：守卫类必须实现这个方法，根据具体的业务逻辑判断当前请求是否允许通过守卫。
返回 true 表示允许通过，返回 false 表示拒绝请求。

3. ExecutionContext
作用：CanActivate 接口中的 canActivate 方法的参数 context 是一个执行上下文对象，提供了关于当前请求的详细信息，包括请求对象、响应对象、路由处理器等。通过执行上下文，守卫可以访问和操作当前请求的各个部分。

4. 返回值
布尔值：守卫可以直接返回布尔值，表示是否允许通过守卫。
Promise<boolean>：如果守卫需要进行异步操作，可以返回一个 Promise，最终解析为布尔值。
Observable<boolean>：对于需要处理流式数据的情况，守卫可以返回一个 Observable，最终发出布尔值。

5. 使用场景
权限控制：守卫常用于实现权限控制，根据用户的角色或权限判断是否允许访问某个路由。
数据验证：守卫也可以用于对请求数据进行验证，确保请求的合法性。
日志记录：守卫还可以用于记录请求日志或执行其他预处理操作。
通过实现 CanActivate 接口，开发者可以定义自定义的守卫类，根据具体的业务需求来保护路由，实现更加灵活和定制化的请求处理逻辑。这种机制使得 NestJS 应用能够更好地控制请求流程，增强安全性和可维护性。

 */