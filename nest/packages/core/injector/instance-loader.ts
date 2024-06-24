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
    modules: Map<string, Module> = this.container.getModules(),
  ) {
    this.createPrototypes(modules);

    try {
      await this.createInstances(modules);
    } catch (err) {
      this.graphInspector.inspectModules(modules);
      this.graphInspector.registerPartial(err);
      throw err;
    }
    this.graphInspector.inspectModules(modules);
  }

  private createPrototypes(modules: Map<string, Module>) {
    modules.forEach(moduleRef => {
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
    const { providers } = moduleRef;
    providers.forEach(wrapper =>
      this.injector.loadPrototype<Injectable>(wrapper, providers),
    );
  }
  /**为模块中的所有提供者创建实例，并使用graphInspector检查每个实例 */
  private async createInstancesOfProviders(moduleRef: Module) {
    const { providers } = moduleRef;
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
