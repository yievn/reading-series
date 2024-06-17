import {
  RESPONSE_PASSTHROUGH_METADATA,
  ROUTE_ARGS_METADATA,
} from '../../constants';
import { RouteParamtypes } from '../../enums/route-paramtypes.enum';
import { PipeTransform } from '../../index';
import { Type } from '../../interfaces';
import { isNil, isString } from '../../utils/shared.utils';

/**
 * The `@Response()`/`@Res` parameter decorator options.
 * 用于配置@Response()或@Res()装饰器的行为，这种配置主要涉及响应的处理方式，尤其在决定是
 * 否通过nest的响应处理管道发送响应时
 */
/**
 * 这个配置选项通常用于那些需要细粒度控制HTTP响应的场景，例如，当你需要直接操作响应流，
 * 或者使用特定的第三方库来处理响应时，可以将passthrough设置true。这样，nest将不会介入
 * 响应的发送过程，开发者可以完全控制响应的内容和发送时机
 */
export interface ResponseDecoratorOptions {
  /**
   * Determines whether the response will be sent manually within the route handler,
   * with the use of native response handling methods exposed by the platform-specific response object,
   * or if it should passthrough Nest response processing pipeline.
   * 决定是否允许响应通过nest的内部响应处理管道。如果设置为true，则可以在路由处理器
   * 中手动处理和发送响应，而不使用nest的自动响应处理机制
   *
   * @default false
   * 默认值为false，这意味着默认情况下，nest会自动处理响应，开发者不需要
   * 手动调用例如res.end()或res.json()这样的方法
   */
  passthrough: boolean;
}
/**定义路由处理器参数装饰器中的额外参数 */
export type ParamData = object | string | number;
/**用于存储关于路由参数的元数据，
 * 这些元数据包括参数在函数中的位置、可能得额外数据，以及应用于该参数的管道 */
export interface RouteParamMetadata {
  /**参数在函数参数列表中的索引s */
  index: number;
  /**用于传递额外的数据或配置 */
  data?: ParamData;
}
/**
 * 
 * @param args 已存在的参数元数据对象
 * @param paramtype 参数类型，通常是RouteParamtypes枚举的一个值
 * @param index 参数在函数中的位置索引
 * @param data 用于传递额外的数据或配置
 * @param pipes 标识应用于该参数的管道数组
 * @returns 
 * 
 * 函数的主要功能是将新的参数配置合并到已有的参数元数据中。它通过创建一个新的键值对
 * 键是由参数类型和索引组成的字符串（例如"REQUEST:0"），值是一个包含索引、数据和管道
 * 的对象，这样，每个参数的配置都会被唯一地标识和存储
、 */
export function assignMetadata<TParamtype = any, TArgs = any>(
  args: TArgs,
  paramtype: TParamtype,
  index: number,
  data?: ParamData,
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
) {
  return {
    ...args,
    [`${paramtype}:${index}`]: {
      index,
      data,
      pipes,
    },
  };
}

/**
 * target vs target.constructor
 * 
 * target: 在方法装饰器中，target指的是类的原型，如果你在一个类的方法上使用
 * 装饰器，target将是该类的原型对象，这意味着所有非静态方法都是在这个原型上
 * 定义的。
 * 
 * target.constructor：这是指向类本身的构造函数。在JavaScript中，类本质上是函数
 * ，而构造函数就是这个类/函数本身。使用target.constructor可以访问到类的静态属性和
 * 方法
 * 
 * 在createRouteParamDecorator中，使用target.constructor而不是直接使用target
 * 的原因是，元数据需要被附加到类本身，而不仅仅是类的实例或其原型上。这是因为元数据是
 * 与类相关联的，而不是与类的某个特定实例相关联。
 * 
 * 当使用如@Get()、@Post()这样的路由装饰器时，这些装饰器通常应用于类的方法。这些
 * 方法在类的原型上定义，但是为了确保元数据能够正确地与整个类关联，需要将元数据附加到
 * 类的构造函数上，这样，无论何时创建类的实例，这些元数据都是可访问的，而且与类本身
 * 紧密相关。
 * 
 * 使用target.constructor来获取元数据，确保无论何时何地，只要有对类的引用，就能
 * 访问到这些元数据。如果使用target(即类的原型)，则只有在通过类的实例访问时才能获取到
 * 元数据。
 */
