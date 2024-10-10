/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/**
 * 用于标识React根节点的类型，通过使用RootTag，React可以在内部区分不同类型的根节点
 */
export type RootTag = 0 | 1;
/**
 * 标识传统的（非并发）React根节点。在React18之前，所有的React根节点都是这种类型。
 * LegacyRoot代表了经典的同步渲染模式
 */
export const LegacyRoot = 0;
/**
 * 标识支持并发渲染的React根节点。ConcurrentRoot是React18引入的
 * 一个新特性，允许React在后台进行渲染操作，提高应用的性能和响应性。
 */
export const ConcurrentRoot = 1;

/**
 * 以上两个变量用于标识和区分React应用中的不同根节点类型。
 * LegacyRoot和ConcurrentRoot分别代表传统的同步渲染模式和
 * 新的并发渲染模式，通过使用这些标识，React可以在内部管理和优化渲染过程，
 * 确保应用的性能和用户体验。
 */