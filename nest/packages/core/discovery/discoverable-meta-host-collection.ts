import { Type } from '@nestjs/common';
import { InstanceWrapper } from '../injector/instance-wrapper';
import { ModulesContainer } from '../injector/modules-container';
/**
 * 这个类在nest中扮演着元数据管理和映射的关键角色，通过维护类
 * 与元数据键的映射关系以及提供者和控制器的元数据索引，这个类支持了
 * 框架的动态性和灵活性，使得开发者可以根据元数据来动态地发现和操作应用
 * 中的组件。
 */
export class DiscoverableMetaHostCollection {
  /**
   * A map of class references to metadata keys
   * .存储类引用于元数据键的映射。这允许框架根据类引用快速查找相关的元数据键
   */
  public static readonly metaHostLinks = new Map<Type | Function, string>();

  /**
   * A map of metadata keys to instance wrappers (providers) with the corresponding metadata key.
   * The map is weakly referenced by the modules container (unique per application).
   * 存储元数据键与实例包装器（providers）的映射，这个映射是弱引用的，依赖于模块容器，
   * 使得每个应用可以有其唯一的实例映射
   */
  private static readonly providersByMetaKey = new WeakMap<
    ModulesContainer,
    Map<string, Set<InstanceWrapper>>
  >();

  /**
   * A map of metadata keys to instance wrappers (controllers) with the corresponding metadata key.
   * The map is weakly referenced by the modules container (unique per application).
   * 用于存储控制器的实例的包装器
   */
  private static readonly controllersByMetaKey = new WeakMap<
    ModulesContainer,
    Map<string, Set<InstanceWrapper>>
  >();

  /**
   * Adds a link between a class reference and a metadata key.
   * @param target The class reference.
   * @param metadataKey The metadata key.
   * 添加一个类与元数据键的链接，允许框架在处理类时能够根据类引用查找到对应的元数据
   */
  public static addClassMetaHostLink(
    target: Type | Function,
    metadataKey: string,
  ) {
    this.metaHostLinks.set(target, metadataKey);
  }

  /**
   * Inspects a provider instance wrapper and adds it to the collection of providers
   * if it has a metadata key.
   * @param hostContainerRef A reference to the modules container.
   * @param instanceWrapper A provider instance wrapper.
   * @returns void
   * 检查提供者或控制器的实例包装器，并根据其元数据键将其添加到相应的集合中
   * 
   * 
   */
  public static inspectProvider(
    /**Module容器（放着所有modules实例） */
    hostContainerRef: ModulesContainer,
    /**包装器实例 */
    instanceWrapper: InstanceWrapper,
  ) {
    return this.inspectInstanceWrapper(
      hostContainerRef,
      instanceWrapper,
      this.providersByMetaKey,
    );
  }

  /**
   * Inspects a controller instance wrapper and adds it to the collection of controllers
   * if it has a metadata key.
   * @param hostContainerRef A reference to the modules container.
   * @param instanceWrapper A controller's instance wrapper.
   * @returns void
   */
  public static inspectController(
    hostContainerRef: ModulesContainer,
    instanceWrapper: InstanceWrapper,
  ) {
    return this.inspectInstanceWrapper(
      hostContainerRef,
      instanceWrapper,
      this.controllersByMetaKey,
    );
  }

  public static insertByMetaKey(
    metaKey: string,
    instanceWrapper: InstanceWrapper,
    collection: Map<string, Set<InstanceWrapper>>,
  ) {
    /**检查集合是否已存在该元数据键的条目，如果存在，则添加到现有集合，如果不存在，则创建新的集合并添加实例 */
    if (collection.has(metaKey)) {
      /**Set集合，用于存档metaKey对应的实例包装器 */
      const wrappers = collection.get(metaKey);
      wrappers.add(instanceWrapper);
    } else {
      /**创建一个新的集合 */
      const wrappers = new Set<InstanceWrapper>();
      /**将包装器放到新的集合中 */
      wrappers.add(instanceWrapper);
      /**将包装器放到collection中*/
      collection.set(metaKey, wrappers);
    }
  }

  public static getProvidersByMetaKey(
    hostContainerRef: ModulesContainer,
    metaKey: string,
  ): Set<InstanceWrapper> {
    const wrappersByMetaKey = this.providersByMetaKey.get(hostContainerRef);
    return wrappersByMetaKey.get(metaKey);
  }

  public static getControllersByMetaKey(
    hostContainerRef: ModulesContainer,
    metaKey: string,
  ): Set<InstanceWrapper> {
    const wrappersByMetaKey = this.controllersByMetaKey.get(hostContainerRef);
    return wrappersByMetaKey.get(metaKey);
  }
  /**
   * 用于检查实例包装器（instanceWrapper），并根据其元数据键将实例添加到相应的集合中。这个方法是处理依赖注入和元数据
   * 管理的关键部分，特别是在动态模块和组件的上下文中。
   */
  private static inspectInstanceWrapper(
    hostContainerRef: ModulesContainer,
    instanceWrapper: InstanceWrapper,
    wrapperByMetaKeyMap: WeakMap<
      ModulesContainer,
      Map<string, Set<InstanceWrapper>>
    >,
  ) {
    /**
     * 使用getMetaKeyByInstanceWrapper方法从实例包装器中获取元数据键。这个方法查找实例的类或函数引用，并从
     * metaHostLinks映射中获取相应的元数据键
     */
    const metaKey =
      DiscoverableMetaHostCollection.getMetaKeyByInstanceWrapper(
        instanceWrapper,
      );
    if (!metaKey) {
      return;
    }

    let collection: Map<string, Set<InstanceWrapper>>;
    /**如果wrapperByMetaKeyMap中存在以hostContainerRef为键值对应的元数据键集合，那就拿到已存在的集合*/
    if (wrapperByMetaKeyMap.has(hostContainerRef)) {
      collection = wrapperByMetaKeyMap.get(hostContainerRef);
    } else {
      /**如果没有存在集合，则创建一个新的映射并舍之道弱引用映射中 */
      collection = new Map<string, Set<InstanceWrapper>>();
      wrapperByMetaKeyMap.set(hostContainerRef, collection);
    }
    /**将实例包装器插入到正确的集合中 */
    this.insertByMetaKey(metaKey, instanceWrapper, collection);
  }

  private static getMetaKeyByInstanceWrapper(
    instanceWrapper: InstanceWrapper<any>,
  ) {
    return this.metaHostLinks.get(
      // NOTE: Regarding the ternary statement below,
      // - The condition `!wrapper.metatype` is needed because when we use `useValue`
      // the value of `wrapper.metatype` will be `null`.
      // - The condition `wrapper.inject` is needed here because when we use
      // `useFactory`, the value of `wrapper.metatype` will be the supplied
      // factory function.
      // For both cases, we should use `wrapper.instance.constructor` instead
      // of `wrapper.metatype` to resolve processor's class properly.
      // But since calling `wrapper.instance` could degrade overall performance
      // we must defer it as much we can.
      instanceWrapper.metatype || instanceWrapper.inject
        ? instanceWrapper.instance?.constructor ?? instanceWrapper.metatype
        : instanceWrapper.metatype,
    );
  }
}
