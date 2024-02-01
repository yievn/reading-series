---
editLink: false
---

[API 参考](../index.md) / RouteRecordNormalized

# 接口：RouteRecordNormalized

一条[路由记录](../index.md#routerecord)的规范化版本。

## 继承关系 %{#Hierarchy}%

- **`RouteRecordNormalized`**

  ↳ [`RouteLocationMatched`](RouteLocationMatched.md)

## 属性 %{#Properties}%

### aliasOf %{#Properties-aliasOf}%

• **aliasOf**: `undefined` \| [`RouteRecordNormalized`](RouteRecordNormalized.md)

定义了是否这条记录是另一条的别名。如果记录是原始记录，则该属性为 `undefined`。

___

### beforeEnter %{#Properties-beforeEnter}%

• **beforeEnter**: `undefined` \| [`NavigationGuardWithThis`](NavigationGuardWithThis.md)\<`undefined`\> \| [`NavigationGuardWithThis`](NavigationGuardWithThis.md)\<`undefined`\>[]

被注册的 beforeEnter 守卫

___

### children %{#Properties-children}%

• **children**: [`RouteRecordRaw`](../index.md#routerecordraw)[]

嵌套的路由记录。

___

### components %{#Properties-components}%

• **components**: `undefined` \| ``null`` \| `Record`\<`string`, `RawRouteComponent`\>

Components to display when the URL matches this route. Allow using named views.

___

### instances %{#Properties-instances}%

• **instances**: `Record`\<`string`, `undefined` \| ``null`` \| `ComponentPublicInstance`\>

<!-- TODO: translation -->

Mounted route component instances
Having the instances on the record mean beforeRouteUpdate and
beforeRouteLeave guards can only be invoked with the latest mounted app
instance if there are multiple application instances rendering the same
view, basically duplicating the content on the page, which shouldn't happen
in practice. It will work if multiple apps are rendering different named
views.

___

### meta %{#Properties-meta}%

• **meta**: [`RouteMeta`](RouteMeta.md)

<!-- TODO: translation -->

Arbitrary data attached to the record.

___

### name %{#Properties-name}%

• **name**: `undefined` \| [`RouteRecordName`](../index.md#routerecordname)

<!-- TODO: translation -->

Name for the route record. Must be unique.

___

### path %{#Properties-path}%

• **path**: `string`

<!-- TODO: translation -->

Path of the record. Should start with `/` unless the record is the child of another record.

___

### props %{#Properties-props}%

• **props**: `Record`\<`string`, `_RouteRecordProps`\>

<!-- TODO: translation -->

Allow passing down params as props to the component rendered by `router-view`. Should be an object with the same keys as `components` or a boolean to be applied to every component.

___

### redirect %{#Properties-redirect}%

• **redirect**: `undefined` \| `RouteRecordRedirectOption`

<!-- TODO: translation -->

Where to redirect if the route is directly matched. The redirection happens before any navigation guard and triggers a new navigation with the new target location.
