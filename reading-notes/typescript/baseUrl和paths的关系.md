在 TypeScript 中，当你使用非相对路径导入模块时，TypeScript 编译器的模块解析机制会按照以下顺序进行解析：

### 1. **检查 `paths` 映射**：

- TypeScript 首先会检查 `paths` 配置，看看是否有匹配的映射规则。
- 如果 `paths` 中定义了匹配的路径模式（包括通配符规则 `*`），编译器会根据 `paths` 中的映射规则来解析模块路径。
- 如果找到了匹配的规则，编译器会根据映射路径来查找相应的模块。

### 2. **使用 `baseUrl` 生成路径**：

- 如果在 `paths` 中找不到匹配的映射规则，TypeScript 编译器才会退而求其次，使用 `baseUrl` 来生成模块路径。
- `baseUrl` 指定了一个基准路径，所有非相对路径的模块导入都会以 `baseUrl` 作为起点进行解析。

### 解析顺序示例

假设 `tsconfig.json` 中的配置如下：

```json
{
  "compilerOptions": {
    "baseUrl": "./src",
    "paths": {
      "@utils/*": ["shared/utils/*"],
      "@components/*": ["components/*"]
    }
  }
}
```

项目结构如下：

```
project/
├── src/
│   ├── components/
│   │   └── header.ts
│   ├── shared/
│   │   └── utils/
│   │       └── helpers.ts
│   └── main.ts
└── tsconfig.json
```

在 `main.ts` 中，你可能会这样导入模块：

```typescript
import { helperFunction } from "@utils/helpers";
import { Header } from "@components/header";
```

### 模块解析过程：

1. **`@utils/helpers`**：

   - 编译器首先在 `paths` 中查找 `@utils/*` 映射。
   - 找到匹配的映射规则 `@utils/*`，对应的是 `shared/utils/*`。
   - 因此，`@utils/helpers` 会被解析为 `src/shared/utils/helpers.ts`。

2. **`@components/header`**：

   - 编译器在 `paths` 中查找 `@components/*` 映射。
   - 找到匹配的映射规则 `@components/*`，对应的是 `components/*`。
   - 因此，`@components/header` 会被解析为 `src/components/header.ts`。

3. **如果某个导入路径没有匹配到 `paths` 中的任何规则**：
   - 比如你导入 `import { something } from 'someModule';`。
   - 编译器会直接基于 `baseUrl` 进行解析，即查找 `src/someModule`。

### 总结

- **优先检查 `paths`**：TypeScript 编译器会优先检查 `paths` 配置，看看是否有匹配的路径映射规则。如果找到了，直接使用映射路径。
- **然后查看 `baseUrl`**：如果 `paths` 中没有找到匹配的路径规则，编译器会退而求其次，使用 `baseUrl` 作为基准路径来解析模块。

这种顺序确保了你可以优先使用路径别名或自定义映射来组织项目结构，同时仍然能够使用 `baseUrl` 进行默认的模块解析。
