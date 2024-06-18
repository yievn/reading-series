import * as mongoose from 'mongoose';
import { CannotDetermineTypeError } from '../errors';
import { RAW_OBJECT_DEFINITION } from '../mongoose.constants';
import { TypeMetadataStorage } from '../storages/type-metadata.storage';

const TYPE_METADATA_KEY = 'design:type';
/**
 * Interface defining property options that can be passed to `@Prop()` decorator.
 */
export type PropOptions<T = any> =
  | Partial<mongoose.SchemaDefinitionProperty<T>>
  | mongoose.SchemaType;

/**
 * @Prop decorator is used to mark a specific class property as a Mongoose property.
 * Only properties decorated with this decorator will be defined in the schema.
 * 
 * options: 可选参数，可以是MongoDB的SchemaDefinitionProperty机票或者其他配置，这些选项定义了如何将属性映射
 * 到MongoDB的模式字段
 */
export function Prop(options?: PropOptions): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    options = (options || {}) as mongoose.SchemaTypeOptions<unknown>;

    const isRawDefinition = options[RAW_OBJECT_DEFINITION];
    if (!options.type && !Array.isArray(options) && !isRawDefinition) {
      /**使用 Reflect.getMetadata 从属性上获取类型元数据 */
      const type = Reflect.getMetadata(TYPE_METADATA_KEY, target, propertyKey);
      /**根据获取的类型信息，自动设置 options.type。如果类型是 Array，
       * 则设置为 []（空数组表示数组类型）；
       * 如果是其他具体类型，则直接使用该类型。 */
      if (type === Array) {
        options.type = [];
      } else if (type && type !== Object) {
        options.type = type;
      } else {
        /**如果无法确定类型，并且没有提供明确的类型定义，
         * 将抛出 CannotDetermineTypeError 异常 */
        throw new CannotDetermineTypeError(
          target.constructor?.name,
          propertyKey as string,
        );
      }
    }

    TypeMetadataStorage.addPropertyMetadata({
      target: target.constructor,
      propertyKey: propertyKey as string,
      options: options as PropOptions,
    });
  };
}
