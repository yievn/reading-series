import {
  Transition,
  createApp,
  createVNode,
  defineComponent,
  h,
  reactive,
  ref,
  toRefs,
  vShow,
  withCtx,
  withDirectives,
} from 'vue'
import { removeClass } from '@element-plus/utils'
import { useGlobalComponentSettings } from '@element-plus/components/config-provider'

import type { UseNamespaceReturn } from '@element-plus/hooks'
import type { LoadingOptionsResolved } from './types'

export function createLoadingComponent(options: LoadingOptionsResolved) {
  let afterLeaveTimer: number
  // IMPORTANT NOTE: this is only a hacking way to expose the injections on an
  // instance, DO NOT FOLLOW this pattern in your own code.
  const afterLeaveFlag = ref(false)
  const data = reactive({
    ...options,
    originalPosition: '',
    originalOverflow: '',
    visible: false,
  })


  function setText(text: string) {
    data.text = text
  }

  function destroySelf() {
    const target = data.parent
    const ns = (vm as any).ns as UseNamespaceReturn
    if (!target.vLoadingAddClassList) {
      let loadingNumber: number | string | null =
        target.getAttribute('loading-number')
      /**当前父元素上挂载的loading组件的数量 */
      loadingNumber = Number.parseInt(loadingNumber as any) - 1
      if (!loadingNumber) {
        /**当前是父元素上挂载的最后一个loading，移除移除el-loading_parent--relative和loading-number */
        removeClass(target, ns.bm('parent', 'relative'))
        target.removeAttribute('loading-number')
      } else {
        /**设置减一的loading-number属性，表示当前父组件挂载的loading少了一个 */
        target.setAttribute('loading-number', loadingNumber.toString())
      }
      /**移除el-loadingparent--hidden类名 */
      removeClass(target, ns.bm('parent', 'hidden'))
    }
    /**从父节点中移除当前loading组件DOM */
    removeElLoadingChild()
    /**从loading组件中卸载 */
    loadingInstance.unmount()
  }
  function removeElLoadingChild(): void {
    vm.$el?.parentNode?.removeChild(vm.$el)
  }
  function close() {
    /**如果存在 beforeClose 选项，并且 beforeClose 函数返回 false，那么直接返回，不执行后续的关闭操作 */
    if (options.beforeClose && !options.beforeClose()) return
    /**表示 loading 组件即将离开 */
    afterLeaveFlag.value = true
    /**防止重复执行 */
    clearTimeout(afterLeaveTimer)
    /**这个延迟是为了等待 loading 组件的离开动画完成 */
    afterLeaveTimer = window.setTimeout(handleAfterLeave, 400)
    /**将触发 loading 组件的离开动画 */
    data.visible = false
    /**如果存在 closed 选项，那么执行 closed 函数。这允许用户在 loading 组件关闭后执行一些自定义的逻辑。 */
    options.closed?.()
  }

  function handleAfterLeave() {
    if (!afterLeaveFlag.value) return
    const target = data.parent
    afterLeaveFlag.value = false
    target.vLoadingAddClassList = undefined
    destroySelf()
  }

  const elLoadingComponent = defineComponent({
    name: 'ElLoading',
    setup(_, { expose }) {
      const { ns, zIndex } = useGlobalComponentSettings('loading')

      expose({
        ns,
        zIndex,
      })

      return () => {
        const svg = data.spinner || data.svg
        const spinner = h(
          'svg',
          {
            class: 'circular',
            viewBox: data.svgViewBox ? data.svgViewBox : '0 0 50 50',
            ...(svg ? { innerHTML: svg } : {}),
          },
          [
            h('circle', {
              class: 'path',
              cx: '25',
              cy: '25',
              r: '20',
              fill: 'none',
            }),
          ]
        )

        const spinnerText = data.text
          ? h('p', { class: ns.b('text') }, [data.text])
          : undefined

        return h(
          Transition,
          {
            name: ns.b('fade'),
            onAfterLeave: handleAfterLeave,
          },
          {
            default: withCtx(() => [
              withDirectives(
                createVNode(
                  'div',
                  {
                    style: {
                      backgroundColor: data.background || '',
                    },
                    class: [
                      ns.b('mask'),
                      data.customClass,
                      data.fullscreen ? 'is-fullscreen' : '',
                    ],
                  },
                  [
                    h(
                      'div',
                      {
                        class: ns.b('spinner'),
                      },
                      [spinner, spinnerText]
                    ),
                  ]
                ),
                [[vShow, data.visible]]
              ),
            ]),
          }
        )
      }
    },
  })

  const loadingInstance = createApp(elLoadingComponent)
  const vm = loadingInstance.mount(document.createElement('div'))

  return {
    ...toRefs(data),
    setText,
    removeElLoadingChild,
    close,
    handleAfterLeave,
    vm,
    get $el(): HTMLElement {
      return vm.$el
    },
  }
}

export type LoadingInstance = ReturnType<typeof createLoadingComponent>
