import { computed, getCurrentInstance, inject, provide, ref, unref } from 'vue'
import { debugWarn, keysOf } from '@element-plus/utils'
import {
  SIZE_INJECTION_KEY,
  defaultInitialZIndex,
  defaultNamespace,
  localeContextKey,
  namespaceContextKey,
  useLocale,
  useNamespace,
  useZIndex,
  zIndexContextKey,
} from '@element-plus/hooks'
import { configProviderContextKey } from '../constants'

import type { MaybeRef } from '@vueuse/core'
import type { App, Ref } from 'vue'
import type { ConfigProviderContext } from '../constants'

// this is meant to fix global methods like `ElMessage(opts)`, this way we can inject current locale
// into the component as default injection value.
// refer to: https://github.com/element-plus/element-plus/issues/2610#issuecomment-887965266
/**
 * 这是为了修复像`ElMessage（opts）`这样的全局方法，这样我们就可以注入当前的locale 作为默认注入值。
 */
const globalConfig = ref<ConfigProviderContext>()
// 获取全局注入的配置，当传入key时，则拿到key对应的value，若key没有对应的值，则使用默认值
// 如果没有传入key，则返回整个配置对象
export function useGlobalConfig<
  K extends keyof ConfigProviderContext,
  D extends ConfigProviderContext[K]
>(
  key: K,
  defaultValue?: D
): Ref<Exclude<ConfigProviderContext[K], undefined> | D>
export function useGlobalConfig(): Ref<ConfigProviderContext>
export function useGlobalConfig(
  key?: keyof ConfigProviderContext,
  defaultValue = undefined
) {
  const config = getCurrentInstance()
    ? inject(configProviderContextKey, globalConfig)
    : globalConfig
  if (key) {
    return computed(() => config.value?.[key] ?? defaultValue)
  } else {
    return config
  }
}

// for components like `ElMessage` `ElNotification` `ElMessageBox`.
// 获取全局组件设置，例如ElMessage、ElNotification、ElMessageBox
export function useGlobalComponentSettings(
  block: string,
  sizeFallback?: MaybeRef<ConfigProviderContext['size']>
) {
  // 获取全局配置
  const config = useGlobalConfig()
  // 命名空间
  const ns = useNamespace(
    block,
    computed(() => config.value?.namespace || defaultNamespace)
  )
  // 语言设置
  const locale = useLocale(computed(() => config.value?.locale))
  // zindex值
  const zIndex = useZIndex(
    computed(() => config.value?.zIndex || defaultInitialZIndex)
  )
  const size = computed(() => unref(sizeFallback) || config.value?.size || '')
  provideGlobalConfig(computed(() => unref(config) || {}))

  return {
    ns,
    locale,
    zIndex,
    size,
  }
}
// 注入全局配置
// 如果传入app，最后注入点的是整个vue实例，不传入的话，是在当前组件实例
export const provideGlobalConfig = (
  config: MaybeRef<ConfigProviderContext>,
  app?: App,
  global = false
) => {
  // 组合式调用或者setup函数中调用getCurrentInstance才会返回值，否则返回undefined
  const inSetup = !!getCurrentInstance()
  // 旧配置，若inSetup为true，则从useGlobalConfig中获取，否则为undefined
  const oldConfig = inSetup ? useGlobalConfig() : undefined

  const provideFn = app?.provide ?? (inSetup ? provide : undefined)
  if (!provideFn) {
    debugWarn(
      'provideGlobalConfig',
      'provideGlobalConfig() can only be used inside setup().'
    )
    return
  }

  const context = computed(() => {
    const cfg = unref(config)
    if (!oldConfig?.value) return cfg
    return mergeConfig(oldConfig.value, cfg)
  })
  // 注入整个配置对象
  provideFn(configProviderContextKey, context)
  provideFn(
    localeContextKey,
    computed(() => context.value.locale)
  )
  provideFn(
    namespaceContextKey,
    computed(() => context.value.namespace)
  )
  provideFn(
    zIndexContextKey,
    computed(() => context.value.zIndex)
  )

  provideFn(SIZE_INJECTION_KEY, {
    size: computed(() => context.value.size || ''),
  })

  if (global || !globalConfig.value) {
    globalConfig.value = context.value
  }
  return context
}

// 合并a和b，当两边都有的属性，以b的值为准
const mergeConfig = (
  a: ConfigProviderContext,
  b: ConfigProviderContext
): ConfigProviderContext => {
  // 去重
  const keys = [...new Set([...keysOf(a), ...keysOf(b)])]
  const obj: Record<string, any> = {}
  for (const key of keys) {
    obj[key] = b[key] ?? a[key]
  }
  return obj
}
