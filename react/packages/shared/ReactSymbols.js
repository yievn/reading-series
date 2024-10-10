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
/**用于标识React元素，也就是通过React.createElement或JSX创建的对象 */
export const REACT_ELEMENT_TYPE: symbol = Symbol.for('react.element');
/**
 * 对应于 ReactDOM.createPortal 创建的 Portal 组件，
 * 用于将子节点渲染到父组件树之外的 DOM 节点。
 * 例如当需要将一个模态对话框、工具提示或下拉菜单渲染
 * 到document.body上，而不是当前的组件树中
 */
export const REACT_PORTAL_TYPE: symbol = Symbol.for('react.portal');
/**
 * 对应于 React.Fragment，用于返回多个子节点而不额外创建 DOM 元素
 */
export const REACT_FRAGMENT_TYPE: symbol = Symbol.for('react.fragment');
/**
 * 对应于 React.StrictMode，用于检测潜在问题的开发模式组件。
*/
export const REACT_STRICT_MODE_TYPE: symbol = Symbol.for('react.strict_mode');
/**用于标识React Profiler组件，Profiler组件是一个用于测量React应用中组件渲染时间的特殊组件，
 * 可以用来发现应用中的性能瓶颈，当React遇到一个$$typeof属性为REACT_PROFILER_TYPE的对象
 * 时，就会对其特殊处理，测量并记录包含在Profiler组件中的其他组件的渲染时间。
 */
export const REACT_PROFILER_TYPE: symbol = Symbol.for('react.profiler');
/**用于标识React Context Provider组件，当React遇到一个$$typeof属性为$$typeof的对象时，它知道这个
 * 对象是一个Provider组件，并会对其进行特殊处理
 */
export const REACT_PROVIDER_TYPE: symbol = Symbol.for('react.provider');
/**
 * 用于标识Context Consumer，这是一种可以订阅context变化的组件
 */
export const REACT_CONTEXT_TYPE: symbol = Symbol.for('react.context');
/**
 * REACT_SERVER_CONTEXT_TYPE是一个特殊的Symbol，用于标识React的Server Context。
 * 在React的服务器端渲染（Server Side Rendering，SSR）中，Server Context是一个特殊的Context，它用于在服务器端渲染过程中传递一些特定的信息。这些信息可能包括请求的URL、请求的HTTP头部、服务器端的会话数据等。
 * 当React在服务器端渲染一个组件时，如果遇到一个$$typeof属性为REACT_SERVER_CONTEXT_TYPE的对象，它知道这个对象是一个Server Context，并会对其进行特殊处理。
 * 需要注意的是，REACT_SERVER_CONTEXT_TYPE主要用于React的内部实现，通常不会在你的应用代码中直接使用。 
 */
export const REACT_SERVER_CONTEXT_TYPE: symbol = Symbol.for(
  'react.server_context',
);
/**用于标识ForwardRef，这是一种可以将ref转发到子组件的组件 */
export const REACT_FORWARD_REF_TYPE: symbol = Symbol.for('react.forward_ref');
/**用于标识React Suspense，这是一种可以“暂停”渲染，等待异步数据的组件。 */
export const REACT_SUSPENSE_TYPE: symbol = Symbol.for('react.suspense');
/**
 * REACT_SUSPENSE_LIST_TYPE 是 React 中的一种特殊类型，
 * 用于实现 SuspenseList 组件。SuspenseList 是
 *  React 16.6 引入的一个实验性特性，旨在协调多个 Suspense 组件的渲染顺序。
 */
export const REACT_SUSPENSE_LIST_TYPE: symbol = Symbol.for(
  'react.suspense_list',
);
/**用于标识React Memo，这是一种可以记住渲染结果，避免不必要渲染的组件。 */
export const REACT_MEMO_TYPE: symbol = Symbol.for('react.memo');
/**用于标识React Lazy，这是一种可以延迟加载组件的组件。 */
export const REACT_LAZY_TYPE: symbol = Symbol.for('react.lazy');


//--------------------------
/**
 * 用于标识 React 的 Scope API，主要用于实验性功能。-----
 */
export const REACT_SCOPE_TYPE: symbol = Symbol.for('react.scope');
/**
 * 用于标识调试追踪模式，主要在调试和性能分析中使用。
 */
export const REACT_DEBUG_TRACING_MODE_TYPE: symbol = Symbol.for(
  'react.debug_trace_mode',
);
/**
 * 用于标识 Offscreen 组件，主要用于实验性功能，
 * 允许组件在不影响布局的情况下保持挂载。----
 */
export const REACT_OFFSCREEN_TYPE: symbol = Symbol.for('react.offscreen');
/**
 * 用于标识 Legacy Hidden 组件，主要用于实验性功能。----
 */
export const REACT_LEGACY_HIDDEN_TYPE: symbol = Symbol.for(
  'react.legacy_hidden',
);
/**
 * 用于标识 Cache 组件，主要用于实验性功能。----
 */
export const REACT_CACHE_TYPE: symbol = Symbol.for('react.cache');

/**
 * 用于标识 Tracing Marker，主要用于性能追踪。-----
 */
export const REACT_TRACING_MARKER_TYPE: symbol = Symbol.for(
  'react.tracing_marker',
);


// ---------------

export const REACT_SERVER_CONTEXT_DEFAULT_VALUE_NOT_LOADED: symbol = Symbol.for(
  'react.default_value',
);

export const REACT_MEMO_CACHE_SENTINEL: symbol = Symbol.for(
  'react.memo_cache_sentinel',
);

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
