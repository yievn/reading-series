import { LoggerService, LogLevel } from '../services/logger.service';

/**
 * @publicApi
 * NestApplicationContextOptions提供了一组强大的配置选项，允许开发者根据具体需求调整nest应用的行为。
 * 这些选项涵盖了从日志处理到
 * 错误管理，再到应用的运行模式等多方面，使得nest应用可以更加灵活地适应不同的运行环境和需求。
 */
export class NestApplicationContextOptions {
  /**
   * Specifies the logger to use.  Pass `false` to turn off logging.
   * 指定用于应用的日志服务。可以传递一个LoggerService的实例，一个日志级别的数组，或者传递false来禁用日志记录
   */
  logger?: LoggerService | LogLevel[] | false;

  /**
   * Whether to abort the process on Error. By default, the process is exited.
   * Pass `false` to override the default behavior. If `false` is passed, Nest will not exit
   * the application and instead will rethrow the exception.
   * @default true
   * 指定当前应用遇到未处理的异常时是否应用终止进程。默认情况下，如果发生错误，nest会退出应用，可以设置为false来覆盖默认行为，
   * 使nest不退出应用并重新抛出异常
   */
  abortOnError?: boolean | undefined;

  /**
   * If enabled, logs will be buffered until the "Logger#flush" method is called.
   * @default false
   * 如果启用，日志将被缓冲，知道调用logger#flush方法，这在某些情况下可以用来优化日志处理。
   */
  bufferLogs?: boolean;

  /**
   * If enabled, logs will be automatically flushed and buffer detached when
   * application initialization process either completes or fails.
   * @default true
   * 如果启用，日志将在应用初始化过程完成或失败时自动刷新，并且缓冲区将被分离。这有助于确保所有的日志都被适时记录
   */
  autoFlushLogs?: boolean;

  /**
   * Whether to run application in the preview mode.
   * In the preview mode, providers/controllers are not instantiated & resolved.
   *
   * @default false
   * 是否在预览模式下运行应用，在预览模式下，提供者和控制器不会被实例化和解析，这可以用于快速启动应用框架以进行某些类型的
   * 测试或分析。
   */
  preview?: boolean;

  /**
   * Whether to generate a serialized graph snapshot.
   *
   * @default false
   * 
   * 是否生成一个序列化的图快照。这可以用于分析应用的依赖结构
   */
  snapshot?: boolean;
}
