/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// ATTENTION
// When adding new symbols to this file,
// Please consider also adding to 'react-devtools-shared/src/backend/ReactSymbols'

// The Symbol used to tag the ReactElement-like types.
/**
 * React 元素类型标记。所有通过 React.createElement 或 JSX 创建的 React 元素对象
 * 其 $$typeof 属性都为该 Symbol。用于区分 React 元素与普通对象。
 * 
 * React 通过 $$typeof 属性和 REACT_ELEMENT_TYPE，可以快速判断一个对象是不是“React 元素”。
这也是 React 能够区分普通对象和虚拟 DOM 的关键机制。
只有带有 $$typeof: REACT_ELEMENT_TYPE 的对象，才会被 React 视为合法的元素节点，参与渲染和 diff。


 */
export const REACT_ELEMENT_TYPE: symbol = Symbol.for('react.element');
/**
 * 对应于 ReactDOM.createPortal 创建的 Portal 组件，
 * 用于将子节点渲染到父组件树之外的 DOM 节点。
 * 例如当需要将一个模态对话框、工具提示或下拉菜单渲染
 * 到document.body上，而不是当前的组件树中
 */
/**
 * Portal 类型标记。通过 ReactDOM.createPortal 创建的 Portal 组件对象
 * 其 $$typeof 属性为该 Symbol。Portal 允许将子节点渲染到父组件树外的 DOM 节点。
 */
export const REACT_PORTAL_TYPE: symbol = Symbol.for('react.portal');
/**
 * 对应于 React.Fragment，用于返回多个子节点而不额外创建 DOM 元素
 */
/**
 * Fragment 类型标记。用于标识 React.Fragment 组件，实现无额外 DOM 包裹的多子节点返回。
 */
export const REACT_FRAGMENT_TYPE: symbol = Symbol.for('react.fragment');
/**
 * 对应于 React.StrictMode，用于检测潜在问题的开发模式组件。
*/
/**
 * StrictMode 类型标记。用于标识 React.StrictMode 组件，启用额外的开发检查。
 */
export const REACT_STRICT_MODE_TYPE: symbol = Symbol.for('react.strict_mode');
/**用于标识React Profiler组件，Profiler组件是一个用于测量React应用中组件渲染时间的特殊组件，
 * 可以用来发现应用中的性能瓶颈，当React遇到一个$$typeof属性为REACT_PROFILER_TYPE的对象
 * 时，就会对其特殊处理，测量并记录包含在Profiler组件中的其他组件的渲染时间。
 */
/**
 * Profiler 类型标记。用于标识 React.Profiler 组件，测量子树渲染性能。
 */
export const REACT_PROFILER_TYPE: symbol = Symbol.for('react.profiler');
/**用于标识React Context Provider组件，当React遇到一个$$typeof属性为$$typeof的对象时，它知道这个
 * 对象是一个Provider组件，并会对其进行特殊处理
 */
/**
 * Context Provider 类型标记。用于标识 context 的 Provider 组件。
 */
export const REACT_PROVIDER_TYPE: symbol = Symbol.for('react.provider');
/**
 * 用于标识Context Consumer，这是一种可以订阅context变化的组件
 */
/**
 * Context Consumer 类型标记。用于标识 context 的 Consumer 组件。
 */
export const REACT_CONTEXT_TYPE: symbol = Symbol.for('react.context');
/**
 * REACT_SERVER_CONTEXT_TYPE是一个特殊的Symbol，用于标识React的Server Context。
 * 在React的服务器端渲染（Server Side Rendering，SSR）中，Server Context是一个特殊的Context，它用于在服务器端渲染过程中传递一些特定的信息。这些信息可能包括请求的URL、请求的HTTP头部、服务器端的会话数据等。
 * 当React在服务器端渲染一个组件时，如果遇到一个$$typeof属性为REACT_SERVER_CONTEXT_TYPE的对象，它知道这个对象是一个Server Context，并会对其进行特殊处理。
 * 需要注意的是，REACT_SERVER_CONTEXT_TYPE主要用于React的内部实现，通常不会在你的应用代码中直接使用。 
 */
/**
 * Server Context 类型标记。用于服务器端渲染时传递特定上下文信息。
 * 主要用于 React 内部的 SSR 实现。
 */
export const REACT_SERVER_CONTEXT_TYPE: symbol = Symbol.for(
  'react.server_context',
);
/**用于标识ForwardRef，这是一种可以将ref转发到子组件的组件 */
/**
 * ForwardRef 类型标记。用于标识通过 React.forwardRef 创建的组件。
 */
export const REACT_FORWARD_REF_TYPE: symbol = Symbol.for('react.forward_ref');
/**用于标识React Suspense，这是一种可以"暂停"渲染，等待异步数据的组件。 */
/**
 * Suspense 类型标记。用于标识 React.Suspense 组件，实现异步渲染"挂起"。
 */
