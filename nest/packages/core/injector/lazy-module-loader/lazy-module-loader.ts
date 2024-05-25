import { DynamicModule, Type } from '@nestjs/common';
import { ModuleOverride } from '../../interfaces/module-override.interface';
import { DependenciesScanner } from '../../scanner';
import { ModuleCompiler } from '../compiler';
import { SilentLogger } from '../helpers/silent-logger';
import { InstanceLoader } from '../instance-loader';
import { Module } from '../module';
import { ModuleRef } from '../module-ref';
import { ModulesContainer } from '../modules-container';
import { LazyModuleLoaderLoadOptions } from './lazy-module-loader-options.interface';

export class LazyModuleLoader {
  constructor(
    /**依赖扫描器 */
    private readonly dependenciesScanner: DependenciesScanner,
    /**InstanceLoader实例，负责在应用启动时加载和实例化模块中的提供者  */
    private readonly instanceLoader: InstanceLoader,
    /**模块元数据提取器 */
    private readonly moduleCompiler: ModuleCompiler,
    /**从容器获取所有模块的引用 */
    private readonly modulesContainer: ModulesContainer,
    /**模块覆盖数组 */
    private readonly moduleOverrides?: ModuleOverride[],
  ) {}
  /**用于按需（懒加载）加载模块 */
  public async load(
    /**一个函数，档条用时，它返回一个Type<unknown>、DynamicModule 或者它们的 Promise
     * 负责提供要加载的模块的定义
     */
    loaderFn: () =>
      | Promise<Type<unknown> | DynamicModule>
      | Type<unknown>
      | DynamicModule,
    /**选项配置，配置在加载过程中日志logger的行为 */
    loadOpts?: LazyModuleLoaderLoadOptions,
  ): Promise<ModuleRef> {
    /**配置日志记录器的行为 */
    this.registerLoggerConfiguration(loadOpts);
    /**使用loaderFn来获取模块的定义，由于loaderFn可能是一个Promise实例，所以使用await来确保异步操作完成 */
    const moduleClassOrDynamicDefinition = await loaderFn();
    /**
     * 使用扫描器实例的scanForModules来扫描和注册模块的依赖，它传递模块定义、任何模块覆盖和
     * 懒加载标志
     */
    const moduleInstances = await this.dependenciesScanner.scanForModules({
      moduleDefinition: moduleClassOrDynamicDefinition,
      overrides: this.moduleOverrides,
      lazy: true,
    });
    /**
     * 加载模块是否已加载，如果moduleInstances返回空数组，这意味着模块已经被加载，在这中情况下，
     * 从模块定义中提取出token，并且从模块容易中获取到模块实例，如果找到模块实例，则使用
     * getTargetModuleRef方法来获取并返回模块的引用
     */
    if (moduleInstances.length === 0) {
      // The module has been loaded already. In this case, we must
      // retrieve a module reference from the existing container.
      const { token } = await this.moduleCompiler.compile(
        moduleClassOrDynamicDefinition,
      );
      const moduleInstance = this.modulesContainer.get(token);
      return moduleInstance && this.getTargetModuleRef(moduleInstance);
    }
    const lazyModulesContainer =
      this.createLazyModulesContainer(moduleInstances);
    await this.dependenciesScanner.scanModulesForDependencies(
      lazyModulesContainer,
    );
    await this.instanceLoader.createInstancesOfDependencies(
      lazyModulesContainer,
    );
    const [targetModule] = moduleInstances;
    return this.getTargetModuleRef(targetModule);
  }
  /**如果logger为false，则将实例加载器中的日志记录器设成一个静默的记录器 */
  private registerLoggerConfiguration(loadOpts?: LazyModuleLoaderLoadOptions) {
    if (loadOpts?.logger === false) {
      this.instanceLoader.setLogger(new SilentLogger());
    }
  }

  private createLazyModulesContainer(
    moduleInstances: Module[],
  ): Map<string, Module> {
    moduleInstances = Array.from(new Set(moduleInstances));
    return new Map(moduleInstances.map(ref => [ref.token, ref]));
  }
  /** */
  private getTargetModuleRef(moduleInstance: Module): ModuleRef {
    const moduleRefInstanceWrapper = moduleInstance.getProviderByKey(ModuleRef);
    return moduleRefInstanceWrapper.instance;
  }
}