/**
 * 
 * @param paramtype 指定从请求中提取哪种类型的数据（如请求体、查询参数、路由参数等）
 * @returns 
 */
function createRouteParamDecorator(paramtype: RouteParamtypes) {
  return (data?: ParamData): ParameterDecorator =>
    (target, key, index) => {
      const args =
        Reflect.getMetadata(ROUTE_ARGS_METADATA, target.constructor, key) || {};
      // 将新的参数配置合并到已有的参数元数据中
      Reflect.defineMetadata(
        ROUTE_ARGS_METADATA,
        assignMetadata<RouteParamtypes, Record<number, RouteParamMetadata>>(
          args,
          paramtype,
          index,
          data,
        ),
        target.constructor,
        key,
      );
    };
}
/**
 * 
 * @param paramtype 
 * @returns 
 * 用于创建路由处理器参数装饰器，这些装饰器与管道（pipes）一起使用。管道主要用于参数的验证
 * 和转换，确保传入的数据符合预期格式，并进行适当的处理。这个工厂函数允许开发者自定义参数装饰器
 * 并在装饰器中嵌入管道逻辑，从而实现
 */
const createPipesRouteParamDecorator =
  (paramtype: RouteParamtypes) =>
  (
    data?: any,
    ...pipes: (Type<PipeTransform> | PipeTransform)[]
  ): ParameterDecorator =>
  (target, key, index) => {
    /**获取路由参数元数据 */
    const args =
      Reflect.getMetadata(ROUTE_ARGS_METADATA, target.constructor, key) || {};
    /**如果传入的data是null或者undefined，或者是字符串 */
    const hasParamData = isNil(data) || isString(data);
    /**要不就是没有值，就不就只能是字符串 */
    const paramData = hasParamData ? data : undefined;
    /**如果data是除了null、undefined、string之外的数据类型，那么默认都是管道类 */
    const paramPipes = hasParamData ? pipes : [data, ...pipes];
    
    Reflect.defineMetadata(
      ROUTE_ARGS_METADATA,
      assignMetadata(args, paramtype, index, paramData, ...paramPipes),
      target.constructor,
      key,
    );
  };

/**
 * Route handler parameter decorator. Extracts the `Request`
 * object from the underlying platform and populates the decorated
 * parameter with the value of `Request`.
 *
 * Example: `logout(@Request() req)`
 *
 * @see [Request object](https://docs.nestjs.com/controllers#request-object)
 *
 * @publicApi
 */
export const Request: () => ParameterDecorator = createRouteParamDecorator(
  RouteParamtypes.REQUEST,
);

/**
 * Route handler parameter decorator. Extracts the `Response`
 * object from the underlying platform and populates the decorated
 * parameter with the value of `Response`.
 *
 * Example: `logout(@Response() res)`
 *
 * @publicApi
 */
export const Response: (
  options?: ResponseDecoratorOptions,
) => ParameterDecorator =
  (options?: ResponseDecoratorOptions) => (target, key, index) => {
    /**
     * 默认值为false，这意味着默认情况下，nest会自动处理响应，开发者不需要
     * 手动调用例如res.end()或res.json()这样的方法
     */
    if (options?.passthrough) {
      Reflect.defineMetadata(
        RESPONSE_PASSTHROUGH_METADATA,
        options?.passthrough,
        target.constructor,
        key,
      );
    }
    return createRouteParamDecorator(RouteParamtypes.RESPONSE)()(
      target,
      key,
      index,
    );
  };

/**
 * Route handler parameter decorator. Extracts reference to the `Next` function
 * from the underlying platform and populates the decorated
 * parameter with the value of `Next`.
 *
 * @publicApi
 */
export const Next: () => ParameterDecorator = createRouteParamDecorator(
  RouteParamtypes.NEXT,
);

