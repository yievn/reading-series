import * as passport from 'passport';
import { Type } from '../interfaces';

/**
 * 用于创建和配置Passport.js 策略的工厂函数。Passport.js 
 * 是一个流行的Nodejs认证中间件，它通过策略的
 * 概念来支持多种认证机制
 * 
 * 这个策略在实例化的时候会将指定的策略注册到passport中的策略集合中，例如，我们可以通过PassportStrategy工厂函数
 * 传入passport的某个策略（LocalStrategy），然后
 */
export function PassportStrategy<T extends Type<any> = any>(
  /**代表要继承的Passport策略。例如，如果你想使用Strategy的本地策略，你可以传递Strategy为passport-local的Strategy类 */
  Strategy: T,
  /**用于定义策略的名称，如果提供，这个名称将用于注册策略，允许你在应用中使用多个同类型的策略 */
  name?: string | undefined,
  /**用于指定验证回调函数的参数数量，如果为true，则自动计算参数数量 */
  callbackArity?: true | number
): {
  new (...args): InstanceType<T>;
} {
  abstract class MixinStrategy extends Strategy {
    abstract validate(...args: any[]): any;

    constructor(...args: any[]) {
      const callback = async (...params: any[]) => {
        // 获取最后一个参数，作为回调函数
        const done = params[params.length - 1];
        try {
          // 校验
          const validateResult = await this.validate(...params);
          if (Array.isArray(validateResult)) {
            done(null, ...validateResult);
          } else {
            done(null, validateResult);
          }
        } catch (err) {
          done(err, null);
        }
      };

      /** */
      if (callbackArity !== undefined) {
        /**当一个构造函数正常通过new操作符调用时，
         * new.target指向该构造函数自身，
         * 如果构造函数是通过子类的构造函数调用的（即在继承链中），
         * new.target将指向最初被new调用的构造函数
         * 
         * 
         * 获取可能有子类提供或重写的方法，在PassportStrategy的上下文中，这种方式用于获取可能由继承
         * PassportStrategy的子类实现的validate方法，以便在策略的回调中使用这个方法进行用户验证
         * 
         *  */
        
        const validate = new.target?.prototype?.validate;
        /**如果callbackArity为true，则arity的值为validate函数的参数数量，+1表示passport给到的一个回调，否则由 callbackArity给的值
         * 
        */
        const arity = // 参数数量
          callbackArity === true ? validate.length + 1 : callbackArity;
        if (validate) {
          /**设置callback的参数数量 */ 
          Object.defineProperty(callback, 'length', {
            value: arity
          });
        }
      }
      /**初始化父策略 */
      super(...args, callback);

      const passportInstance = this.getPassportInstance();
      /**注册策略 */
      if (name) {
        /**提供了名称，则使用这个名称通过passport.use方法注册策略 */
        passportInstance.use(name, this as any);
      } else {
        passportInstance.use(this as any);
      }
    }

    getPassportInstance() {
      return passport;
    }
  }
  return MixinStrategy;
}
