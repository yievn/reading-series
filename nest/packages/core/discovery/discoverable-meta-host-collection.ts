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
   * @param hostContainerRef 模块容器引用.
   * @param instanceWrapper 实例包装器引用.
   * @returns void
   * 检查提供者实例包装器，如果它具有元数据键，则将其添加到提供者集合中
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
   * 检查控制器实例包装器，如果它具有元数据键，则将其添加到控制器集合中。
   * @param hostContainerRef 模块容器引用.
   * @param instanceWrapper 实例包装器引用.
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
     * 最后返回metatype，InstanceWrapper包裹的类
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
      /**
       * 注意：关于下面的三元语句，
       * -条件`！需要wrapper.metatype`，因为当我们使用`useValue`时，
       * `wrapper.metatype`的值将为`null`。
       * -这里需要`wrapper.inject`条件，因为当我们使用
       * `useFactory`，`wrapper.metatype`的值将是提供的factory函数
       * 对于这两种情况，我们应该使用`wrapper.instance.constructor`代替
       * `wrapper.metatype`解析处理器
       * 但是由于调用`wrapper.instance`会降低整体性能，
       * 我们必须尽可能地推迟它。
       */
      instanceWrapper.metatype || instanceWrapper.inject
        ? instanceWrapper.instance?.constructor ?? instanceWrapper.metatype
        : instanceWrapper.metatype,
    );
  }
}


/**
 * 通常情况下，一个nestjs应用实例会有一个主ModulesContainer，它包含了应用的所有模块和提供者。
 * 然后，设计上允许存在多个ModulesContainer的情况：
 * 
 * 1、在单元测试或集成测试中，可能需要创建多个隔离的应用实例每个实例都有自己的ModulesContainer，这样可以
 * 确保测试之间不会相互影响，每个测试都会在一个干净的环境中运行。
 * 
 * 2、微服务架构中，每个微服务可能是一个独立的nestjs应用，每个应用都有自己的ModulesContainer，即使
 * 这些微服务是在同一个物理服务器或同一个进程中运行的，他们也可以通过各自的ModulesContainer来保持
 * 逻辑上的隔离。
 * 
 * 3、在多租户应用中，每个租户可能需要有自己的一套模块配置，一直吃不同的业务逻辑或数据隔离需求。通过为每个
 * 租户创建独立的ModulesContainer，可以在一个应用实例中有效地隔离不同租户的模块和服务
 */