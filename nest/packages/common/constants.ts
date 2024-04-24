/**
 * 定义了模块元数据的键，用于标识模块imports（导入的模块）、providers（提供者既可以注入的服务）、
 * controllers（控制器，处理路由请求）、exports（导出的提供者，可被其他模块使用）
 */
export const MODULE_METADATA = {
  IMPORTS: 'imports',
  PROVIDERS: 'providers',
  CONTROLLERS: 'controllers',
  EXPORTS: 'exports',
};
/**
 * 用于标记模块为全局模块的元数据键，全局模块的提供者可以在任何地方被注入，无需再次导入
 */
export const GLOBAL_MODULE_METADATA = '__module:global__';
/**
 * 以下两个分别用于存储主机和路劲的元数据，通常用于定义路由和控制器的行为
 */
export const HOST_METADATA = 'host';
export const PATH_METADATA = 'path';


// 依赖注入相关
/**
 *  存储构造函数参数的类型，用于依赖注入时解析参数类型
 */
export const PARAMTYPES_METADATA = 'design:paramtypes';
/**
 * 存储自声明的依赖项，即明确指定的依赖项，而不是通过类型推断得到的
 */
export const SELF_DECLARED_DEPS_METADATA = 'self:paramtypes';
/**
 * 标记依赖项为可选，即在依赖项无法解析时不会抛出错误
 */
export const OPTIONAL_DEPS_METADATA = 'optional:paramtypes';


// 属性注入相关
/**用于存储类属性的依赖项及其可选依赖项的元数据 */
export const PROPERTY_DEPS_METADATA = 'self:properties_metadata';
export const OPTIONAL_PROPERTY_DEPS_METADATA = 'optional:properties_metadata';

/**存储作用域选项的元数据，影响提供者的生命周期（如单例或请求作用域） */
export const SCOPE_OPTIONS_METADATA = 'scope:options';

/**存储方法的元数据，通常用于路由处理 */
export const METHOD_METADATA = 'method';
/**以下两个分别用于存储路由参数和自定义路由参数的元数据 */
export const ROUTE_ARGS_METADATA = '__routeArguments__';
export const CUSTOM_ROUTE_ARGS_METADATA = '__customRouteArgs__';
/**用于标识异常过滤器可以捕获的异常类型 */
export const FILTER_CATCH_EXCEPTIONS = '__filterCatchExceptions__';
/**以下四个分别用于存储管道、守卫、拦截器、异常过滤器的元数据 */
export const PIPES_METADATA = '__pipes__';
/**守卫 */
export const GUARDS_METADATA = '__guards__';
/**拦截器 */
export const INTERCEPTORS_METADATA = '__interceptors__';
/**异常过滤器 */
export const EXCEPTION_FILTERS_METADATA = '__exceptionFilters__';
/**将增强器键（如守卫、拦截器等）映射到其子类型，用于框架内部处理 */
export const ENHANCER_KEY_TO_SUBTYPE_MAP = {
  [GUARDS_METADATA]: 'guard',
  [INTERCEPTORS_METADATA]: 'interceptor',
  [PIPES_METADATA]: 'pipe',
  [EXCEPTION_FILTERS_METADATA]: 'filter',
} as const;

export type EnhancerSubtype =
  (typeof ENHANCER_KEY_TO_SUBTYPE_MAP)[keyof typeof ENHANCER_KEY_TO_SUBTYPE_MAP];


export const RENDER_METADATA = '__renderTemplate__';
export const HTTP_CODE_METADATA = '__httpCode__';
export const MODULE_PATH = '__module_path__';
export const HEADERS_METADATA = '__headers__';
export const REDIRECT_METADATA = '__redirect__';
export const RESPONSE_PASSTHROUGH_METADATA = '__responsePassthrough__';
export const SSE_METADATA = '__sse__';
/**标注版本号 */
export const VERSION_METADATA = '__version__';
/**这些常量用于标记类或提供者的特定角色或特性，如可注入的、控制器、异常过滤器、入口提供者等 */
export const INJECTABLE_WATERMARK = '__injectable__';
/**标注一个类为controller */
export const CONTROLLER_WATERMARK = '__controller__';
/**标注一个类为异常过滤器 */
export const CATCH_WATERMARK = '__catch__';
export const ENTRY_PROVIDER_WATERMARK = '__entryProvider__';
