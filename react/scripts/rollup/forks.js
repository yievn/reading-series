'use strict';

/**
 * 该文件的主要作用是定义一个“fork”机制，
 * 用于在不同的构建环境中选择合适的模块实现。
 * 这种机制允许React在不同的环境（如Web、React Native、Facebook内部环境等）
 * 中使用不同的代码路径，以优化性能或解决特定环境中的问题。
 * 
 * 具体来说，该文件的作用包括：
 * 1. 模块替换：定义了一系列模块路径和对应的替换逻辑。
 * 根据不同的bundleType、entry、dependencies等参数，
 * 选择合适的模块实现。这种替换可以解决模块间的循环依赖问题，
 * 或在不同环境中使用不同的实现。
 * 
 * 2. 环境适配：通过检查bundleType和entry，
 * 为不同的环境（如UMD、React Native、Facebook内部环境等）
 * 提供特定的实现。这种适配可以确保React在
 * 不同平台上运行时的行为一致性和性能优化。
 * 
 * 3. 错误处理：在某些情况下，如果没有找到合适的替换模块，
 * 文件会抛出错误。这种设计可以防止在构建或运行时使用不正确的模块实现。
 * 
 * 4. 配置管理：通过使用inlinedHostConfigs等配置，
 * 动态决定某些模块的替换逻辑。
 * 这种配置管理可以使代码库更具灵活性和可扩展性。
 * 
 * 总的来说，该文件是React构建系统的一部分，
 * 负责在不同的构建和运行环境中选择合适的模块实现，
 * 以确保React的功能和性能在各种环境中都能得到优化。
 */

const fs = require('node:fs');
const {bundleTypes, moduleTypes} = require('./bundles');
const inlinedHostConfigs = require('../shared/inlinedHostConfigs');

const {
  UMD_DEV,
  UMD_PROD,
  UMD_PROFILING,
  FB_WWW_DEV,
  FB_WWW_PROD,
  FB_WWW_PROFILING,
  RN_OSS_DEV,
  RN_OSS_PROD,
  RN_OSS_PROFILING,
  RN_FB_DEV,
  RN_FB_PROD,
  RN_FB_PROFILING,
} = bundleTypes;
const {RENDERER, RECONCILER} = moduleTypes;

const RELEASE_CHANNEL = process.env.RELEASE_CHANNEL;

// Default to building in experimental mode. If the release channel is set via
// an environment variable, then check if it's "experimental".
const __EXPERIMENTAL__ =
  typeof RELEASE_CHANNEL === 'string'
    ? RELEASE_CHANNEL === 'experimental'
    : true;

function findNearestExistingForkFile(path, segmentedIdentifier, suffix) {
  const segments = segmentedIdentifier.split('-');
  while (segments.length) {
    const candidate = segments.join('-');
    const forkPath = path + candidate + suffix;
    try {
      fs.statSync(forkPath);
      return forkPath;
    } catch (error) {
      // Try the next candidate.
    }
    segments.pop();
  }
  return null;
}

// If you need to replace a file with another file for a specific environment,
// add it to this list with the logic for choosing the right replacement.

