import { DynamicModule } from '@nestjs/common';
import { Type } from '@nestjs/common/interfaces/type.interface';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { isFunction, isSymbol } from '@nestjs/common/utils/shared.utils';
import { createHash } from 'crypto';
import stringify from 'fast-safe-stringify';

const CLASS_STR = 'class ';
const CLASS_STR_LEN = CLASS_STR.length;
/**
 * ModuleTokenFactory主要为了生成和管理模块的标识符，这些标识符用于唯一
 * 地区分不同的模块，尤其是在动态模块的情况下这点尤为重要
 */
export class ModuleTokenFactory {
  /**缓存静态模块的标识符。键是由模块ID和模块名称组成的字符串，值是这个键的哈希值 */
  private readonly moduleTokenCache = new Map<string, string>();
  /**缓存每个模块类型（matatype）的唯一ID，这是一个弱引用映射，可以帮助垃圾回收 */
  private readonly moduleIdsCache = new WeakMap<Type<unknown>, string>();
  /**根据模块类型（matatype）和可选的动态模块元数据生成模块的标识符。
   * 如果没有提供动态模块元数据，它将生成一个静态模块的标识符，如果提供了动态
   * 模块元数据，它将生成一个包含动态信息的标识符
   */
  public create(
    metatype: Type<unknown>,
    dynamicModuleMetadata?: Partial<DynamicModule> | undefined,
  ): string {
    const moduleId = this.getModuleId(metatype);

    if (!dynamicModuleMetadata) {
      return this.getStaticModuleToken(moduleId, this.getModuleName(metatype));
    }
    const opaqueToken = {
      id: moduleId,
      module: this.getModuleName(metatype),
      dynamic: dynamicModuleMetadata,
    };
    const opaqueTokenString = this.getStringifiedOpaqueToken(opaqueToken);

    return this.hashString(opaqueTokenString);
  }
  /**
   * 生成并缓存一个静态模块的标识符，这个标识符是模块ID和模块名的组合的哈希值
   */
  public getStaticModuleToken(moduleId: string, moduleName: string): string {
    const key = `${moduleId}_${moduleName}`;
    if (this.moduleTokenCache.has(key)) {
      return this.moduleTokenCache.get(key);
    }

    const hash = this.hashString(key);
    this.moduleTokenCache.set(key, hash);
    return hash;
  }
  /**
   * 将一个包含模块ID、模块名和动态模块元数据的对象转化为字符串，只用fast-save-stringify
   * 库来处理可能存在的循环引用。
   */
  public getStringifiedOpaqueToken(opaqueToken: object | undefined): string {
    // Uses safeStringify instead of JSON.stringify to support circular dynamic modules
    // The replacer function is also required in order to obtain real class names
    // instead of the unified "Function" key
    return opaqueToken ? stringify(opaqueToken, this.replacer) : '';
  }
  /**为给定的模块类型生成一个唯一的ID，如果这个类型已经有一个ID，则返回它 */
  public getModuleId(metatype: Type<unknown>): string {
    let moduleId = this.moduleIdsCache.get(metatype);
    if (moduleId) {
      return moduleId;
    }
    // 生成随机字符串
    moduleId = randomStringGenerator();
    this.moduleIdsCache.set(metatype, moduleId);
    return moduleId;
  }
  /**返回给定模块类型的名称 */
  public getModuleName(metatype: Type<any>): string {
    return metatype.name;
  }
  // 使用SHA-256哈希算法对给定的字符串进行哈希处理
  private hashString(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }
  /**
   * 在stringify函数中使用的替换器函数，用于在字符串化对象时正确处理函数和符号类型
   * 的值
   */
  private replacer(key: string, value: any) {
    if (isFunction(value)) {
      const funcAsString = value.toString();
      const isClass = funcAsString.slice(0, CLASS_STR_LEN) === CLASS_STR;
      if (isClass) {
        return value.name;
      }
      return funcAsString;
    }
    if (isSymbol(value)) {
      return value.toString();
    }
    return value;
  }
}
