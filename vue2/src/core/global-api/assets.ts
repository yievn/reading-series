import { ASSET_TYPES } from 'shared/constants'
import type { GlobalAPI } from 'types/global-api'
import { isFunction, isPlainObject, validateComponentName } from '../util/index'

export function initAssetRegisters(Vue: GlobalAPI) {
  /**
   * 将components、filters、directives挂载到Vue上  阿萨
   */
  ASSET_TYPES.forEach(type => {
    // @ts-expect-error function is not exact same type
    Vue[type] = function (
      id: string,
      definition?: Function | Object
    ): Function | Object | void {
      if (!definition) {
        /**如果没有传入definition，那么代码是获取指定id的组件 */
        return this.options[type + 's'][id]
      } else {
        /**校验组件名称 */
        /* istanbul ignore if */
        if (__DEV__ && type === 'component') {
          validateComponentName(id)
        }
        // 如果当前是组件注册函数并且definition是一个普通对象
        if (type === 'component' && isPlainObject(definition)) {
          // @ts-expect-error
          definition.name = definition.name || id
          /**将definition设为Vue的子类 */
          definition = this.options._base.extend(definition)
        }
        /**如果当前是指令注册函数，并且definition为函数类型 */
        if (type === 'directive' && isFunction(definition)) {
          /**将definition转化为对象 */
          definition = { bind: definition, update: definition }
        }
        /**将definition挂载到options上对应assets集合上（components/filters/directives）*/
        this.options[type + 's'][id] = definition
        return definition
      }
    }
  })
}
