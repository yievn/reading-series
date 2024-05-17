import { UnknownDependenciesException } from '../errors/exceptions/unknown-dependencies.exception';
import { NestContainer } from '../injector/container';
import { InstanceWrapper } from '../injector/instance-wrapper';
import { Module } from '../injector/module';
import { DeterministicUuidRegistry } from './deterministic-uuid-registry';
import { EnhancerMetadataCacheEntry } from './interfaces/enhancer-metadata-cache-entry.interface';
import { Entrypoint } from './interfaces/entrypoint.interface';
import { OrphanedEnhancerDefinition } from './interfaces/extras.interface';
import { ClassNode, Node } from './interfaces/node.interface';
import { PartialGraphHost } from './partial-graph.host';
import { SerializedGraph } from './serialized-graph';

/**用来检查和操作nestjs应用的依赖图的工具。这个类提供了一系列方法来分析模块、实例
 * 和依赖关系，并将这些信息序列化为一个图形结构，以便于进一步的分析和可视化。
 * 
 * 实现原理：GraphInspector的实现原理基于图数据结构中的节点和边的概念。每个模块、提供者或
 * 控制器在图中都是一个节点，而他们之间的依赖关系则通过边来标识，这种结构使得可以清晰地表示和分析应用的结构和依赖关系。
 *
 * 节点：代表应用中的一个实体，如模块、提供者或控制器
 * 边：表示两个节点之间的依赖关系，如一个控制器依赖于一个服务
 * 
 * 通过这些节点和边的管理和分析，GraphInspector能够提供对应用结构的深入了解，支持错误诊断、性能优化和
 * 其他高级分析功能。
 */
export class GraphInspector {
  /**用于存储和管理应用的依赖图，这个图包含了节点（模块、提供者等）和边（依赖关系） */
  private readonly graph: SerializedGraph;
  /**缓存增强器的元数据。增强器通常是指那些通过装饰器或其他方式增加类功能的实体。 */
  private readonly enhancersMetadataCache =
    new Array<EnhancerMetadataCacheEntry>();

