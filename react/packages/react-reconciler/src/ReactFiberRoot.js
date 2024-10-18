/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactNodeList, ReactFormState} from 'shared/ReactTypes';
import type {
  FiberRoot,
  SuspenseHydrationCallbacks,
  TransitionTracingCallbacks,
} from './ReactInternalTypes';
import type {RootTag} from './ReactRootTags';
import type {Cache} from './ReactFiberCacheComponent';
import type {Container} from './ReactFiberConfig';

import {noTimeout} from './ReactFiberConfig';
import {createHostRootFiber} from './ReactFiber';
import {
  NoLane,
  NoLanes,
  NoTimestamp,
  TotalLanes,
  createLaneMap,
} from './ReactFiberLane';
import {
  enableSuspenseCallback,
  enableCache, // 默认为true
  enableProfilerCommitHooks,
  enableProfilerTimer,
  enableUpdaterTracking,
  enableTransitionTracing,
} from 'shared/ReactFeatureFlags';
import {initializeUpdateQueue} from './ReactFiberClassUpdateQueue';
import {LegacyRoot, ConcurrentRoot} from './ReactRootTags';
import {createCache, retainCache} from './ReactFiberCacheComponent';

export type RootState = {
  element: any,
  isDehydrated: boolean,
  cache: Cache,
};

/**
 * 1、管理应用的根状态：FiberRootNode是整个React应用的根节点，负责管理应用的全局
 * 状态和更新。
 * 2、它负责调度和管理整个应用的更新任务，包括优先级和过期时间。
 * 3、支持并发特性，在React18中，FiberRootNode支持并发特性，允许React在后台进行
 * 渲染操作，提高应用的性能和响应性
 */
