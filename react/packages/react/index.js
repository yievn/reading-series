/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/**
 * react包是React的核心库，主要负责定义和管理组件的逻辑和状态，它提供了构建用户界面
 * 的基础工具和API，作为构建React应用的核心。
 * 
 * react-dom包负责将React组件渲染到浏览器的DOM中，处理与浏览器环境的交互，是React应用的运行时支持。
 */

// Keep in sync with https://github.com/facebook/flow/blob/main/lib/react.js
/**定义无状态函数组件的类型 */
export type StatelessFunctionalComponent<P> =
  React$StatelessFunctionalComponent<P>;
  /**定义组件的类型 */
export type ComponentType<-P> = React$ComponentType<P>;
/**定义抽象组件的类型 */
export type AbstractComponent<
  -Config,
  +Instance = mixed,
> = React$AbstractComponent<Config, Instance>;
/**定义React元素的类型 */
export type ElementType = React$ElementType;
/**定义具体组件的React元素类型 */
export type Element<+C> = React$Element<C>;
/**定义React元素的key属性的类型 */
export type Key = React$Key;
/**定义引用的类型 */
export type Ref<C> = React$Ref<C>;
/**定义React节点的类型 */
export type Node = React$Node;
/**定义上下文的类型 */
export type Context<T> = React$Context<T>;
/**定义Portal的类型 */
export type Portal = React$Portal;
/**定义组件元素的属性类型 */
export type ElementProps<C> = React$ElementProps<C>;
/**定义组件元素的配置类型 */
export type ElementConfig<C> = React$ElementConfig<C>;
/**定义组件元素的引用类型 */
export type ElementRef<C> = React$ElementRef<C>;
/**定义组件配置的类型 */
export type Config<Props, DefaultProps> = React$Config<Props, DefaultProps>;
/**定义子元素数组的类型 */
export type ChildrenArray<+T> = $ReadOnlyArray<ChildrenArray<T>> | T;

// Export all exports so that they're available in tests.
// We can't use export * from in Flow for some reason.
export {
  /**
   * 内部使用对象，包含React的一些内部实现细节。不应被外部使用，主要用于React自身的实现
   * 和内部协调
   */
  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
  /**
   *在测始终使用，确保组件在测试期间的状态更新被正确处理
   */
  act as unstable_act,
  /**工具类对象，提供一些操作和便利React元素的子元素的方法，如map,forEach,count,toArray,only, */
  Children,
  /**定义类组件的基类，用于创建有状态的类组件 */
  Component,
  /**用于返回多个元素的占位符。
   * 允许组件返回多个元素，而不需要额外的DOM节点
   */
  Fragment,
  /**
   * 用于测量组件的渲染性能，帮助开发者分析和优化组件的性能。
   */
  Profiler,
  /**
   * 定义春组件的基类。
   * 用于创建有状态的类组件，自动实现shouldComponentUpdate以优化性能
   */
  PureComponent,
  /**
   * 用于检测潜在问题的工具
   * 在开发模式下启用额外的检查和警告
   */
  StrictMode,
  /**
   * 允许组件在等待异步数据时显示备用内容
   */
  Suspense,
  /**
   * 克隆并返回新的React元素
   * 用于在不改变原始元素的情况下修改其属性或子元素
   */
  cloneElement,
  /**
   * 创建一个上下文对象
   * 用于在组件树中共享数据，而无需通过每层组件手动传递props
   */
  createContext,
  /** 
   * 创建并返回新的React元素，用于在jsx之外创建元素
  */
  createElement,
  /**创建一个用于创建特定类型元素的工厂函数，用于在jsx之外创建元素 */
  createFactory,
  /** 创建一个可以附加到React元素的引用，用于访问DOM元素或组件实例*/
  createRef,
  /** 创建一个服务端上下文对象，用于服务端渲染时共享数据*/
  createServerContext,
  /** 用于在组件中使用hook*/
  use,
  /** 创建一个可以转发引用的组件，用于在组件树中传递引用*/
  forwardRef,
  /** 检查对象是否是有效的React元素*/
  isValidElement,
  /** 用于懒加载组件*/
  lazy,
  /** 用于记忆化组件，优化函数组件性能，防止不必要的重新渲染*/
  memo,
  /**用于优化性能，减少不必要的数据请求 */
  cache,
  /** 用于标记更新为过度
   * 用于优化性能，允许在后台进行更新
  */
  startTransition,
  /** 用于缓存数据，减少不必要的数据请求*/
  unstable_Cache,
  /** 在调试跟踪模式时用于分析和优化性能*/
  unstable_DebugTracingMode,
  /** 用于隐藏组件，优化性能，减少不必要的渲染*/
  unstable_LegacyHidden,
  /** 用于管理活动*/
  unstable_Activity,
  /** 用于管理方位*/
  unstable_Scope,
  /** 用于管理suspense列表*/
  unstable_SuspenseList,
  /** 用于标记跟踪*/
  unstable_TracingMarker,
  /** 用于获取缓存信号*/
  unstable_getCacheSignal,
  /** 用于获取特定类型的缓存*/
  unstable_getCacheForType,
  /** 用于刷新缓存*/
  unstable_useCacheRefresh,
  /** 用于缓存记忆化值*/
  unstable_useMemoCache,
  /** 用于生成唯一ID，在组件中生成唯一标识符*/
  useId,
  /** 用于记忆化回调函数，防止不必要的重新创建*/
  useCallback,
  /** 用于在组件中使用上下文*/
  useContext,
  /** 用于在React DevTool中显示调试值，便于调试和分析组件状态*/
  useDebugValue,
  /** 用于延迟更新值*/
  useDeferredValue,
  /** 用于在组件中执行副作用
   * 用于在组件挂载、更新和卸载时执行逻辑
  */
  useEffect,
  /** 用于实验性处理副作用事件
   * 在组件中处理事件驱动的副作用
  */
  experimental_useEffectEvent,
  /** 用于自定义引用实例，在组件中暴露自定义方法*/
  useImperativeHandle,
  /** 
   * 用于在组件中执行DOM插入前的逻辑
  */
  useInsertionEffect,
  /** */
  useLayoutEffect,
  /** 用于记忆化计算值*/
  useMemo,
  /** */
  useOptimistic,
  /** */
  useSyncExternalStore,
  /** */
  useReducer,
  /** */
  useRef,
  /** */
  useState,
  /** */
  useTransition,
  /** */
  version,
} from './src/React';
