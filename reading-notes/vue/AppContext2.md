在创建组件实例时，在基于appContext上进行进一步扩展，加上当前组件的一些状态信息，是么?


在 Vue 3 中，[appContext](file:///Users/qsk/yievnh/reading-series/element-plus/packages/components/message/src/method.ts#119%2C9-119%2C9) 是在应用实例（由 `createApp` 创建）初始化时创建的，并在组件实例化过程中传递给每个组件实例。这个过程主要涉及几个关键步骤：

### 创建应用实例

当你调用 `createApp` 创建一个新的 Vue 应用实例时，Vue 内部会创建一个 [appContext](file:///Users/qsk/yievnh/reading-series/element-plus/packages/components/message/src/method.ts#119%2C9-119%2C9) 对象。这个对象包含了应用级别的配置和状态，如全局组件、指令、插件、提供的值等。

### 注册组件和插件

在你通过 `app.use()` 注册插件或通过 `app.component()` 和 `app.directive()` 注册全局组件和指令时，这些注册信息都会被添加到 [appContext](file:///Users/qsk/yievnh/reading-series/element-plus/packages/components/message/src/method.ts#119%2C9-119%2C9) 中。这样，[appContext](file:///Users/qsk/yievnh/reading-series/element-plus/packages/components/message/src/method.ts#119%2C9-119%2C9) 就包含了所有全局可用的资源和配置。

### 组件实例化

当 Vue 渲染组件时，它会为每个组件创建一个组件实例。在这个过程中，Vue 会将 [appContext](file:///Users/qsk/yievnh/reading-series/element-plus/packages/components/message/src/method.ts#119%2C9-119%2C9) 传递给每个新创建的组件实例。这是通过在组件实例的内部结构中设置一个指向 [appContext](file:///Users/qsk/yievnh/reading-series/element-plus/packages/components/message/src/method.ts#119%2C9-119%2C9) 的引用来实现的。这样，每个组件实例都可以通过这个引用访问到共享的应用上下文。

### 组件实例访问 [appContext](file:///Users/qsk/yievnh/reading-series/element-plus/packages/components/message/src/method.ts#119%2C9-119%2C9)

组件实例可以通过其内部结构（如通过 `getCurrentInstance` API 获取的实例）访问 [appContext](file:///Users/qsk/yievnh/reading-series/element-plus/packages/components/message/src/method.ts#119%2C9-119%2C9)。这使得组件能够访问全局注册的组件、指令、插件以及其他应用级别的配置和状态。

### [appContext](file:///Users/qsk/yievnh/reading-series/element-plus/packages/components/message/src/method.ts#119%2C9-119%2C9) 的处理

[appContext](file:///Users/qsk/yievnh/reading-series/element-plus/packages/components/message/src/method.ts#119%2C9-119%2C9) 包含了多个重要的属性，如：

- [config](file:///Users/qsk/yievnh/reading-series/element-plus/packages/components/message/src/method.ts#11%2C57-11%2C57)：全局配置对象。
- [components](file:///Users/qsk/yievnh/reading-series/element-plus/packages/components/message/src/method.ts#11%2C46-11%2C46)、`directives`：存储全局注册的组件和指令。
- `provides`：通过应用实例的 `provide` 方法提供的值，可被任何组件实例通过 `inject` 方法注入。
- `app`：指向创建 [appContext](file:///Users/qsk/yievnh/reading-series/element-plus/packages/components/message/src/method.ts#119%2C9-119%2C9) 的应用实例本身。

通过这种方式，[appContext](file:///Users/qsk/yievnh/reading-series/element-plus/packages/components/message/src/method.ts#119%2C9-119%2C9) 作为一个全局上下文，在应用初始化时创建，并在组件实例化过程中传递给每个组件实例，使得组件能够访问到全局的资源和配置。这种设计促进了应用的模块化和解耦，同时简化了跨组件的状态共享和依赖注入。