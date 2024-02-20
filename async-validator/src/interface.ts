// >>>>> Rule
// Modified from https://github.com/yiminghe/async-validator/blob/0d51d60086a127b21db76f44dff28ae18c165c47/src/index.d.ts
export type RuleType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'method'
  | 'regexp'
  | 'integer'
  | 'float'
  | 'array'
  | 'object'
  | 'enum'
  | 'date'
  | 'url'
  | 'hex'
  | 'email'
  | 'pattern'
  | 'any';

export interface ValidateOption {
  //  控制是否抑制内部警告信息
  suppressWarning?: boolean;

  // 控制是否抑制验证器错误
  suppressValidatorError?: boolean;

  /**
   * 当first为true时，表示在整个验证过程中，只要任何一个字段的第一个验证规则生成错误，
   * 就会停止处理后续规则，即停止处理所有字段的后续规则
   */
  first?: boolean;
  /**
   * 当firstFields为true时，表示每个字段的第一个验证规则生成错误时后悔停止该字段的后续规则，
   * 但不会影响其他其他字段的验证。这意味着即使某个字段的第一个验证规则出错，其他字段仍会继续验证，
   * 不会因为某个字段的错误而停止整个验证过程
   */
  firstFields?: boolean | string[];
  // 自定义验证消息，用于覆盖默认的验证消息。
  messages?: Partial<ValidateMessages>;

  // 需要触发的规则名称列表，如果为空则验证所有规则
  keys?: string[];
  // 自定义错误处理函数，用于生成验证错误对象。
  error?: (rule: InternalRuleItem, message: string) => ValidateError;
}

export type SyncErrorType = Error | string;
export type SyncValidateResult = boolean | SyncErrorType | SyncErrorType[];
export type ValidateResult = void | Promise<void> | SyncValidateResult;
/**
 * 
 */
export interface RuleItem {
  /**表示验证的规则类型，例如string、number、array等 */
  type?: RuleType; // default type is 'string'
  /**是否必须 */
  required?: boolean;
  /**字段的匹配模式 */
  pattern?: RegExp | string;
  /**字段的最小值 */
  min?: number; // Range of type 'string' and 'array'
  /**字段的最大值 */
  max?: number; // Range of type 'string' and 'array'
  /**字符串和数组的长度 */
  len?: number; // Length of type 'string' and 'array'
  /**当type为enum时字段可能得枚举值 */
  enum?: Array<string | number | boolean | null | undefined>; // possible values of type 'enum'
  /**是否允许空格 */
  whitespace?: boolean;
  /**嵌套字段的验证规则 */
  fields?: Record<string, Rule>; // ignore when without required
  /**验证选项 */
  options?: ValidateOption;
  /**默认验证规则 */
  defaultField?: Rule; // 'object' or 'array' containing validation rules
  /**字段值转换函数 */
  transform?: (value: Value) => Value;
  /**自定义验证信息 */
  message?: string | ((a?: string) => string);
  /**异步验证器函数 */
  asyncValidator?: (
    rule: InternalRuleItem,
    value: Value,
    callback: (error?: string | Error) => void,
    source: Values,
    options: ValidateOption,
  ) => void | Promise<void>;
  /**同步验证器函数 */
  validator?: (
    rule: InternalRuleItem,
    value: Value,
    callback: (error?: string | Error) => void,
    source: Values,
    options: ValidateOption,
  ) => SyncValidateResult | void;
}

export type Rule = RuleItem | RuleItem[];

export type Rules = Record<string, Rule>;

/**
 *  Rule for validating a value exists in an enumerable list.
 *  ExecuteRule函数的作用是根据给定的验证规则、值和选项，执行验证规则并
 * 根据验证结果进行相应的处理。在执行过程中，它会根据规则对值进行验证，并
 * 根据验证结果将可能出现的错误信息存储在errors数组中，通过执行验证规则，可以
 * 确保输入值符合指定的规则要求，从而保证数据的有效性和一致性
 *
 *  @param rule 要执行的验证规则.
 *  @param value 源对象上要验证的字段的值
 *  @param source 表示源对象，即包含要验证值的对象.
 *  @param errors 表示一个数组，用于存储验证过程中可能出现的错误信息
 *  @param options 表示验证的选项，包括控制验证行为的各种选项
 *  @param options.messages The validation messages.
 *  @param type Rule type 规则类型
 */
export type ExecuteRule = (
  rule: InternalRuleItem,
  value: Value,
  source: Values,
  errors: string[],
  options: ValidateOption,
  type?: string,
) => void;

