import { InjectionToken } from '@nestjs/common';
import { ApplicationConfig } from '../application-config';
import { ExternalContextCreator } from '../helpers/external-context-creator';
import { HttpAdapterHost } from '../helpers/http-adapter-host';
import { INQUIRER } from '../injector/inquirer/inquirer-constants';
import { LazyModuleLoader } from '../injector/lazy-module-loader/lazy-module-loader';
import { ModuleRef } from '../injector/module-ref';
import { ModulesContainer } from '../injector/modules-container';
import { REQUEST } from '../router/request/request-constants';
import { Reflector } from '../services/reflector.service';
import { DeterministicUuidRegistry } from './deterministic-uuid-registry';
import { Edge } from './interfaces/edge.interface';
import { Entrypoint } from './interfaces/entrypoint.interface';
import {
  Extras,
  OrphanedEnhancerDefinition,
} from './interfaces/extras.interface';
import { Node } from './interfaces/node.interface';
import { SerializedGraphJson } from './interfaces/serialized-graph-json.interface';
import { SerializedGraphMetadata } from './interfaces/serialized-graph-metadata.interface';

export type SerializedGraphStatus = 'partial' | 'complete';
/**将id变为可选的 */
type WithOptionalId<T extends Record<'id', string>> = Omit<T, 'id'> &
  Partial<Pick<T, 'id'>>;

  /**在NestJs框架的上下文中，主要用于序列化应用的依赖图。 */
export class SerializedGraph {
  /**用于存储依赖图中的所有节点，在NestJS中，节点可以代表提供者、控制器等 */
  private readonly nodes = new Map<string, Node>();
  /**用于存储图中所有的边。边代表节点之间的依赖关系 */
  private readonly edges = new Map<string, Edge>();
  /*用于存储图中的所有入口点。入口点通常是模块的导出，它们可以被其他模块导入和使用 */
  private readonly entrypoints = new Map<string, Entrypoint<unknown>[]>();
  /**用于存储额外的信息，如孤立的增强器（orphanedEnhancers）
   * 和附加的增强器（attachedEnhancers） */
  private readonly extras: Extras = {
    orphanedEnhancers: [],
    attachedEnhancers: [],
  };
  /**一个SerializedGraphStatus类型（'partial' | 'complete'），表示图的序列化状态。 */
  private _status: SerializedGraphStatus = 'complete';
  /**一个可选的SerializedGraphMetadata类型，用于存储图的元数据。 */
  private _metadata?: SerializedGraphMetadata;
  /**内部提供者 */
  private static readonly INTERNAL_PROVIDERS: Array<InjectionToken> = [
    ApplicationConfig,
    ModuleRef,
    HttpAdapterHost,
    LazyModuleLoader,
    ExternalContextCreator,
    ModulesContainer,
    Reflector,
    SerializedGraph,
    HttpAdapterHost.name,
    Reflector.name,
    REQUEST,
    INQUIRER,
  ];
  
  set status(status: SerializedGraphStatus) {
    this._status = status;
  }

  set metadata(metadata: SerializedGraphMetadata) {
    this._metadata = metadata;
  }
  /**向图中添加一个新的节点，如果节点已存在，则返回现有节点 */
  public insertNode(nodeDefinition: Node) {
    if (
      nodeDefinition.metadata.type === 'provider' &&
      SerializedGraph.INTERNAL_PROVIDERS.includes(nodeDefinition.metadata.token)
    ) {
      // 如果nodeDefinition节点是内部的提供者，则修改internal为true
      nodeDefinition.metadata = {
        ...nodeDefinition.metadata,
        internal: true,
      };
    }
    /**节点已经存在 */
    if (this.nodes.has(nodeDefinition.id)) {
      /**返回现有节点 */
      return this.nodes.get(nodeDefinition.id);
    }
    /**不存在则添加到nodes中 */
    this.nodes.set(nodeDefinition.id, nodeDefinition);
    return nodeDefinition;
  }

  public insertEdge(edgeDefinition: WithOptionalId<Edge>) {
    if (
      edgeDefinition.metadata.type === 'class-to-class' &&
      (SerializedGraph.INTERNAL_PROVIDERS.includes(
        edgeDefinition.metadata.sourceClassToken,
      ) ||
        SerializedGraph.INTERNAL_PROVIDERS.includes(
          edgeDefinition.metadata.targetClassToken,
        ))
    ) {
      /**检查边的源类和目标类是否属于内部提供者（INTERNAL_PROVIDERS列表中的项）。如果是，将边的internal属性设置为true
       * 表示这是一个内部依赖。
       */
      edgeDefinition.metadata = {
        ...edgeDefinition.metadata,
        internal: true,
      };
    }
    const id =
      edgeDefinition.id ?? this.generateUuidByEdgeDefinition(edgeDefinition);
    const edge = {
      ...edgeDefinition,
      id,
    };
    /**
     * 使用边id作为健，将边对象存储到edges映射中，如果便已经存在，则更新；如果不存在，则添加
     */
    this.edges.set(id, edge);
    return edge;
  }
  /**用于向依赖图中添加一个入口店，入口点通常是模块的导出他们可以被其他模块导入和使用。 */
  /**
   * 
   * @param definition 
   * @param parentId 指的是导出点所属模块的唯一标识符或模块ID，在nestjs的依赖图中，每个模块都被视为一个
   * 节点，具有一个唯一的标识符，即模块ID，这个ID用于标识和追踪模块之间的关系，包括他们的依赖和导出。
   */
  public insertEntrypoint<T>(definition: Entrypoint<T>, parentId: string) {
    /**如果有parentId对应的入口点集合，则将新的入口点归入到已存在的集合中 */
    if (this.entrypoints.has(parentId)) {
      const existingCollection = this.entrypoints.get(parentId);
      existingCollection.push(definition);
    } else {
      /**新建一个集合 */
      this.entrypoints.set(parentId, [definition]);
    }
  }
  
  public insertOrphanedEnhancer(entry: OrphanedEnhancerDefinition) {
    this.extras.orphanedEnhancers.push(entry);
  }

  public insertAttachedEnhancer(nodeId: string) {
    this.extras.attachedEnhancers.push({
      nodeId,
    });
  }

  public getNodeById(id: string) {
    return this.nodes.get(id);
  }

  public toJSON(): SerializedGraphJson {
    const json: SerializedGraphJson = {
      nodes: Object.fromEntries(this.nodes),
      edges: Object.fromEntries(this.edges),
      entrypoints: Object.fromEntries(this.entrypoints),
      extras: this.extras,
    };

    if (this._status) {
      json['status'] = this._status;
    }
    if (this._metadata) {
      json['metadata'] = this._metadata;
    }
    return json;
  }

  public toString() {
    const replacer = (key: string, value: unknown) => {
      if (typeof value === 'symbol') {
        return value.toString();
      }
      return typeof value === 'function' ? value.name ?? 'Function' : value;
    };
    return JSON.stringify(this.toJSON(), replacer, 2);
  }

  private generateUuidByEdgeDefinition(
    edgeDefinition: WithOptionalId<Edge>,
  ): string {
    return DeterministicUuidRegistry.get(JSON.stringify(edgeDefinition));
  }
}
