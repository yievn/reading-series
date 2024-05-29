import { InjectionToken } from '@nestjs/common';
import { isFunction } from '@nestjs/common/utils/shared.utils';
import { UnknownElementException } from '../errors/exceptions/unknown-element.exception';
import { NestContainer } from './container';
import { InstanceWrapper } from './instance-wrapper';
import { Module } from './module';

type HostCollection = 'providers' | 'controllers' | 'injectables';

/**实例链接 */
export interface InstanceLink<T = any> {
  /**注入标识符 */
  token: InjectionToken;
  /**实例的包装引用 */
  wrapperRef: InstanceWrapper<T>;
  /**实例所属的集合（如提供者_providers、控制器_controllers） */
  collection: Map<any, InstanceWrapper>;
  /**实例所属模块ID */
  moduleId: string;
}

/**
 * 用于管理和链接模块中的实例。这个类作为一个中心仓库，
 * 存储了关于模块实例（如提供者、控制器
 * 和注入的服务）的链接信息.
 * 
 * 通过维护实例与其模块和类型的链接，这个类支持高效的实例查找和依赖注入
 */
export class InstanceLinksHost {
  /**
   * 这是一个映射，用于存储每个注入标识符（InjectionToken）与其对应的
   * InstanceLink数组。每个InstanceLink包含了实例的包装引用、所属模块ID、以及
   * 实例所属的集合（如提供者_providers、控制器_controllers）
   */
  private readonly instanceLinks = new Map<InjectionToken, InstanceLink[]>();
  /**
   * container: 这是对nest容器的引用，提供了对整个应用模块
   * 和依赖的访问能力。通过这个容器，InstanceLinksHost可以访问到所有模块的信息
   * 和实例
   */
  constructor(private readonly container: NestContainer) {
    this.initialize();
  }
  /**
   * 这个方法用于根据提供的Token和可选的options获取一个或多个instanceLinks。
   * 如果制定了moduleId，则只返回该模块的实例链接，如果指定了each，则返回所有
   * 匹配的实例链接
   */
  get<T = any>(token: InjectionToken): InstanceLink<T>;
  get<T = any>(
    token: InjectionToken,
    options?: { moduleId?: string; each?: boolean },
  ): InstanceLink<T> | Array<InstanceLink<T>>;
  get<T = any>(
    token: InjectionToken,
    options: { moduleId?: string; each?: boolean } = {},
  ): InstanceLink<T> | Array<InstanceLink<T>> {
    const instanceLinksForGivenToken = this.instanceLinks.get(token);
    /**找不到token对应的实例链接 */
    if (!instanceLinksForGivenToken) {
      throw new UnknownElementException(this.getInstanceNameByToken(token));
    }
    /**如果each为false，则返回token对应的所有实例链接 */
    if (options.each) {
      return instanceLinksForGivenToken;
    }
    /**
     * 只找到moduleId对应的实例链接 ，
     * 找不到则返回instanceLinksForGivenToken中的最后一个实例链接
     * */
    const instanceLink = options.moduleId
      ? instanceLinksForGivenToken.find(
          item => item.moduleId === options.moduleId,
        )
      : instanceLinksForGivenToken[instanceLinksForGivenToken.length - 1];
    /**没找到则抛出错误 */
    if (!instanceLink) {
      throw new UnknownElementException(this.getInstanceNameByToken(token));
    }
    return instanceLink;
  }
  /**
   * 这个方法在构造函数中被调用，用于初始化instanceLinks用舌，它遍历
   * 容器中的所有模块，并为每个模块中的提供者和注入的服务创建InstanceLink
   */
  private initialize() {
    const modules = this.container.getModules();
    modules.forEach(moduleRef => {
      const { providers, injectables, controllers } = moduleRef;
      /**为提供者创建实例链接 */
      providers.forEach((wrapper, token) =>
        this.addLink(wrapper, token, moduleRef, 'providers'),
      );
      /**为注入依赖创建实例链接 */
      injectables.forEach((wrapper, token) =>
        this.addLink(wrapper, token, moduleRef, 'injectables'),
      );
      /**为控制器创建实例链接 */
      controllers.forEach((wrapper, token) =>
        this.addLink(wrapper, token, moduleRef, 'controllers'),
      );
    });
  }
  /**
   * 这个方法用于添加一个新的 InstanceLink 到 instanceLinks 
   * 映射中。它接受一个实例包装器、一个注入标识符、
   * 一个模块引用和集合名称（指示实例属于提供者、控制器还是注入的服务）。
   */
  private addLink(
    wrapper: InstanceWrapper,
    token: InjectionToken,
    moduleRef: Module,
    collectionName: HostCollection,
  ) {
    const instanceLink: InstanceLink = {
      moduleId: moduleRef.id,
      wrapperRef: wrapper,
      collection: moduleRef[collectionName],
      token,
    };
    const existingLinks = this.instanceLinks.get(token);
    /**不存在，则 token对应的值为一个新数组，存在则push到已有的数组中*/
    if (!existingLinks) {
      this.instanceLinks.set(token, [instanceLink]);
    } else {
      existingLinks.push(instanceLink);
    }
  }
  /**
   * 这个方法用于根据提供的 token 获取实例的名称。
   * 如果 token 是一个函数（通常是类的构造函数），则返回函数的名称；
   * 如果是字符串或符号，则直接返回该字符串或符号的描述。
   */
  private getInstanceNameByToken(token: InjectionToken): string {
    return isFunction(token) ? (token as Function)?.name : (token as string);
  }
}
