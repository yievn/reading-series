/* eslint no-console:0 */

import {
  ValidateError,
  ValidateOption,
  RuleValuePackage,
  InternalRuleItem,
  SyncErrorType,
  RuleType,
  Value,
  Values,
} from './interface';

/**
 * 用于匹配字符串中的特定格式标记，
 * 如 %s、%d、%j 等。这个正则表达式通常用于格式化字符串模板，
 * 其中 %s 表示字符串，%d 表示数字，
 * %j 表示 JSON 对象。
 * 通过匹配这些格式标记，可以在字符串模板中动态替换相应的值，
 * 实现字符串的格式化输出。
 * 
 * 
 */
const formatRegExp = /%[sdj%]/g;

declare var ASYNC_VALIDATOR_NO_WARNING;

export let warning: (type: string, errors: SyncErrorType[]) => void = () => {};
/**在开发环境下warning */
// don't print warning message when in production env or node runtime
if (
  typeof process !== 'undefined' &&
  process.env &&
  process.env.NODE_ENV !== 'production' &&
  typeof window !== 'undefined' &&
  typeof document !== 'undefined'
) {
  warning = (type, errors) => {
    if (
      typeof console !== 'undefined' &&
      console.warn &&
      typeof ASYNC_VALIDATOR_NO_WARNING === 'undefined'
    ) {
      if (errors.every(e => typeof e === 'string')) {
        console.warn(type, errors);
      }
    }
  };
}

/**将错误数组转换为对象 */
export function convertFieldsError(
  errors: ValidateError[],
): Record<string, ValidateError[]> {
  if (!errors || !errors.length) return null;
  const fields = {};
  errors.forEach(error => {
    const field = error.field;
    fields[field] = fields[field] || [];
    fields[field].push(error);
  });
  return fields;
}
/**格式化字符串模版，将字符模版中的%s、%d、%j、%%替换成给定参数中的值 */
export function format(
  /**模板字符串或返回模板字符串的函数 */
  template: ((...args: any[]) => string) | string,
  ...args: any[]
): string {
  let i = 0;
  const len = args.length;
  if (typeof template === 'function') {
    return template.apply(null, args);
  }
  if (typeof template === 'string') {
    let str = template.replace(formatRegExp, x => {
      /**将 %% 替换为 % */
      if (x === '%%') {
        return '%';
      }
      /**如果左边匹配到的字符串数量大于参数数量，那就不替换了 */
      if (i >= len) {
        return x;
      }
      switch (x) {
        case '%s':
          return String(args[i++]);
        case '%d':
          return (Number(args[i++]) as unknown) as string;
        case '%j':
          try {
            return JSON.stringify(args[i++]);
          } catch (_) {
            return '[Circular]';
          }
          break;
        default:
          return x;
      }
    });
    return str;
  }
  return template;
}

function isNativeStringType(type: string) {
  return (
    type === 'string' ||
    type === 'url' ||
    type === 'hex' ||
    type === 'email' ||
    type === 'date' ||
    type === 'pattern'
  );
}
/**是否为空值 */
export function isEmptyValue(value: Value, type?: string) {
  /**如果值是null或undefined */
  if (value === undefined || value === null) {
    return true;
  }
  /**只为数组 */
  if (type === 'array' && Array.isArray(value) && !value.length) {
    return true;
  }
  /**值为字符串 */
  if (isNativeStringType(type) && typeof value === 'string' && !value) {
    return true;
  }
  return false;
}
/**是否为空对象 */
export function isEmptyObject(obj: object) {
  return Object.keys(obj).length === 0;
}

function asyncParallelArray(
  arr: RuleValuePackage[],
  func: ValidateFunc,
  callback: (errors: ValidateError[]) => void,
) {
  const results: ValidateError[] = [];
  let total = 0;
  const arrLength = arr.length;

  function count(errors: ValidateError[]) {
    results.push(...(errors || []));
    total++;
    if (total === arrLength) {
      callback(results);
    }
  }

  arr.forEach(a => {
    func(a, count);
  });
}
/**
 * an
 * @param arr 包含要处理的元素的数组。
 * @param func 
 * @param callback 
 */
function asyncSerialArray(
  arr: RuleValuePackage[],
  func: ValidateFunc,
  callback: (errors: ValidateError[]) => void,
) {
  let index = 0;
  const arrLength = arr.length;

  function next(errors: ValidateError[]) {
    /**有错误就立马返回 */
    if (errors && errors.length) {
      callback(errors);
      return;
    }
    const original = index;
    index = index + 1;
    if (original < arrLength) {
      func(arr[original], next);
    } else {
      callback([]);
    }
  }

  next([]);
}
// 将对象打平为数组
function flattenObjArr(objArr: Record<string, RuleValuePackage[]>) {
  const ret: RuleValuePackage[] = [];
  Object.keys(objArr).forEach(k => {
    ret.push(...(objArr[k] || []));
  });
  return ret;
}
// 异步验证错误类，继承自Error
export class AsyncValidationError extends Error {
  errors: ValidateError[];
  fields: Record<string, ValidateError[]>;

