export class DeterministicUuidRegistry {
  private static readonly registry = new Map<string, boolean>();

  static get(str: string, inc = 0) {
    const id = inc ? this.hashCode(`${str}_${inc}`) : this.hashCode(str);
    if (this.registry.has(id)) {
      /**既然有了，那就不算唯一，就重新生成 */
      return this.get(str, inc + 1);
    }
    this.registry.set(id, true);
    return id;
  }

  static clear() {
    this.registry.clear();
  }
  /**用于生成一个字符串的哈希码 */
  private static hashCode(s: string) {
    let h = 0;
    for (let i = 0; i < s.length; i++)
      h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
    return h.toString();
  }
}
