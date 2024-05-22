/**定义了不同类型的路由参数，这些参数可以在控制器的路由处理函数中
 * 通过装饰器注入，主要用于指定和区分请求对象中的不同数据源
 */
export enum RouteParamtypes {
  /**代表整个请求对象，使用@Req()或@Request()装饰器注入 */
  REQUEST,
  /**代表响应对象，使用@Res()或@Response() */
  RESPONSE,
  /**代表next函数，用于中间件中的流程控制。使用@Next()装饰器注入 */
  NEXT,
  /**用于获取请求体中的数据。使用@Body()装饰器注入 */
  BODY,
  /** 用于获取查询字符串参数。使用 @Query() 装饰器注入*/
  QUERY,
  /** 用于获取路由参数。使用 @Param() 装饰器注入。*/
  PARAM,
  /** 用于获取请求头。使用 @Headers() 装饰器注入。*/
  HEADERS,
  /** 用于获取会话数据。使用 @Session() 装饰器注入。*/
  SESSION,
  /**用于获取上传的单个文件。使用 @UploadedFile() 装饰器注入。 */
  FILE,
  /** 用于获取上传的多个文件。使用 @UploadedFiles() 装饰器注入。*/
  FILES,
  /** 用于获取请求的主机信息。使用 @HostParam() 装饰器注入。 */
  HOST,
  /** 用于获取请求来源的 IP 地址。使用 @Ip() 装饰器注入。*/
  IP,
}
