/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/**
 


/*

在 React 的代码中，使用二进制串来表示变量（如 `0b0000000`）通常是为了进行位操作和标志位管理。这种表示法在处理多个布尔标志或状态时非常有用，因为它允许在一个整数中存储多个独立的标志位。

### 使用二进制表示的原因

1. **位操作的便利性：**
   - 二进制表示法使得位操作（如按位与、按位或、按位取反）更加直观和高效。通过位操作，可以轻松地检查、设置或清除特定位。

2. **多标志位管理：**
   - 使用二进制表示法可以在一个整数中存储多个标志位。每个位可以表示一个独立的布尔状态，这在需要管理多个状态或标志时非常有用。

3. **内存效率：**
   - 将多个布尔值存储在一个整数中比使用多个独立的布尔变量更节省内存，尤其是在需要存储大量标志位时。

4. **状态组合：**
   - 二进制表示法允许轻松地组合和分解状态。例如，可以通过按位或操作将多个状态组合在一起，通过按位与操作检查特定状态。

### 在 React 中的应用

在 React 中，二进制标志位常用于表示组件或节点的不同模式、状态或特性。例如：

- **渲染模式**：使用二进制标志位来表示不同的渲染模式（如 `ConcurrentMode`、`StrictMode`）。
- **更新标志**：使用二进制标志位来表示不同的更新类型或优先级。
- **特性启用**：使用二进制标志位来表示某些特性或功能是否启用。

### 结论

使用二进制串来表示变量（如 `0b0000000`）在 React 中是为了方便地进行位操作和标志位管理。这种表示法在处理多个布尔标志或状态时非常高效和直观，允许在一个整数中存储和操作多个独立的标志位。通过这种方式，React 可以更高效地管理组件和节点的状态、模式和特性。

 */

export type TypeOfMode = number;

/**
 * 表示没有启用任何特殊模式。
 * 0b0000000，所有位为0，表示没有任何标志被设置。
 */
export const NoMode = /*                         */ 0b0000000;
// TODO: Remove ConcurrentMode by reading from the root tag instead
/**
 * 启用并发渲染模式
 * 
 */
export const ConcurrentMode = /*                 */ 0b0000001;
/**
 * 启用性能分析模式
 */
export const ProfileMode = /*                    */ 0b0000010;
/**
 * 启用调试跟踪模式
 */
export const DebugTracingMode = /*               */ 0b0000100;
/**
 * 启用严格模式的传统实现
 */
export const StrictLegacyMode = /*               */ 0b0001000;
/**
 * 启用严格的副作用模式
 */
export const StrictEffectsMode = /*              */ 0b0010000;
/**
 * 默认启用并发更新。
 */
export const ConcurrentUpdatesByDefaultMode = /* */ 0b0100000;
/**
 * 含义：禁用严格的被动效果模式。
 */
export const NoStrictPassiveEffectsMode = /*     */ 0b1000000;

