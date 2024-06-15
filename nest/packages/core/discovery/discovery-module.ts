import { Module } from '@nestjs/common';
import { MetadataScanner } from '../metadata-scanner';
import { DiscoveryService } from './discovery-service';

/**
 * @publicApi
 * DiscoveryModule用于提供元数据发现和处理的功能，这个模块的主要职责是扫描应用中的各种装饰器和类，
 * 收集和管理与这些元素相关的元数据，以支持框架的各种高级功能，如依赖注入、模块动态加载、拦截器、守卫等。
 * 
 * 
1. DiscoveryModule 使用 MetadataScanner 类来扫描应用中的类和提供者，
提取装饰器和其他元数据。这些元数据是 NestJS 功能实现的基础，例如，通过装饰器定义的路由、注入的服务等。
2. 依赖关系解析：
该模块帮助解析和构建类和提供者之间的依赖关系。这对于正确实现依赖注入机制至关重要。
3. 动态模块和提供者的发现：
在大型应用中，可能需要动态加载模块或提供者。DiscoveryModule 提供了必要的工具和服务，
以支持这种动态性，允许应用在运行时根据需要加载或修改其行为。
 * 
 * MetadataScanner：用于扫描类和提供者，提取装饰器和其他相关元数据
 * DiscoveryService：提供了一个服务层，用于处理和访问由MetadataScanner收集的元数据，这可能包括获取
 * 特定类型的提供者列表、解析特定装饰器的元数据。
 * 
 */
@Module({
  providers: [MetadataScanner, DiscoveryService],
  exports: [MetadataScanner, DiscoveryService],
})
export class DiscoveryModule {}