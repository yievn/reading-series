/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactNodeList} from 'shared/ReactTypes';
import type {
  Container,
  PublicInstance,
} from 'react-dom-bindings/src/client/ReactFiberConfigDOM';
import type {
  RootType,
  HydrateRootOptions,
  CreateRootOptions,
} from './ReactDOMRoot';

import {
  findDOMNode,
  render,
  hydrate,
  unstable_renderSubtreeIntoContainer,
  unmountComponentAtNode,
} from './ReactDOMLegacy';
import {
  createRoot as createRootImpl,
  hydrateRoot as hydrateRootImpl,
  isValidContainer,
} from './ReactDOMRoot';
import {createEventHandle} from 'react-dom-bindings/src/client/ReactDOMEventHandle';

import {
  batchedUpdates,
  flushSync as flushSyncWithoutWarningIfAlreadyRendering,
  isAlreadyRendering,
  injectIntoDevTools,
} from 'react-reconciler/src/ReactFiberReconciler';
import {runWithPriority} from 'react-reconciler/src/ReactEventPriorities';
import {createPortal as createPortalImpl} from 'react-reconciler/src/ReactPortal';
import {canUseDOM} from 'shared/ExecutionEnvironment';
import ReactVersion from 'shared/ReactVersion';

import {
  getClosestInstanceFromNode,
  getInstanceFromNode,
  getNodeFromInstance,
  getFiberCurrentPropsFromNode,
} from 'react-dom-bindings/src/client/ReactDOMComponentTree';
import {
  enqueueStateRestore,
  restoreStateIfNeeded,
} from 'react-dom-bindings/src/events/ReactDOMControlledComponent';
/**
 * 通常包含React内部使用的一些共享数据和方法，这些内容不对外部开发者公开，主要用于
 * React自身的视线和内部协调
 */
import Internals from '../ReactDOMSharedInternals';

export {
  prefetchDNS,
  preconnect,
  preload,
  preloadModule,
  preinit,
  preinitModule,
} from '../shared/ReactDOMFloat';
export {
  useFormStatus,
  useFormState,
} from 'react-dom-bindings/src/shared/ReactDOMFormActions';

if (__DEV__) {
  if (
    typeof Map !== 'function' ||
    // $FlowFixMe[prop-missing] Flow incorrectly thinks Map has no prototype
    Map.prototype == null ||
    typeof Map.prototype.forEach !== 'function' ||
    typeof Set !== 'function' ||
    // $FlowFixMe[prop-missing] Flow incorrectly thinks Set has no prototype
    Set.prototype == null ||
    typeof Set.prototype.clear !== 'function' ||
    typeof Set.prototype.forEach !== 'function'
  ) {
    console.error(
      'React depends on Map and Set built-in types. Make sure that you load a ' +
        'polyfill in older browsers. https://reactjs.org/link/react-polyfills',
    );
  }
}

function createPortal(
  children: ReactNodeList,
  container: Element | DocumentFragment,
  key: ?string = null,
): React$Portal {
  if (!isValidContainer(container)) {
    throw new Error('Target container is not a DOM element.');
  }

  // TODO: pass ReactDOM portal implementation as third argument
  // $FlowFixMe[incompatible-return] The Flow type is opaque but there's no way to actually create it.
  return createPortalImpl(children, container, null, key);
}

function renderSubtreeIntoContainer(
  parentComponent: React$Component<any, any>,
  element: React$Element<any>,
  containerNode: Container,
  callback: ?Function,
): React$Component<any, any> | PublicInstance | null {
  return unstable_renderSubtreeIntoContainer(
    parentComponent,
    element,
    containerNode,
    callback,
  );
}

function createRoot(
  container: Element | Document | DocumentFragment,
  options?: CreateRootOptions,
): RootType {
  if (__DEV__) {
    if (!Internals.usingClientEntryPoint && !__UMD__) {
      console.error(
        'You are importing createRoot from "react-dom" which is not supported. ' +
          'You should instead import it from "react-dom/client".',
      );
    }
  }
  return createRootImpl(container, options);
}

