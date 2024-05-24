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
    container: NestContainer,
    scanner: DependenciesScanner,
    moduleCompiler: ModuleCompiler,
    httpAdapterHost: HttpAdapterHost,
    graphInspector: GraphInspector,
    moduleOverrides?: ModuleOverride[],
  ) {
    const lazyModuleLoaderFactory = () => {
      const logger = new Logger(LazyModuleLoader.name, {
        timestamp: false,
      });
      const injector = new Injector();
      const instanceLoader = new InstanceLoader(
        container,
        injector,
        graphInspector,
        logger,
      );
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
