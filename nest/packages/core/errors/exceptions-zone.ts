import { Logger } from '@nestjs/common';
import { ExceptionHandler } from './exception-handler';

/**进程终止 */
const DEFAULT_TEARDOWN = () => process.exit(1);

/**用于处理nestjs应用中的异常，这个类封装了异常处理的逻辑，它使用nodejs的try-catch
 * 语法来捕获同步和异步代码中的错误，并提供一个结构化的方式来处理这些错误
 * 
 * 它的主要作用是：
 * 异常捕获：捕获在应用执行过程中抛出的同步和异步异常
 * 异常处理：使用ExceptionHandler类来统一处理捕获的异常
 * 日志管理：在异常处理过程中，根据配置决定是否需要刷新日志
 * 应用终止：在处理完异常后，根据提供的teardown函数来决定是否终止应用。
 */
export class ExceptionsZone {
  private static readonly exceptionHandler = new ExceptionHandler();
  /**同步处理异常 */
  public static run(
    callback: () => void,
    teardown: (err: any) => void = DEFAULT_TEARDOWN,
    autoFlushLogs?: boolean,
  ) {
    try {
      /**执行回调 */
      callback();
    } catch (e) {
      /**捕获异常，并用exceptionHandler处理异常 */
      this.exceptionHandler.handle(e);
      if (autoFlushLogs) {
        // autoFlushLogs为true，刷新异常
        Logger.flush();
      }
      teardown(e);
    }
  }
  /**异步处理异常 */
  public static async asyncRun(
    callback: () => Promise<void>,
    teardown: (err: any) => void = DEFAULT_TEARDOWN,
    autoFlushLogs?: boolean,
  ) {
    try {
      await callback();
    } catch (e) {
      this.exceptionHandler.handle(e);
      if (autoFlushLogs) {
        Logger.flush();
      }
      teardown(e);
    }
  }
}