/**
 * Route handler parameter decorator. Extracts the `Ip` property
 * from the `req` object and populates the decorated
 * parameter with the value of `ip`.
 *
 * @see [Request object](https://docs.nestjs.com/controllers#request-object)
 *
 * @publicApi
 */
export const Ip: () => ParameterDecorator = createRouteParamDecorator(
  RouteParamtypes.IP,
);

/**
 * Route handler parameter decorator. Extracts the `Session` object
 * from the underlying platform and populates the decorated
 * parameter with the value of `Session`.
 *
 * @see [Request object](https://docs.nestjs.com/controllers#request-object)
 *
 * @publicApi
 */
export const Session: () => ParameterDecorator = createRouteParamDecorator(
  RouteParamtypes.SESSION,
);

/**
 * Route handler parameter decorator. Extracts the `file` object
 * and populates the decorated parameter with the value of `file`.
 * Used in conjunction with
 * [multer middleware](https://github.com/expressjs/multer) for Express-based applications.
 *
 * For example:
 * ```typescript
 * uploadFile(@UploadedFile() file) {
 *   console.log(file);
 * }
 * ```
 * @see [Request object](https://docs.nestjs.com/techniques/file-upload)
 *
 * @publicApi
 */
export function UploadedFile(): ParameterDecorator;
/**
 * Route handler parameter decorator. Extracts the `file` object
 * and populates the decorated parameter with the value of `file`.
 * Used in conjunction with
 * [multer middleware](https://github.com/expressjs/multer) for Express-based applications.
 *
 * For example:
 * ```typescript
 * uploadFile(@UploadedFile() file) {
 *   console.log(file);
 * }
 * ```
 * @see [Request object](https://docs.nestjs.com/techniques/file-upload)
 *
 * @publicApi
 */
export function UploadedFile(
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
): ParameterDecorator;

/**
 * Route handler parameter decorator. Extracts the `file` object
 * and populates the decorated parameter with the value of `file`.
 * Used in conjunction with
 * [multer middleware](https://github.com/expressjs/multer) for Express-based applications.
 *
 * For example:
 * ```typescript
 * uploadFile(@UploadedFile() file) {
 *   console.log(file);
 * }
 * ```
 * @see [Request object](https://docs.nestjs.com/techniques/file-upload)
 *
 * @publicApi
 */
export function UploadedFile(
  fileKey?: string,
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
): ParameterDecorator;
/**
 * Route handler parameter decorator. Extracts the `file` object
 * and populates the decorated parameter with the value of `file`.
 * Used in conjunction with
 * [multer middleware](https://github.com/expressjs/multer) for Express-based applications.
 *
 * For example:
 * ```typescript
 * uploadFile(@UploadedFile() file) {
 *   console.log(file);
 * }
 * ```
 * @see [Request object](https://docs.nestjs.com/techniques/file-upload)
 *
 * @publicApi
 */
export function UploadedFile(
  fileKey?: string | (Type<PipeTransform> | PipeTransform),
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
): ParameterDecorator {
  return createPipesRouteParamDecorator(RouteParamtypes.FILE)(
    fileKey,
    ...pipes,
  );
}

/**
 * Route handler parameter decorator. Extracts the `files` object
 * and populates the decorated parameter with the value of `files`.
 * Used in conjunction with
 * [multer middleware](https://github.com/expressjs/multer) for Express-based applications.
 *
 * For example:
 * ```typescript
 * uploadFile(@UploadedFiles() files) {
 *   console.log(files);
 * }
 * ```
 * @see [Request object](https://docs.nestjs.com/techniques/file-upload)
 *
 * @publicApi
 */
export function UploadedFiles(): ParameterDecorator;
/**
 * Route handler parameter decorator. Extracts the `files` object
 * and populates the decorated parameter with the value of `files`.
 * Used in conjunction with
 * [multer middleware](https://github.com/expressjs/multer) for Express-based applications.
 *
 * For example:
 * ```typescript
 * uploadFile(@UploadedFiles() files) {
 *   console.log(files);
 * }
 * ```
 * @see [Request object](https://docs.nestjs.com/techniques/file-upload)
 *
 * @publicApi
 */
