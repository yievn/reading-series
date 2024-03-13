import { buildProps, definePropType } from '@element-plus/utils'
import { useSizeProp } from '@element-plus/hooks'

import type { ExtractPropTypes } from 'vue'
import type { Language } from '@element-plus/locale'
import type { ButtonConfigContext } from '@element-plus/components/button'
import type { MessageConfigContext } from '@element-plus/components/message'

export type ExperimentalFeatures = {
  // TO BE Defined
}
/**
 * 该属性对象y关于配置Element plus组件库的全局属性和行为
 */
export const configProviderProps = buildProps({
  /**
   * @description Controlling if the users want a11y features
   * 控制是否启用可访问性 (Accessibility, a11y) 特性。
   * 当设置为 true 时，Element Plus 组件将遵循可访问性指南，
   * 以确保组件对残障用户友好。
   */
  a11y: {
    type: Boolean,
    default: true,
  },
  /**
   * @description Locale Object
   * 用于配置组件库使用的语言和文本，实现国际化
   */
  locale: {
    type: definePropType<Language>(Object),
  },
  /**
   * @description global component size
   * 设置全局组件的默认尺寸，这个属性可以影响所有支持尺寸属性的Element Plus组件，如按钮、输入框
   */
  size: useSizeProp,
  /**
   * @description button related configuration, [see the following table](#button-attributes)
   * 提供一个对象，用于配置全员的按钮相关属性，如按钮尺寸、颜色
   */
  button: {
    type: definePropType<ButtonConfigContext>(Object),
  },
  /**
   * @description features at experimental stage to be added, all features are default to be set to false   | ^[object]
   * 
   *用于启用或禁用处于实验阶段的特性，这允许开发者尝试新功能，同时保持向后兼容性
   */
  experimentalFeatures: {
    type: definePropType<ExperimentalFeatures>(Object),
  },
  /**
   * @description Controls if we should handle keyboard navigation
   * 控制是否启用键盘导航。当设置为true时，用户可以使用键盘操作组件，提高
   * 可访问性和用户体验
   */
  keyboardNavigation: {
    type: Boolean,
    default: true,
  },
  /**
   * @description message related configuration, [see the following table](#message-attributes)
   * 提供一个对象，用于配置全局的消息提示相关属性，如显示位置、持续时间
   */
  message: {
    type: definePropType<MessageConfigContext>(Object),
  },
  /**
   * @description global Initial zIndex
   * 设置全局组件的初始z-index值。这个值将影响弹出层、模态框等组件的堆叠顺序
   */
  zIndex: Number,
  /**
   * @description global component className prefix (cooperated with [$namespace](https://github.com/element-plus/element-plus/blob/dev/packages/theme-chalk/src/mixins/config.scss#L1)) | ^[string]
   * 设置全局组件的类名前缀。这允许你自定义Element Plus组件的类名，
   * 以避免样式冲突并更好地集成到现有的项目中
   */
  namespace: {
    type: String,
    default: 'el',
  },
} as const)
export type ConfigProviderProps = ExtractPropTypes<typeof configProviderProps>
