/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {EventPriority} from 'react-reconciler/src/ReactEventPriorities';
import type {AnyNativeEvent} from '../events/PluginModuleType';
import type {Fiber, FiberRoot} from 'react-reconciler/src/ReactInternalTypes';
import type {Container, SuspenseInstance} from '../client/ReactFiberConfigDOM';
import type {DOMEventName} from '../events/DOMEventNames';

import {
  isDiscreteEventThatRequiresHydration,
  clearIfContinuousEvent,
  queueIfContinuousEvent,
} from './ReactDOMEventReplaying';
import {attemptSynchronousHydration} from 'react-reconciler/src/ReactFiberReconciler';
import {
  getNearestMountedFiber,
  getContainerFromFiber,
  getSuspenseInstanceFromFiber,
} from 'react-reconciler/src/ReactFiberTreeReflection';
import {HostRoot, SuspenseComponent} from 'react-reconciler/src/ReactWorkTags';
import {type EventSystemFlags, IS_CAPTURE_PHASE} from './EventSystemFlags';

import getEventTarget from './getEventTarget';
import {
  getInstanceFromNode,
  getClosestInstanceFromNode,
} from '../client/ReactDOMComponentTree';

import {dispatchEventForPluginEventSystem} from './DOMPluginEventSystem';

import {
  getCurrentPriorityLevel as getCurrentSchedulerPriorityLevel,
  IdlePriority as IdleSchedulerPriority,
  ImmediatePriority as ImmediateSchedulerPriority,
  LowPriority as LowSchedulerPriority,
  NormalPriority as NormalSchedulerPriority,
  UserBlockingPriority as UserBlockingSchedulerPriority,
} from 'react-reconciler/src/Scheduler';
import {
  DiscreteEventPriority,
  ContinuousEventPriority,
  DefaultEventPriority,
  IdleEventPriority,
  getCurrentUpdatePriority,
  setCurrentUpdatePriority,
} from 'react-reconciler/src/ReactEventPriorities';
import ReactSharedInternals from 'shared/ReactSharedInternals';
import {isRootDehydrated} from 'react-reconciler/src/ReactFiberShellHydration';

const {ReactCurrentBatchConfig} = ReactSharedInternals;

// TODO: can we stop exporting these?
/**
 * 用于控制事件系统是否启用。初始值为true，可以通过setEnabled函数进行修改
 */
let _enabled: boolean = true;

// This is exported in FB builds for use by legacy FB layer infra.
// We'd like to remove this but it's not clear if this is safe.
/**
 * 用于启用或禁用事件系统。通过设置_enabled变量来控制事件系统的状态。
 */
export function setEnabled(enabled: ?boolean): void {
  _enabled = !!enabled;
}
// 返回事件系统当前的启用状态。
export function isEnabled(): boolean {
  return _enabled;
}
/**
 * 创建一个事件监听器包装函数，该函数绑定了事件名称、
 * 系统标志和目标容器。返回的函数用于调度事件。
 */
export function createEventListenerWrapper(
  targetContainer: EventTarget,
  domEventName: DOMEventName,
  eventSystemFlags: EventSystemFlags,
): Function {
  return dispatchEvent.bind(
    null,
    domEventName,
    eventSystemFlags,
    targetContainer,
  );
}
/**
 * 创建事件监听器包装函数的工具函数。
 * 它根据事件的优先级来选择合适的事件调度函数，
 * 以确保事件在适当的优先级下被处理。
 */
export function createEventListenerWrapperWithPriority(
  targetContainer: EventTarget,
  domEventName: DOMEventName,
  eventSystemFlags: EventSystemFlags,
): Function {
  /**
   * 调用 getEventPriority 函数，根据 domEventName 确定事件的优先级。
   * 不同的事件类型有不同的优先级，
   * 例如，点击事件通常是离散事件，滚动事件是连续事件。
   */
  const eventPriority = getEventPriority(domEventName);
  let listenerWrapper;
  switch (eventPriority) {

    case DiscreteEventPriority:
       // 使用 dispatchDiscreteEvent，用于处理离散事件，这些事件需要快速响应。
      listenerWrapper = dispatchDiscreteEvent;
      break; 
    case ContinuousEventPriority:
       // dispatchContinuousEvent，用于处理连续事件，这些事件需要持续处理。
      listenerWrapper = dispatchContinuousEvent;
      break;
    case DefaultEventPriority:
    default:
      // 使用 dispatchEvent，用于处理默认优先级的事件。
      listenerWrapper = dispatchEvent;
      break;
  }
  return listenerWrapper.bind(
    null,
    domEventName,
    eventSystemFlags,
    targetContainer,
  );
}

