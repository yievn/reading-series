/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * 
 * 特性标志用于控制React的不同功能和实验性特性的启用和禁用。通过设置
 * 这些标志，开发者可以在开发和生产环境中测试和控制不同的功能
 */

// -----------------------------------------------------------------------------
// Land or remove (zero effort)
//
// Flags that can likely be deleted or landed without consequences
// -----------------------------------------------------------------------------
/**
 * 启用组件堆栈位置的标志，通常用于调试
 */
export const enableComponentStackLocations = true;

// -----------------------------------------------------------------------------
// Killswitch
//
// Flags that exist solely to turn off a change in case it causes a regression
// when it rolls out to prod. We should remove these as soon as possible.
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// Land or remove (moderate effort)
//
// Flags that can be probably deleted or landed, but might require extra effort
// like migrating internal callers or performance testing.
// -----------------------------------------------------------------------------

// TODO: Finish rolling out in www
/**
 * 启用客户端渲染回退机制以处理文本不匹配。
 */
export const enableClientRenderFallbackOnTextMismatch = true;
/**
 * 启用表单操作功能。
 */
export const enableFormActions = true;
/**
 * 启用异步操作功能。
 */
export const enableAsyncActions = true;

// Not sure if www still uses this. We don't have a replacement but whatever we
// replace it with will likely be different than what's already there, so we
// probably should just delete it as long as nothing in www relies on it.
/**
 * 启用调度器调试功能。
 */
export const enableSchedulerDebugging = false;

// Need to remove didTimeout argument from Scheduler before landing
/**
 * 禁用调度器在工作循环中的超时。
 */
export const disableSchedulerTimeoutInWorkLoop = false;

// This will break some internal tests at Meta so we need to gate this until
// those can be fixed.
/**
 * 启用将根调度推迟到微任务的功能。
 */
export const enableDeferRootSchedulingToMicrotask = true;

// -----------------------------------------------------------------------------
// Slated for removal in the future (significant effort)
//
// These are experiments that didn't work out, and never shipped, but we can't
// delete from the codebase until we migrate internal callers.
// -----------------------------------------------------------------------------

// Add a callback property to suspense to notify which promises are currently
// in the update queue. This allows reporting and tracing of what is causing
// the user to see a loading state.
//
// Also allows hydration callbacks to fire when a dehydrated boundary gets
// hydrated or deleted.
//
// This will eventually be replaced by the Transition Tracing proposal.
/**
 * 启用Suspense回调功能，用于跟踪和报告导致用户看到加载状态的原因。

 */
export const enableSuspenseCallback = false;

// Experimental Scope support.
/**
 * 启用实验性的 Scope API
 */
export const enableScopeAPI = false;

// Experimental Create Event Handle API.
/**
 * 启用实验性的创建事件句柄 API。
 */
export const enableCreateEventHandleAPI = false;

// Support legacy Primer support on internal FB www
/**
 * 启用对内部 Facebook 的遗留支持。
 */
export const enableLegacyFBSupport = false;

// -----------------------------------------------------------------------------
// Ongoing experiments
//
// These are features that we're either actively exploring or are reasonably
// likely to include in an upcoming release.
// -----------------------------------------------------------------------------
/**
 * 启用缓存功能。
 */
export const enableCache = true;
/**
 *  启用遗留缓存功能（实验性）。
 */
export const enableLegacyCache = __EXPERIMENTAL__;
/**
 * 启用缓存元素功能（实验性）。
 */
export const enableCacheElement = __EXPERIMENTAL__;
/**
 * 启用获取指令功能。
 */
export const enableFetchInstrumentation = true;
/**
 * 启用二进制传输功能（实验性）。
 */
export const enableBinaryFlight = __EXPERIMENTAL__;
/**
 * 启用污染检测功能（实验性）。
 */
export const enableTaint = __EXPERIMENTAL__;
/**
 * 启用推迟功能（实验性）。
 */
export const enablePostpone = __EXPERIMENTAL__;
/**
 * 启用过渡跟踪功能。
 */
export const enableTransitionTracing = false;

// No known bugs, but needs performance testing
/**
 * 启用懒惰上下文传播功能。
 */
export const enableLazyContextPropagation = false;

// FB-only usage. The new API has different semantics.
/**
 * 启用遗留隐藏功能。
 */
export const enableLegacyHidden = false;

// Enables unstable_avoidThisFallback feature in Fiber
/**
 * 启用在 Fiber 中避免此回退的功能。
 */
export const enableSuspenseAvoidThisFallback = false;
// Enables unstable_avoidThisFallback feature in Fizz
/**
 * 
 */
export const enableSuspenseAvoidThisFallbackFizz = false;
/**
 * 
 */
export const enableCPUSuspense = __EXPERIMENTAL__;
/**
 * 
 */
export const enableFloat = true;

// Enables unstable_useMemoCache hook, intended as a compilation target for
// auto-memoization.
/**
 * 
 */
export const enableUseMemoCacheHook = __EXPERIMENTAL__;
/**
 * 
 */
export const enableUseEffectEventHook = __EXPERIMENTAL__;

// Test in www before enabling in open source.
// Enables DOM-server to stream its instruction set as data-attributes
// (handled with an MutationObserver) instead of inline-scripts
/**
 * 
 */
export const enableFizzExternalRuntime = true;
/**
 * 
 */
export const alwaysThrottleRetries = true;
/**
 * 
 */
