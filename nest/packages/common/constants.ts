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
 * 用于存储宿主的元数据信息，通常用于定义路由和控制器行为，可以标识和管理数组相关的信息
 */
export const HOST_METADATA = 'host';
/**用于存储路径的元数据信息，也用于定义路由和控制器的行为 ，标识和管理路径信息 */
export const PATH_METADATA = 'path';


// 依赖注入相关
/**
 *  用于存储构造函数参数的类型，主要用于依赖注入时解析参数类型。通过
 * 它可以在运行时获取构造函数参数的类型，以便进行依赖注入时的参数解析和处理
 */
export const PARAMTYPES_METADATA = 'design:paramtypes';
/**
 * 存储自声明的依赖项，即明确指定的依赖项，而不是通过类型推断得到的。
 * 通过它可以标识和管理在代码中显示声明的依赖项，以确保依赖注入时能够准确识别和应用这些依赖项
 */
export const SELF_DECLARED_DEPS_METADATA = 'self:paramtypes';
/**
 * 标记依赖项为可选，即在依赖项无法解析时不会抛出错误。
 * 通过它可以指示系统在处理依赖注入时，对于标记为可选的依赖项，
 * 即使无法解析也不会导致错误，提高代码的容错性和灵活性
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
/**将增强器键（如守卫、拦截器等）映射到其子类型，用于框架内部处理
 * 
 * 用于标识和管理不同类型的增强器（如守卫、拦截器等）的键值。在框架或应用程序中，增强器通常用于对
 * 请求或响应进行处理、拦截或增强，以实现特定的功能或逻辑。通过增强器键，可以将不同类型的增强器进行分类和区分，
 * 以便在处理请求时能够准确识别和应用响应的增强器。
 */
export const ENHANCER_KEY_TO_SUBTYPE_MAP = {
  [GUARDS_METADATA]: 'guard',
  [INTERCEPTORS_METADATA]: 'interceptor',
  [PIPES_METADATA]: 'pipe',
  [EXCEPTION_FILTERS_METADATA]: 'filter',
} as const;

export type EnhancerSubtype =
  (typeof ENHANCER_KEY_TO_SUBTYPE_MAP)[keyof typeof ENHANCER_KEY_TO_SUBTYPE_MAP];

/**用于存储渲染模版的元数据信息，在处理HTTP请求时，可以使用
 * 这个常量来标识和管理与渲染模版相关的信息
 */
export const RENDER_METADATA = '__renderTemplate__';
/**
 * 用于存储HTTP响应状态码的元数据信息，在处理HTTP请求时，
 * 可以使用这个常量来存储和传递响应的状态码，以便控制和定制HTTP响应的状态
 */
export const HTTP_CODE_METADATA = '__httpCode__';
/**用于存储模块的路径信息。这个常量可以在模块加载和路由处理
 * 等场景中使用，用于表示和管理模块的路径信息
 */
export const MODULE_PATH = '__module_path__';
/**用于存储HTTP响应头信息，在处理HTTP请求时，可以使用这个常量来存储和传递响应头信息，以便控制
 * 和定制HTTP响应的头部内容
 */
export const HEADERS_METADATA = '__headers__';
/**用于存储重定向信息，在处理HTPP请求时，可以使用这个常量来存储重定向的目标路径，以便在需要时进行页面重定向操作 */
export const REDIRECT_METADATA = '__redirect__';
/**用于标识响应是否需要直接透传，在处理HTTP请求时，可以使用这个常量来标识响应是否需要直接透传给客户端，而不做其他处理 */
export const RESPONSE_PASSTHROUGH_METADATA = '__responsePassthrough__';
/**用于标识服务器发送事件（Server-Sent Events）的元数据信息，在处理HTTP请求和管理服务器发送事件的相关逻辑 */
export const SSE_METADATA = '__sse__';
/**标注版本号 */
export const VERSION_METADATA = '__version__';
/**这些常量用于标记类或提供者的特定角色或特性，如可注入的、控制器、异常过滤器、入口提供者等 */
export const INJECTABLE_WATERMARK = '__injectable__';
/**标注一个类为controller */
export const CONTROLLER_WATERMARK = '__controller__';
/**标注一个类为异常过滤器 */
export const CATCH_WATERMARK = '__catch__';
/**用于标识一个类为入口提供者的常量，表示该类具有特定的角色或特性，在框架中可能会被用于特殊处理或识别 */
/**
 * 入口提供者通常具有以下特点：
 * 关键性：它们通常是应用启动和运行所必须的，如数据库链接、配置管理等
 * 优先处理：在模块的初始化过程中，这些提供者需要被优先创建和配置，以确保其他部分的正常运行。
 * 
 * 方法实现的原因
1. 初始化顺序控制：通过标记和识别入口提供者，NestJS 可以控制依赖注入的初始化顺序，确保关键服务先于其他服务初始化。
2. 模块化和封装：入口提供者的概念支持了更好的模块化设计，允许模块明确其初始化逻辑的关键部分，从而提高了代码的可读性和可维护性。
3. 灵活性和扩展性：开发者可以通过定义入口提供者来扩展模块的功能，使得模块更加灵活和可配置。
 */
export const ENTRY_PROVIDER_WATERMARK = '__entryProvider__';