export function UploadedFiles(
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
): ParameterDecorator;
/**
 * Route handler parameter decorator. Extracts the `files` object
 * and populates the decorated parameter with the value of `files`.
 * Used in conjunction with
 * [multer middleware](https://github.com/expressjs/multer) for Express-based applications.
 *
 * For example:
 * ```typescript
 * uploadFile(@UploadedFiles() files) {
 *   console.log(files);
 * }
 * ```
 * @see [Request object](https://docs.nestjs.com/techniques/file-upload)
 *
 * @publicApi
 */
export function UploadedFiles(
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
): ParameterDecorator {
  return createPipesRouteParamDecorator(RouteParamtypes.FILES)(
    undefined,
    ...pipes,
  );
}

/**
 * Route handler parameter decorator. Extracts the `headers`
 * property from the `req` object and populates the decorated
 * parameter with the value of `headers`.
 *
 * For example: `async update(@Headers('Cache-Control') cacheControl: string)`
 *
 * @param property name of single header property to extract.
 *
 * @see [Request object](https://docs.nestjs.com/controllers#request-object)
 *
 * @publicApi
 */
export const Headers: (property?: string) => ParameterDecorator =
  createRouteParamDecorator(RouteParamtypes.HEADERS);

/**
 * Route handler parameter decorator. Extracts the `query`
 * property from the `req` object and populates the decorated
 * parameter with the value of `query`. May also apply pipes to the bound
 * query parameter.
 *
 * For example:
 * ```typescript
 * async find(@Query('user') user: string)
 * ```
 *
 * @param property name of single property to extract from the `query` object
 * @param pipes one or more pipes to apply to the bound query parameter
 *
 * @see [Request object](https://docs.nestjs.com/controllers#request-object)
 *
 * @publicApi
 */
export function Query(): ParameterDecorator;
/**
 * Route handler parameter decorator. Extracts the `query`
 * property from the `req` object and populates the decorated
 * parameter with the value of `query`. May also apply pipes to the bound
 * query parameter.
 *
 * For example:
 * ```typescript
 * async find(@Query('user') user: string)
 * ```
 *
 * @param property name of single property to extract from the `query` object
 * @param pipes one or more pipes to apply to the bound query parameter
 *
 * @see [Request object](https://docs.nestjs.com/controllers#request-object)
 *
 * @publicApi
 */
export function Query(
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
): ParameterDecorator;
/**
 * Route handler parameter decorator. Extracts the `query`
 * property from the `req` object and populates the decorated
 * parameter with the value of `query`. May also apply pipes to the bound
 * query parameter.
 *
 * For example:
 * ```typescript
 * async find(@Query('user') user: string)
 * ```
 *
 * @param property name of single property to extract from the `query` object
 * @param pipes one or more pipes to apply to the bound query parameter
 *
 * @see [Request object](https://docs.nestjs.com/controllers#request-object)
 *
 * @publicApi
 */
export function Query(
  property: string,
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
): ParameterDecorator;
/**
 * Route handler parameter decorator. Extracts the `query`
 * property from the `req` object and populates the decorated
 * parameter with the value of `query`. May also apply pipes to the bound
 * query parameter.
 *
 * For example:
 * ```typescript
 * async find(@Query('user') user: string)
 * ```
 *
 * @param property name of single property to extract from the `query` object
 * @param pipes one or more pipes to apply to the bound query parameter
 *
 * @see [Request object](https://docs.nestjs.com/controllers#request-object)
 *
 * @publicApi
 */
export function Query(
  property?: string | (Type<PipeTransform> | PipeTransform),
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
): ParameterDecorator {
  return createPipesRouteParamDecorator(RouteParamtypes.QUERY)(
    property,
    ...pipes,
  );
}

/**
 * Route handler parameter decorator. Extracts the entire `body`
 * object from the `req` object and populates the decorated
 * parameter with the value of `body`.
 *
 * For example:
 * ```typescript
 * async create(@Body() createDto: CreateCatDto)
 * ```
 *
 * @see [Request object](https://docs.nestjs.com/controllers#request-object)
 *
 * @publicApi
 */
