import { DynamicModule, Module, Provider } from '@nestjs/common';
import {
  AuthModuleAsyncOptions,
  AuthModuleOptions,
  AuthOptionsFactory,
  IAuthModuleOptions
} from './interfaces/auth-module.options';

//
@Module({})
export class PassportModule {
  /**注册动态模块 */
  static register(options: IAuthModuleOptions): DynamicModule {
    return {
      module: PassportModule,
      providers: [{ provide: AuthModuleOptions, useValue: options }],
      exports: [AuthModuleOptions]
    };
  }
  /**异步注册动态模块 */
  static registerAsync(options: AuthModuleAsyncOptions): DynamicModule {
    return {
      module: PassportModule,
      imports: options.imports || [],
      providers: this.createAsyncProviders(options),
      exports: [AuthModuleOptions]
    };
  }
  /**创建异步提供者 */
  private static createAsyncProviders(
    options: AuthModuleAsyncOptions
  ): Provider[] {
    /**如果useExisting或者useFactory存在 */
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)];
    }
    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: options.useClass,
        useClass: options.useClass
      }
    ];
  }

  private static createAsyncOptionsProvider(
    options: AuthModuleAsyncOptions
  ): Provider {
    /**如果工厂函数属性存在，则返回工厂函数提供者 */
    if (options.useFactory) {
      return {
        provide: AuthModuleOptions,
        useFactory: options.useFactory,
        inject: options.inject || []
      };
    }
    return {
      provide: AuthModuleOptions,
      useFactory: async (optionsFactory: AuthOptionsFactory) =>
        await optionsFactory.createAuthOptions(),
      inject: [options.useExisting || options.useClass]
    };
  }
}
