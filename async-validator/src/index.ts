import {
  format,
  complementError,
  asyncMap,
  warning,
  deepMerge,
  convertFieldsError,
} from './util';
import validators from './validator/index';
import { messages as defaultMessages, newMessages } from './messages';
import {
  InternalRuleItem,
  InternalValidateMessages,
  Rule,
  RuleItem,
  Rules,
  ValidateCallback,
  ValidateMessages,
  ValidateOption,
  Values,
  RuleValuePackage,
  ValidateError,
  ValidateFieldsError,
  SyncErrorType,
  ValidateResult,
} from './interface';

export * from './interface';

/**
 *  Encapsulates a validation schema.
 *
 *  @param descriptor An object declaring validation rules
 *  for this schema.
 */
class Schema {
  // ========================= Static =========================
  static register = function register(type: string, validator) {
    if (typeof validator !== 'function') {
      throw new Error(
        'Cannot register a validator by type, validator is not a function',
      );
    }
    validators[type] = validator;
  };

  static warning = warning;

  static messages = defaultMessages;

  static validators = validators;

  // ======================== Instance ========================
  rules: Record<string, RuleItem[]> = null;
  _messages: InternalValidateMessages = defaultMessages;

  constructor(descriptor: Rules) {
    this.define(descriptor);
  }

  define(rules: Rules) {
    // 不能是空的
    if (!rules) {
      throw new Error('Cannot configure a schema with no rules');
    }
    // 非对象
    if (typeof rules !== 'object' || Array.isArray(rules)) {
      throw new Error('Rules must be an object');
    }
    this.rules = {};
    /**将各规则转成数组形式 */
    Object.keys(rules).forEach(name => {
      const item: Rule = rules[name];
      this.rules[name] = Array.isArray(item) ? item : [item];
    });
  }

  messages(messages?: ValidateMessages) {
    if (messages) {
      this._messages = deepMerge(newMessages(), messages);
    }
    return this._messages;
  }

  validate(
    source: Values,
    option?: ValidateOption,
    callback?: ValidateCallback,
  ): Promise<Values>;
  validate(source: Values, callback: ValidateCallback): Promise<Values>;
  validate(source: Values): Promise<Values>;