// Fork paths are relative to the project root. They must include the full path,
// including the extension. We intentionally don't use Node's module resolution
// algorithm because 1) require.resolve doesn't work with ESM modules, and 2)
// the behavior is easier to predict.
const forks = Object.freeze({
  // Without this fork, importing `shared/ReactSharedInternals` inside
  // the `react` package itself would not work due to a cyclical dependency.
  './packages/shared/ReactSharedInternals.js': (
    bundleType,
    entry,
    dependencies
  ) => {
    if (entry === 'react') {
      return './packages/react/src/ReactSharedInternalsClient.js';
    }
    if (
      entry === 'react/src/ReactSharedSubset.js' ||
      entry === 'react/src/ReactSharedSubsetFB.js'
    ) {
      return './packages/react/src/ReactSharedInternalsServer.js';
    }
    if (!entry.startsWith('react/') && dependencies.indexOf('react') === -1) {
      // React internals are unavailable if we can't reference the package.
      // We return an error because we only want to throw if this module gets used.
      return new Error(
        'Cannot use a module that depends on ReactSharedInternals ' +
          'from "' +
          entry +
          '" because it does not declare "react" in the package ' +
          'dependencies or peerDependencies.'
      );
    }
    return null;
  },

  // Without this fork, importing `shared/ReactDOMSharedInternals` inside
  // the `react-dom` package itself would not work due to a cyclical dependency.
  './packages/shared/ReactDOMSharedInternals.js': (
    bundleType,
    entry,
    dependencies
  ) => {
    if (
      entry === 'react-dom' ||
      entry === 'react-dom/server-rendering-stub' ||
      entry === 'react-dom/src/ReactDOMSharedSubset.js'
    ) {
      return './packages/react-dom/src/ReactDOMSharedInternals.js';
    }
    if (
      !entry.startsWith('react-dom/') &&
      dependencies.indexOf('react-dom') === -1
    ) {
      // React DOM internals are unavailable if we can't reference the package.
      // We return an error because we only want to throw if this module gets used.
      return new Error(
        'Cannot use a module that depends on ReactDOMSharedInternals ' +
          'from "' +
          entry +
          '" because it does not declare "react-dom" in the package ' +
          'dependencies or peerDependencies.'
      );
    }
    return null;
  },

  // We have a few forks for different environments.
  './packages/shared/ReactFeatureFlags.js': (bundleType, entry) => {
    switch (entry) {
      case 'react-native-renderer':
        switch (bundleType) {
          case RN_FB_DEV:
          case RN_FB_PROD:
          case RN_FB_PROFILING:
            return './packages/shared/forks/ReactFeatureFlags.native-fb.js';
          case RN_OSS_DEV:
          case RN_OSS_PROD:
          case RN_OSS_PROFILING:
            return './packages/shared/forks/ReactFeatureFlags.native-oss.js';
          default:
            throw Error(
              `Unexpected entry (${entry}) and bundleType (${bundleType})`
            );
        }
      case 'react-native-renderer/fabric':
        switch (bundleType) {
          case RN_FB_DEV:
          case RN_FB_PROD:
          case RN_FB_PROFILING:
            return './packages/shared/forks/ReactFeatureFlags.native-fb.js';
          case RN_OSS_DEV:
          case RN_OSS_PROD:
          case RN_OSS_PROFILING:
            return './packages/shared/forks/ReactFeatureFlags.native-oss.js';
          default:
            throw Error(
              `Unexpected entry (${entry}) and bundleType (${bundleType})`
            );
        }
      case 'react-test-renderer':
        switch (bundleType) {
          case RN_FB_DEV:
          case RN_FB_PROD:
          case RN_FB_PROFILING:
          case RN_OSS_DEV:
          case RN_OSS_PROD:
          case RN_OSS_PROFILING:
            return './packages/shared/forks/ReactFeatureFlags.test-renderer.native.js';
          case FB_WWW_DEV:
          case FB_WWW_PROD:
          case FB_WWW_PROFILING:
            return './packages/shared/forks/ReactFeatureFlags.test-renderer.www.js';
        }
        return './packages/shared/forks/ReactFeatureFlags.test-renderer.js';
      default:
        switch (bundleType) {
          case FB_WWW_DEV:
          case FB_WWW_PROD:
          case FB_WWW_PROFILING:
            return './packages/shared/forks/ReactFeatureFlags.www.js';
          case RN_FB_DEV:
          case RN_FB_PROD:
          case RN_FB_PROFILING:
            return './packages/shared/forks/ReactFeatureFlags.native-fb.js';
        }
    }
    return null;
  },

  './packages/scheduler/index.js': (bundleType, entry, dependencies) => {
    switch (bundleType) {
      case UMD_DEV:
      case UMD_PROD:
      case UMD_PROFILING:
        if (dependencies.indexOf('react') === -1) {
          // It's only safe to use this fork for modules that depend on React,
          // because they read the re-exported API from the SECRET_INTERNALS object.
          return null;
        }
        // Optimization: for UMDs, use the API that is already a part of the React
        // package instead of requiring it to be loaded via a separate <script> tag
        return './packages/shared/forks/Scheduler.umd.js';
      default:
        // For other bundles, use the shared NPM package.
        return null;
    }
  },

  './packages/scheduler/src/SchedulerFeatureFlags.js': (
    bundleType,
    entry,
    dependencies
  ) => {
    if (
      bundleType === FB_WWW_DEV ||
      bundleType === FB_WWW_PROD ||
      bundleType === FB_WWW_PROFILING
    ) {
      return './packages/scheduler/src/forks/SchedulerFeatureFlags.www.js';
    }
    return './packages/scheduler/src/SchedulerFeatureFlags.js';
  },

  './packages/shared/consoleWithStackDev.js': (bundleType, entry) => {
    switch (bundleType) {
      case FB_WWW_DEV:
        return './packages/shared/forks/consoleWithStackDev.www.js';
      default:
        return null;
    }
  },

  './packages/react/src/ReactSharedInternalsClient.js': (bundleType, entry) => {
    switch (bundleType) {
      case UMD_DEV:
      case UMD_PROD:
      case UMD_PROFILING:
        return './packages/react/src/forks/ReactSharedInternalsClient.umd.js';
      default:
        return null;
    }
  },

  // Different wrapping/reporting for caught errors.
  './packages/shared/invokeGuardedCallbackImpl.js': (bundleType, entry) => {
    switch (bundleType) {
      case FB_WWW_DEV:
      case FB_WWW_PROD:
      case FB_WWW_PROFILING:
        return './packages/shared/forks/invokeGuardedCallbackImpl.www.js';
      default:
        return null;
    }
  },

  // Different dialogs for caught errors.
  './packages/react-reconciler/src/ReactFiberErrorDialog.js': (
    bundleType,
    entry
  ) => {
    switch (bundleType) {
      case FB_WWW_DEV:
      case FB_WWW_PROD:
      case FB_WWW_PROFILING:
        // Use the www fork which shows an error dialog.
        return './packages/react-reconciler/src/forks/ReactFiberErrorDialog.www.js';
      case RN_OSS_DEV:
      case RN_OSS_PROD:
      case RN_OSS_PROFILING:
      case RN_FB_DEV:
      case RN_FB_PROD:
      case RN_FB_PROFILING:
        switch (entry) {
          case 'react-native-renderer':
          case 'react-native-renderer/fabric':
            // Use the RN fork which plays well with redbox.
            return './packages/react-reconciler/src/forks/ReactFiberErrorDialog.native.js';
          default:
            return null;
        }
      default:
        return null;
    }
  },

  './packages/react-reconciler/src/ReactFiberConfig.js': (
    bundleType,
    entry,
    dependencies,
    moduleType
  ) => {
    if (dependencies.indexOf('react-reconciler') !== -1) {
      return null;
    }
    if (moduleType !== RENDERER && moduleType !== RECONCILER) {
      return null;
    }
    // eslint-disable-next-line no-for-of-loops/no-for-of-loops
    for (let rendererInfo of inlinedHostConfigs) {
      if (rendererInfo.entryPoints.indexOf(entry) !== -1) {
        const foundFork = findNearestExistingForkFile(
          './packages/react-reconciler/src/forks/ReactFiberConfig.',
          rendererInfo.shortName,
          '.js'
        );
        if (foundFork) {
          return foundFork;
        }
        // fall through to error
        break;
      }
    }
    throw new Error(
      'Expected ReactFiberConfig to always be replaced with a shim, but ' +
        `found no mention of "${entry}" entry point in ./scripts/shared/inlinedHostConfigs.js. ` +
        'Did you mean to add it there to associate it with a specific renderer?'
    );
  },

  './packages/react-server/src/ReactServerStreamConfig.js': (
    bundleType,
    entry,
    dependencies,
    moduleType
  ) => {
    if (dependencies.indexOf('react-server') !== -1) {
      return null;
    }
    if (moduleType !== RENDERER && moduleType !== RECONCILER) {
      return null;
    }
    // eslint-disable-next-line no-for-of-loops/no-for-of-loops
    for (let rendererInfo of inlinedHostConfigs) {
      if (rendererInfo.entryPoints.indexOf(entry) !== -1) {
        if (!rendererInfo.isServerSupported) {
          return null;
        }
        const foundFork = findNearestExistingForkFile(
          './packages/react-server/src/forks/ReactServerStreamConfig.',
          rendererInfo.shortName,
          '.js'
        );
        if (foundFork) {
          return foundFork;
        }
        // fall through to error
        break;
      }
    }
    throw new Error(
      'Expected ReactServerStreamConfig to always be replaced with a shim, but ' +
        `found no mention of "${entry}" entry point in ./scripts/shared/inlinedHostConfigs.js. ` +
        'Did you mean to add it there to associate it with a specific renderer?'
    );
  },

  './packages/react-server/src/ReactFizzConfig.js': (
    bundleType,
    entry,
    dependencies,
    moduleType
  ) => {
    if (dependencies.indexOf('react-server') !== -1) {
      return null;
    }
    if (moduleType !== RENDERER && moduleType !== RECONCILER) {
      return null;
    }
    // eslint-disable-next-line no-for-of-loops/no-for-of-loops
    for (let rendererInfo of inlinedHostConfigs) {
      if (rendererInfo.entryPoints.indexOf(entry) !== -1) {
        if (!rendererInfo.isServerSupported) {
          return null;
        }
        const foundFork = findNearestExistingForkFile(
          './packages/react-server/src/forks/ReactFizzConfig.',
          rendererInfo.shortName,
          '.js'
        );
        if (foundFork) {
          return foundFork;
        }
        // fall through to error
        break;
      }
    }
    throw new Error(
      'Expected ReactFizzConfig to always be replaced with a shim, but ' +
        `found no mention of "${entry}" entry point in ./scripts/shared/inlinedHostConfigs.js. ` +
        'Did you mean to add it there to associate it with a specific renderer?'
    );
  },

  './packages/react-server/src/ReactFlightServerConfig.js': (
    bundleType,
    entry,
    dependencies,
    moduleType
  ) => {
    if (dependencies.indexOf('react-server') !== -1) {
      return null;
    }
    if (moduleType !== RENDERER && moduleType !== RECONCILER) {
      return null;
    }
    // eslint-disable-next-line no-for-of-loops/no-for-of-loops
    for (let rendererInfo of inlinedHostConfigs) {
      if (rendererInfo.entryPoints.indexOf(entry) !== -1) {
        if (!rendererInfo.isServerSupported) {
          return null;
        }
        if (rendererInfo.isFlightSupported === false) {
          return new Error(
            `Expected not to use ReactFlightServerConfig with "${entry}" entry point ` +
              'in ./scripts/shared/inlinedHostConfigs.js. Update the renderer config to ' +
              'activate flight suppport and add a matching fork implementation for ReactFlightServerConfig.'
          );
        }
        const foundFork = findNearestExistingForkFile(
          './packages/react-server/src/forks/ReactFlightServerConfig.',
          rendererInfo.shortName,
          '.js'
        );
        if (foundFork) {
          return foundFork;
        }
        // fall through to error
        break;
      }
    }
    throw new Error(
      'Expected ReactFlightServerConfig to always be replaced with a shim, but ' +
        `found no mention of "${entry}" entry point in ./scripts/shared/inlinedHostConfigs.js. ` +
        'Did you mean to add it there to associate it with a specific renderer?'
    );
  },

  './packages/react-client/src/ReactFlightClientConfig.js': (
    bundleType,
    entry,
    dependencies,
    moduleType
  ) => {
    if (dependencies.indexOf('react-client') !== -1) {
      return null;
    }
    if (moduleType !== RENDERER && moduleType !== RECONCILER) {
      return null;
    }
    // eslint-disable-next-line no-for-of-loops/no-for-of-loops
    for (let rendererInfo of inlinedHostConfigs) {
      if (rendererInfo.entryPoints.indexOf(entry) !== -1) {
        if (!rendererInfo.isServerSupported) {
          return null;
        }
        if (rendererInfo.isFlightSupported === false) {
          return new Error(
            `Expected not to use ReactFlightClientConfig with "${entry}" entry point ` +
              'in ./scripts/shared/inlinedHostConfigs.js. Update the renderer config to ' +
              'activate flight suppport and add a matching fork implementation for ReactFlightClientConfig.'
          );
        }
        const foundFork = findNearestExistingForkFile(
          './packages/react-client/src/forks/ReactFlightClientConfig.',
          rendererInfo.shortName,
          '.js'
        );
        if (foundFork) {
          return foundFork;
        }
        // fall through to error
        break;
      }
    }
    throw new Error(
      'Expected ReactFlightClientConfig to always be replaced with a shim, but ' +
        `found no mention of "${entry}" entry point in ./scripts/shared/inlinedHostConfigs.js. ` +
        'Did you mean to add it there to associate it with a specific renderer?'
    );
  },

  // We wrap top-level listeners into guards on www.
  './packages/react-dom-bindings/src/events/EventListener.js': (
    bundleType,
    entry
  ) => {
    switch (bundleType) {
      case FB_WWW_DEV:
      case FB_WWW_PROD:
      case FB_WWW_PROFILING:
        if (__EXPERIMENTAL__) {
          // In modern builds we don't use the indirection. We just use raw DOM.
          return null;
        } else {
          // Use the www fork which is integrated with TimeSlice profiling.
          return './packages/react-dom-bindings/src/events/forks/EventListener-www.js';
        }
      default:
        return null;
    }
  },

  './packages/use-sync-external-store/src/useSyncExternalStore.js': (
    bundleType,
    entry
  ) => {
    if (entry.startsWith('use-sync-external-store/shim')) {
      return './packages/use-sync-external-store/src/forks/useSyncExternalStore.forward-to-shim.js';
    }
    if (entry !== 'use-sync-external-store') {
      // Internal modules that aren't shims should use the native API from the
      // react package.
      return './packages/use-sync-external-store/src/forks/useSyncExternalStore.forward-to-built-in.js';
    }
    return null;
  },

  './packages/use-sync-external-store/src/isServerEnvironment.js': (
    bundleType,
    entry
  ) => {
    if (entry.endsWith('.native')) {
      return './packages/use-sync-external-store/src/forks/isServerEnvironment.native.js';
    }
  },
});

module.exports = forks;
