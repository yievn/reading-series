import type { SetupContext, UnwrapRef } from 'vue'
import type {
  RuleItem,
  ValidateError,
  ValidateFieldsError,
} from 'async-validator'
import type { ComponentSize } from '@element-plus/constants'
import type { Arrayable } from '@element-plus/utils'
import type { MaybeRef } from '@vueuse/core'
import type {
  FormItemProp,
  FormItemProps,
  FormItemValidateState,
} from './form-item'
import type { FormEmits, FormProps } from './form'

import type { useFormLabelWidth } from './utils'

export type FormLabelWidthContext = ReturnType<typeof useFormLabelWidth>
export interface FormItemRule extends RuleItem {
  trigger?: Arrayable<string>
}
/**原始类型 */
type Primitive = null | undefined | string | number | boolean | symbol | bigint
/**浏览器内置对象 */
type BrowserNativeObject = Date | FileList | File | Blob | RegExp
/**
 * Check whether it is tuple
 *
 * 检查是否为元组
 *
 * @example
 * IsTuple<[1, 2, 3]> => true
 * IsTuple<Array[number]> => false
 * 判断语句检查是否 number 类型可以被赋值给数组的长度。
 * 如果数组的长度可以被赋值为 number 类型，说明它不是元组，因为元组的长度是固定的。
 */
type IsTuple<T extends ReadonlyArray<any>> = number extends T['length']
  ? false
  : true
/**
 * Array method key
 *
 * 获取数组的属性和方法的键联合类型
 */
type ArrayMethodKey = keyof any[]
/**
 * Tuple index key
 *
 * 元组下标键
 * 
 * Exclude<keyof T, ArrayMethodKey>
 * 
 * keyof T 获取T类型的属性（下标）和方法联合类型
 * Exclude 从T的下标和方法联合类型中排除掉数组的属性和方法的键类型，剩下的就是元组却确切的下标
 *
 * @example
 * TupleKey<[1, 2, 3]> => '0' | '1' | '2'
 */
type TupleKey<T extends ReadonlyArray<any>> = Exclude<keyof T, ArrayMethodKey>
/**
 * Array index key
 *
 * 数组下标键
 */
type ArrayKey = number
/**
 * Helper type for recursively constructing paths through a type
 *
 * 用于通过一个类型递归构建路径的辅助类型
 * 
 * type User = {
      id: number;
      name: string;
      address: {
        street: string;
        city: string;
      };
    };
    type UserPath = PathImpl<'user', User>;
    UserPath will be 'user' | 'user.id' | 'user.name' | 'user.address' | 'user.address.street' | 'user.address.city'
 */
type PathImpl<K extends string | number, V> = V extends
  | Primitive
  | BrowserNativeObject
  ? `${K}`
  : `${K}` | `${K}.${Path<V>}`
/**
 * Type which collects all paths through a type
 *
 * 通过一个类型收集所有路径的类型
 *
 * @see {@link FieldPath}
 */
/**
 * type ExampleType = {
      1: number;
      a: number;
      b: string;
      c: { d: number; e: string };
      f: [{ value: string }];
      g: { value: string }[];
      h: Date;
      i: FileList;
      j: File;
      k: Blob;
      l: RegExp;
    };
    type ExamplePath = Path<ExampleType>;
    // ExamplePath will be '1' | 'a' | 'b' | 'c' | 'f' | 'g' | 'c.d' | 'c.e' | 'f.0' | 'f.0.value' | 'g.number' | 'g.number.value' | 'h' | 'i' | 'j' | 'k' | 'l'
 */
type Path<T> = T extends ReadonlyArray<infer V>
  ? IsTuple<T> extends true
    ? {
        [K in TupleKey<T>]-?: PathImpl<Exclude<K, symbol>, T[K]>
      }[TupleKey<T>] // tuple 是元组
    : PathImpl<ArrayKey, V> // array 是数组
  : {
      [K in keyof T]-?: PathImpl<Exclude<K, symbol>, T[K]>
    }[keyof T] // object
/**
 * Type which collects all paths through a type
 *
 * 通过一个类型收集所有路径的类型
 *
 * @example
 * FieldPath<{ 1: number; a: number; b: string; c: { d: number; e: string }; f: [{ value: string }]; g: { value: string }[]; h: Date; i: FileList; j: File; k: Blob; l: RegExp }> => '1' | 'a' | 'b' | 'c' | 'f' | 'g' | 'c.d' | 'c.e' | 'f.0' | 'f.0.value' | 'g.number' | 'g.number.value' | 'h' | 'i' | 'j' | 'k' | 'l'
 */
type FieldPath<T> = T extends object ? Path<T> : never
export type FormRules<
  T extends MaybeRef<Record<string, any> | string> = string
> = Partial<
  Record<
    UnwrapRef<T> extends string ? UnwrapRef<T> : FieldPath<UnwrapRef<T>>,
    Arrayable<FormItemRule>
  >
>
/**校验结果 */
export type FormValidationResult = Promise<boolean>
/**校验回调 */
export type FormValidateCallback = (
  isValid: boolean,
  invalidFields?: ValidateFieldsError
) => void
/**校验失败 */
export interface FormValidateFailure {
  errors: ValidateError[] | null
  fields: ValidateFieldsError
}

export type FormContext = FormProps &
  UnwrapRef<FormLabelWidthContext> & {
    emit: SetupContext<FormEmits>['emit']
    getField: (prop: string) => FormItemContext | undefined
    addField: (field: FormItemContext) => void
    removeField: (field: FormItemContext) => void
    resetFields: (props?: Arrayable<FormItemProp>) => void
    clearValidate: (props?: Arrayable<FormItemProp>) => void
    validateField: (
      props?: Arrayable<FormItemProp>,
      callback?: FormValidateCallback
    ) => FormValidationResult
  }

export interface FormItemContext extends FormItemProps {
  $el: HTMLDivElement | undefined
  size: ComponentSize
  validateState: FormItemValidateState
  isGroup: boolean
  labelId: string
  inputIds: string[]
  hasLabel: boolean
  fieldValue: any
  addInputId: (id: string) => void
  removeInputId: (id: string) => void
  validate: (
    trigger: string,
    callback?: FormValidateCallback
  ) => FormValidationResult
  resetField(): void
  clearValidate(): void
}