function FiberRootNode(
  this: $FlowFixMe,
  containerInfo: any,
  // $FlowFixMe[missing-local-annot]
  tag,
  hydrate: any,
  identifierPrefix: any,
  onRecoverableError: any,
  formState: ReactFormState<any, any> | null,
) {
  /**
   * tag属性用于标识根节点的类型，以确定React应用的渲染模式，主要有以下类型：
   * 
   * LegacyRoot：代表传统的同步渲染模式。在这种模式下，React 会立即处理所有更新任务。
   * 这意味着一旦有更新任务被触发，React 会阻塞其他操作，直到更新完成。
   * 这种模式适用于简单的应用，但在复杂应用中可能导致性能问题。这是
   * React16之前的默认渲染模式。
   * ConcurrentRoot：代表并发渲染模式。在这种模式下，React 可以在后台处理更新任务。
   * 这意味着 React 可以暂停低优先级的更新任务，以便更快地响应用户交互。
   * 并发模式通过时间切片和优先级调度来优化渲染过程，减少卡顿和延迟。
   * 并发模式时React18引入的特性，旨在提高应用的性能和用户体验。
   */
  this.tag = tag;
  /**
   * 存储React应用挂载的DOM容器元素。用于在渲染过程中访问和操作DOM
   */
  this.containerInfo = containerInfo;
  /**
   * 存储待处理的子节点。用于在更新过程中暂存新的子节点结构
   */
  this.pendingChildren = null;
  /**
   * 直线当前正在渲染的fiber树。用于个跟踪和管理当前的组件树状态
   */
  this.current = null;
  /**
   * 存储挂起的请求缓存。用于管理和恢复挂起的异步请求
   */
  this.pingCache = null;
  /**
   * 存储已完成的fiber树。用于在提交阶段应用更新
   */
  this.finishedWork = null;
  /**
   * 存储超时处理的句柄。用于管理和清理超时任务
   */
  this.timeoutHandle = noTimeout;
  /**
   * 存储挂起提交的函数。用于在需要时取消挂起的提交操作
   * 取消待处理的提交
   */
  this.cancelPendingCommit = null;
  /**
   * 存储当前的上下文对象。用于在组件树中共享数据
   */
  this.context = null;
  /**
   * 存储待处理的上下文对象。用于在更新过程中暂存新的上下文
   */
  this.pendingContext = null;
  /**
   * 指向下一个根节点。用于在多根节点的情况下进行便利
   */
  this.next = null;
  /**
   * 存储当前调度的回调节点。用于管理和调度更新任务
   */
  this.callbackNode = null;
  /**
   * 存储当前回调的优先级。用于确定更新任务的调度顺序
   */
  this.callbackPriority = NoLane;
  /**
   * 存储每个车道的过期事件。用于管理和调度更新任务的优先级
   */
  this.expirationTimes = createLaneMap(NoTimestamp);
  /**
   * 存储待处理车道，用于跟踪和管理待处理的更新任务
   */
  this.pendingLanes = NoLanes;
  /**
   * 存储挂起的车道。用于管理和恢复挂起的更新任务。
   */
  this.suspendedLanes = NoLanes;
  /**
   * 存储已触发的车道。用于管理和调度已触发的更新任务
   */
  this.pingedLanes = NoLanes;
  /**
   * 存储已过期的车道。用于优先处理已过期更新任务
   */
  this.expiredLanes = NoLanes;
  /**
   * 存储已完成的车道，用于在提交阶段应用更新
   */
  this.finishedLanes = NoLanes;
  // 存储禁用错误恢复的车道。用于管理和调度不需要错误恢复的更新任务。
  this.errorRecoveryDisabledLanes = NoLanes;
  // 存储外壳挂起计数器。用于跟踪和管理外壳组件的挂起状态。
  this.shellSuspendCounter = 0;
  // 存储车道之间的纠缠关系。用于管理和调度相互依赖的更新任务。
  this.entangledLanes = NoLanes;
  // 用于管理和调度相互依赖的更新任务。
  this.entanglements = createLaneMap(NoLanes);
  // 用于管理和调度不需要立即处理的更新任务。
  this.hiddenUpdates = createLaneMap(null);
  /**
   * 存储标识符前缀，用于生成唯一标识符
   */
  this.identifierPrefix = identifierPrefix;
  /**
   * 存储可恢复错误的处理函数，用于在发生恢复错误时执行特定逻辑
   */
  this.onRecoverableError = onRecoverableError;
  // 启动缓存
  if (enableCache) {
    // 用于管理和重用缓存数据
    this.pooledCache = null;
    // 用于管理和调度缓存数据的更新任务。
    this.pooledCacheLanes = NoLanes;
  }

  if (enableSuspenseCallback) {
    // 存储水合回调函数。用于在水合过程中执行特定逻辑。
    this.hydrationCallbacks = null;
  }
  // 用于管理和跟踪表单的状态。
  this.formState = formState;

  this.incompleteTransitions = new Map();
  if (enableTransitionTracing) {
    this.transitionCallbacks = null;
    const transitionLanesMap = (this.transitionLanes = []);
    for (let i = 0; i < TotalLanes; i++) {
      transitionLanesMap.push(null);
    }
  }

  if (enableProfilerTimer && enableProfilerCommitHooks) {
    this.effectDuration = 0;
    this.passiveEffectDuration = 0;
  }

  if (enableUpdaterTracking) {
    this.memoizedUpdaters = new Set();
    const pendingUpdatersLaneMap = (this.pendingUpdatersLaneMap = []);
    for (let i = 0; i < TotalLanes; i++) {
      pendingUpdatersLaneMap.push(new Set());
    }
  }
  // 开发环境下
  if (__DEV__) {
    switch (tag) {
      case ConcurrentRoot: //  并发渲染模式
        this._debugRootType = hydrate ? 'hydrateRoot()' : 'createRoot()';
        break;
      case LegacyRoot: // 同步渲染模式
        this._debugRootType = hydrate ? 'hydrate()' : 'render()';
        break;
    }
  }
}

/**
 * createFiberRoot是React内部用于创建Fiber树根节点的函数。Fiber树是React的核心
 * 数据结构之一，用于管理组件的状态和更新。
 * 
 * createFiberRoot函数负责初始化和
 * 配置根节点，以便React可以正确地调度和渲染组件树。
 * 
 * createFiberRoot 创建并初始化一个新的 FiberRootNode，这是整个应用的根节点。它包含了应用的状态和更新信息。
 * 
 * 通过传递 tag 参数，createFiberRoot 可以配置根节点的渲染模式（如 LegacyRoot 或 ConcurrentRoot），以确定如何处理和调度更新。
 * 
 * 函数会根据传入的参数设置根节点的初始状态，包括初始的子节点、上下文、缓存等。
 * 
 * 在 React 18 中，createFiberRoot 支持并发渲染特性，通过配置 ConcurrentRoot，可以启用并发更新和调度。
 * 
 * @param {*} containerInfo 存储 React 应用挂载的 DOM 容器信息。
 * @param {*} tag 标识根节点的类型（如 LegacyRoot 或 ConcurrentRoot）。
 * @param {*} hydrate 指示是否进行服务器端渲染的水合过程。
 * @param {*} initialChildren 初始渲染的子节点。
 * @param {*} hydrationCallbacks  水合过程中的回调函数。
 * @param {*} isStrictMode 是否启用严格模式。
 * @param {*} concurrentUpdatesByDefaultOverride 是否默认启用并发更新。
 * @param {*} identifierPrefix 用于生成唯一标识符的前缀。
 * @param {*} onRecoverableError 可恢复错误的处理函数。
 * @param {*} transitionCallbacks 过渡过程中的回调函数。
 * @param {*} formState 表单状态。
 * @returns 
 */