export const REACT_SUSPENSE_TYPE: symbol = Symbol.for('react.suspense');
/**
 * REACT_SUSPENSE_LIST_TYPE 是 React 中的一种特殊类型，
 * 用于实现 SuspenseList 组件。SuspenseList 是
 *  React 16.6 引入的一个实验性特性，旨在协调多个 Suspense 组件的渲染顺序。
 */
/**
 * SuspenseList 类型标记。用于标识 SuspenseList 组件，协调多个 Suspense 的渲染顺序。
 */
export const REACT_SUSPENSE_LIST_TYPE: symbol = Symbol.for(
  'react.suspense_list',
);
/**用于标识React Memo，这是一种可以记住渲染结果，避免不必要渲染的组件。 */
/**
 * Memo 类型标记。用于标识通过 React.memo 创建的组件，实现组件记忆优化。
 */
export const REACT_MEMO_TYPE: symbol = Symbol.for('react.memo');
/**用于标识React Lazy，这是一种可以延迟加载组件的组件。 */
/**
 * Lazy 类型标记。用于标识通过 React.lazy 创建的组件，实现组件懒加载。
 */
export const REACT_LAZY_TYPE: symbol = Symbol.for('react.lazy');


//--------------------------
/**
 * 用于标识 React 的 Scope API，主要用于实验性功能。-----
 */
/**
 * Scope 类型标记。用于实验性 Scope API。
 */
export const REACT_SCOPE_TYPE: symbol = Symbol.for('react.scope');
/**
 * 用于标识调试追踪模式，主要在调试和性能分析中使用。
 */
/**
 * Debug Trace Mode 类型标记。用于调试和性能分析的实验性功能。
 */
export const REACT_DEBUG_TRACING_MODE_TYPE: symbol = Symbol.for(
  'react.debug_trace_mode',
);
/**
 * 用于标识 Offscreen 组件，主要用于实验性功能，
 * 允许组件在不影响布局的情况下保持挂载。----
 */
/**
 * Offscreen 类型标记。用于实验性 Offscreen 组件，允许组件在不影响布局的情况下挂载。
 */
export const REACT_OFFSCREEN_TYPE: symbol = Symbol.for('react.offscreen');
/**
 * 用于标识 Legacy Hidden 组件，主要用于实验性功能。----
 */
/**
 * Legacy Hidden 类型标记。用于实验性隐藏组件功能。
 */
export const REACT_LEGACY_HIDDEN_TYPE: symbol = Symbol.for(
  'react.legacy_hidden',
);
/**
 * 用于标识 Cache 组件，主要用于实验性功能。----
 */
/**
 * Cache 类型标记。用于实验性 Cache 组件。
 */
export const REACT_CACHE_TYPE: symbol = Symbol.for('react.cache');

/**
 * 用于标识 Tracing Marker，主要用于性能追踪。-----
 */
/**
 * Tracing Marker 类型标记。用于性能追踪的实验性功能。
 */
export const REACT_TRACING_MARKER_TYPE: symbol = Symbol.for(
  'react.tracing_marker',
);


// ---------------

/**
 * Server Context 默认值未加载标记。用于区分 Server Context 是否已加载默认值。
 */
export const REACT_SERVER_CONTEXT_DEFAULT_VALUE_NOT_LOADED: symbol = Symbol.for(
  'react.default_value',
);

/**
 * Memo 缓存哨兵值。用于内部实现 Memo 组件缓存的特殊标记。
 */
export const REACT_MEMO_CACHE_SENTINEL: symbol = Symbol.for(
  'react.memo_cache_sentinel',
);

/**
 * Postpone 类型标记。用于实验性 Postpone 组件。
 */
export const REACT_POSTPONE_TYPE: symbol = Symbol.for('react.postpone');

const MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
const FAUX_ITERATOR_SYMBOL = '@@iterator';

/**etIteratorFn函数的主要作用是获取一个对象的迭代器函数。在JavaScript中，
 * 一个对象如果有一个名为Symbol.iterator的方法，
 * 那么这个对象就是可迭代的，可以使用for...of循环进行遍历。
 * 
 * getIteratorFn函数的作用是获取一个对象的迭代器函数，
 * 以便可以使用这个函数来遍历这个对象。
 * 这在React的内部实现中被用于处理可迭代的子元素，
 * 例如在渲染数组或其他可迭代的子元素时。 
 */
/**
 * 获取对象的迭代器函数（如果存在）。
 * 如果对象实现了 Symbol.iterator 或 @@iterator，则返回对应的迭代器函数，否则返回 null。
 * 该函数用于 React 内部遍历可迭代的子元素（如数组、Set 等）。
 *
 * @param {?any} maybeIterable 可能可迭代的对象
 * @return {?function} 迭代器函数或 null
 */
export function getIteratorFn(maybeIterable: ?any): ?() => ?Iterator<any> {
  if (maybeIterable === null || typeof maybeIterable !== 'object') {
    return null;
  }
  const maybeIterator =
    (MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL]) ||
    maybeIterable[FAUX_ITERATOR_SYMBOL];
  if (typeof maybeIterator === 'function') {
    return maybeIterator;
  }
  return null;
}
