/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from 'react-reconciler/src/ReactInternalTypes';
import type {ReactScopeInstance} from 'shared/ReactTypes';
import type {
  ReactDOMEventHandle,
  ReactDOMEventHandleListener,
} from './ReactDOMEventHandleTypes';
import type {
  Container,
  TextInstance,
  Instance,
  SuspenseInstance,
  Props,
  HoistableRoot,
  RootResources,
} from './ReactFiberConfigDOM';

import {
  HostComponent,
  HostHoistable,
  HostSingleton,
  HostText,
  HostRoot,
  SuspenseComponent,
} from 'react-reconciler/src/ReactWorkTags';

import {getParentSuspenseInstance} from './ReactFiberConfigDOM';

import {enableScopeAPI, enableFloat} from 'shared/ReactFeatureFlags';

const randomKey = Math.random().toString(36).slice(2);
const internalInstanceKey = '__reactFiber$' + randomKey;
const internalPropsKey = '__reactProps$' + randomKey;
const internalContainerInstanceKey = '__reactContainer$' + randomKey;
const internalEventHandlersKey = '__reactEvents$' + randomKey;
const internalEventHandlerListenersKey = '__reactListeners$' + randomKey;
const internalEventHandlesSetKey = '__reactHandles$' + randomKey;
const internalRootNodeResourcesKey = '__reactResources$' + randomKey;
const internalHoistableMarker = '__reactMarker$' + randomKey;

export function detachDeletedInstance(node: Instance): void {
  // TODO: This function is only called on host components. I don't think all of
  // these fields are relevant.
  delete (node: any)[internalInstanceKey];
  delete (node: any)[internalPropsKey];
  delete (node: any)[internalEventHandlersKey];
  delete (node: any)[internalEventHandlerListenersKey];
  delete (node: any)[internalEventHandlesSetKey];
}

export function precacheFiberNode(
  hostInst: Fiber,
  node: Instance | TextInstance | SuspenseInstance | ReactScopeInstance,
): void {
  (node: any)[internalInstanceKey] = hostInst;
}

export function markContainerAsRoot(hostRoot: Fiber, node: Container): void {
  // $FlowFixMe[prop-missing]
  node[internalContainerInstanceKey] = hostRoot;
}

export function unmarkContainerAsRoot(node: Container): void {
  // $FlowFixMe[prop-missing]
  node[internalContainerInstanceKey] = null;
}

export function isContainerMarkedAsRoot(node: Container): boolean {
  // $FlowFixMe[prop-missing]
  return !!node[internalContainerInstanceKey];
}

// Given a DOM node, return the closest HostComponent or HostText fiber ancestor.
// If the target node is part of a hydrated or not yet rendered subtree, then
// this may also return a SuspenseComponent or HostRoot to indicate that.
// Conceptually the HostRoot fiber is a child of the Container node. So if you
// pass the Container node as the targetNode, you will not actually get the
// HostRoot back. To get to the HostRoot, you need to pass a child of it.
// The same thing applies to Suspense boundaries.
/**
 * 
 * @param {*} targetNode 
 * @returns 
 * 从给定的DOM节点中找到最近的React Fiber实例的函数。帮助确定事件目标与React组件树的关系。
 */
