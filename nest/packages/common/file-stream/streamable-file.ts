import { Readable } from 'stream';
import { types } from 'util';
import { HttpStatus } from '../enums';
import { isFunction } from '../utils/shared.utils';
import { StreamableFileOptions, StreamableHandlerResponse } from './interfaces';

/**
 * @see [Streaming files](https://docs.nestjs.com/techniques/streaming-files)
 *
 * @publicApi
 * StreamableFile 类是一个封装了文件流处理逻辑的类，涉及用于在nestjs应用中
 * 方便地处理和发送文件流，这个流提供了一种简洁的方式来发送文件给客户端，无论
 * 是通过直接传递一个buffer对象还是一个Readable流.
 */
export class StreamableFile {
  private readonly stream: Readable;

  protected handleError: (
    err: Error,
    response: StreamableHandlerResponse,
  ) => void = (err: Error, res) => {
    if (res.destroyed) {
      return;
    }
    if (res.headersSent) {
      res.end();
      return;
    }

    res.statusCode = HttpStatus.BAD_REQUEST;
    res.send(err.message);
  };

  /**接受一个 Uint8Array对象*/
  constructor(buffer: Uint8Array, options?: StreamableFileOptions);
  /**接受一个 Readable对象*/
  constructor(readable: Readable, options?: StreamableFileOptions);
  constructor(
    bufferOrReadStream: Uint8Array | Readable,
    readonly options: StreamableFileOptions = {},
  ) {
    /**当第一个参数为 Uint8Array对象时，创建一个新的Readable流对象，
     * 并通过Push方法将Uint8Array对象中的内容作为流的一部分，之后调用push(null)
     * 来结束流。
    */
    if (types.isUint8Array(bufferOrReadStream)) {
      this.stream = new Readable();
      this.stream.push(bufferOrReadStream);
      this.stream.push(null);
      this.options.length ??= bufferOrReadStream.length;
    } else if (bufferOrReadStream.pipe && isFunction(bufferOrReadStream.pipe)) {
      /**如果传递的是一个 Readable 流实例，构造函数则直接使用这个流 */
      this.stream = bufferOrReadStream;
    }
  }
  /**获取流对象 */
  getStream(): Readable {
    return this.stream;
  }
  /**
   * 
   * 此方法根据构造函数中提供的选项（如果有的话）生
   * 成并返回一个包含 HTTP 响应头信息的对象
   */
  getHeaders() {
    const {
      type = 'application/octet-stream',
      disposition = undefined,
      length = undefined,
    } = this.options;
    return {
      type,
      disposition,
      length,
    };
  }
  /**错误处理程序 */
  get errorHandler(): (
    err: Error,
    response: StreamableHandlerResponse,
  ) => void {
    return this.handleError;
  }
  /**自定义错误处理程序 */
  setErrorHandler(
    handler: (err: Error, response: StreamableHandlerResponse) => void,
  ) {
    this.handleError = handler;
    return this;
  }
}
