
export const mutable = <T extends readonly any[] | Record<string, unknown>>(
  val: T
) => val as Mutable<typeof val>
/**将类型T的所有属性从只读转换为可写 */
export type Mutable<T> = { -readonly [P in keyof T]: T[P] }

/**创建一个新类型，该类型结合了HTMLElement的所有属性和类型T的属性，相当于扩展了
 * 标准的HTMLElement类型，添加自定义属性
 */
export type HTMLElementCustomized<T> = HTMLElement & T

/**
 * @deprecated stop to use null
 * @see {@link https://github.com/sindresorhus/meta/discussions/7}
 */
/**该类型表示可以是T类型或者null */
export type Nullable<T> = T | null
/**该类型可以是T类型的单个值或者T类型的数组 */
export type Arrayable<T> = T | T[]
/**该类型可以是T类型的值，或者是一个解析为T类型的Promise，这在处理异步操作时非常有用，允许函数同时接受同步和
 * 异步的值
 */
export type Awaitable<T> = Promise<T> | T