export function Body(): ParameterDecorator;

/**
 * Route handler parameter decorator. Extracts the entire `body`
 * object from the `req` object and populates the decorated
 * parameter with the value of `body`. Also applies the specified
 * pipes to that parameter.
 *
 * For example:
 * ```typescript
 * async create(@Body(new ValidationPipe()) createDto: CreateCatDto)
 * ```
 *
 * @param pipes one or more pipes - either instances or classes - to apply to
 * the bound body parameter.
 *
 * @see [Request object](https://docs.nestjs.com/controllers#request-object)
 * @see [Working with pipes](https://docs.nestjs.com/custom-decorators#working-with-pipes)
 *
 * @publicApi
 */
export function Body(
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
): ParameterDecorator;

/**
 * Route handler parameter decorator. Extracts a single property from
 * the `body` object property of the `req` object and populates the decorated
 * parameter with the value of that property. Also applies pipes to the bound
 * body parameter.
 *
 * For example:
 * ```typescript
 * async create(@Body('role', new ValidationPipe()) role: string)
 * ```
 *
 * @param property name of single property to extract from the `body` object
 * @param pipes one or more pipes - either instances or classes - to apply to
 * the bound body parameter.
 *
 * @see [Request object](https://docs.nestjs.com/controllers#request-object)
 * @see [Working with pipes](https://docs.nestjs.com/custom-decorators#working-with-pipes)
 *
 * @publicApi
 */
export function Body(
  property: string,
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
): ParameterDecorator;

/**
 * Route handler parameter decorator. Extracts the entire `body` object
 * property, or optionally a named property of the `body` object, from
 * the `req` object and populates the decorated parameter with that value.
 * Also applies pipes to the bound body parameter.
 *
 * For example:
 * ```typescript
 * async create(@Body('role', new ValidationPipe()) role: string)
 * ```
 *
 * @param property name of single property to extract from the `body` object
 * @param pipes one or more pipes - either instances or classes - to apply to
 * the bound body parameter.
 *
 * @see [Request object](https://docs.nestjs.com/controllers#request-object)
 * @see [Working with pipes](https://docs.nestjs.com/custom-decorators#working-with-pipes)
 *
 * @publicApi
 */
export function Body(
  property?: string | (Type<PipeTransform> | PipeTransform),
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
): ParameterDecorator {
  return createPipesRouteParamDecorator(RouteParamtypes.BODY)(
    property,
    ...pipes,
  );
}

/**
 * Route handler parameter decorator. Extracts the `params`
 * property from the `req` object and populates the decorated
 * parameter with the value of `params`. May also apply pipes to the bound
 * parameter.
 *
 * For example, extracting all params:
 * ```typescript
 * findOne(@Param() params: string[])
 * ```
 *
 * For example, extracting a single param:
 * ```typescript
 * findOne(@Param('id') id: string)
 * ```
 * @param property name of single property to extract from the `req` object
 * @param pipes one or more pipes - either instances or classes - to apply to
 * the bound parameter.
 *
 * @see [Request object](https://docs.nestjs.com/controllers#request-object)
 * @see [Working with pipes](https://docs.nestjs.com/custom-decorators#working-with-pipes)
 *
 * @publicApi
 */
export function Param(): ParameterDecorator;
/**
 * Route handler parameter decorator. Extracts the `params`
 * property from the `req` object and populates the decorated
 * parameter with the value of `params`. May also apply pipes to the bound
 * parameter.
 *
 * For example, extracting all params:
 * ```typescript
 * findOne(@Param() params: string[])
 * ```
 *
 * For example, extracting a single param:
 * ```typescript
 * findOne(@Param('id') id: string)
 * ```
 * @param property name of single property to extract from the `req` object
 * @param pipes one or more pipes - either instances or classes - to apply to
 * the bound parameter.
 *
 * @see [Request object](https://docs.nestjs.com/controllers#request-object)
 * @see [Working with pipes](https://docs.nestjs.com/custom-decorators#working-with-pipes)
 *
 * @publicApi
 */
