/**
 * ShapeFlags用来判断虚拟节点的类型以及它们的子节点的类型。
 */
export const enum ShapeFlags {
  /**表示这是一个普通的DOM元素 */
  ELEMENT = 1, // 1
  /**表示这是一个函数式组件 */
  FUNCTIONAL_COMPONENT = 1 << 1, // 2
  /**表示这是一个有状态的组件（基于类或选项的组件）*/
  STATEFUL_COMPONENT = 1 << 2, // 4
  /**表示子节点是文本节点 */
  TEXT_CHILDREN = 1 << 3, // 8
  /**表示子节点是数组（多个子节点） */
  ARRAY_CHILDREN = 1 << 4, // 16
  /**表示子节点是插槽 */
  SLOTS_CHILDREN = 1 << 5, // 32
  /**表示这是一个Teleport组件（用于将组件的内容渲染到 DOM 树的其他位置） */
  TELEPORT = 1 << 6, // 64
  /**表示这是一个Suspense组件（用于异步组件的加载状态管理） */
  SUSPENSE = 1 << 7, // 128
  /**表示组件应该被keep-alive缓存 */
  COMPONENT_SHOULD_KEEP_ALIVE = 1 << 8, // 256
  /**表示组件已经被keep-alive缓存 */
  COMPONENT_KEPT_ALIVE = 1 << 9, // 512
  /**表示这是一个组件，无论是有状态还是函数式的 */
  COMPONENT = ShapeFlags.STATEFUL_COMPONENT | ShapeFlags.FUNCTIONAL_COMPONENT
}
