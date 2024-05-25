import { Logger } from '@nestjs/common';
import { ExternalContextCreator } from '../../helpers/external-context-creator';
import { HttpAdapterHost } from '../../helpers/http-adapter-host';
import { GraphInspector } from '../../inspector/graph-inspector';
import { SerializedGraph } from '../../inspector/serialized-graph';
import { ModuleOverride } from '../../interfaces/module-override.interface';
import { DependenciesScanner } from '../../scanner';
import { ModuleCompiler } from '../compiler';
import { NestContainer } from '../container';
import { Injector } from '../injector';
import { InstanceLoader } from '../instance-loader';
import { LazyModuleLoader } from '../lazy-module-loader/lazy-module-loader';
import { ModulesContainer } from '../modules-container';
import { InternalCoreModule } from './internal-core-module';

export class InternalCoreModuleFactory {
  static create(
    /**模块容器 */
    container: NestContainer,
    /**模块扫描器实例 */
    scanner: DependenciesScanner,
    /**模块元数据提取器 */
    moduleCompiler: ModuleCompiler,
    /**http适配器托管实例 */
    httpAdapterHost: HttpAdapterHost,
    /**依赖关系图检查器 */
    graphInspector: GraphInspector,
    /**覆盖模块数组 */
    moduleOverrides?: ModuleOverride[],
  ) {
    /** */
    const lazyModuleLoaderFactory = () => {
      /**创建一个日志记录器实例，用于记录与懒加载模块相关的日志细腻 */
      const logger = new Logger(LazyModuleLoader.name, {
        timestamp: false,
      });
      /**创建一个Injector实例，这是nest的依赖注入系统的核心部分，用于解析依赖项和实例化提供者 */
      const injector = new Injector();
      /**创建一个InstanceLoader实例，负责在应用启动时加载和实例化模块中的提供者 */
      const instanceLoader = new InstanceLoader(
        /**模块容器 */
        container,
        /**依赖注入器 */
        injector,
        /**依赖关系图检查器 */
        graphInspector,
        /**日志记录器 */
        logger,
      );
      /**返回一个LazyModuleLoader实例，它负责按需（懒加载）加载模块。 */
      return new LazyModuleLoader(
        scanner,
        instanceLoader,
        moduleCompiler,
        container.getModules(),
        moduleOverrides,
      );
    };
    /**注册内部模块和提供者，这些模块和提供者是框架核心功能的一部分，
     * 这些注册的提供者通常是关键的基础设施服务，他们支持框架的运行和其他模块
     * 的功能
     */
    return InternalCoreModule.register([
      {
        /**ExternalContextCreator负责创建外部上下文，这是处理请求的基础。
         * 它用于创建控制器和中间件的执行上下文，确保请求处理流程中的依赖注入和
         * 中间件执行能够正确进行。
         */
        provide: ExternalContextCreator,
        useValue: ExternalContextCreator.fromContainer(container),
      },
      {
        /**
         * ModulesContainer是一个存储所有模块及其元数据的容器，它是模块
         * 系统的核心，用于管理模块的生命周期、提供者的注册和解析等。
         */
        provide: ModulesContainer,
        useValue: container.getModules(),
      },
      {
        /**
         * HttpAdapterHost 包装了底层的 HTTP 
         * 平台适配器（如 Express 或 Fastify）。
         * 它允许框架在不同的 HTTP 平台之间进行切换，
         * 而不影响应用的其余部分。
         */
        provide: HttpAdapterHost,
        useValue: httpAdapterHost,
      },
      {
        /**
         * LazyModuleLoader 用于延迟加载模块。
         * 这对于大型应用来说非常有用，
         * 可以在需要时才加载某些模块，
         * 从而优化启动时间和资源使用
         */
        provide: LazyModuleLoader,
        useFactory: lazyModuleLoaderFactory,
      },
      {
        /**
         * SerializedGraph 可能用于存储和管理模块和提供
         * 者之间的依赖关系图的序列化形式。
         * 这对于分析和优化应用结构可能非常有用。
         */
        provide: SerializedGraph,
        useValue: container.serializedGraph,
      },
    ]);
  }
}