export function Param(
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
): ParameterDecorator;
/**
 * Route handler parameter decorator. Extracts the `params`
 * property from the `req` object and populates the decorated
 * parameter with the value of `params`. May also apply pipes to the bound
 * parameter.
 *
 * For example, extracting all params:
 * ```typescript
 * findOne(@Param() params: string[])
 * ```
 *
 * For example, extracting a single param:
 * ```typescript
 * findOne(@Param('id') id: string)
 * ```
 * @param property name of single property to extract from the `req` object
 * @param pipes one or more pipes - either instances or classes - to apply to
 * the bound parameter.
 *
 * @see [Request object](https://docs.nestjs.com/controllers#request-object)
 * @see [Working with pipes](https://docs.nestjs.com/custom-decorators#working-with-pipes)
 *
 * @publicApi
 */
export function Param(
  property: string,
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
): ParameterDecorator;
/**
 * Route handler parameter decorator. Extracts the `params`
 * property from the `req` object and populates the decorated
 * parameter with the value of `params`. May also apply pipes to the bound
 * parameter.
 *
 * For example, extracting all params:
 * ```typescript
 * findOne(@Param() params: string[])
 * ```
 *
 * For example, extracting a single param:
 * ```typescript
 * findOne(@Param('id') id: string)
 * ```
 * @param property name of single property to extract from the `req` object
 * @param pipes one or more pipes - either instances or classes - to apply to
 * the bound parameter.
 *
 * @see [Request object](https://docs.nestjs.com/controllers#request-object)
 * @see [Working with pipes](https://docs.nestjs.com/custom-decorators#working-with-pipes)
 *
 * @publicApi
 */
export function Param(
  property?: string | (Type<PipeTransform> | PipeTransform),
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
): ParameterDecorator {
  return createPipesRouteParamDecorator(RouteParamtypes.PARAM)(
    property,
    ...pipes,
  );
}

/**
 * Route handler parameter decorator. Extracts the `hosts`
 * property from the `req` object and populates the decorated
 * parameter with the value of `hosts`. May also apply pipes to the bound
 * parameter.
 *
 * For example, extracting all params:
 * ```typescript
 * findOne(@HostParam() params: string[])
 * ```
 *
 * For example, extracting a single param:
 * ```typescript
 * findOne(@HostParam('id') id: string)
 * ```
 * @param property name of single property to extract from the `req` object
 *
 * @see [Request object](https://docs.nestjs.com/controllers#request-object)
 *
 * @publicApi
 */
export function HostParam(): ParameterDecorator;
/**
 * Route handler parameter decorator. Extracts the `hosts`
 * property from the `req` object and populates the decorated
 * parameter with the value of `hosts`. May also apply pipes to the bound
 * parameter.
 *
 * For example, extracting all params:
 * ```typescript
 * findOne(@HostParam() params: string[])
 * ```
 *
 * For example, extracting a single param:
 * ```typescript
 * findOne(@HostParam('id') id: string)
 * ```
 * @param property name of single property to extract from the `req` object
 *
 * @see [Request object](https://docs.nestjs.com/controllers#request-object)
 *
 * @publicApi
 */
export function HostParam(property: string): ParameterDecorator;
/**
 * Route handler parameter decorator. Extracts the `hosts`
 * property from the `req` object and populates the decorated
 * parameter with the value of `params`. May also apply pipes to the bound
 * parameter.
 *
 * For example, extracting all params:
 * ```typescript
 * findOne(@HostParam() params: string[])
 * ```
 *
 * For example, extracting a single param:
 * ```typescript
 * findOne(@HostParam('id') id: string)
 * ```
 * @param property name of single property to extract from the `req` object
 *
 * @see [Request object](https://docs.nestjs.com/controllers#request-object)
 *
 * @publicApi
 */
export function HostParam(
  property?: string | (Type<PipeTransform> | PipeTransform),
): ParameterDecorator {
  return createRouteParamDecorator(RouteParamtypes.HOST)(property);
}

export const Req = Request;
export const Res = Response;
