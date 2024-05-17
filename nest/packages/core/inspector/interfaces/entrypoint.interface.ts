import { RequestMethod } from '@nestjs/common';
import { VersionValue } from '@nestjs/common/interfaces';

/**用于描述HTTP入口点（通常是控制器方法）的元数据 */
export type HttpEntrypointMetadata = {
  /**表示HTTP请求的路径 */
  path: string;
  requestMethod: keyof typeof RequestMethod;
  methodVersion?: VersionValue;
  controllerVersion?: VersionValue;
};

export type MiddlewareEntrypointMetadata = {
  path: string;
  requestMethod: keyof typeof RequestMethod;
  version?: VersionValue;
};

export type Entrypoint<T> = {
  id?: string;
  type: string;
  methodName: string;
  className: string;
  classNodeId: string;
  metadata: { key: string } & T;
};
