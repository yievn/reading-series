import {
  CONTROLLER_WATERMARK,
  HOST_METADATA,
  PATH_METADATA,
  SCOPE_OPTIONS_METADATA,
  VERSION_METADATA,
} from '../../constants';
import { ScopeOptions, VersionOptions } from '../../interfaces';
import { isString, isUndefined } from '../../utils/shared.utils';

/**
 * Interface defining options that can be passed to `@Controller()` decorator
 *
 * @publicApi
 */
export interface ControllerOptions extends ScopeOptions, VersionOptions {
  /**
   * Specifies an optional `route path prefix`.  The prefix is pre-pended to the
   * path specified in any request decorator in the class.
   *
   * Supported only by HTTP-based applications (does not apply to non-HTTP microservices).
   * 
   * 指定一个可选的路由路径前缀，这个前缀会被被预先加到类中请求方法装饰器中指定的路径之前
   *
   * @see [Routing](https://docs.nestjs.com/controllers#routing)
   */
  path?: string | string[];

  /**
   * Specifies an optional HTTP Request host filter.  When configured, methods
   * within the controller will only be routed if the request host matches the
   * specified value.
   * 用于指定一个可选的HTTP请求主机过滤器，当配置了这个属性后，控制器内的方法只会在请求的主机名与指定的值
   * 匹配时被路由处理，具体来说，host属性可以使一个字符串、正则表达式或它们的数组，这允许开发者在定义控制器时
   * 对接受请求的主机名进行限制，增加了一个额外的路由匹配条件，这在多主机部署或特定主机处理请求时非常有用，
   * 
   * 例如，如果你只想让某个控制器响应来自特定子域的请求，你可以这样配置：
   * @Controller({
  host: 'api.example.com'
})
class ExampleController {
  // 控制器方法
}
   *
   * @see [Routing](https://docs.nestjs.com/controllers#routing)
   */
  host?: string | RegExp | Array<string | RegExp>;
}

/**
 * 当使用@Controller() 修饰器而不传入任何参数时，它标记的类被定义为一个Nestjs控制器，用于处理进入的HTTP请求并
 * 产生响应，这个控制器将使用默认的配置，通常意味着：
 * 
 * 1、默认路由前缀：如果没有指定prefix，控制器的路由将默认没有任何前缀，即直接基于根URL
 * 2、无主机过滤：没有指定host，因此控制器将接受来自任何主机的请求。
 * 3、默认作用域和版本：如果没有通过options指定scope和version，控制器将使用
 * 默认的作用域和不特定于任何版本。
 * 
 * @Controller()
   class UserController {
   @Get('profile')
   getProfile() {
     return { name: "John Doe" };
   }

   @Post('update')
   updateProfile(@Body() body) {
     return { status: "Profile updated" };
   }
  }
 *在这个例子中，UserController 处理两个路由：GET /profile 和 POST /update。
 由于没有指定前缀或其他配置，这些路由直接挂载在根路径上。
 * @see [Controllers](https://docs.nestjs.com/controllers)
 * @see [Microservices](https://docs.nestjs.com/microservices/basics#request-response)
 *
 * @publicApi
 */
export function Controller(): ClassDecorator;

/**
 * Decorator that marks a class as a Nest controller that can receive inbound
 * requests and produce responses.
 *
 * An HTTP Controller responds to inbound HTTP Requests and produces HTTP Responses.
 * It defines a class that provides the context for one or more related route
 * handlers that correspond to HTTP request methods and associated routes
 * for example `GET /api/profile`, `POST /users/resume`.
 *
 * A Microservice Controller responds to requests as well as events, running over
 * a variety of transports [(read more here)](https://docs.nestjs.com/microservices/basics).
 * It defines a class that provides a context for one or more message or event
 * handlers.
 *
 * @param {string|Array} prefix string that defines a `route path prefix`.  The prefix
 * is pre-pended to the path specified in any request decorator in the class.
 *
 * @see [Routing](https://docs.nestjs.com/controllers#routing)
 * @see [Controllers](https://docs.nestjs.com/controllers)
 * @see [Microservices](https://docs.nestjs.com/microservices/basics#request-response)
 *
 * @publicApi
 */