function hydrateRoot(
  container: Document | Element,
  initialChildren: ReactNodeList,
  options?: HydrateRootOptions,
): RootType {
  if (__DEV__) {
    if (!Internals.usingClientEntryPoint && !__UMD__) {
      console.error(
        'You are importing hydrateRoot from "react-dom" which is not supported. ' +
          'You should instead import it from "react-dom/client".',
      );
    }
  }
  return hydrateRootImpl(container, initialChildren, options);
}

// Overload the definition to the two valid signatures.
// Warning, this opts-out of checking the function body.
declare function flushSync<R>(fn: () => R): R;
// eslint-disable-next-line no-redeclare
declare function flushSync(): void;
// eslint-disable-next-line no-redeclare
function flushSync<R>(fn: (() => R) | void): R | void {
  if (__DEV__) {
    if (isAlreadyRendering()) {
      console.error(
        'flushSync was called from inside a lifecycle method. React cannot ' +
          'flush when React is already rendering. Consider moving this call to ' +
          'a scheduler task or micro task.',
      );
    }
  }
  return flushSyncWithoutWarningIfAlreadyRendering(fn);
}

export {
  // 
  createPortal,
  batchedUpdates as unstable_batchedUpdates,
  flushSync,
  ReactVersion as version,
  // Disabled behind disableLegacyReactDOMAPIs
  findDOMNode,
  hydrate,
  render,  
  unmountComponentAtNode,
  // exposeConcurrentModeAPIs
  createRoot,
  hydrateRoot,
  // Disabled behind disableUnstableRenderSubtreeIntoContainer
  renderSubtreeIntoContainer as unstable_renderSubtreeIntoContainer,
  // enableCreateEventHandleAPI
  createEventHandle as unstable_createEventHandle,
  // TODO: Remove this once callers migrate to alternatives.
  // This should only be used by React internals.
  runWithPriority as unstable_runWithPriority,    
};

// Keep in sync with ReactTestUtils.js.
// This is an array for better minification.
Internals.Events = [
  /**  
   * 在事件处理过程中，React需要从触发事件的DOM节点找到对应的React组件实例，以便正确地处理事件
   */
  getInstanceFromNode,
  /**
   * 从React实例获取对应的DOM节点。在需要直接操作DOM的场景中，React需要从组件实例找到对应的DOM节点。
   */
  getNodeFromInstance,
  /**
   * 从节点中获取fiber的当前属性。在事件处理过程中，React需要知道当前节点的属性，以便
   * 正确地处理事件和更新状态。
   */
  getFiberCurrentPropsFromNode,
  /**
   * 在事件处理处理过程中，某些组件的状态可能需要再事件处理后恢复，这个函数用于将这些组件
   * 的状态加入恢复队列
   */
  enqueueStateRestore,
  /**
   * 在事件处理完成后，React会调用这个函数来检查是否有组件的状态需要恢复，并执行恢复操作
   */
  restoreStateIfNeeded,
  /**
   * 在事件处理过程中，React可以批量处理多个状态更新，以减少渲染次数，提高性能
   */
  batchedUpdates,
];

const foundDevTools = injectIntoDevTools({
  findFiberByHostInstance: getClosestInstanceFromNode,
  bundleType: __DEV__ ? 1 : 0,
  version: ReactVersion,
  rendererPackageName: 'react-dom',
});

if (__DEV__) {
  if (!foundDevTools && canUseDOM && window.top === window.self) {
    // If we're in Chrome or Firefox, provide a download link if not installed.
    if (
      (navigator.userAgent.indexOf('Chrome') > -1 &&
        navigator.userAgent.indexOf('Edge') === -1) ||
      navigator.userAgent.indexOf('Firefox') > -1
    ) {
      const protocol = window.location.protocol;
      // Don't warn in exotic cases like chrome-extension://.
      if (/^(https?|file):$/.test(protocol)) {
        // eslint-disable-next-line react-internal/no-production-logging
        console.info(
          '%cDownload the React DevTools ' +
            'for a better development experience: ' +
            'https://reactjs.org/link/react-devtools' +
            (protocol === 'file:'
              ? '\nYou might need to use a local HTTP server (instead of file://): ' +
                'https://reactjs.org/link/react-devtools-faq'
              : ''),
          'font-weight:bold',
        );
      }
    }
  }
}
