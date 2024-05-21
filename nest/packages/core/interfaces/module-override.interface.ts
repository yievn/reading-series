import { ModuleDefinition } from './module-definition.interface';

/**用于定义模块覆盖的配置，这是一种高级功能，允许在测试或
 * 特定环境下替换或修改模块的行为，这种机制特别有用于单元测试和继承测试，其中可能
 * 需要替换某些模块以避免副作用，或者提供模拟的实现
 */
export interface ModuleOverride {
  /**指定要被替换的原始模块 */
  moduleToReplace: ModuleDefinition;
  /**指定用于替换的新模块 */
  newModule: ModuleDefinition;
}


/**
用途:
ModuleOverride 的主要用途是在测试或特定的应用配置中动态地替换模块。这可以帮助开发者：
隔离依赖：在测试时，可以替换掉依赖外部资源的模块，如数据库连接、外部API调用等，使用模拟或存根来代替。
改变行为：在不同的环境下，可能需要模块表现出不同的行为。通过替换模块，可以根据环境需求调整模块的功能。
简化测试：通过替换复杂的模块或服务，可以简化测试设置，专注于测试应用的特定部分而不是整个系统。
示例
假设有一个 EmailModule，在测试时你不希望实际发送电子邮件，而是使用一个模拟的邮件服务：

// 原始的 EmailModule
@Module({
  providers: [RealEmailService],
  exports: [RealEmailService]
})
class EmailModule {}

// 模拟的 EmailService
class MockEmailService {}

// 测试配置中使用 ModuleOverride
const testModuleOverride: ModuleOverride = {
  moduleToReplace: EmailModule,
  newModule: {
    module: EmailModule,
    providers: [{ provide: RealEmailService, useClass: MockEmailService }],
    exports: [RealEmailService]
  }
};
 * 
在这个例子中，EmailModule 在测试环境中被配置为使用 MockEmailService 替代 RealEmailService。
这样，当运行测试时，不会有实际的邮件发送操作，而是使用模拟的邮件服务，从而避免了副作用并简化了测试过程。
 */