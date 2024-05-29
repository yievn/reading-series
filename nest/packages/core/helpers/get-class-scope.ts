import { Scope } from '@nestjs/common';
import { SCOPE_OPTIONS_METADATA } from '@nestjs/common/constants';
import { Type } from '@nestjs/common/interfaces/type.interface';

export function getClassScope(provider: Type<unknown>): Scope {
  /**获取在提供者provider中SCOPE_OPTIONS_METADATA对应的作用域元数据，其实就是@Injectable(args)
   * 使用时传入的作用域配置对象
  */
  const metadata = Reflect.getMetadata(SCOPE_OPTIONS_METADATA, provider);
  return metadata && metadata.scope;
}