export function createFiberRoot(
  containerInfo: Container,
  tag: RootTag,
  hydrate: boolean,
  initialChildren: ReactNodeList,
  hydrationCallbacks: null | SuspenseHydrationCallbacks,
  isStrictMode: boolean,
  concurrentUpdatesByDefaultOverride: null | boolean,
  // TODO: We have several of these arguments that are conceptually part of the
  // host config, but because they are passed in at runtime, we have to thread
  // them through the root constructor. Perhaps we should put them all into a
  // single type, like a DynamicHostConfig that is defined by the renderer.
  identifierPrefix: string,
  onRecoverableError: null | ((error: mixed) => void),
  transitionCallbacks: null | TransitionTracingCallbacks,
  formState: ReactFormState<any, any> | null,
): FiberRoot {
  // $FlowFixMe[invalid-constructor] Flow no longer supports calling new on functions
  /**
   * 创建一个新的FiberRoot根节点实例，并初始化基本属性
   */
  const root: FiberRoot = (new FiberRootNode(
    containerInfo,
    tag,
    hydrate,
    identifierPrefix,
    onRecoverableError,
    formState,
  ): any);
  /**
   * 如果启用了 enableSuspenseCallback，则设置水合回调。
   */
  if (enableSuspenseCallback) {
    root.hydrationCallbacks = hydrationCallbacks;
  }
  /**
   * 如果启用了 enableTransitionTracing，则设置过渡回调。
   */
  if (enableTransitionTracing) {
    root.transitionCallbacks = transitionCallbacks;
  }

  // Cyclic construction. This cheats the type system right now because
  // stateNode is any.
  /**
   * 
   * 使用 createHostRootFiber 创建一个未初始化的 Fiber 节点，并将其与根节点关联。
   * 
   * uninitializedFiber 是渲染和提交阶段的起点。
   * 在渲染阶段，React 从 root.current 开始遍历和更新组件树。
   * 在提交阶段，React 从 root.current 开始应用更新。
   * 
   * uninitializedFiber 是整个 Fiber 树的起点。它代表了应用的根组件，并将作为所有子组件的父节点。
   * 它负责管理整个应用的状态和更新，它包含了与根组件相关的所有信息，包括状态，props，更新队列等。
   * 
   */
  const uninitializedFiber = createHostRootFiber(
    tag,
    isStrictMode,
    concurrentUpdatesByDefaultOverride,
  );
  /**
   * 通过将 uninitializedFiber 赋给 root.current，
   * React 确保了有一个明确的起点来管理和调度整个组件树的更新。
   * 
   * 通过 root.current，React 可以访问和操作整个组件树的状态和更新信息。
   */
  root.current = uninitializedFiber;

  uninitializedFiber.stateNode = root;
  // 默认启用缓存
  if (enableCache) {
    const initialCache = createCache();
    retainCache(initialCache);

    // The pooledCache is a fresh cache instance that is used temporarily
    // for newly mounted boundaries during a render. In general, the
    // pooledCache is always cleared from the root at the end of a render:
    // it is either released when render commits, or moved to an Offscreen
    // component if rendering suspends. Because the lifetime of the pooled
    // cache is distinct from the main memoizedState.cache, it must be
    // retained separately.
    root.pooledCache = initialCache;
    retainCache(initialCache);
    const initialState: RootState = {
      element: initialChildren,
      isDehydrated: hydrate,
      cache: initialCache,
    };
    uninitializedFiber.memoizedState = initialState;
  } else {
    const initialState: RootState = {
      element: initialChildren,
      isDehydrated: hydrate,
      cache: (null: any), // not enabled yet
    };
    uninitializedFiber.memoizedState = initialState;
  }
  // 初始化更新队列
  initializeUpdateQueue(uninitializedFiber);

  return root;
}