export const useMicrotasksForSchedulingInFabric = false;
/**
 * 
 */
export const passChildrenWhenCloningPersistedNodes = false;
/**
 * 
 */
export const enableUseDeferredValueInitialArg = __EXPERIMENTAL__;

/**
 * Enables an expiration time for retry lanes to avoid starvation.
 */
/**
 * 启用重试通道过期功能。
 */
export const enableRetryLaneExpiration = false;
/**
 * 重试通道的过期时间（毫秒）。
 */
export const retryLaneExpirationMs = 5000;
/**
 * 同步通道的过期时间（毫秒）。
 */
export const syncLaneExpirationMs = 250;
/**
 * 过渡通道的过期时间（毫秒）。
 */
export const transitionLaneExpirationMs = 5000;

// -----------------------------------------------------------------------------
// Chopping Block
//
// Planned feature deprecations and breaking changes. Sorted roughly in order of
// when we plan to enable them.
// -----------------------------------------------------------------------------

// This flag enables Strict Effects by default. We're not turning this on until
// after 18 because it requires migration work. Recommendation is to use
// <StrictMode /> to gradually upgrade components.
// If TRUE, trees rendered with createRoot will be StrictEffectsMode.
// If FALSE, these trees will be StrictLegacyMode.
// 默认启用严格效果模式。
export const createRootStrictEffectsByDefault = false;

export const disableModulePatternComponents = false;

export const disableLegacyContext = false;

export const enableUseRefAccessWarning = false;

// Enables time slicing for updates that aren't wrapped in startTransition.
// 强制默认并发模式用于测试。
export const forceConcurrentByDefaultForTesting = false;

export const enableUnifiedSyncLane = true;

// Adds an opt-in to time slicing for updates that aren't wrapped in startTransition.
// 默认允许并发
export const allowConcurrentByDefault = false;

// -----------------------------------------------------------------------------
// React DOM Chopping Block
//
// Similar to main Chopping Block but only flags related to React DOM. These are
// grouped because we will likely batch all of them into a single major release.
// -----------------------------------------------------------------------------

// Disable support for comment nodes as React DOM containers. Already disabled
// in open source, but www codebase still relies on it. Need to remove.
// 禁用将注释节点作为 DOM 容器。
export const disableCommentsAsDOMContainers = true;

// Disable javascript: URL strings in href for XSS protection.
export const disableJavaScriptURLs = false;

export const enableTrustedTypesIntegration = false;

// Prevent the value and checked attributes from syncing with their related
// DOM properties
export const disableInputAttributeSyncing = false;

// Remove IE and MsApp specific workarounds for innerHTML
export const disableIEWorkarounds = __EXPERIMENTAL__;

// Filter certain DOM attributes (e.g. src, href) if their values are empty
// strings. This prevents e.g. <img src=""> from making an unnecessary HTTP
// request for certain browsers.
export const enableFilterEmptyStringAttributesDOM = __EXPERIMENTAL__;

// Changes the behavior for rendering custom elements in both server rendering
// and client rendering, mostly to allow JSX attributes to apply to the custom
// element's object properties instead of only HTML attributes.
// https://github.com/facebook/react/issues/11347
export const enableCustomElementPropertySupport = __EXPERIMENTAL__;

// Disables children for <textarea> elements
export const disableTextareaChildren = false;

// -----------------------------------------------------------------------------
// Debugging and DevTools
// -----------------------------------------------------------------------------

// Adds user timing marks for e.g. state updates, suspense, and work loop stuff,
// for an experimental timeline tool.
export const enableSchedulingProfiler = __PROFILE__;

// Helps identify side effects in render-phase lifecycle hooks and setState
// reducers by double invoking them in StrictLegacyMode.
export const debugRenderPhaseSideEffectsForStrictMode = __DEV__;

// To preserve the "Pause on caught exceptions" behavior of the debugger, we
// replay the begin phase of a failed component inside invokeGuardedCallback.
export const replayFailedUnitOfWorkWithInvokeGuardedCallback = __DEV__;

// Gather advanced timing metrics for Profiler subtrees.
export const enableProfilerTimer = __PROFILE__;

// Record durations for commit and passive effects phases.
export const enableProfilerCommitHooks = __PROFILE__;

// Phase param passed to onRender callback differentiates between an "update" and a "cascading-update".
export const enableProfilerNestedUpdatePhase = __PROFILE__;

// Adds verbose console logging for e.g. state updates, suspense, and work loop
// stuff. Intended to enable React core members to more easily debug scheduling
// issues in DEV builds.
export const enableDebugTracing = false;

export const enableAsyncDebugInfo = __EXPERIMENTAL__;

// Track which Fiber(s) schedule render work.
export const enableUpdaterTracking = __PROFILE__;

export const enableServerContext = __EXPERIMENTAL__;

// Internal only.
export const enableGetInspectorDataForInstanceInProduction = false;

// Profiler API accepts a function to be called when a nested update is scheduled.
// This callback accepts the component type (class instance or function) the update is scheduled for.
export const enableProfilerNestedUpdateScheduledHook = false;

export const consoleManagedByDevToolsDuringStrictMode = true;

// Modern <StrictMode /> behaviour aligns more with what components
// components will encounter in production, especially when used With <Offscreen />.
// TODO: clean up legacy <StrictMode /> once tests pass WWW.
export const useModernStrictMode = false;
export const enableDO_NOT_USE_disableStrictPassiveEffect = false;
