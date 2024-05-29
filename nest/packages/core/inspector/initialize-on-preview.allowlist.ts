import { Type } from '@nestjs/common';

/**
 * 通过维护一个allowlist列表来控制在特定环境（如开发或预览模式）
 * 下哪些组件应该被初始化。这种机制可以帮助开发者控制在特定环境下的资源使用，
 * 优化性能，或者防止在开发环境中执行生产环境的操作。
 * 
 * 在开发或测试阶段，可以通过这个allowlist列表来启用或禁用特定的功能
 * 或服务，从而更好地控制应用的行为。
 */
export class InitializeOnPreviewAllowlist {
  /**
   * 使用WeakMap来存储类型和布尔值的映射，WeakMap的键是一个类的类型，
   * 值是一个布尔值，表示该类型是否在预览模式下被允许初始化。
   * 
   * 使用WeakMap的好处是，它对键的引用是弱引用，不会阻止垃圾回收期回收键指向的对象
   */
  private static readonly allowlist = new WeakMap<Type, boolean>();
  /**
   * 
   * @param type 要添加到allowlist中的类型
   */
  public static add(type: Type) {
    /**
     * 将传入的类型添加到allowlist中，设置其值为true，这表示该类型在预览模式
     * 下允许初始化的。
     */
    this.allowlist.set(type, true);
  }
  /**
   * 
   * @param type 要检查是否在allowlist中的类型
   * @returns 
   */
  public static has(type: Type) {
    /**
     * 检查传入的类型是否在allowlist中。
     * 如果存在于allowlist中，则返回true，否则为false
     */
    return this.allowlist.has(type);
  }
}