  validate(source_: Values, o: any = {}, oc: any = () => {}): Promise<Values> {
    let source: Values = source_;
    let options: ValidateOption = o;
    let callback: ValidateCallback = oc;
    /**options是函数，那说明他其实是回调函数，此时真正options为空 */
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    /**如果这个时候规则是空的，那么就到这里了 */
    if (!this.rules || Object.keys(this.rules).length === 0) {
      if (callback) {
        callback(null, source);
      }
      return Promise.resolve(source);
    }

    function complete(results: (ValidateError | ValidateError[])[]) {
      let errors: ValidateError[] = [];
      let fields: ValidateFieldsError = {};

      function add(e: ValidateError | ValidateError[]) {
        if (Array.isArray(e)) {
          errors = errors.concat(...e);
        } else {
          errors.push(e);
        }
      }

      for (let i = 0; i < results.length; i++) {
        add(results[i]);
      }
      if (!errors.length) {
        // 没有错误
        callback(null, source);
      } else {
        fields = convertFieldsError(errors);
        (callback as (
          errors: ValidateError[],
          fields: ValidateFieldsError,
        ) => void)(errors, fields);
      }
    }

    if (options.messages) {
      let messages = this.messages();
      if (messages === defaultMessages) {
        messages = newMessages();
      }
      deepMerge(messages, options.messages);
      options.messages = messages;
    } else {
      options.messages = this.messages();
    }

    const series: Record<string, RuleValuePackage[]> = {};
    /**options.keys为空则验证rules所有规则 */
    const keys = options.keys || Object.keys(this.rules);
    keys.forEach(z => {
      /**z字段对应的规则 */
      const arr = this.rules[z];
      // z字段对应的值
      let value = source[z];
      // 逐个规则验证值
      arr.forEach(r => {
        let rule: InternalRuleItem = r;
        // 规则中有transform方法，则执行值转换
        if (typeof rule.transform === 'function') {
          // 复制一个，避免影响外层的source对象
          if (source === source_) {
            source = { ...source };
          }
          // 计算新的值
          value = source[z] = rule.transform(value);
        }
        // 如果此时rule是一个函数，那么把它当做一个validator
        if (typeof rule === 'function') {
          rule = {
            validator: rule,
          };
        } else { // 否则，复制一个
          rule = { ...rule };
        }

        // Fill validator. Skip if nothing need to validate
        rule.validator = this.getValidationMethod(rule);
        if (!rule.validator) {
          return;
        }

        rule.field = z;
        rule.fullField = rule.fullField || z;
        rule.type = this.getType(rule);
        series[z] = series[z] || [];
        series[z].push({
          rule,
          value,
          source,
          field: z,
        });
      });
    });
    const errorFields = {};
    return asyncMap(
      series,
      options,
      (data, doIt) => {
        /**data 为series项， data.rule校验规则 */
        const rule = data.rule;
        /**如果校验规则的type为objecte或者数组，并且存在嵌套的校验规则 */
        let deep =
          (rule.type === 'object' || rule.type === 'array') &&
          (typeof rule.fields === 'object' ||
            typeof rule.defaultField === 'object');
        
        deep = deep && (rule.required || (!rule.required && data.value));
        rule.field = data.field;

        function addFullField(key: string, schema: RuleItem) {
          return {
            ...schema,
            fullField: `${rule.fullField}.${key}`,
            fullFields: rule.fullFields ? [...rule.fullFields, key] : [key],
          };
        }

        function cb(e: SyncErrorType | SyncErrorType[] = []) {
          let errorList = Array.isArray(e) ? e : [e];
          if (!options.suppressWarning && errorList.length) {
            Schema.warning('async-validator:', errorList);
          }
          if (errorList.length && rule.message !== undefined) {
            errorList = [].concat(rule.message);
          }
          // Fill error info
          let filledErrors = errorList.map(complementError(rule, source));

          if (options.first && filledErrors.length) {
            errorFields[rule.field] = 1;
            return doIt(filledErrors);
          }
          if (!deep) {
            doIt(filledErrors);
          } else {
            // if rule is required but the target object
            // does not exist fail at the rule level and don't
            // go deeper
            if (rule.required && !data.value) {
              if (rule.message !== undefined) {
                filledErrors = []
                  .concat(rule.message)
                  .map(complementError(rule, source));
              } else if (options.error) {
                filledErrors = [
                  options.error(
                    rule,
                    format(options.messages.required, rule.field),
                  ),
                ];
              }
              return doIt(filledErrors);
            }

            let fieldsSchema: Record<string, Rule> = {};
            if (rule.defaultField) {
              Object.keys(data.value).map(key => {
                fieldsSchema[key] = rule.defaultField;
              });
            }
            fieldsSchema = {
              ...fieldsSchema,
              ...data.rule.fields,
            };

            const paredFieldsSchema: Record<string, RuleItem[]> = {};

            Object.keys(fieldsSchema).forEach(field => {
              const fieldSchema = fieldsSchema[field];
              const fieldSchemaList = Array.isArray(fieldSchema)
                ? fieldSchema
                : [fieldSchema];
              paredFieldsSchema[field] = fieldSchemaList.map(
                addFullField.bind(null, field),
              );
            });
            const schema = new Schema(paredFieldsSchema);
            schema.messages(options.messages);
            if (data.rule.options) {
              data.rule.options.messages = options.messages;
              data.rule.options.error = options.error;
            }
            schema.validate(data.value, data.rule.options || options, errs => {
              const finalErrors = [];
              if (filledErrors && filledErrors.length) {
                finalErrors.push(...filledErrors);
              }
              if (errs && errs.length) {
                finalErrors.push(...errs);
              }
              doIt(finalErrors.length ? finalErrors : null);
            });
          }
        }

        let res: ValidateResult;
        if (rule.asyncValidator) {
          res = rule.asyncValidator(rule, data.value, cb, data.source, options);
        } else if (rule.validator) {
          try {
            res = rule.validator(rule, data.value, cb, data.source, options);
          } catch (error) {
            console.error?.(error);
            // rethrow to report error
            if (!options.suppressValidatorError) {
              setTimeout(() => {
                throw error;
              }, 0);
            }
            cb(error.message);
          }
          if (res === true) {
            cb();
          } else if (res === false) {
            cb(
              typeof rule.message === 'function'
                ? rule.message(rule.fullField || rule.field)
                : rule.message || `${rule.fullField || rule.field} fails`,
            );
          } else if (res instanceof Array) {
            cb(res);
          } else if (res instanceof Error) {
            cb(res.message);
          }
        }
        if (res && (res as Promise<void>).then) {
          (res as Promise<void>).then(
            () => cb(),
            e => cb(e),
          );
        }
      },
      results => {
        complete(results);
      },
      source,
    );
  }

  getType(rule: InternalRuleItem) {
    // 具有正则表达式
    if (rule.type === undefined && rule.pattern instanceof RegExp) {
      rule.type = 'pattern';
    }
    /** */
    if (
      typeof rule.validator !== 'function' &&
      rule.type &&
      !validators.hasOwnProperty(rule.type)
    ) {
      throw new Error(format('Unknown rule type %s', rule.type));
    }
    return rule.type || 'string';
  }


  getValidationMethod(rule: InternalRuleItem) {
    /**存在validator函数 */
    if (typeof rule.validator === 'function') {
      return rule.validator;
    }
    const keys = Object.keys(rule);
    const messageIndex = keys.indexOf('message');
    /**如果有message字段 */
    if (messageIndex !== -1) {
      // 去除message字段
      keys.splice(messageIndex, 1);
    }
    /**如果只剩有一个required字段 */
    if (keys.length === 1 && keys[0] === 'required') {
      return validators.required;
    }

    return validators[this.getType(rule)] || undefined;
  }
}

export default Schema;
