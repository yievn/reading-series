/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/**REACT_PROVIDER_TYPE, REACT_CONTEXT_TYPE用于标识React的provider和Context类型 */
import {REACT_PROVIDER_TYPE, REACT_CONTEXT_TYPE} from 'shared/ReactSymbols';

import type {ReactProviderType} from 'shared/ReactTypes';
import type {ReactContext} from 'shared/ReactTypes';

export function createContext<T>(defaultValue: T): ReactContext<T> {
  // TODO: Second argument used to be an optional `calculateChangedBits`
  // function. Warn to reserve for future use?

  const context: ReactContext<T> = {
    $$typeof: REACT_CONTEXT_TYPE,
    /**
     * 在React的Context对象中，_currentValue和_currentValue2这两个字段是用来支持并发模式的。
     * 在并发模式下，React可能会同时进行多个渲染任务。
     * 例如，React可能在主线程上进行一个渲染任务，同时在一个后台线程上进行另一个渲染任务。
     * 这两个渲染任务可能会使用到同一个Context对象。
     * 为了避免这两个渲染任务之间的冲突，React为每个Context对象提供了两个字段_currentValue和_currentValue2，
     * 用来分别存储这两个渲染任务的Context值。
     * 当一个渲染任务开始时，React会根据这个任务的优先级来选择使用_currentValue还是_currentValue2。
     * 这样，即使两个渲染任务同时进行，它们也可以各自独立地读取和更新Context的值，而不会相互干扰。
     * 
     * 在当前的React实现中，设计了两个并发渲染线程：主渲染线程和后台渲染线程。
     * 这是基于React团队对于大多数应用场景的考虑，
     * 即大部分时间，一个React应用最多只需要同时进行两个渲染任务。
     */
    _currentValue: defaultValue,
    _currentValue2: defaultValue,
    // Used to track how many concurrent renderers this context currently
    // supports within in a single renderer. Such as parallel server rendering.
    //用于跟踪此上下文当前有多少个并发呈现器
    _threadCount: 0,
    // These are circular
    Provider: (null: any), // 提供者
    Consumer: (null: any), // 消费者

    // Add these to use same hidden class in VM as ServerContext
    _defaultValue: (null: any),
    _globalName: (null: any),
  };

  context.Provider = {
    $$typeof: REACT_PROVIDER_TYPE,
    _context: context,
  };

  let hasWarnedAboutUsingNestedContextConsumers = false;
  let hasWarnedAboutUsingConsumerProvider = false;
  let hasWarnedAboutDisplayNameOnConsumer = false;

  if (__DEV__) {
    // A separate object, but proxies back to the original context object for
    // backwards compatibility. It has a different $$typeof, so we can properly
    // warn for the incorrect usage of Context as a Consumer.
    const Consumer = {
      $$typeof: REACT_CONTEXT_TYPE,
      _context: context,
    };
    // $FlowFixMe[prop-missing]: Flow complains about not setting a value, which is intentional here
    Object.defineProperties(Consumer, {
      /**不支持<Context.Consumer.Provider> */
      Provider: {
        get() {
          if (!hasWarnedAboutUsingConsumerProvider) {
            hasWarnedAboutUsingConsumerProvider = true;
            console.error(
              'Rendering <Context.Consumer.Provider> is not supported and will be removed in ' +
                'a future major release. Did you mean to render <Context.Provider> instead?',
            );
          }
          return context.Provider;
        },
        set(_Provider: ReactProviderType<T>) {
          context.Provider = _Provider;
        },
      },
      _currentValue: {
        get() {
          return context._currentValue;
        },
        set(_currentValue: T) {
          context._currentValue = _currentValue;
        },
      },
      _currentValue2: {
        get() {
          return context._currentValue2;
        },
        set(_currentValue2: T) {
          context._currentValue2 = _currentValue2;
        },
      },
      _threadCount: {
        get() {
          return context._threadCount;
        },
        set(_threadCount: number) {
          context._threadCount = _threadCount;
        },
      },
      Consumer: {
        // 不支持Context.Consumer.Consumer
        get() {
          if (!hasWarnedAboutUsingNestedContextConsumers) {
            hasWarnedAboutUsingNestedContextConsumers = true;
            console.error(
              'Rendering <Context.Consumer.Consumer> is not supported and will be removed in ' +
                'a future major release. Did you mean to render <Context.Consumer> instead?',
            );
          }
          return context.Consumer;
        },
      },
      displayName: {
        get() {
          return context.displayName;
        },
        set(displayName: void | string) {
          if (!hasWarnedAboutDisplayNameOnConsumer) {
            console.warn(
              'Setting `displayName` on Context.Consumer has no effect. ' +
                "You should set it directly on the context with Context.displayName = '%s'.",
              displayName,
            );
            hasWarnedAboutDisplayNameOnConsumer = true;
          }
        },
      },
    });
    // $FlowFixMe[prop-missing]: Flow complains about missing properties because it doesn't understand defineProperty
    context.Consumer = Consumer;
  } else {
    context.Consumer = context;
  }

  if (__DEV__) {
    context._currentRenderer = null;
    context._currentRenderer2 = null;
  }

  return context;
}
