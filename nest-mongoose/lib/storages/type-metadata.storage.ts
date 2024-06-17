import { Type } from '@nestjs/common';
import { PropertyMetadata } from '../metadata/property-metadata.interface';
import { SchemaMetadata } from '../metadata/schema-metadata.interface';
import { isTargetEqual } from '../utils/is-target-equal-util';

/**用于存储和管理与Mongoose 模式（Schema）相关的类型元数据，这个类的实现使得nest与mongoose集成时能够有效地
 * 处理和查询模型的元数据，从而支持模型定义和模式生成的动态性和灵活性
 */
export class TypeMetadataStorageHost {
  /**用于存储SchemaMetadata对象的数组，这些对象包含了模式的类和相关的模式定义 */
  private schemas = new Array<SchemaMetadata>();
  /**用于存储PropertyMetadata对象的数组，这些对象包含了模式属性的配置和类型信息 */
  private properties = new Array<PropertyMetadata>();
  /**将属性元数据添加到properties数组的开头，这种方式确保了最新添加的元数据可以优先被访问 */
  addPropertyMetadata(metadata: PropertyMetadata) {
    this.properties.unshift(metadata);
  }
  /**添加模式元数据到schema数组，并在添加前通过compileClassMetadata方法处理类的元数据，
   * 确保类的属性元数据被正确处理和关联
   */
  addSchemaMetadata(metadata: SchemaMetadata) {
    /**如果metadata不存在properties的相关元数据配置，
     * 那就从properties数组中获取到当前schema类下的所有属性及其元数据 */
    this.compileClassMetadata(metadata);
    this.schemas.push(metadata);
  }

  getSchemaMetadataByTarget(target: Type<unknown>): SchemaMetadata | undefined {
    return this.schemas.find((item) => item.target === target);
  }

  private compileClassMetadata(metadata: SchemaMetadata) {
    const belongsToClass = isTargetEqual.bind(undefined, metadata);

    if (!metadata.properties) {
      metadata.properties = this.getClassFieldsByPredicate(belongsToClass);
    }
  }
  /**过滤出给定类中的所有属性配置 */
  private getClassFieldsByPredicate(
    belongsToClass: (item: PropertyMetadata) => boolean,
  ) {
    return this.properties.filter(belongsToClass);
  }
}

const globalRef = global as any;
export const TypeMetadataStorage: TypeMetadataStorageHost =
  globalRef.MongoTypeMetadataStorage ||
  (globalRef.MongoTypeMetadataStorage = new TypeMetadataStorageHost());
