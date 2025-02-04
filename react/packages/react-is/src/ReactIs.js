/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * 
 * 当前模块的主要作用是提供一组工具函数和常量，用于识别和验证React元素的类型。
 */

'use strict';

import {
  REACT_CONTEXT_TYPE,
  REACT_SERVER_CONTEXT_TYPE,
  REACT_ELEMENT_TYPE,
  REACT_FORWARD_REF_TYPE,
  REACT_FRAGMENT_TYPE,
  REACT_LAZY_TYPE,
  REACT_MEMO_TYPE,
  REACT_PORTAL_TYPE,
  REACT_PROFILER_TYPE,
  REACT_PROVIDER_TYPE,
  REACT_STRICT_MODE_TYPE,
  REACT_SUSPENSE_TYPE,
  REACT_SUSPENSE_LIST_TYPE,
} from 'shared/ReactSymbols';
import isValidElementType from 'shared/isValidElementType';

/**
 * 用于识别给定对象的React类型。通过检查对象的$$typeof和type属性，返回相应的类型常量
 */
export function typeOf(object: any): mixed {
  // 如果object是对象，则对object.$$typeof进行判断
  if (typeof object === 'object' && object !== null) {
    const $$typeof = object.$$typeof;
    switch ($$typeof) {
      // 如果React元素，通过type类型，进一步细分reactElement类型
      case REACT_ELEMENT_TYPE:
        // type是具体的React元素类型
        const type = object.type;

        switch (type) {
          /**
           * 内置组件被babel编译后，传入createElement的type，就是一个类型符号标志，为以下几种
           */
          case REACT_FRAGMENT_TYPE:
          case REACT_PROFILER_TYPE:
          case REACT_STRICT_MODE_TYPE:
          case REACT_SUSPENSE_TYPE:
          case REACT_SUSPENSE_LIST_TYPE:
            // 如果 是以上几种，则直接返回type
            return type;
          default: // 如果不是以上罗列的几种类型，则通过
            // 如果type是对象，并且type.$$typeof有值，那么则进一步区分类型
            const $$typeofType = type && type.$$typeof;
            switch ($$typeofType) {
              case REACT_SERVER_CONTEXT_TYPE:
              case REACT_CONTEXT_TYPE:
              case REACT_FORWARD_REF_TYPE:
              case REACT_LAZY_TYPE:
              case REACT_MEMO_TYPE:
              case REACT_PROVIDER_TYPE:
                return $$typeofType;
              default:
                return $$typeof;
            }
        }
      case REACT_PORTAL_TYPE:
        return $$typeof;
    }
  }

  return undefined;
}
// 
export const ContextConsumer = REACT_CONTEXT_TYPE;
export const ContextProvider = REACT_PROVIDER_TYPE;
export const Element = REACT_ELEMENT_TYPE;
export const ForwardRef = REACT_FORWARD_REF_TYPE;
export const Fragment = REACT_FRAGMENT_TYPE;
export const Lazy = REACT_LAZY_TYPE;
export const Memo = REACT_MEMO_TYPE;
export const Portal = REACT_PORTAL_TYPE;
export const Profiler = REACT_PROFILER_TYPE;
export const StrictMode = REACT_STRICT_MODE_TYPE;
export const Suspense = REACT_SUSPENSE_TYPE;
export const SuspenseList = REACT_SUSPENSE_LIST_TYPE;
// 用于检查给定的类型是否是有效的 React 元素类型。
export {isValidElementType};

let hasWarnedAboutDeprecatedIsAsyncMode = false;
let hasWarnedAboutDeprecatedIsConcurrentMode = false;

// AsyncMode should be deprecated
/**
 * 用于检查对象是否是异步模式组件。此函数已被弃用，
 * 并在开发模式下发出警告，提示将在未来版本中移除。
 */
export function isAsyncMode(object: any): boolean {
  if (__DEV__) {
    if (!hasWarnedAboutDeprecatedIsAsyncMode) {
      hasWarnedAboutDeprecatedIsAsyncMode = true;
      // Using console['warn'] to evade Babel and ESLint
      console['warn'](
        'The ReactIs.isAsyncMode() alias has been deprecated, ' +
          'and will be removed in React 18+.',
      );
    }
  }
  return false;
}
/**
 * 用于检查对象是否是并发模式组件。此函数也已被弃用，并在开发模式下发出警告。
 */
export function isConcurrentMode(object: any): boolean {
  if (__DEV__) {
    if (!hasWarnedAboutDeprecatedIsConcurrentMode) {
      hasWarnedAboutDeprecatedIsConcurrentMode = true;
      // Using console['warn'] to evade Babel and ESLint
      console['warn'](
        'The ReactIs.isConcurrentMode() alias has been deprecated, ' +
          'and will be removed in React 18+.',
      );
    }
  }
  return false;
}
/**
 * 检查对象是否是一个 Context 消费者组件。
 */
export function isContextConsumer(object: any): boolean {
  return typeOf(object) === REACT_CONTEXT_TYPE;
}
/**
 * 检查对象是否是一个 Context 提供者组件。
 */
export function isContextProvider(object: any): boolean {
  return typeOf(object) === REACT_PROVIDER_TYPE;
}
/**
 * 检查对象是否是一个 React 元素。

 */
export function isElement(object: any): boolean {
  return (
    typeof object === 'object' &&
    object !== null &&
    object.$$typeof === REACT_ELEMENT_TYPE
  );
}
/**
 * 检查对象是否是一个使用 React.forwardRef 创建的组件。
 */
export function isForwardRef(object: any): boolean {
  return typeOf(object) === REACT_FORWARD_REF_TYPE;
}
/**
 * 检查对象是否是一个 Fragment 组件。
 */
export function isFragment(object: any): boolean {
  return typeOf(object) === REACT_FRAGMENT_TYPE;
}
/**
 * 检查对象是否是一个 Lazy 组件。
 */
export function isLazy(object: any): boolean {
  return typeOf(object) === REACT_LAZY_TYPE;
}
/**
 * 检查对象是否是一个 Memo 组件。
 */
export function isMemo(object: any): boolean {
  return typeOf(object) === REACT_MEMO_TYPE;
}
/**
 * 检查对象是否是一个 Portal 组件。
 */
export function isPortal(object: any): boolean {
  return typeOf(object) === REACT_PORTAL_TYPE;
}
/**
 * 检查对象是否是一个 Profiler 组件。
 */
export function isProfiler(object: any): boolean {
  return typeOf(object) === REACT_PROFILER_TYPE;
}
/**
 * 检查对象是否是一个 StrictMode 组件。
 */
export function isStrictMode(object: any): boolean {
  return typeOf(object) === REACT_STRICT_MODE_TYPE;
}
/**
 * 检查对象是否是一个 Suspense 组件。
 */
export function isSuspense(object: any): boolean {
  return typeOf(object) === REACT_SUSPENSE_TYPE;
}
/**
 * 检查对象是否是一个 SuspenseList 组件。
 */
export function isSuspenseList(object: any): boolean {
  return typeOf(object) === REACT_SUSPENSE_LIST_TYPE;
}
