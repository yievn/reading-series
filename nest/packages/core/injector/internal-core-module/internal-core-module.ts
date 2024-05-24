import { DynamicModule, Global, Module } from '@nestjs/common';
import {
  ExistingProvider,
  FactoryProvider,
  ValueProvider,
} from '@nestjs/common/interfaces';
import { requestProvider } from '../../router/request/request-providers';
import { Reflector } from '../../services';
import { inquirerProvider } from '../inquirer/inquirer-providers';

const ReflectorAliasProvider = {
  provide: Reflector.name,
  useExisting: Reflector,
};

@Global()
@Module({
  providers: [
    /**
     * Reflector是一个用于访问和操作元数据的服务，在nest中，它通常用于
     * 检索装饰器（如守卫、拦截器、装饰器等）附加到类或方法上的元数据
     * 
     * 使用场景：Reflector 在很多内部机制中被使用，
     * 特别是在权限控制（通过守卫）、异常处理、拦截器等方面。
     * 例如，一个守卫可能会使用 Reflector 
     * 来检查一个控制器或路由处理器是否有特定的权限注解。
    */
    Reflector,
    /**
     * ReflectorAliasProvider可能是一个特定于项目或库的提供者，用于
     * 创建Reflector的别名，或者提供一种特定的配置或扩展方式
     */
    ReflectorAliasProvider,
    requestProvider,
    inquirerProvider,
  ],
  exports: [
    Reflector,
    ReflectorAliasProvider,
    requestProvider,
    inquirerProvider,
  ],
})
/**
 * provide属性用作服务的标识符，这个标识符实在整个应用中唯一的，
 * 用于在依赖注入容器中注册和解析服务。当将一个服务或值注册到
 * 模块时，使用provide作为键来标识这个服务，这样其他部分的应用就可以
 * 通过这个键来获取服务的实例
 */
export class InternalCoreModule {
  static register(
    providers: Array<ValueProvider | FactoryProvider | ExistingProvider>,
  ): DynamicModule {
    return {
      module: InternalCoreModule,
      providers: [...providers],
      /**
       * providers中可能包含不同类型的提供者，每个提供者都有一个provide
       * 属性在返回DynamicModule对象中，exports数组通过映射map获取providers中
       * 所有提供者的provide，这样的用处就是所有在providers数组中注册的服务，
       * 都可以通过它们的provide标识符在模块外部使用。
       */
      exports: [...providers.map(item => item.provide)],
    };
  }
}
