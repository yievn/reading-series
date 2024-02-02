/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/**
 * 当React仔渲染时，通过$$typeof知道这是一个懒加载组件LazyComponent，此时会判断payload中的_status
 *
 * 如果此时的_status 是Uninitialized，说明组件还没开始加载，此时会调用_init函数（也就是lazyInitializer）
 * 加载组件
 *
 * lazyInitializer函数会调用_payload._result(就是传入lazy中的() => import())开始异步加载
 * 组件，并将_status设置为Pending；
 *
 * 当组件加载完成，lazyInitializer函数会将_status设置为Resolved，并将_result设置为加载的组件。
 *
 * 如果加载失败，_status会被设置为Rejected，并将_resulr设置为错误对象。
 *
 * 在组件加载过程中，如果LazyComponent的父组件被渲染，React会抛出一个promise（即_payload._result，因为当_status
 * 为Pending时，_result为thanable，是一个promise对象）.
 *
 * 这时离他最近的Suspense组件将会捕获到该Promise对象（如果我们在LazyComponent的上级组件中使用了Suspense），
 * 并且在等待promise对象解析的过程中显示fallback。
 */

import type {Wakeable, Thenable} from 'shared/ReactTypes';

import {REACT_LAZY_TYPE} from 'shared/ReactSymbols';

/**
 * 这些常量用于表示动态加载组件的不同状态
 */
/**这是组件的初始状态，表示组件尚未开始加载 */
const Uninitialized = -1;
/**这是组件开始加载但尚未完成的状态 */
const Pending = 0;
/**这是组件加载成功的状态 */
const Resolved = 1;
/**这是组件加载失败的状态 */
const Rejected = 2;

type UninitializedPayload<T> = {
  _status: -1,
  _result: () => Thenable<{default: T, ...}>,
};

type PendingPayload = {
  _status: 0,
  _result: Wakeable,
};

type ResolvedPayload<T> = {
  _status: 1,
  _result: {default: T, ...},
};

type RejectedPayload = {
  _status: 2,
  _result: mixed,
};

type Payload<T> =
  | UninitializedPayload<T>
  | PendingPayload
  | ResolvedPayload<T>
  | RejectedPayload;

/**
 * 这个类型定义提供了一种方式来秒速通过React.lazy创建的组件
 *
 * $$typeof 用于内部标记这个对象是一种特殊的React组件类型，即懒加载组件
 * _payload 这是一个泛型P， 表示携带的数据，在React.lazy中，这个_payload通常是一个包含了组件加载状态和结果的对象
 * _init 这是一个函数，接收_payload作为参数，返回泛型T。在React.lazy中，这个函数是lazyInitializer，它负责处理
 * _payload的状态转换，并返回加载的组件。
 */
export type LazyComponent<T, P> = {
  $$typeof: symbol | number,
  _payload: P,
  _init: (payload: P) => T,
};

