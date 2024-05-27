import {
  DynamicModule,
  ForwardReference,
  Type,
} from '@nestjs/common/interfaces';
import { ModuleTokenFactory } from './module-token-factory';

export interface ModuleFactory {
  type: Type<any>;
  token: string;
  dynamicMetadata?: Partial<DynamicModule>;
}

/**
 * 用于从不同形式（普通模块类、前向引用和动态模块）的模块中提取出模块类、元数据以及模块标识符
 */
export class ModuleCompiler {
  /**
   * 接受一个ModuleTokenFactory实例作为参数，它用于生成模块唯一的标识符token，这对于
   * 模块的注册和检索是必要的，如果没有提供ModuleTokenFactory实例，构造函数会默认创建一个新的实例。
   */
  constructor(private readonly moduleTokenFactory = new ModuleTokenFactory()) {}

  public async compile(
    metatype: Type<any> | DynamicModule | Promise<DynamicModule>,
  ): Promise<ModuleFactory> {
    /**
     * 首先，方法通过 this.extractMetadata 确保如果 metatype 是一个 Promise，
     * 则会等待其解析。然后，它调用 extractMetadata 方法来提取模块的类型和任何动态元数据。
     */
    const { type, dynamicMetadata } = this.extractMetadata(await metatype);
    /**
     * moduleTokenFactory.create 方法，根据提取的类型和动态元数据生成一个唯一的 
     * token。这个 token 用于在 NestJS 的依赖注入容器中唯一标识模块。
     */
    const token = this.moduleTokenFactory.create(type, dynamicMetadata);
    /**
     * 方法返回一个包含模块类型、动态元数据和 token 的 ModuleFactory 实例
     */
    return { type, dynamicMetadata, token };
  }
  /**提取模块的元数据，这个方法处理不同类型的模块输入，包括普通的类模块、前向引用ForwardReference和动态模块 */
  public extractMetadata(
    metatype: Type<any> | ForwardReference | DynamicModule,
  ): {
    type: Type<any>;
    dynamicMetadata?: Partial<DynamicModule> | undefined;
  } {
    // 不是动态模块
    if (!this.isDynamicModule(metatype)) {
      return {
        /**检查它是否是一个前向引用。如果是，它将调用 forwardRef() 
         * 方法来解析引用。如果不是前向引用，直接返回 metatype 作为 type */
        type: (metatype as ForwardReference)?.forwardRef
          ? (metatype as ForwardReference).forwardRef()
          : metatype,
      };
    }
    // 动态模块
    const { module: type, ...dynamicMetadata } = metatype;
    return { type, dynamicMetadata };
  }
  /**判断是否为动态模块 */
  public isDynamicModule(
    module: Type<any> | DynamicModule | ForwardReference,
  ): module is DynamicModule {
    // 判断是否存在module属性，存在即为动态模块
    return !!(module as DynamicModule).module;
  }
}
