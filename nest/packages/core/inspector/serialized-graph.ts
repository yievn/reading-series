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
    this.edges.set(id, edge);
    return edge;
  }

  public insertEntrypoint<T>(definition: Entrypoint<T>, parentId: string) {
    if (this.entrypoints.has(parentId)) {
      const existingCollection = this.entrypoints.get(parentId);
      existingCollection.push(definition);
    } else {
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