function dispatchDiscreteEvent(
  domEventName: DOMEventName,
  eventSystemFlags: EventSystemFlags,
  container: EventTarget,
  nativeEvent: AnyNativeEvent,
) {
  const previousPriority = getCurrentUpdatePriority();
  const prevTransition = ReactCurrentBatchConfig.transition;
  ReactCurrentBatchConfig.transition = null;
  try {
    setCurrentUpdatePriority(DiscreteEventPriority);
    dispatchEvent(domEventName, eventSystemFlags, container, nativeEvent);
  } finally {
    setCurrentUpdatePriority(previousPriority);
    ReactCurrentBatchConfig.transition = prevTransition;
  }
}

function dispatchContinuousEvent(
  domEventName: DOMEventName,
  eventSystemFlags: EventSystemFlags,
  container: EventTarget,
  nativeEvent: AnyNativeEvent,
) {
  const previousPriority = getCurrentUpdatePriority();
  const prevTransition = ReactCurrentBatchConfig.transition;
  ReactCurrentBatchConfig.transition = null;
  try {
    setCurrentUpdatePriority(ContinuousEventPriority);
    dispatchEvent(domEventName, eventSystemFlags, container, nativeEvent);
  } finally {
    setCurrentUpdatePriority(previousPriority);
    ReactCurrentBatchConfig.transition = prevTransition;
  }
}

export function dispatchEvent(
  /**
   *  DOM 事件的名称（例如 "click", "keydown"）。

   */
  domEventName: DOMEventName, 
  /**
   * 提供关于事件系统状态的附加信息的标志（例如，捕获阶段）。
   */
  eventSystemFlags: EventSystemFlags,
  /**
   * 事件被分发的目标容器。

   */
  targetContainer: EventTarget,
  /**
   * 来自浏览器的原生事件对象。
   */
  nativeEvent: AnyNativeEvent,
): void {
  /**
   * 函数首先检查事件系统是否通过 _enabled 标志启用。
   * 如果事件系统被禁用，函数会立即返回，阻止任何进一步的事件处理。
   */
  if (!_enabled) {
    return;
  }
  /**
   * 函数尝试使用 findInstanceBlockingEvent 查找可能阻塞事件的实例。
   * 这对于处理某些组件（如 Suspense）可能需要延迟事件处理的情况非常重要。
   */
  let blockedOn = findInstanceBlockingEvent(nativeEvent);
  /**
   * 如果没有找到阻塞实例（blockedOn 为 null）
   */
  if (blockedOn === null) {
    /**
     * dispatchEventForPluginEventSystem 负责将事件传递给插件事件系统进行处理。
     */
    dispatchEventForPluginEventSystem(
      domEventName,
      eventSystemFlags,
      nativeEvent,
      return_targetInst,
      targetContainer,
    );
    /**
     * 调用 clearIfContinuousEvent 清除连续事件的状态（如果适用），
     * 然后返回，表示事件处理完成。
     */
    clearIfContinuousEvent(domEventName, nativeEvent);
    return;
  }
  /**
   * 如果事件是连续事件（如滚动或拖动），并且有阻塞实例，
   * 调用 queueIfContinuousEvent 将事件排队。
   */
  if (
    queueIfContinuousEvent(
      blockedOn,
      domEventName,
      eventSystemFlags,
      targetContainer,
      nativeEvent,
    )
  ) {
    // 如果事件被成功排队，调用 nativeEvent.stopPropagation() 阻止事件冒泡，并返回。
    nativeEvent.stopPropagation();
    return;
  }
  // We need to clear only if we didn't queue because
  // queueing is accumulative.
  /**
   * clearIfContinuousEvent 清除连续事件的状态。
   */
  clearIfContinuousEvent(domEventName, nativeEvent);
  /**
   * eventSystemFlags & IS_CAPTURE_PHASE这个表达式用于检查事件系统标志中是否包含捕获阶段的标志。
   * 通过使用按位与操作符 &，可以检查 eventSystemFlags 是否包含 IS_CAPTURE_PHASE 标志。这是为了确定当前事件是否处于捕获阶段。
   * 
   * isDiscreteEventThatRequiresHydration(domEventName)判断事件是否是需要同步处理的离散事件。
   */
  if (
    eventSystemFlags & IS_CAPTURE_PHASE &&
    isDiscreteEventThatRequiresHydration(domEventName)
  ) {
    while (blockedOn !== null) {
      const fiber = getInstanceFromNode(blockedOn);
      if (fiber !== null) {
        attemptSynchronousHydration(fiber);
      }
      const nextBlockedOn = findInstanceBlockingEvent(nativeEvent);
      if (nextBlockedOn === null) {
        dispatchEventForPluginEventSystem(
          domEventName,
          eventSystemFlags,
          nativeEvent,
          return_targetInst,
          targetContainer,
        );
      }
      if (nextBlockedOn === blockedOn) {
        break;
      }
      blockedOn = nextBlockedOn;
    }
    if (blockedOn !== null) {
      nativeEvent.stopPropagation();
    }
    return;
  }

  // This is not replayable so we'll invoke it but without a target,
  // in case the event system needs to trace it.
  dispatchEventForPluginEventSystem(
    domEventName,
    eventSystemFlags,
    nativeEvent,
    null,
    targetContainer,
  );
}