export function getClosestInstanceFromNode(targetNode: Node): null | Fiber {
  // 尝试从 targetNode 获取直接关联的 React Fiber 实例。
  let targetInst = (targetNode: any)[internalInstanceKey];
  // 如果 targetInst 存在，直接返回它。
  if (targetInst) {
    // Don't return HostRoot or SuspenseComponent here.
    return targetInst;
  }
  // If the direct event target isn't a React owned DOM node, we need to look
  // to see if one of its parents is a React owned DOM node.
  /**
   * React使用Fiber数据结构来表示组件树。每个DOM节点通常与一个Fiber实例相关联。Fiber树与DOM树并不总是
   * 一一对应，因为Fiber树可能包含一些抽象的组件节点（Suspense）或为挂载的节点。
   * 
   * React事件系统需要知道事件目标与React组件树的关系，以便正确地处理事件。
   * 事件可能会再非React管理的节点上触发，因此需要向上遍历DOM树以找到最近的React管理节点。
   * 
   * 1、防护力非React节点：事件可能会再非React管理的节点上触发，
   * 因此需要向上遍历DOM树以找到最近的React管理节点。
   * 2、处理脱水节点：在服务器端渲染和Suspense组件的场景中，某些节点可能是脱水的。这些节点在初始化加载时没有
   * 与React Fiber实例相关联，因此需要向上查找以找到关联的Fiber实例。
   * 3、确保正确的Fiber实例：直接事件目标可能没有关联的Fiber实例，或者关联的实例不完整（例如，未挂载）。
   * 向上遍历可以确保找到一个已挂载的、完整的Fiber实例。
   * 4、处理嵌套结构：在复杂的组件结构中，某些组件可能嵌套在其他组件中
   */
  let parentNode = targetNode.parentNode;
  while (parentNode) {
    /**
     * 我们将检查这是否是一个将来可能包含 React 节点的容器根。
     * 我们需要首先检查这一点，因为如果我们是一个脱水容器的子节点，
     * 我们需要先找到那个内部容器，然后再继续寻找父实例。
     * 注意，我们不会在 targetNode 本身上检查这个字段，因为在概念上，
     * Fiber 是在容器节点和第一个子节点之间的。它并不包围容器节点。
     * 如果它不是一个容器，我们会检查它是否是一个实例。
     */
    targetInst =
      (parentNode: any)[internalContainerInstanceKey] ||
      (parentNode: any)[internalInstanceKey];
    // 如果有
    if (targetInst) {
      /**
       * 由于这不是事件的直接目标，我们可能已经越过了脱水的 DOM 节点到达这里。然而，
       * 它们也可能是非 React 节点。我们需要确定是哪一种。
       * 如果实例没有任何子节点，那么其中不可能有嵌套的 Suspense 边界。因此，我们可以快速退出。
       * 大多数情况下，当人们向树中添加非 React 子节点时，是通过引用一个没有子节点的 DOM 
       * 节点来实现的。通常，我们只需要检查其中一个 Fiber，因为如果它曾经有过子节点并删除了它们，
       * 或者反之亦然，它会删除已经嵌套在其中的脱水边界。然而，由于 HostRoot 
       * 从一开始就有一个备用节点，因此可能在备用节点上有一个，所以我们需要检查以防这是一个根节点。
       */
      const alternate = targetInst.alternate;
      // 查看备用Fiber中书否有子节点，如果有，那么子节点中可能存在嵌套的Suspense
      if (
        targetInst.child !== null ||
        (alternate !== null && alternate.child !== null)
      ) {
        // Next we need to figure out if the node that skipped past is
        // nested within a dehydrated boundary and if so, which one.
        let suspenseInstance = getParentSuspenseInstance(targetNode);
        while (suspenseInstance !== null) {
          // We found a suspense instance. That means that we haven't
          // hydrated it yet. Even though we leave the comments in the
          // DOM after hydrating, and there are boundaries in the DOM
          // that could already be hydrated, we wouldn't have found them
          // through this pass since if the target is hydrated it would
          // have had an internalInstanceKey on it.
          // Let's get the fiber associated with the SuspenseComponent
          // as the deepest instance.
          // $FlowFixMe[prop-missing]
          const targetSuspenseInst = suspenseInstance[internalInstanceKey];
          if (targetSuspenseInst) {
            return targetSuspenseInst;
          }
          // If we don't find a Fiber on the comment, it might be because
          // we haven't gotten to hydrate it yet. There might still be a
          // parent boundary that hasn't above this one so we need to find
          // the outer most that is known.
          suspenseInstance = getParentSuspenseInstance(suspenseInstance);
          // If we don't find one, then that should mean that the parent
          // host component also hasn't hydrated yet. We can return it
          // below since it will bail out on the isMounted check later.
        }
      }
      return targetInst;
    }
    targetNode = parentNode;
    parentNode = targetNode.parentNode;
  }
  return null;
}

/**
 * Given a DOM node, return the ReactDOMComponent or ReactDOMTextComponent
 * instance, or null if the node was not rendered by this React.
 * 
 * 用于从DOM节点获取react fiber实例的函数。在react的内部实现中，
 * fiber是用于表示组件树的基本单元。这个函数的作用是帮助在事件处理或
 * 其他操作中，从一个DOM节点找到与之关联的fiber实例。
 */
