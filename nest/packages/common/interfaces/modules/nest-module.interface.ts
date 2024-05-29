import { MiddlewareConsumer } from '../middleware/middleware-consumer.interface';

/**
 * @publicApi
 * 主要用于定义模块的配置方法，允许模块在其生命周期内配置中间件。
 */
export interface NestModule {
  /**允许模块在初始化时配置中间件
   * 在这个方法中，可以使用 MiddlewareConsumer 来配置中间件，
   * 例如使用 apply 方法应用中间件，
   * 使用 forRoutes 方法指定中间件应用于哪些路由。
   */
  configure(consumer: MiddlewareConsumer);
}

/**
 * 通过在模块级别配置中间件，NestModule 接口支持更好的模块化和封装。
 * 每个模块可以独立地配置其中间件，不影响其他模块。
 * 
 * NestModule 提供的配置方法增加了应用的灵活性，
 * 使得开发者可以根据需要轻松地为不同的路由或控制器添加不同的中间件。
 * 
 * 使用 NestModule 接口可以帮助维持清晰的项目结构，
 * 因为所有的中间件配置都集中在模块的 configure 方法中。
 */