/**
 *  Performs validation for any type.
 * 执行验证器
 *
 *  @param rule The validation rule.
 *  @param value The value of the field on the source object.
 *  @param callback The callback function.
 *  @param source The source object being validated.
 *  @param options The validation options.
 *  @param options.messages The validation messages.
 */
export type ExecuteValidator = (
  rule: InternalRuleItem,
  value: Value,
  callback: (error?: string[]) => void,
  source: Values,
  options: ValidateOption,
) => void;

// >>>>> Message校验信息  字符串或返回字符串的函数
type ValidateMessage<T extends any[] = unknown[]> =
  | string
  | ((...args: T) => string);
type FullField = string | undefined;
type EnumString = string | undefined;
type Pattern = string | RegExp | undefined;
type Range = number | undefined;
type Type = string | undefined;

export interface ValidateMessages {
  default?: ValidateMessage;
  required?: ValidateMessage<[FullField]>;
  enum?: ValidateMessage<[FullField, EnumString]>;
  whitespace?: ValidateMessage<[FullField]>;
  date?: {
    format?: ValidateMessage;
    parse?: ValidateMessage;
    invalid?: ValidateMessage;
  };
  types?: {
    string?: ValidateMessage<[FullField, Type]>;
    method?: ValidateMessage<[FullField, Type]>;
    array?: ValidateMessage<[FullField, Type]>;
    object?: ValidateMessage<[FullField, Type]>;
    number?: ValidateMessage<[FullField, Type]>;
    date?: ValidateMessage<[FullField, Type]>;
    boolean?: ValidateMessage<[FullField, Type]>;
    integer?: ValidateMessage<[FullField, Type]>;
    float?: ValidateMessage<[FullField, Type]>;
    regexp?: ValidateMessage<[FullField, Type]>;
    email?: ValidateMessage<[FullField, Type]>;
    url?: ValidateMessage<[FullField, Type]>;
    hex?: ValidateMessage<[FullField, Type]>;
  };
  string?: {
    len?: ValidateMessage<[FullField, Range]>;
    min?: ValidateMessage<[FullField, Range]>;
    max?: ValidateMessage<[FullField, Range]>;
    range?: ValidateMessage<[FullField, Range, Range]>;
  };
  number?: {
    len?: ValidateMessage<[FullField, Range]>;
    min?: ValidateMessage<[FullField, Range]>;
    max?: ValidateMessage<[FullField, Range]>;
    range?: ValidateMessage<[FullField, Range, Range]>;
  };
  array?: {
    len?: ValidateMessage<[FullField, Range]>;
    min?: ValidateMessage<[FullField, Range]>;
    max?: ValidateMessage<[FullField, Range]>;
    range?: ValidateMessage<[FullField, Range, Range]>;
  };
  pattern?: {
    mismatch?: ValidateMessage<[FullField, Value, Pattern]>;
  };
}

export interface InternalValidateMessages extends ValidateMessages {
  clone: () => InternalValidateMessages;
}

// >>>>> Values
export type Value = any;
export type Values = Record<string, Value>;

// >>>>> Validate
export interface ValidateError {
  message?: string;
  fieldValue?: Value;
  field?: string;
}

export type ValidateFieldsError = Record<string, ValidateError[]>;

/**验证回调函数 */
export type ValidateCallback = (
  errors: ValidateError[] | null,
  fields: ValidateFieldsError | Values,
) => void;

/**RuleValuePackage用来封装验证规则的值和相关信息，以便在验证过程中传递和处理。
 * 通过将信息封装在RuleValuePackage中，可以方便地传递和处理验证规则的值、规则信息以及字段信息。
 * 这有助于在验证过程中准确地处理和执行验证规则，确保数据的有效性和一致性。
 */
export interface RuleValuePackage {
  /**要执行的验证规则 */
  rule: InternalRuleItem;
  /**要验证的值 */
  value: Value;
  /**表示源对象，即包含要验证值的对象 */
  source: Values;
  /**表示字段的名 */
  field: string;
}
/**
 * 内部验证规则项，用于描述验证规则的具体内容，具体来说，
 * 它扩展了ruleItem类型，并添加了一些额外的属性和方法。
 * 通过定义内部验证规则项，可以更加灵活地描述规则的结构和行为，包括指定字段名称、完整性
 * 字段名称、验证器函数等信息。这有助于在验证过程中准确地处理和执行验证规则，确保
 * 数据的有效性和一致性
 */
export interface InternalRuleItem extends Omit<RuleItem, 'validator'> {
  field?: string;  //  字段名称 name
  fullField?: string; // 完整的字段引用路径 user.name
  fullFields?: string[]; // 字段引用路径数据
  validator?: RuleItem['validator'] | ExecuteValidator;
}
