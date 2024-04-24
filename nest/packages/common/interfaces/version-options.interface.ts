import { VersioningType } from '../enums/version-type.enum';

/**
 * Indicates that this will work for any version passed in the request, or no version.
 *
 * @publicApi
 * VERSION_NEUTRAL被用作一个特殊的标识符，表示某个路由或控制器是版本中立的，
 * 即它不属于任何特定的版本，对所有版本
 * 都可用。
 */
export const VERSION_NEUTRAL = Symbol('VERSION_NEUTRAL');

/**
 * @publicApi
 */
export type VersionValue =
  | string
  | typeof VERSION_NEUTRAL
  | Array<string | typeof VERSION_NEUTRAL>;

/**
 * @publicApi
 */
export interface VersionOptions {
  /**
   * Specifies an optional API Version. When configured, methods
   * within the controller will only be routed if the request version
   * matches the specified value.
   *
   * Supported only by HTTP-based applications (does not apply to non-HTTP microservices).
   *
   * @see [Versioning](https://docs.nestjs.com/techniques/versioning)
   * 
   * 允许指定一个或多个版本号，这些版本号将应用于装饰器（如@Controller或@Get等）标记的控制器或
   * 路由处理程序。客户端可以通过请求头、URL参数或URL前缀来指定他们希望调用的API版本
   * 
   * 可以是一个字符串、字符串数组或符号，用于定义特定路由或控制器支持的版本。
   */
  version?: VersionValue;
}

/**
 * @publicApi
 */
export interface HeaderVersioningOptions {
  type: VersioningType.HEADER;
  /**
   * The name of the Request Header that contains the version.
   * 包含版本号的请求头名称
   */
  header: string;
}

/**
 * @publicApi
 */
export interface UriVersioningOptions {
  type: VersioningType.URI;
  /**
   * Optional prefix that will prepend the version within the URI.
   *
   * Defaults to `v`.
   *
   * Ex. Assuming a version of `1`, for `/api/v1/route`, `v` is the prefix.
   */
  prefix?: string | false;
}

/**
 * @publicApi
 */
export interface MediaTypeVersioningOptions {
  type: VersioningType.MEDIA_TYPE;
  /**
   * The key within the Media Type Header to determine the version from.
   *
   * Ex. For `application/json;v=1`, the key is `v=`.
   * 在媒体类型头部中版本号对应的键名称
   */
  key: string;
}

/**
 * @publicApi
 */
export interface CustomVersioningOptions {
  type: VersioningType.CUSTOM;

  /**
   * A function that accepts a request object (specific to the underlying platform, ie Express or Fastify)
   * and returns a single version value or an ordered array of versions, in order from HIGHEST to LOWEST.
   *接受一个请求对象，
   * Ex. Returned version array = ['3.1', '3.0', '2.5', '2', '1.9']
   *
   * Use type assertion or narrowing to identify the specific request type.
   */
  extractor: (request: unknown) => string | string[];
}

/**
 * @publicApi
 */
interface VersioningCommonOptions {
  /**
   * The default version to be used as a fallback when you did not provide some
   * // 默认版本用于当没有提供版本号时，作为一个回退处理
   * version to `@Controller()` nor `@Version()`.
   */
  defaultVersion?: VersionOptions['version'];
}

/**
 * @publicApi
 */
export type VersioningOptions = VersioningCommonOptions &
  (
    | HeaderVersioningOptions
    | UriVersioningOptions
    | MediaTypeVersioningOptions
    | CustomVersioningOptions
  );
