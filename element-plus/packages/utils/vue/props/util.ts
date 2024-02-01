/**将只读属性变为可写属性 */
export type Writable<T> = { -readonly [P in keyof T]: T[P] }
/**将只读数组类型转化为可写数组类型 */
export type WritableArray<T> = T extends readonly any[] ? Writable<T> : T
/**这个类型对类型 T 进行条件判断，如果是 never 类型，则返回 Y，否则返回 N */
export type IfNever<T, Y = true, N = false> = [T] extends [never] ? Y : N
/**
 * 这个类型对类型 T 进行条件判断，如果是 unknown 类型，则返回 Y，否则返回 N
 */
export type IfUnknown<T, Y, N> = [unknown] extends [T] ? Y : N
/**
 * 这个类型将类型 T 转换为 never 类型，如果它是 unknown，则为never，否则保持不变。
 */
export type UnknownToNever<T> = IfUnknown<T, never, T>

export {}


/**
 * 在 TypeScript 中，[T] 表示一个元组类型，
 * 即一个只有一个元素的元组。
 * 这种写法是为了避免 TypeScript 的类型系统对单个类型参数进行特殊处理。
 * 如果直接写 T，那么 T 可能会被 TypeScript 解释为一个单独的类型，
 * 而不是一个类型参数。
 * 使用 [T] 可以确保 T 被视为一个类型参数。
 */