  constructor(
    errors: ValidateError[],
    fields: Record<string, ValidateError[]>,
  ) {
    super('Async Validation Error');
    this.errors = errors;
    this.fields = fields;
  }
}

type ValidateFunc = (
  data: RuleValuePackage,
  doIt: (errors: ValidateError[]) => void,
) => void;

/**
 * 
 * @param objArr 包含字段路径和对应的验证规则值的对象数组
 * @param option 包含验证选项，用于配置验证行为
 * @param func 用于执行验证的函数
 * @param callback 用于处理验证结果的回调函数
 * @param source 包含待验证值的对象
 * @returns 
 */
export function asyncMap(
  objArr: Record<string, RuleValuePackage[]>,
  option: ValidateOption,
  func: ValidateFunc,
  callback: (errors: ValidateError[]) => void,
  source: Values,
): Promise<Values> {
  // 当first为true，只要出现一个错误，就不继续向下校验
  if (option.first) {
    const pending = new Promise<Values>((resolve, reject) => {
      const next = (errors: ValidateError[]) => {
        callback(errors);
        // 有验证失败的错误
        return errors.length
          ? reject(new AsyncValidationError(errors, convertFieldsError(errors)))
          : resolve(source);
      };
      /**将series对象打平为数组 */
      const flattenArr = flattenObjArr(objArr);
      asyncSerialArray(flattenArr, func, next);
    });
    pending.catch(e => e);
    return pending;
  }
  const firstFields =
    option.firstFields === true
      ? Object.keys(objArr)
      : option.firstFields || [];
  /**所有字段key数组 */
  const objArrKeys = Object.keys(objArr);
  /**所有字段key数组 长度 */
  const objArrLength = objArrKeys.length;
  let total = 0;
  /**校验结果 */
  const results: ValidateError[] = [];
  const pending = new Promise<Values>((resolve, reject) => {
    const next = (errors: ValidateError[]) => {
      results.push.apply(results, errors);
      total++;
      if (total === objArrLength) {
        callback(results);
        return results.length
          ? reject(
              new AsyncValidationError(results, convertFieldsError(results)),
            )
          : resolve(source);
      }
    };
    if (!objArrKeys.length) {
      callback(results);
      resolve(source);
    }
    objArrKeys.forEach(key => {
      const arr = objArr[key];
      if (firstFields.indexOf(key) !== -1) {
        asyncSerialArray(arr, func, next);
      } else {
        asyncParallelArray(arr, func, next);
      }
    });
  });
  pending.catch(e => e);
  return pending;
}

/**是否为错误对象 */
function isErrorObj(
  obj: ValidateError | string | (() => string),
): obj is ValidateError {
  return !!(obj && (obj as ValidateError).message !== undefined);
}

function getValue(value: Values, path: string[]) {
  let v = value;
  for (let i = 0; i < path.length; i++) {
    if (v == undefined) {
      return v;
    }
    v = v[path[i]];
  }
  return v;
}

/**
 * 
 * @param rule 内部验证规则
 * @param source 待验证的源对象
 * @returns 返回一个错误对象生成函数
 */
export function complementError(rule: InternalRuleItem, source: Values) {
  return (oe: ValidateError | (() => string) | string): ValidateError => {
    let fieldValue;
    /**完整字段引用路径数组存在 */
    if (rule.fullFields) {
      fieldValue = getValue(source, rule.fullFields);
    } else {
      fieldValue = source[(oe as any).field || rule.fullField];
    }
    if (isErrorObj(oe)) {
      oe.field = oe.field || rule.fullField;
      oe.fieldValue = fieldValue;
      return oe;
    }
    return {
      message: typeof oe === 'function' ? oe() : oe,
      fieldValue,
      field: ((oe as unknown) as ValidateError).field || rule.fullField,
    };
  };
}

/**深度合并 */
export function deepMerge<T extends object>(target: T, source: Partial<T>): T {
  if (source) {
    for (const s in source) {
      if (source.hasOwnProperty(s)) {
        const value = source[s];
        if (typeof value === 'object' && typeof target[s] === 'object') {
          target[s] = {
            ...target[s],
            ...value,
          };
        } else {
          target[s] = value;
        }
      }
    }
  }
  return target;
}