export function findInstanceBlockingEvent(
  nativeEvent: AnyNativeEvent,
): null | Container | SuspenseInstance {
  const nativeEventTarget = getEventTarget(nativeEvent);
  return findInstanceBlockingTarget(nativeEventTarget);
}

export let return_targetInst: null | Fiber = null;

// Returns a SuspenseInstance or Container if it's blocked.
// The return_targetInst field above is conceptually part of the return value.
export function findInstanceBlockingTarget(
  targetNode: Node,
): null | Container | SuspenseInstance {
  // TODO: Warn if _enabled is false.

  return_targetInst = null;

  let targetInst = getClosestInstanceFromNode(targetNode);

  if (targetInst !== null) {
    const nearestMounted = getNearestMountedFiber(targetInst);
    if (nearestMounted === null) {
      // This tree has been unmounted already. Dispatch without a target.
      targetInst = null;
    } else {
      const tag = nearestMounted.tag;
      if (tag === SuspenseComponent) {
        const instance = getSuspenseInstanceFromFiber(nearestMounted);
        if (instance !== null) {
          // Queue the event to be replayed later. Abort dispatching since we
          // don't want this event dispatched twice through the event system.
          // TODO: If this is the first discrete event in the queue. Schedule an increased
          // priority for this boundary.
          return instance;
        }
        // This shouldn't happen, something went wrong but to avoid blocking
        // the whole system, dispatch the event without a target.
        // TODO: Warn.
        targetInst = null;
      } else if (tag === HostRoot) {
        const root: FiberRoot = nearestMounted.stateNode;
        if (isRootDehydrated(root)) {
          // If this happens during a replay something went wrong and it might block
          // the whole system.
          return getContainerFromFiber(nearestMounted);
        }
        targetInst = null;
      } else if (nearestMounted !== targetInst) {
        // If we get an event (ex: img onload) before committing that
        // component's mount, ignore it for now (that is, treat it as if it was an
        // event on a non-React tree). We might also consider queueing events and
        // dispatching them after the mount.
        targetInst = null;
      }
    }
  }
  return_targetInst = targetInst;
  // We're not blocked on anything.
  return null;
}

export function getEventPriority(domEventName: DOMEventName): EventPriority {
  switch (domEventName) {
    // Used by SimpleEventPlugin:
    case 'cancel':
    case 'click':
    case 'close':
    case 'contextmenu':
    case 'copy':
    case 'cut':
    case 'auxclick':
    case 'dblclick':
    case 'dragend':
    case 'dragstart':
    case 'drop':
    case 'focusin':
    case 'focusout':
    case 'input':
    case 'invalid':
    case 'keydown':
    case 'keypress':
    case 'keyup':
    case 'mousedown':
    case 'mouseup':
    case 'paste':
    case 'pause':
    case 'play':
    case 'pointercancel':
    case 'pointerdown':
    case 'pointerup':
    case 'ratechange':
    case 'reset':
    case 'resize':
    case 'seeked':
    case 'submit':
    case 'touchcancel':
    case 'touchend':
    case 'touchstart':
    case 'volumechange':
    // Used by polyfills: (fall through)
    case 'change':
    case 'selectionchange':
    case 'textInput':
    case 'compositionstart':
    case 'compositionend':
    case 'compositionupdate':
    // Only enableCreateEventHandleAPI: (fall through)
    case 'beforeblur':
    case 'afterblur':
    // Not used by React but could be by user code: (fall through)
    case 'beforeinput':
    case 'blur':
    case 'fullscreenchange':
    case 'focus':
    case 'hashchange':
    case 'popstate':
    case 'select':
    case 'selectstart':
      return DiscreteEventPriority;
    case 'drag':
    case 'dragenter':
    case 'dragexit':
    case 'dragleave':
    case 'dragover':
    case 'mousemove':
    case 'mouseout':
    case 'mouseover':
    case 'pointermove':
    case 'pointerout':
    case 'pointerover':
    case 'scroll':
    case 'toggle':
    case 'touchmove':
    case 'wheel':
    // Not used by React but could be by user code: (fall through)
    case 'mouseenter':
    case 'mouseleave':
    case 'pointerenter':
    case 'pointerleave':
      return ContinuousEventPriority;
    case 'message': {
      // We might be in the Scheduler callback.
      // Eventually this mechanism will be replaced by a check
      // of the current priority on the native scheduler.
      const schedulerPriority = getCurrentSchedulerPriorityLevel();
      switch (schedulerPriority) {
        case ImmediateSchedulerPriority:
          return DiscreteEventPriority;
        case UserBlockingSchedulerPriority:
          return ContinuousEventPriority;
        case NormalSchedulerPriority:
        case LowSchedulerPriority:
          // TODO: Handle LowSchedulerPriority, somehow. Maybe the same lane as hydration.
          return DefaultEventPriority;
        case IdleSchedulerPriority:
          return IdleEventPriority;
        default:
          return DefaultEventPriority;
      }
    }
    default:
      return DefaultEventPriority;
  }
}
