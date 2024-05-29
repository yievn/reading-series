import { Abstract, Scope, Type } from '@nestjs/common';
import { GetOrResolveOptions } from '@nestjs/common/interfaces';
import {
  InvalidClassScopeException,
  UnknownElementException,
} from '../errors/exceptions';
import { Injector } from './injector';
import { InstanceLink, InstanceLinksHost } from './instance-links-host';
import { ContextId } from './instance-wrapper';
import { Module } from './module';

/**用于解析模块实例和依赖的核心逻辑 */
export abstract class AbstractInstanceResolver {
  /**这是一个容器，用于存储和管理模块实例及其依赖关系的链接。它允许快速访问和解析模块中的各种实例 */
  protected abstract instanceLinksHost: InstanceLinksHost;
  /**这是注入器实例，负责实际的依赖注入逻辑，包括实例的创建和依赖的解析 */
  protected abstract injector: Injector;
  /**
   * 用于获取一个类型或标识符对应的所以实例，
   * 它支持单个实例或实例数组的获取，
   * 具体取决于传入的参数和选项
   */
  protected abstract get<TInput = any, TResult = TInput>(
    /**类型或标识符 */
    typeOrToken: Type<TInput> | Function | string | symbol,
    /** */
    options?: GetOrResolveOptions,
  ): TResult | Array<TResult>;
  /**
   * 用于查找一个或多个实例，根绝提供的typeOrToken和options。
   * 它首先通过instanceLinksHost获取实例链接，
   * 然后根据实例的作用域（如请求或瞬态）抛出异常或返回实例
   */
  protected find<TInput = any, TResult = TInput>(
    /**类型或标识符 */
    typeOrToken: Type<TInput> | Abstract<TInput> | string | symbol,
    options: { moduleId?: string; each?: boolean },
  ): TResult | Array<TResult> {
    /**根据 typeOrToken和options调用instanceLinksHost.get获取实例链接*/
    const instanceLinkOrArray = this.instanceLinksHost.get<TResult>(
      typeOrToken,
      options,
    );
    const pluckInstance = ({ wrapperRef }: InstanceLink) => {
      /**如果实例的作用域是请求作用域或瞬态作用域，则抛出错误 */
      if (
        wrapperRef.scope === Scope.REQUEST ||
        wrapperRef.scope === Scope.TRANSIENT
      ) {
        throw new InvalidClassScopeException(typeOrToken);
      }
      return wrapperRef.instance;
    };
    /**如果instanceLinkOrArray是数组 */
    if (Array.isArray(instanceLinkOrArray)) {
      return instanceLinkOrArray.map(pluckInstance);
    }
    return pluckInstance(instanceLinkOrArray);
  }
  /**
   * 这是一个异步方法，用于在特定的上下文中解析依赖，它处理依赖项的动态解析，特别是在请求作用域或瞬态
   * 作用域中的依赖
   */
  protected async resolvePerContext<TInput = any, TResult = TInput>(
    /**要解析的依赖项的类型或标识符 */
    typeOrToken: Type<TInput> | Abstract<TInput> | string | symbol,
    /**当前请求所在的模块 */
    contextModule: Module,
    /**当前请求的上下文标识，用于标识请求的唯一性 */
    contextId: ContextId,
    /**用于提供额外的解析选项，如是否严格解析 */
    options?: GetOrResolveOptions,
  ): Promise<TResult | Array<TResult>> {
    /**获取实例链接 */
    const instanceLinkOrArray = options?.strict
      /**只返回当前模块对应的实例链接 */
      ? this.instanceLinksHost.get(typeOrToken, {
          moduleId: contextModule.id,
          each: options.each,
        })
        /**返回所有实例链接 */
      : this.instanceLinksHost.get(typeOrToken, {
          each: options.each,
        });

    const pluckInstance = async (instanceLink: InstanceLink) => {
      const { wrapperRef, collection } = instanceLink;
      /**如果实例的依赖树是静态的并且不是瞬态的，则可以直接通过get方法获取实例 */
      if (wrapperRef.isDependencyTreeStatic() && !wrapperRef.isTransient) {
        return this.get(typeOrToken, { strict: options.strict });
      }
      /**不满足上诉条件，说明需要再特定上下文中动态加载或创建实例 */
      const ctorHost = wrapperRef.instance || { constructor: typeOrToken };
      const instance = await this.injector.loadPerContext(
        ctorHost,
        wrapperRef.host,
        collection,
        contextId,
        wrapperRef,
      );
      if (!instance) {
        throw new UnknownElementException();
      }
      return instance;
    };
    /**如果实例链接是数组 */
    if (Array.isArray(instanceLinkOrArray)) {
      return Promise.all(
        instanceLinkOrArray.map(instanceLink => pluckInstance(instanceLink)),
      );
    }
    return pluckInstance(instanceLinkOrArray);
  }
}
