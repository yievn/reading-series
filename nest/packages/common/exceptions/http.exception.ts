import {
  HttpExceptionBody,
  HttpExceptionBodyMessage,
} from '../interfaces/http/http-exception-body.interface';
import { isObject, isString } from '../utils/shared.utils';

export interface HttpExceptionOptions {
  /** original cause of the error */
  /**
   * cause通常是一个Error对象或其他异常对象，用于表示导致当前异常发生的根本原因，通过保留
   * cause属性，可以建立异常之间的关联，帮助开发人员更好地定位和解决问题。
   * 总的来说，cause属性的作用是用于个跟踪异常的原因，帮助开发人员更好地理解异常的来源和
   * 上下文，以便更好地处理和调试异常情况。
   */
  cause?: unknown;
  description?: string;
}

export interface DescriptionAndOptions {
  description?: string;
  httpExceptionOptions?: HttpExceptionOptions;
}

/**
 * Defines the base Nest HTTP exception, which is handled by the default
 * Exceptions Handler.
 *
 * @see [Built-in HTTP exceptions](https://docs.nestjs.com/exception-filters#built-in-http-exceptions)
 *
 * @publicApi
 */
export class HttpException extends Error {
  /**
   * Instantiate a plain HTTP Exception.
   *
   * @example
   * throw new HttpException()
   * throw new HttpException('message', HttpStatus.BAD_REQUEST)
   * throw new HttpException('custom message', HttpStatus.BAD_REQUEST, {
   *  cause: new Error('Cause Error'),
   * })
   *
   *
   * @usageNotes
   * The constructor arguments define the response and the HTTP response status code.
   * - The `response` argument (required) defines the JSON response body. alternatively, it can also be
   *  an error object that is used to define an error [cause](https://nodejs.org/en/blog/release/v16.9.0/#error-cause).
   * - The `status` argument (required) defines the HTTP Status Code.
   * - The `options` argument (optional) defines additional error options. Currently, it supports the `cause` attribute,
   *  and can be used as an alternative way to specify the error cause: `const error = new HttpException('description', 400, { cause: new Error() });`
   *
   * By default, the JSON response body contains two properties:
   * - `statusCode`: the Http Status Code.
   * - `message`: a short description of the HTTP error by default; override this
   * by supplying a string in the `response` parameter.
   *
   * To override the entire JSON response body, pass an object to the `createBody`
   * method. Nest will serialize the object and return it as the JSON response body.
   *
   * The `status` argument is required, and should be a valid HTTP status code.
   * Best practice is to use the `HttpStatus` enum imported from `nestjs/common`.
   *
   * @param response string, object describing the error condition or the error cause.
   * @param status HTTP response status code.
   * @param options An object used to add an error cause.
   */
  constructor(
    private readonly response: string | Record<string, any>,
    private readonly status: number,
    private readonly options?: HttpExceptionOptions,
  ) {
    super();
    this.initMessage();
    this.initName();
    this.initCause();
  }

  public cause: unknown;

  /**
   * Configures error chaining support
   *
   * @see https://nodejs.org/en/blog/release/v16.9.0/#error-cause
   * @see https://github.com/microsoft/TypeScript/issues/45167
   */
  public initCause(): void {
    if (this.options?.cause) {
      this.cause = this.options.cause;
      return;
    }
  }
  /**初始化该异常信息 */
  public initMessage() {
    /**如果response为字符串 */
    if (isString(this.response)) {
      this.message = this.response;
    } else if (
      isObject(this.response) &&
      isString((this.response as Record<string, any>).message)
    ) {
      /**如果 */
      this.message = (this.response as Record<string, any>).message;
    } else if (this.constructor) {
      this.message =
        this.constructor.name.match(/[A-Z][a-z]+|[0-9]+/g)?.join(' ') ??
        'Error';
    }
  }

  public initName(): void {
    this.name = this.constructor.name;
  }

  public getResponse(): string | object {
    return this.response;
  }

  public getStatus(): number {
    return this.status;
  }

  public static createBody(
    nil: null | '',
    message: HttpExceptionBodyMessage,
    statusCode: number,
  ): HttpExceptionBody;

  public static createBody(
    message: HttpExceptionBodyMessage,
    error: string,
    statusCode: number,
  ): HttpExceptionBody;
  public static createBody<Body extends Record<string, unknown>>(
    custom: Body,
  ): Body;
  /**
   * 如果arg0是一个对象，那么直接返回arg0作为错误响应主体
   * @param arg0 
   * @param arg1 
   * @param statusCode 
   * @returns 
   */
  public static createBody<Body extends Record<string, unknown>>(
    arg0: null | HttpExceptionBodyMessage | Body,
    arg1?: HttpExceptionBodyMessage | string,
    statusCode?: number,
  ): HttpExceptionBody | Body {
    if (!arg0) {
      return {
        message: arg1,
        statusCode: statusCode,
      };
    }

    if (isString(arg0) || Array.isArray(arg0)) {
      return {
        message: arg0,
        error: arg1 as string,
        statusCode: statusCode,
      };
    }

    return arg0;
  }

  /**
   * 从描述或者选项中提取错误描述信息，descriptionOrOptions可以
   * 是一描述个字符串或一个包含描述信息的选项对象，函数根据传入的参数类型，
   * 提取并返回相应的错误描述信息
   */
  public static getDescriptionFrom(
    descriptionOrOptions: string | HttpExceptionOptions,
  ): string {
    return isString(descriptionOrOptions)
      ? descriptionOrOptions
      : descriptionOrOptions?.description;
  }
  
  public static getHttpExceptionOptionsFrom(
    descriptionOrOptions: string | HttpExceptionOptions,
  ): HttpExceptionOptions {
    return isString(descriptionOrOptions) ? {} : descriptionOrOptions;
  }

  /**
   * Utility method used to extract the error description and httpExceptionOptions from the given argument.
   * This is used by inheriting classes to correctly parse both options.
   * 用于从给定参数中提取错误描述和httpExceptionOptions的实用程序方法。 
   * 这是由继承类用来正确地分析这两个选项s
   * @returns the error description and the httpExceptionOptions as an object.
   * 从descriptionOrOptions中提取描述字符串和选项对象
   */
  public static extractDescriptionAndOptionsFrom(
    descriptionOrOptions: string | HttpExceptionOptions,
  ): DescriptionAndOptions {

    const description = isString(descriptionOrOptions)
      ? descriptionOrOptions
      : descriptionOrOptions?.description;

    const httpExceptionOptions = isString(descriptionOrOptions)
      ? {}
      : descriptionOrOptions;

    return {
      description,
      httpExceptionOptions,
    };
  }
}
