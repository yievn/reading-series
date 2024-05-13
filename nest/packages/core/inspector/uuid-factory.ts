import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { DeterministicUuidRegistry } from './deterministic-uuid-registry';

export enum UuidFactoryMode {
  /**随机的 */
  Random = 'random',
  /**确定的 */
  Deterministic = 'deterministic',
}

export class UuidFactory {
  private static _mode = UuidFactoryMode.Random;

  static set mode(value: UuidFactoryMode) {
    this._mode = value;
  }

  static get(key = '') {
    return this._mode === UuidFactoryMode.Deterministic
    /**根据字符串生成hash值 */
      ? DeterministicUuidRegistry.get(key)
      /**返回随机hash字符串 */
      : randomStringGenerator();
  }
}