export function getInstanceFromNode(node: Node): Fiber | null {
  /**
   * internalInstanceKey 和 internalContainerInstanceKey 是用于存储 Fiber 实例的内部键。
   * 通过访问这些键，可以获取到与 DOM 节点关联的 Fiber 实例。
   */
  const inst =
    (node: any)[internalInstanceKey] ||
    (node: any)[internalContainerInstanceKey];
  /**
   * 如果找到了实例 inst，则继续进行下一步的检查。
   */
  if (inst) {
    // 获取实例的 tag 属性，tag 用于标识 Fiber 的类型。
    const tag = inst.tag;
    /**
     * 检查fiber实例的tag是不是HostComponent（DOM元素）、
     */
    if (
      tag === HostComponent ||
      tag === HostText ||
      tag === SuspenseComponent ||
      (enableFloat ? tag === HostHoistable : false) ||
      tag === HostSingleton ||
      tag === HostRoot
    ) {
      return inst;
    } else {
      return null;
    }
  }
  return null;
}

/**
 * Given a ReactDOMComponent or ReactDOMTextComponent, return the corresponding
 * DOM node.
 */
export function getNodeFromInstance(inst: Fiber): Instance | TextInstance {
  const tag = inst.tag;
  if (
    tag === HostComponent ||
    (enableFloat ? tag === HostHoistable : false) ||
    tag === HostSingleton ||
    tag === HostText
  ) {
    // In Fiber this, is just the state node right now. We assume it will be
    // a host component or host text.
    return inst.stateNode;
  }

  // Without this first invariant, passing a non-DOM-component triggers the next
  // invariant for a missing parent, which is super confusing.
  throw new Error('getNodeFromInstance: Invalid argument.');
}

export function getFiberCurrentPropsFromNode(
  node: Instance | TextInstance | SuspenseInstance,
): Props {
  return (node: any)[internalPropsKey] || null;
}

export function updateFiberProps(
  node: Instance | TextInstance | SuspenseInstance,
  props: Props,
): void {
  (node: any)[internalPropsKey] = props;
}

export function getEventListenerSet(node: EventTarget): Set<string> {
  let elementListenerSet = (node: any)[internalEventHandlersKey];
  if (elementListenerSet === undefined) {
    elementListenerSet = (node: any)[internalEventHandlersKey] = new Set();
  }
  return elementListenerSet;
}

export function getFiberFromScopeInstance(
  scope: ReactScopeInstance,
): null | Fiber {
  if (enableScopeAPI) {
    return (scope: any)[internalInstanceKey] || null;
  }
  return null;
}

export function setEventHandlerListeners(
  scope: EventTarget | ReactScopeInstance,
  listeners: Set<ReactDOMEventHandleListener>,
): void {
  (scope: any)[internalEventHandlerListenersKey] = listeners;
}

export function getEventHandlerListeners(
  scope: EventTarget | ReactScopeInstance,
): null | Set<ReactDOMEventHandleListener> {
  return (scope: any)[internalEventHandlerListenersKey] || null;
}

export function addEventHandleToTarget(
  target: EventTarget | ReactScopeInstance,
  eventHandle: ReactDOMEventHandle,
): void {
  let eventHandles = (target: any)[internalEventHandlesSetKey];
  if (eventHandles === undefined) {
    eventHandles = (target: any)[internalEventHandlesSetKey] = new Set();
  }
  eventHandles.add(eventHandle);
}

export function doesTargetHaveEventHandle(
  target: EventTarget | ReactScopeInstance,
  eventHandle: ReactDOMEventHandle,
): boolean {
  const eventHandles = (target: any)[internalEventHandlesSetKey];
  if (eventHandles === undefined) {
    return false;
  }
  return eventHandles.has(eventHandle);
}

export function getResourcesFromRoot(root: HoistableRoot): RootResources {
  let resources = (root: any)[internalRootNodeResourcesKey];
  if (!resources) {
    resources = (root: any)[internalRootNodeResourcesKey] = {
      hoistableStyles: new Map(),
      hoistableScripts: new Map(),
    };
  }
  return resources;
}

export function isMarkedHoistable(node: Node): boolean {
  return !!(node: any)[internalHoistableMarker];
}

export function markNodeAsHoistable(node: Node) {
  (node: any)[internalHoistableMarker] = true;
}

export function isOwnedInstance(node: Node): boolean {
  return !!(
    (node: any)[internalHoistableMarker] || (node: any)[internalInstanceKey]
  );
}
