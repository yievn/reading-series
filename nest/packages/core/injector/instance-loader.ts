import { Logger, LoggerService } from '@nestjs/common';
import { Controller } from '@nestjs/common/interfaces/controllers/controller.interface';
import { Injectable } from '@nestjs/common/interfaces/injectable.interface';
import { MODULE_INIT_MESSAGE } from '../helpers/messages';
import { GraphInspector } from '../inspector/graph-inspector';
import { NestContainer } from './container';
import { Injector } from './injector';
import { InternalCoreModule } from './internal-core-module/internal-core-module';
import { Module } from './module';

export class InstanceLoader<TInjector extends Injector = Injector> {
  constructor(
    /**用于存储和管理整个应用的所有模块和提供者的容器 */
    protected readonly container: NestContainer,
    /**用于实例化模块中的提供者、控制器 */
    protected readonly injector: TInjector,
    /**用于检查和分析模块和提供者之间的依赖关系图 */
    protected readonly graphInspector: GraphInspector,
    /**用于记录日志，初始化时默认使用Logger类，可以通过setLogger方法进行自定义 */
    private logger: LoggerService = new Logger(InstanceLoader.name, {
      timestamp: true,
    }),
  ) {}
  /**允许外部设置自定义的日志记录器 */
  public setLogger(logger: Logger) {
    this.logger = logger;
  }
  /**
   * 异步方法，用于创建传入模块的所有依赖项的实例。它首先创建原型，然后创建实例，并在出现错误时使用graphInspector
   * 进行错误处理和分析
   */
  public async createInstancesOfDependencies(
    /**从容器中获取所有已注册的模块 */
    modules: Map<string, Module> = this.container.getModules(),
  ) {
    /**
     * 遍历每个模块中的所有提供者、控制器和可注入项，为他们
     * 创建圆形，这一步不涉及实例化，而是为后续的实例化准备好原型对象。
     * 通过预先创建原型，可以解析依赖关系并设置好构造函数和其他初始化需要的元数据，这有助于在实际创建实例
     * 时能快速并准确地进行。
    */
    this.createPrototypes(modules);

    try {
      /**这一步根据前面创建的原型来创建实例。它涉及异步操作，因为实例化过程咋可能
       * 需要执行异步任务（如数据库链接、文件读取等）
       * 实例化所有的依赖项，确保每个模块的服务和控制器都已经准备好可以被使用。
       * 这是依赖注入框架的核心功能，确保了应用的各个部分能够正确地协同工作。
       */
      await this.createInstances(modules);
    } catch (err) {
      this.graphInspector.inspectModules(modules);
      this.graphInspector.registerPartial(err);
      throw err;
    }
    this.graphInspector.inspectModules(modules);
  }
  /**用于为每个模块中的提供者、可注入项和kong晦气创建原型的关键步骤 */
  private createPrototypes(modules: Map<string, Module>) {
    modules.forEach(moduleRef => {
      /**对于每个模块，调用以下方法，这个方法遍历模块中的所有提供者，并为每个提供者调用注入器的loadProtoType方法，它
       * 负责创建提供者的原型，通常设计到解析提供者的构造函数和相关依赖，但不实例化提供者
       */
      this.createPrototypesOfProviders(moduleRef);
      this.createPrototypesOfInjectables(moduleRef);
      this.createPrototypesOfControllers(moduleRef);
    });
  }
  /**遍历每个模块，为模块中的提供者、可注入项和控制器创建原型 */
  private async createInstances(modules: Map<string, Module>) {
    await Promise.all(
      [...modules.values()].map(async moduleRef => {
        await this.createInstancesOfProviders(moduleRef);
        await this.createInstancesOfInjectables(moduleRef);
        await this.createInstancesOfControllers(moduleRef);

        const { name } = moduleRef;
        this.isModuleWhitelisted(name) &&
          this.logger.log(MODULE_INIT_MESSAGE`${name}`);
      }),
    );
  }
  /**为模块中的所有提供者创建原型 */
  private createPrototypesOfProviders(moduleRef: Module) {
    /**获取该模块中的提供者集合 */
    const { providers } = moduleRef;
    /**遍历提供者集合，调用注入器的loadPrototype */
    providers.forEach(wrapper =>
      this.injector.loadPrototype<Injectable>(wrapper, providers),
    );
  }
  /**为模块中的所有提供者创建实例，并使用graphInspector检查每个实例 */
  private async createInstancesOfProviders(moduleRef: Module) {
    const { providers } = moduleRef;
    /**获取到所有实例包装器 */
    const wrappers = [...providers.values()];
    await Promise.all(
      wrappers.map(async item => {
        await this.injector.loadProvider(item, moduleRef);
        this.graphInspector.inspectInstanceWrapper(item, moduleRef);
      }),
    );
  }
  /**为模块中的所有控制器创建原型。 */
  private createPrototypesOfControllers(moduleRef: Module) {
    const { controllers } = moduleRef;
    controllers.forEach(wrapper =>
      this.injector.loadPrototype<Controller>(wrapper, controllers),
    );
  }
  /**异步方法，为模块中的所有控制器创建实例，并使用 graphInspector 检查每个实例。 */
  private async createInstancesOfControllers(moduleRef: Module) {
    const { controllers } = moduleRef;
    const wrappers = [...controllers.values()];
    await Promise.all(
      wrappers.map(async item => {
        await this.injector.loadController(item, moduleRef);
        this.graphInspector.inspectInstanceWrapper(item, moduleRef);
      }),
    );
  }
  /**为模块中的所有可注入项创建原型。 */
  private createPrototypesOfInjectables(moduleRef: Module) {
    const { injectables } = moduleRef;
    injectables.forEach(wrapper =>
      this.injector.loadPrototype(wrapper, injectables),
    );
  }
  /**异步方法，为模块中的所有可注入项创建实例，并使用 graphInspector 检查每个实例。 */
  private async createInstancesOfInjectables(moduleRef: Module) {
    const { injectables } = moduleRef;
    const wrappers = [...injectables.values()];
    await Promise.all(
      wrappers.map(async item => {
        await this.injector.loadInjectable(item, moduleRef);
        this.graphInspector.inspectInstanceWrapper(item, moduleRef);
      }),
    );
  }
  /**检查模块名称是否不是 InternalCoreModule，用于决定是否记录模块初始化消息。 */
  private isModuleWhitelisted(name: string): boolean {
    return name !== InternalCoreModule.name;
  }
}