  /**应用的依赖注入容器，用于管理应用中的所有模块和提供者 */
  constructor(private readonly container: NestContainer) {
    this.graph = container.serializedGraph;
  }
  /**分析传入模块集合，为每个模块创建节点，并为模块间创建边 */
  public inspectModules(
    modules: Map<string, Module> = this.container.getModules(),
  ) {
    for (const moduleRef of modules.values()) {
      this.insertModuleNode(moduleRef);
      this.insertClassNodes(moduleRef);
      this.insertModuleToModuleEdges(moduleRef);
    }

    this.enhancersMetadataCache.forEach(entry =>
      this.insertEnhancerEdge(entry),
    );

    DeterministicUuidRegistry.clear();
  }
  /**在发生错误时注册部分完成的图，这通常用于错误处理，以记录在错误发生时的应用状态 */
  public registerPartial(error: unknown) {
    this.graph.status = 'partial';

    if (error instanceof UnknownDependenciesException) {
      this.graph.metadata = {
        cause: {
          type: 'unknown-dependencies',
          context: error.context,
          moduleId: error.moduleRef?.id,
          nodeId: error.metadata?.id,
        },
      };
    } else {
      this.graph.metadata = {
        cause: {
          type: 'unknown',
          error,
        },
      };
    }
    PartialGraphHost.register(this.graph);
  }
  /**检查特定的实例包装器InstanceWrapper，为其依赖创建边 */
  public inspectInstanceWrapper<T = any>(
    source: InstanceWrapper<T>,
    moduleRef: Module,
  ) {
    const ctorMetadata = source.getCtorMetadata();
    ctorMetadata?.forEach((target, index) =>
      this.insertClassToClassEdge(
        source,
        target,
        moduleRef,
        index,
        'constructor',
      ),
    );

    const propertiesMetadata = source.getPropertiesMetadata();
    propertiesMetadata?.forEach(({ key, wrapper: target }) =>
      this.insertClassToClassEdge(source, target, moduleRef, key, 'property'),
    );
  }
  /**将增强器的元数据添加到缓存中 */
  public insertEnhancerMetadataCache(entry: EnhancerMetadataCacheEntry) {
    this.enhancersMetadataCache.push(entry);
  }
  /**向图中添加孤立的增强器节点 */
  public insertOrphanedEnhancer(entry: OrphanedEnhancerDefinition) {
    this.graph.insertOrphanedEnhancer({
      ...entry,
      ref: entry.ref?.constructor?.name ?? 'Object',
    });
  }
  /**向图中添加已附加的增强器节点 */
  public insertAttachedEnhancer(wrapper: InstanceWrapper) {
    const existingNode = this.graph.getNodeById(wrapper.id);
    existingNode.metadata.global = true;

    this.graph.insertAttachedEnhancer(existingNode.id);
  }
  /**向图中添加入口点定义 */
  public insertEntrypointDefinition<T>(
    definition: Entrypoint<T>,
    parentId: string,
  ) {
    definition = {
      ...definition,
      id: `${definition.classNodeId}_${definition.methodName}`,
    };
    this.graph.insertEntrypoint(definition, parentId);
  }
  /**向图中添加类节点 */
  public insertClassNode(
    moduleRef: Module,
    wrapper: InstanceWrapper,
    type: Exclude<Node['metadata']['type'], 'module'>,
  ) {
    this.graph.insertNode({
      id: wrapper.id,
      label: wrapper.name,
      parent: moduleRef.id,
      metadata: {
        type,
        internal: wrapper.metatype === moduleRef.metatype,
        sourceModuleName: moduleRef.name,
        durable: wrapper.isDependencyTreeDurable(),
        static: wrapper.isDependencyTreeStatic(),
        scope: wrapper.scope,
        transient: wrapper.isTransient,
        exported: moduleRef.exports.has(wrapper.token),
        token: wrapper.token,
        subtype: wrapper.subtype,
        initTime: wrapper.initTime,
      },
    });
  }
  /**向图中添加模块节点 */
  private insertModuleNode(moduleRef: Module) {
    const dynamicMetadata = this.container.getDynamicMetadataByToken(
      moduleRef.token,
    );
    const node: Node = {
      id: moduleRef.id,
      label: moduleRef.name,
      metadata: {
        type: 'module',
        global: moduleRef.isGlobal,
        dynamic: !!dynamicMetadata,
        internal: moduleRef.name === 'InternalCoreModule',
      },
    };
    this.graph.insertNode(node);
  }
  /**为模块间的依赖关系添加边 */
  private insertModuleToModuleEdges(moduleRef: Module) {
    for (const targetModuleRef of moduleRef.imports) {
      this.graph.insertEdge({
        source: moduleRef.id,
        target: targetModuleRef.id,
        metadata: {
          type: 'module-to-module',
          sourceModuleName: moduleRef.name,
          targetModuleName: targetModuleRef.name,
        },
      });
    }
  }
  /**为增强器添加边  */
  private insertEnhancerEdge(entry: EnhancerMetadataCacheEntry) {
    const moduleRef = this.container.getModuleByKey(entry.moduleToken);
    const sourceInstanceWrapper =
      moduleRef.controllers.get(entry.classRef) ??
      moduleRef.providers.get(entry.classRef);
    const existingSourceNode = this.graph.getNodeById(
      sourceInstanceWrapper.id,
    ) as ClassNode;
    const enhancers = existingSourceNode.metadata.enhancers ?? [];

    if (entry.enhancerInstanceWrapper) {
      this.insertClassToClassEdge(
        sourceInstanceWrapper,
        entry.enhancerInstanceWrapper,
        moduleRef,
        undefined,
        'decorator',
      );

      enhancers.push({
        id: entry.enhancerInstanceWrapper.id,
        methodKey: entry.methodKey,
        subtype: entry.subtype,
      });
    } else {
      const name =
        entry.enhancerRef.constructor?.name ??
        (entry.enhancerRef as Function).name;

      enhancers.push({
        name,
        methodKey: entry.methodKey,
        subtype: entry.subtype,
      });
    }
    existingSourceNode.metadata.enhancers = enhancers;
  }
  /** 为类之间的依赖关系添加边*/
  private insertClassToClassEdge<T>(
    source: InstanceWrapper<T>,
    target: InstanceWrapper,
    moduleRef: Module,
    keyOrIndex: number | string | symbol | undefined,
    injectionType: 'constructor' | 'property' | 'decorator',
  ) {
    this.graph.insertEdge({
      source: source.id,
      target: target.id,
      metadata: {
        type: 'class-to-class',
        sourceModuleName: moduleRef.name,
        sourceClassName: source.name,
        targetClassName: target.name,
        sourceClassToken: source.token,
        targetClassToken: target.token,
        targetModuleName: target.host?.name,
        keyOrIndex,
        injectionType,
      },
    });
  }
  /**为模块中的所有类添加节点 */
  private insertClassNodes(moduleRef: Module) {
    moduleRef.providers.forEach(value =>
      this.insertClassNode(moduleRef, value, 'provider'),
    );
    moduleRef.injectables.forEach(value =>
      this.insertClassNode(moduleRef, value, 'injectable'),
    );
    moduleRef.controllers.forEach(value =>
      this.insertClassNode(moduleRef, value, 'controller'),
    );
  }
}