export function Controller(prefix: string | string[]): ClassDecorator;
/**
 * Decorator that marks a class as a Nest controller that can receive inbound
 * requests and produce responses.
 *
 * An HTTP Controller responds to inbound HTTP Requests and produces HTTP Responses.
 * It defines a class that provides the context for one or more related route
 * handlers that correspond to HTTP request methods and associated routes
 * for example `GET /api/profile`, `POST /users/resume`.
 *
 * A Microservice Controller responds to requests as well as events, running over
 * a variety of transports [(read more here)](https://docs.nestjs.com/microservices/basics).
 * It defines a class that provides a context for one or more message or event
 * handlers.
 *
 * @param {object} options configuration object specifying:
 *
 * - `scope` - symbol that determines the lifetime of a Controller instance.
 * [See Scope](https://docs.nestjs.com/fundamentals/injection-scopes#usage) for
 * more details.
 * - `prefix` - string that defines a `route path prefix`.  The prefix
 * is pre-pended to the path specified in any request decorator in the class.
 * - `version` - string, array of strings, or Symbol that defines the version
 * of all routes in the class. [See Versioning](https://docs.nestjs.com/techniques/versioning)
 * for more details.
 *
 * @see [Routing](https://docs.nestjs.com/controllers#routing)
 * @see [Controllers](https://docs.nestjs.com/controllers)
 * @see [Microservices](https://docs.nestjs.com/microservices/basics#request-response)
 * @see [Versioning](https://docs.nestjs.com/techniques/versioning)
 *
 * @publicApi
 */
export function Controller(options: ControllerOptions): ClassDecorator;

/**
 * Decorator that marks a class as a Nest controller that can receive inbound
 * requests and produce responses.
 *
 * An HTTP Controller responds to inbound HTTP Requests and produces HTTP Responses.
 * It defines a class that provides the context for one or more related route
 * handlers that correspond to HTTP request methods and associated routes
 * for example `GET /api/profile`, `POST /users/resume`
 *
 * A Microservice Controller responds to requests as well as events, running over
 * a variety of transports [(read more here)](https://docs.nestjs.com/microservices/basics).
 * It defines a class that provides a context for one or more message or event
 * handlers.
 *
 * @param prefixOrOptions a `route path prefix` or a `ControllerOptions` object.
 * A `route path prefix` is pre-pended to the path specified in any request decorator
 * in the class. `ControllerOptions` is an options configuration object specifying:
 * - `scope` - symbol that determines the lifetime of a Controller instance.
 * [See Scope](https://docs.nestjs.com/fundamentals/injection-scopes#usage) for
 * more details.
 * - `prefix` - string that defines a `route path prefix`.  The prefix
 * is pre-pended to the path specified in any request decorator in the class.
 * - `version` - string, array of strings, or Symbol that defines the version
 * of all routes in the class. [See Versioning](https://docs.nestjs.com/techniques/versioning)
 * for more details.
 *
 * @see [Routing](https://docs.nestjs.com/controllers#routing)
 * @see [Controllers](https://docs.nestjs.com/controllers)
 * @see [Microservices](https://docs.nestjs.com/microservices/basics#request-response)
 * @see [Scope](https://docs.nestjs.com/fundamentals/injection-scopes#usage)
 * @see [Versioning](https://docs.nestjs.com/techniques/versioning)
 *
 * @publicApi
 */
export function Controller(
  prefixOrOptions?: string | string[] | ControllerOptions,
): ClassDecorator {
  const defaultPath = '/';

  const [path, host, scopeOptions, versionOptions] = isUndefined(
    prefixOrOptions,
  ) 
    ? [defaultPath, undefined, undefined, undefined] // 不存在，默认根路径 '/'
    : isString(prefixOrOptions) || Array.isArray(prefixOrOptions) // 是字符串或者是字符串数组
    ? [prefixOrOptions, undefined, undefined, undefined]
    : [
        prefixOrOptions.path || defaultPath,
        prefixOrOptions.host,
        { scope: prefixOrOptions.scope, durable: prefixOrOptions.durable },
        Array.isArray(prefixOrOptions.version)
          ? Array.from(new Set(prefixOrOptions.version)) // 去重并重新转化为数组
          : prefixOrOptions.version,
      ];

  return (target: object) => {
    // 将类标注为controller类
    Reflect.defineMetadata(CONTROLLER_WATERMARK, true, target);
    // 将path数据存为元数据
    Reflect.defineMetadata(PATH_METADATA, path, target);
    // 将host存为元数据
    Reflect.defineMetadata(HOST_METADATA, host, target);
    // 将作用域配置存为元数据
    Reflect.defineMetadata(SCOPE_OPTIONS_METADATA, scopeOptions, target);
    // 将版本数据存为元数据
    Reflect.defineMetadata(VERSION_METADATA, versionOptions, target);
  };
}
