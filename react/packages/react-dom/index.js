/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// Export all exports so that they're available in tests.
// We can't use export * from in Flow for some reason.
export {default as __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED} from './src/ReactDOMSharedInternals';
export {
  /**
   * 用于在DOM的其它位置渲染子节点，而不影响父组件的DOM层次结构，常用语
   * 模态框、工具提示等需要再DOM树中不同位置渲染的组件。
   */
  createPortal,
  /**
   * 创建一个支持并发特性的根节点，允许使用react18的新特性，如并发渲染。它是
   * react应用的入口点之一，由此替代了ReactDOM.render
   */
  createRoot,
  /**
   * 类似于hydrate，但用于并发模式下的服务器端渲染，支持React18的新特性，它将React组件
   * 挂载到现有的HTML上，并保留现有的DOM结构。
   */
  hydrateRoot,
  /**
   * 提供对组件实例的底层DOM节点的访问，通常不推荐使用，因为它与React的抽象层次不一致，
   * 可能在未来的版本中被移除。
   */
  findDOMNode,
  /**
   * 强制React同步刷新更新，通常用于需要逻辑更新UI的厂家，但应谨慎使用以避免性能问题。
   */
  flushSync,
  /**
   * 用于在服务器端渲染的应用中，将React组件挂载到现有的HTML上，并保留现有的DOM结构。
   */
  hydrate,
  /**
   * 将React组件渲染到指定的DOM容器中，是React应用的入口点之一，但在React18中被createRoot
   * 替代。
   */
  render,
  /**
   * 从DOM中卸载React组件，并清理相关事件处理程序和状态。
   */
  unmountComponentAtNode,
  /**
   * 允许在React之外批量更新状态，以减少渲染次数，提高性能。通常用于事件处理程序中。
   */
  unstable_batchedUpdates,
  /**
   * 提供创建事件处理程序的api，允许在React事件系统之外管理事件。
   */
  unstable_createEventHandle,
  /**
   * 允许将组件渲染到指定的DOM容器中，同时保留对父组件的引用。通常用于需要在现有组件树
   * 之外渲染的场景。
   */
  unstable_renderSubtreeIntoContainer,
  /**
   * 允许指定的优先级下运行代码块，通常用于优化性能和响应性
   */
  unstable_runWithPriority, // DO NOT USE: Temporarily exposed to migrate off of Scheduler.runWithPriority.
  /**
   * 提供表单状态的钩子，通常用于管理表单的提交状态和错误处理。
   */
  useFormStatus,
  /**
   * 提供表单状态管理的钩子，允许开发者轻松管理表单输入的状态。
   */
  useFormState,
  /**
   * 用于预取DNS记录，以减少后续网络请求的延迟。
   */
  prefetchDNS,
  /**
   * 提前建立与服务器的链接，以减少后续请求的延迟。
   */
  preconnect,
  /**
   * 预加载资源（如脚本、样式等），以提高页面加载性能。
   */
  preload,
  /**
   * 预加载JavaScript模块，以提高模块加载性能。
   */
  preloadModule,
  /**
   * 提前初始化资源或模块，以优化模块加载性能。
   */
  preinit,
  /**
   * 提前初始化JavaScript模块，以优化模块加载性能
   */
  preinitModule,
  /**
   * 提供当前React版本号，便于在应用中检查和记录React的版本。
   */
  version,
} from './src/client/ReactDOM';
