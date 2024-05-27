import { uid } from 'uid';
import { Module } from './module';

/**
 * 用于存储和管理应用中所有模块的实例，这个类扩展了JavaScript的Map类，提供
 * 了一些额外的功能，特别是与模块管理相关的功能。
 * 
 * 通过Map的特性，能快速有效检索模块
 */
export class ModulesContainer extends Map<string, Module> {
  /**使用uuid函数生成一个长度为21的唯一标识符，这个标识符用于标识整个应用 */
  private readonly _applicationId = uid(21);
  /**访问器，用于获取_applicationId属性的值，这提供了一个安全的方式来访问应用的唯一标识符 */
  get applicationId(): string {
    return this._applicationId;
  }
  /**接受一个ID作为参数，返回与该ID匹配的Module实例，它通过遍历ModulesContainer中存储的所有模块
   * 实例（使用this.values()获取），并使用find方法查找具有匹配id的模块。
   */
  public getById(id: string): Module | undefined {
    return Array.from(this.values()).find(moduleRef => moduleRef.id === id);
  }
}
