/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * 
 * React内部用于标识不同类型的工作单元（或节点）的文件。每个tag类型都代表一个特定的工作单元类型
 * 这些类型用于React的调和过程，以便React能够正确地处理和更新组件树。
 */

export type WorkTag =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24
  | 25
  | 26
  | 27;
//  表示一个函数组件。
export const FunctionComponent = 0;
// 表示一个类组件。
export const ClassComponent = 1;
// 在确定是函数组件还是类组件之前的状态。
export const IndeterminateComponent = 2; // Before we know whether it is function or class
//  表示宿主树的根节点，可能嵌套在另一个节点中。
export const HostRoot = 3; // Root of a host tree. Could be nested inside another node.
// 表示一个子树，可能是不同渲染器的入口点。
export const HostPortal = 4; // A subtree. Could be an entry point to a different renderer.
// 表示一个宿主组件，如 DOM 元素。
export const HostComponent = 5;
// 表示一个文本节点。
export const HostText = 6;
// 表示一个片段节点，用于分组多个子节点。
export const Fragment = 7;
// 表示不同的模式节点，如严格模式。
export const Mode = 8;
// 表示一个上下文消费者。
export const ContextConsumer = 9;
//  表示一个上下文提供者。
export const ContextProvider = 10;
// 表示一个使用 React.forwardRef 创建的组件。
export const ForwardRef = 11;
// 表示一个分析器节点，用于性能分析。
export const Profiler = 12;
// 表示一个Suspense组件，用于异步加载。
export const SuspenseComponent = 13;
// 表示一个使用 React.memo 创建的组件。
export const MemoComponent = 14;
// 表示一个简单的记忆组件。
export const SimpleMemoComponent = 15;
// 表示一个懒加载组件。
export const LazyComponent = 16;
// 表示一个未完成的类组件。
export const IncompleteClassComponent = 17;
// 表示一个脱水的片段，用于服务器端渲染。
export const DehydratedFragment = 18;
// : 表示一个SuspenseList组件。
export const SuspenseListComponent = 19;
// 表示一个作用域组件。
export const ScopeComponent = 21;
// 表示一个离屏组件，用于延迟渲染。
export const OffscreenComponent = 22;
// 表示一个遗留的隐藏组件。
export const LegacyHiddenComponent = 23;
// 表示一个缓存组件。
export const CacheComponent = 24;
// 表示一个跟踪标记组件。
export const TracingMarkerComponent = 25;
// 表示一个可提升的宿主组件。
export const HostHoistable = 26;
// 表示一个单例宿主组件。

export const HostSingleton = 27;
