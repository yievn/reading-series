import {
  DynamicModule,
  Global,
  Inject,
  Module,
  OnApplicationShutdown,
  Provider,
  Type,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import * as mongoose from 'mongoose';
import { ConnectOptions, Connection } from 'mongoose';
import { defer, lastValueFrom } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { getConnectionToken, handleRetry } from './common/mongoose.utils';
import {
  MongooseModuleAsyncOptions,
  MongooseModuleFactoryOptions,
  MongooseModuleOptions,
  MongooseOptionsFactory,
} from './interfaces/mongoose-options.interface';
import {
  MONGOOSE_CONNECTION_NAME,
  MONGOOSE_MODULE_OPTIONS,
} from './mongoose.constants';

@Global()
@Module({})
export class MongooseCoreModule implements OnApplicationShutdown {
  constructor(
    @Inject(MONGOOSE_CONNECTION_NAME) private readonly connectionName: string,
    private readonly moduleRef: ModuleRef,
  ) {}

  static forRoot(
    uri: string,
    options: MongooseModuleOptions = {},
  ): DynamicModule {
    const {
      retryAttempts,
      retryDelay,
      connectionName,
      connectionFactory,
      connectionErrorFactory,
      lazyConnection,
      onConnectionCreate,
      ...mongooseOptions
    } = options;

    const mongooseConnectionFactory =
      connectionFactory || ((connection) => connection);

    const mongooseConnectionError =
      connectionErrorFactory || ((error) => error);

    const mongooseConnectionName = getConnectionToken(connectionName);

    const mongooseConnectionNameProvider = {
      provide: MONGOOSE_CONNECTION_NAME,
      useValue: mongooseConnectionName,
    };

    const connectionProvider = {
      /**mongooseConnectionName是一个动态生成的令牌，用于在nest的依赖注入系统中唯一标识这个MongoDB链接 */
      provide: mongooseConnectionName,
      useFactory: async (): Promise<any> =>
        await lastValueFrom(
          /**defer：创建一个Observable，它在被订阅时才会执行提供的工厂函数，这确保了MongoDB连接的创建
           * 是按需进行的
           */
          defer(async () =>
            /**允许用户对创建的连接进一步的配置或封装 */
            mongooseConnectionFactory(
              /**用于十几创建MongoDB连接，它接受uri和连接选项作为参数，并处理连接的创建 */
              await this.createMongooseConnection(uri, mongooseOptions, {
                lazyConnection,
                onConnectionCreate,
              }),
              mongooseConnectionName,
            ),
          ).pipe(
            /**重试机制，它根据 retryAttempts, retryDelay参数进行配置，用于在连接失败时重试*/
            handleRetry(retryAttempts, retryDelay),
            /**捕获连接过程中的任何错误，并通过mongooseConnectionError函数处理，并抛出一个错误 */
            catchError((error) => {
              throw mongooseConnectionError(error);
            }),
          ),
        ),
    };
    return {
      module: MongooseCoreModule,
      providers: [connectionProvider, mongooseConnectionNameProvider],
      exports: [connectionProvider],
    };
  }

  static forRootAsync(options: MongooseModuleAsyncOptions): DynamicModule {
    const mongooseConnectionName = getConnectionToken(options.connectionName);

    const mongooseConnectionNameProvider = {
      provide: MONGOOSE_CONNECTION_NAME,
      useValue: mongooseConnectionName,
    };

    const connectionProvider = {
      provide: mongooseConnectionName,
      useFactory: async (
        mongooseModuleOptions: MongooseModuleFactoryOptions,
      ): Promise<any> => {
        const {
          retryAttempts,
          retryDelay,
          uri,
          connectionFactory,
          connectionErrorFactory,
          lazyConnection,
          onConnectionCreate,
          ...mongooseOptions
        } = mongooseModuleOptions;

        const mongooseConnectionFactory =
          connectionFactory || ((connection) => connection);

        const mongooseConnectionError =
          connectionErrorFactory || ((error) => error);

        return await lastValueFrom(
          defer(async () =>
            mongooseConnectionFactory(
              await this.createMongooseConnection(
                uri as string,
                mongooseOptions,
                { lazyConnection, onConnectionCreate },
              ),
              mongooseConnectionName,
            ),
          ).pipe(
            handleRetry(retryAttempts, retryDelay),
            catchError((error) => {
              throw mongooseConnectionError(error);
            }),
          ),
        );
      },
      inject: [MONGOOSE_MODULE_OPTIONS],
    };
    const asyncProviders = this.createAsyncProviders(options);
    return {
      module: MongooseCoreModule,
      imports: options.imports,
      providers: [
        ...asyncProviders,
        connectionProvider,
        mongooseConnectionNameProvider,
      ],
      exports: [connectionProvider],
    };
  }

  private static createAsyncProviders(
    options: MongooseModuleAsyncOptions,
  ): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)];
    }
    const useClass = options.useClass as Type<MongooseOptionsFactory>;
    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: useClass,
        useClass,
      },
    ];
  }

  private static createAsyncOptionsProvider(
    options: MongooseModuleAsyncOptions,
  ): Provider {
    if (options.useFactory) {
      return {
        provide: MONGOOSE_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }
    // `as Type<MongooseOptionsFactory>` is a workaround for microsoft/TypeScript#31603
    const inject = [
      (options.useClass || options.useExisting) as Type<MongooseOptionsFactory>,
    ];
    return {
      provide: MONGOOSE_MODULE_OPTIONS,
      useFactory: async (optionsFactory: MongooseOptionsFactory) =>
        await optionsFactory.createMongooseOptions(),
      inject,
    };
  }

  private static async createMongooseConnection(
    uri: string,
    mongooseOptions: ConnectOptions,
    factoryOptions: {
      lazyConnection?: boolean;
      onConnectionCreate?: MongooseModuleOptions['onConnectionCreate'];
    },
  ): Promise<Connection> {
    const connection = mongoose.createConnection(uri, mongooseOptions);

    if (factoryOptions?.lazyConnection) {
      return connection;
    }

    factoryOptions?.onConnectionCreate?.(connection);

    return connection.asPromise();
  }

  async onApplicationShutdown() {
    const connection = this.moduleRef.get<any>(this.connectionName);
    connection && (await connection.close());
  }
}