/**lazyInitializer是一个动态加载组件状态的函数，它接收一个Payload的参数，根据_status
 * 字段的值来决定如何处理
*/
function lazyInitializer<T>(payload: Payload<T>): T {
  /**如果组件尚未开始加载 */
  if (payload._status === Uninitialized) {
    /**组件加载函数 */
    const ctor = payload._result;
    const thenable = ctor();
    // Transition to the next state.
    // This might throw either because it's missing or throws. If so, we treat it
    // as still uninitialized and try again next time. Which is the same as what
    // happens if the ctor or any wrappers processing the ctor throws. This might
    // end up fixing it if the resolution was a concurrency bug.
    thenable.then(
      moduleObject => {
        /**如果当前状态为加载中或者尚未加载的状态
         * 将状态改为1，表示加载成功
         * 将加载结果moduleObject存储起来
         */
        if (payload._status === Pending || payload._status === Uninitialized) {
          // Transition to the next state.
          const resolved: ResolvedPayload<T> = (payload: any);
          resolved._status = Resolved;
          resolved._result = moduleObject;
        }
      },
      error => {
        /**
         * 如果当前状态为加载中或者尚未加载的状态
         * 将状态改为2，表示加载失败
         * 并将失败理由存到_resulr中
         */
        if (payload._status === Pending || payload._status === Uninitialized) {
          // Transition to the next state.
          const rejected: RejectedPayload = (payload: any);
          rejected._status = Rejected;
          rejected._result = error;
        }
      },
    );
    /**当前状态还处于未加载状态
     * 因为执行了上面的thenable，已经在加载了，所以在这里讲状态改为加载中
    */
    if (payload._status === Uninitialized) {
      // In case, we're still uninitialized, then we're waiting for the thenable
      // to resolve. Set it as pending in the meantime.
      const pending: PendingPayload = (payload: any);
      pending._status = Pending;
      pending._result = thenable;
    }
  }

  /**如果此时组件已经被加载好了，那么直接返回moduleObject.default ，否则抛出错误*/
  if (payload._status === Resolved) {
    const moduleObject = payload._result;
    if (__DEV__) {
      if (moduleObject === undefined) {
        console.error(
          'lazy: Expected the result of a dynamic imp' +
            'ort() call. ' +
            'Instead received: %s\n\nYour code should look like: \n  ' +
            // Break up imports to avoid accidentally parsing them as dependencies.
            'const MyComponent = lazy(() => imp' +
            "ort('./MyComponent'))\n\n" +
            'Did you accidentally put curly braces around the import?',
          moduleObject,
        );
      }
    }
    if (__DEV__) {
      if (!('default' in moduleObject)) {
        console.error(
          'lazy: Expected the result of a dynamic imp' +
            'ort() call. ' +
            'Instead received: %s\n\nYour code should look like: \n  ' +
            // Break up imports to avoid accidentally parsing them as dependencies.
            'const MyComponent = lazy(() => imp' +
            "ort('./MyComponent'))",
          moduleObject,
        );
      }
    }
    return moduleObject.default;
  } else {
    throw payload._result;
  }
}

/** */
export function lazy<T>(
  ctor: () => Thenable<{default: T, ...}>,
): LazyComponent<T, Payload<T>> {
  /**初始一个payload */
  const payload: Payload<T> = {
    // We use these fields to store the result.
    _status: Uninitialized,
    _result: ctor,
  };

  const lazyType: LazyComponent<T, Payload<T>> = {
    $$typeof: REACT_LAZY_TYPE,
    _payload: payload,
    _init: lazyInitializer,
  };

  if (__DEV__) {
    // In production, this would just set it on the object.
    let defaultProps;
    let propTypes;
    // $FlowFixMe[prop-missing]
    Object.defineProperties(lazyType, {
      defaultProps: {
        configurable: true,
        get() {
          return defaultProps;
        },
        // $FlowFixMe[missing-local-annot]
        set(newDefaultProps) {
          console.error(
            'React.lazy(...): It is not supported to assign `defaultProps` to ' +
              'a lazy component import. Either specify them where the component ' +
              'is defined, or create a wrapping component around it.',
          );
          defaultProps = newDefaultProps;
          // Match production behavior more closely:
          // $FlowFixMe[prop-missing]
          Object.defineProperty(lazyType, 'defaultProps', {
            enumerable: true,
          });
        },
      },
      propTypes: {
        configurable: true,
        get() {
          return propTypes;
        },
        // $FlowFixMe[missing-local-annot]
        set(newPropTypes) {
          console.error(
            'React.lazy(...): It is not supported to assign `propTypes` to ' +
              'a lazy component import. Either specify them where the component ' +
              'is defined, or create a wrapping component around it.',
          );
          propTypes = newPropTypes;
          // Match production behavior more closely:
          // $FlowFixMe[prop-missing]
          Object.defineProperty(lazyType, 'propTypes', {
            enumerable: true,
          });
        },
      },
    });
  }

  return lazyType;
}
