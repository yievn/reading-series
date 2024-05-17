/**运行时异常类 */
export class RuntimeException extends Error {
  constructor(message = ``) {
    super(message);
  }
  /**返回错误消息 */
  public what() {
    return this.message;
  }
}
