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

    const visitedNames = new Map<string, boolean>();
    const result: R[] = [];

    do {
      for (const property of Object.getOwnPropertyNames(prototype)) {
        if (visitedNames.has(property)) {
          continue;
        }

        visitedNames.set(property, true);

        // reason: https://github.com/nestjs/nest/pull/10821#issuecomment-1411916533
        const descriptor = Object.getOwnPropertyDescriptor(prototype, property);

        if (
          descriptor.set ||
          descriptor.get ||
          isConstructor(property) ||
          !isFunction(prototype[property])
        ) {
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

    if (this.cachedScannedPrototypes.has(prototype)) {
      return this.cachedScannedPrototypes.get(prototype);
    }

    const visitedNames = new Map<string, boolean>();
    const result: string[] = [];

    this.cachedScannedPrototypes.set(prototype, result);

    do {
      for (const property of Object.getOwnPropertyNames(prototype)) {
        if (visitedNames.has(property)) {
          continue;
        }

        visitedNames.set(property, true);

        // reason: https://github.com/nestjs/nest/pull/10821#issuecomment-1411916533
        const descriptor = Object.getOwnPropertyDescriptor(prototype, property);

        if (
          descriptor.set ||
          descriptor.get ||
          isConstructor(property) ||
          !isFunction(prototype[property])
        ) {
          continue;
        }

        result.push(property);
      }
    } while (
      (prototype = Reflect.getPrototypeOf(prototype)) &&
      prototype !== Object.prototype
    );

    return result;
  }
}
