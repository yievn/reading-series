/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Lane, Lanes} from './ReactFiberLane';

import {
  NoLane,
  SyncLane,
  InputContinuousLane,
  DefaultLane,
  IdleLane,
  getHighestPriorityLane,
  includesNonIdleWork,
} from './ReactFiberLane';

export opaque type EventPriority = Lane;
/**
 * 定义了离散事件的优先级，通常用于处理用户交互事件，如点击和按键。
 * 这些事件需要快速响应，因此优先级较高。
 */
export const DiscreteEventPriority: EventPriority = SyncLane;
/**
 * 定义了连续事件的优先级，适用于需要持续处理的事件，
 * 如滚动和拖动。这些事件的优先级低于离散事件，但仍需要及时处理。
 */
export const ContinuousEventPriority: EventPriority = InputContinuousLane;
/**
 * 定义了默认事件的优先级，适用于一般的更新任务。这些任务不需要立即响应，但也不应被无限期推迟。
 */
export const DefaultEventPriority: EventPriority = DefaultLane;
/**
 * 定义了空闲事件的优先级，适用于可以在系统空闲时处理的任务。这些任务的优先级最低。
 */
export const IdleEventPriority: EventPriority = IdleLane;
/**
 * 用于跟踪当前正在处理的更新的优先级。初始值为 NoLane，表示没有正在进行的更新。
 */
let currentUpdatePriority: EventPriority = NoLane;
/**
 * 返回当前的更新优先级。用于在事件处理过程中获取当前的优先级上下文。
 */
export function getCurrentUpdatePriority(): EventPriority {
  return currentUpdatePriority;
}
/**
 * 设置当前的更新优先级。用于在事件处理过程中更新优先级上下文。
 */
export function setCurrentUpdatePriority(newPriority: EventPriority) {
  currentUpdatePriority = newPriority;
}
/**
 * 在指定的优先级下运行一个函数 fn。在执行 fn 期间，
 * currentUpdatePriority 被设置为 priority，执行完后恢复之前的优先级。
 * 这对于确保在特定优先级下执行某些操作非常有用。
 */
export function runWithPriority<T>(priority: EventPriority, fn: () => T): T {
  const previousPriority = currentUpdatePriority;
  try {
    currentUpdatePriority = priority;
    return fn();
  } finally {
    currentUpdatePriority = previousPriority;
  }
}
/**
 * 比较两个事件优先级 a 和 b，返回较高的优先级。
 * 用于确定两个事件中哪个应该优先处理。
 */
export function higherEventPriority(
  a: EventPriority,
  b: EventPriority,
): EventPriority {
  return a !== 0 && a < b ? a : b;
}
/**
 * 比较两个事件优先级 a 和 b，返回较低的优先级。
 * 用于确定两个事件中哪个可以延后处理。
 */
export function lowerEventPriority(
  a: EventPriority,
  b: EventPriority,
): EventPriority {
  return a === 0 || a > b ? a : b;
}
/**
 * 检查 a 是否具有比 b 更高的优先级。返回布尔值，用于优先级判断。
 */
export function isHigherEventPriority(
  a: EventPriority,
  b: EventPriority,
): boolean {
  return a !== 0 && a < b;
}
/**
 * 根据 lanes 的优先级，确定事件的优先级。通过调用 getHighestPriorityLane 
 * 和 isHigherEventPriority，将调度的 lanes 转换为事件优先级。
 * 这是调度系统的一部分，用于将调度的 lanes 转换为事件优先级。
 * 
 * lanesToEventPriority 函数通过检查 lanes 中的最高优先级 lane，确定事件的优先级。它依次检查离散、连续、默认和空闲优先级，确保事件在适当的优先级下被处理。
 */
export function lanesToEventPriority(lanes: Lanes): EventPriority {
  // 获取最高lane中最高的优先级，也就是通过计算获取数值标志位中最低的一位，数值最小，优先级越高
  const lane = getHighestPriorityLane(lanes);
  // 检查 lane 是否具有比 DiscreteEventPriority 更高的优先级，不是的话，返回DiscreteEventPriority。
  if (!isHigherEventPriority(DiscreteEventPriority, lane)) {
    return DiscreteEventPriority;
  }
  // 检查 lane 是否具有比 ContinuousEventPriority 更高的优先级。不是的话，返回ContinuousEventPriority。
  if (!isHigherEventPriority(ContinuousEventPriority, lane)) {
    return ContinuousEventPriority;
  }
  // 检查 lane 是否包含非空闲工作。如果 lane 包含非空闲工作，返回 DefaultEventPriority。
  if (includesNonIdleWork(lane)) {
    return DefaultEventPriority;
  }
  // 如果以上条件都不满足，返回 IdleEventPriority。这意味着 lane 只包含空闲工作，优先级最低。
  return IdleEventPriority;
}
