import { Injectable } from '@nestjs/common/interfaces/injectable.interface';
import {
  isConstructor,
  isFunction,
  isNil,
} from '@nestjs/common/utils/shared.utils';

/**
 * 用于从类的原型链中获取方法名和相关属性。并
 */
export class MetadataScanner {
  /**
   * 缓存已扫描的原型和其方法名，这个缓存帮助避免重复扫描相同的原型，提高性能。
   */
  private readonly cachedScannedPrototypes: Map<object, string[]> = new Map();

  /**
   * @deprecated
   * @see {@link getAllMethodNames}
   * @see getAllMethodNames
   * 从给定的原型对象中扫描所有方法，并对每个方法名执行回调函数。这个方法用于执行自定义的逻辑处理，如手机特定的元数据
   * 或应用特定的处理函数。
   * 
   * 用途：在nestjs中，这个方法可以用于手机装饰器提供的元数据，或者
   * 执行其他需要遍历类方法的操作。
   */
  public scanFromPrototype<T extends Injectable, R = any>(
    instance: T,
    prototype: object,
    callback: (name: string) => R,
  ): R[] {
    if (!prototype) {
      return [];
    }
    /** */
    const visitedNames = new Map<string, boolean>();
    const result: R[] = [];

    do {
      /**遍历对象的自有属性 */
      for (const property of Object.getOwnPropertyNames(prototype)) {
        /**如果遍历过，就直接跳过 */
        if (visitedNames.has(property)) {
          continue;
        }
        /**标记属性，防止重复遍历 */
        visitedNames.set(property, true);

        // reason: https://github.com/nestjs/nest/pull/10821#issuecomment-1411916533
        /**返回属性对应的描述符对象 */
        const descriptor = Object.getOwnPropertyDescriptor(prototype, property);

        if (
          descriptor.set ||
          descriptor.get ||
          isConstructor(property) ||
          !isFunction(prototype[property])
        ) {
          /**如果是访问器属性、构造属性以及某属性不是方法，那就跳过 */
          continue;
        }

        const value = callback(property);

        if (isNil(value)) {
          continue;
        }

        result.push(value);
      }
    } while (
      (prototype = Reflect.getPrototypeOf(prototype)) &&
      prototype !== Object.prototype
    );

    return result;
  }

  /**
   * @deprecated
   * @see {@link getAllMethodNames}
   * @see getAllMethodNames
   * 生成器函数，遍历给定原型的所有方法名，并返回一个迭代器。这个方法使用getAllMethodNames方法
   * 来获取方法名，然后通过生成器逐一返回
   */
  public *getAllFilteredMethodNames(
    prototype: object,
  ): IterableIterator<string> {
    /**
     * yield* 是一个用于在生成器函数中委托到另一个生成器或可迭代对象的操作符。当使用 yield* 与一个可迭代对象
     * （如数组）一起使用时，它会自动遍历该数组，并逐个 yield 数组中的每个元素。
     */
    yield* this.getAllMethodNames(prototype);
  }

  public getAllMethodNames(prototype: object | null): string[] {
    if (!prototype) {
      return [];
    }
    /**缓存里存在该原型对象，则返回之前扫描的结果 */
    if (this.cachedScannedPrototypes.has(prototype)) {
      return this.cachedScannedPrototypes.get(prototype);
    }

    const visitedNames = new Map<string, boolean>();
    const result: string[] = [];

    this.cachedScannedPrototypes.set(prototype, result);

    do {
      for (const property of Object.getOwnPropertyNames(prototype)) {
        /**已经遍历过了，就直接跳过 */
        if (visitedNames.has(property)) {
          continue;
        }
        /**设置改属性已被遍历 */
        visitedNames.set(property, true);

        // reason: https://github.com/nestjs/nest/pull/10821#issuecomment-1411916533
        const descriptor = Object.getOwnPropertyDescriptor(prototype, property);
        /**
         * 如果是访问器属性、非函数属性以及构造器属性，则直接跳过
         */
        if (
          descriptor.set ||
          descriptor.get ||
          isConstructor(property) ||
          !isFunction(prototype[property])
        ) {
          continue;
        }
        /**将属性添加到result中 */
        result.push(property);
      }
    } while (
      /**回溯原型对象，直到prototype为null或者为Object.prototype */
      (prototype = Reflect.getPrototypeOf(prototype)) &&
      prototype !== Object.prototype
    );

    return result;
  }
}
