import { computed, getCurrentInstance, inject, ref, unref } from 'vue'
import { isNumber } from '@element-plus/utils'

import type { InjectionKey, Ref } from 'vue'

const zIndex = ref(0)
// 默认z-index为2000
export const defaultInitialZIndex = 2000

export const zIndexContextKey: InjectionKey<Ref<number | undefined>> =
  Symbol('zIndexContextKey')

export const useZIndex = (zIndexOverrides?: Ref<number>) => {
  // 如果有传入覆盖值zIndexOverrides，那么就用它，没有则找到注入的z-index值
  const zIndexInjection =
    zIndexOverrides ||
    (getCurrentInstance() ? inject(zIndexContextKey, undefined) : undefined)
    
  const initialZIndex = computed(() => {
    // 拿到注入的，没有用上面定义的默认值
    const zIndexFromInjection = unref(zIndexInjection)
    return isNumber(zIndexFromInjection)
      ? zIndexFromInjection
      : defaultInitialZIndex
  })
  const currentZIndex = computed(() => initialZIndex.value + zIndex.value)

  const nextZIndex = () => {
    zIndex.value++
    return currentZIndex.value
  }

  return {
    initialZIndex,
    currentZIndex,
    nextZIndex,
  }
}

export type UseZIndexReturn = ReturnType<typeof useZIndex>
