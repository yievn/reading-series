import { shallowReactive } from 'vue'
import type { ComponentInternalInstance, VNode } from 'vue'
import type { Mutable } from '@element-plus/utils'
import type { MessageHandler, MessageProps } from './message'

/**message上下文对象 */
export type MessageContext = {
  id: string
  vnode: VNode
  handler: MessageHandler
  vm: ComponentInternalInstance
  props: Mutable<MessageProps>
}
/**用于存放message实例 */
export const instances: MessageContext[] = shallowReactive([])
/**根据ID获取message实例 */
export const getInstance = (id: string) => {
  const idx = instances.findIndex((instance) => instance.id === id)
  const current = instances[idx]
  /**上一个message实例 */
  let prev: MessageContext | undefined
  if (idx > 0) {
    prev = instances[idx - 1]
  }
  return { current, prev }
}
/**用于计算最后一个实例的偏移值，基于上一个实例的位置 */
export const getLastOffset = (id: string): number => {
  const { prev } = getInstance(id)
  if (!prev) return 0
  return prev.vm.exposed!.bottom.value
}
/**获取偏移大小 */
export const getOffsetOrSpace = (id: string, offset: number) => {
  const idx = instances.findIndex((instance) => instance.id === id)
  return idx > 0 ? 20 : offset
}
