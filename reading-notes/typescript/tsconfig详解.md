## 详解 compilerOptions 配置

#### compilerOptions.target

**类型**: `"es3"` | `"es5"` | `"es6"` | `"es2015"` | `"es2016"` | `"es2017"` | `"es2018"` | `"es2019"` | `"es2020"` | `"es2021"` | `"es2022"` | `"es2023"` | `"esnext"`
<br>**默认值**: `"es3"`
<br>**作用**: 指定生成代码的 ECMAScript 版本。
<br>**使用场景**: 根据运行环境选择合适的 ECMAScript 版本，以利用最新的语言特性。

#### compilerOptions.jsx

**类型**: `"preserve"` | `"react"` | `"react-jsx"` | `"react-jsxdev"` | `"react-native"`
<br>**默认值**: `"preserve"`
<br>**作用**: 指定 JSX 的编译模式。`"preserve"` 保留 JSX 以供其他工具处理，`"react"` 编译为 `React.createElement` 调用，`"react-jsx"` 和 `"react-jsxdev"` 针对 React 17 及以后。
<br>**使用场景**: 用于 React 项目中，以控制 JSX 如何被编译。

#### compilerOptions.experimentalDecorators

**类型**: `boolean`
<br>**默认值**: `false`
<br>**作用**: 启用实验性的 ES 装饰器特性。
<br>**使用场景**: 在使用装饰器（如在 Angular、NestJS 等框架中）时需要启用。

#### compilerOptions.emitDecoratorMetadata

**类型**: `boolean`
<br>**默认值**: `false`
<br>**作用**: 在编译输出中生成装饰器元数据。该选项用于配合装饰器（Decorators）使用，为类型和类成员生成元数据。
<br>**使用场景**:当你使用 TypeScript 的装饰器功能，并且需要访问类型和参数的元数据时（例如，使用依赖注入框架或一些 ORM 库），启用此选项。

#### compilerOptions.jsxFactory

**类型**: `string`
<br>**默认值**: `React.createElement`
<br>**作用**: 指定在 JSX 编译时使用的工厂函数。一般与 `jsx` 选项一起使用。
<br>**使用场景**: 使用非标准的 JSX 工厂时需要指定，比如使用 `h` 作为 JSX 工厂时。

#### compilerOptions.jsxFragmentFactory

**类型**: `string`
<br>**默认值**: `React.Fragment`
<br>**作用**: 指定在编译 JSX 片段时使用的工厂函数。
<br>**使用场景**: 当你需要使用非标准的 JSX 片段处理时。

#### compilerOptions.jsxImportSource

**类型**: `string`
<br>**默认值**: `undefined`
<br>**作用**: 当 `jsx` 选项为 `"react-jsx"` 或 `"react-jsxdev"` 时，指定用于导入 JSX 工厂函数和片段的模块。
<br>**使用场景**: 与新的 React JSX 转换模式一起使用，指定自定义的 JSX 工厂来源。

#### compilerOptions.noLib

**类型**: `boolean`
<br>**默认值**: `false
<br>**作用**: 不包含默认的库文件（如 `lib.d.ts`）。
<br>**使用场景**: 自定义环境或不需要标准库时使用。

#### compilerOptions.module

**类型**: `"none"` | `"commonjs"` | `"amd"` | `"system"` | `"umd"` | `"esnext"` | `"es6"` | `"es2015"` | `"node16"` | `"nodenext"`
<br>**默认值**: 取决于 `target`，通常为 `commonjs`
<br>**作用**: 指定生成代码时使用的模块系统。
<br>**使用场景**: 根据运行环境（如 Node.js、浏览器等）或项目需求选择合适的模块系统。

#### compilerOptions.rootDir

**类型**: `string`
<br>**默认值**: 计算出来的公共路径
<br>**作用**: 指定编译器用于输出文件路径计算的根目录。影响编译输出目录结构。
<br>**使用场景**: 当你需要控制源文件目录与输出文件目录的映射关系时使用。

rootDir 选项用于定义项目中源代码文件的起始位置（根目录），TypeScript 编译器会以这个目录作为基准来处理文件，并保持文件结构一致性。当编译器将 TypeScript 文件转换为 JavaScript 文件时，rootDir 决定了输入文件的相对路径，从而影响最终输出的目录结构。

```typescript
project/
├── src/
│   ├── utils/
│   │   └── helper.ts
│   ├── components/
│   │   └── header.ts
│   └── main.ts
└── tsconfig.json
```

在 tsconfig.json 中，rootDir 被指定为 src

```typescript
{
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist"
  }
}
```

这里 rootDir: "./src" 表示 TypeScript 编译器会把 src 目录下的所有文件当作编译输入的起始点。编译后，TypeScript 会将每个文件放入到 outDir 指定的输出目录中，并保留 rootDir 下的文件结构。

```typescript
project/
├── dist/
│   ├── utils/
│   │   └── helper.js
│   ├── components/
│   │   └── header.js
│   └── main.js
└── tsconfig.json

```

可以看到，dist 目录中的文件结构与 src 目录中的结构是一致的。rootDir 确保了这个一致性，编译器根据 src 目录下文件的相对路径，将它们放在 dist 目录下的相应位置。

#### compilerOptions.moduleResolution

**类型**: `"node"` | `"classic"`
<br>**默认值**: `node`
<br>**作用**: 指定模块解析策略，`node` 模式模仿 Node.js 的解析机制，`classic` 模式是 TypeScript 的旧解析方式。
<br>**使用场景**: 根据项目需求选择模块解析策略，现代项目通常使用 `node` 模式。

#### compilerOptions.baseUrl

**类型**: `string`
<br>**默认值**: `./`
<br>**作用**: 用于解析非相对模块导入的基准路径。
<br>**使用场景**: 当你使用非相对路径导入模块时（如 `import x from "module"`），TypeScript 将从 `baseUrl` 开始解析。

baseUrl 是用来指定模块解析时的基准路径。当你在 Typescript 代码中使用非相对路径（即不以 ./ 或 ../ 开头的路径）导入模块时，Typescript 编译器会从 baseUrl 开始查找这个模块。

假设项目结构如下：

```typescript
project/
├── src/
│   ├── utils/
│   │   └── helpers.ts
│   ├── components/
│   │   └── header.ts
│   └── main.ts
└── tsconfig.json

```

如果在 tsconfig.json 中配置 baseUrl 为 src

```typescript
{
  "compilerOptions": {
    "baseUrl": "./src"
  }
}
```

在这种情况下，你可以在 main.ts 中这样导入 helpers.ts：

```typescript
import { helperFunction } from "utils/helpers";
```

这里的 'utils/helpers' 是相对于 baseUrl (./src) 的路径。TypeScript 编译器会从 src 目录开始查找 utils/helpers.ts 文件。

#### compilerOptions.rootDirs

**类型**: `string[]`
<br>**默认值**: `[]`（空数组）
<br>**作用**:
`rootDirs` 允许你指定一个或多个目录，这些目录中的文件可以作为一个整体来处理。这对于组织多个源文件目录，尤其是在大型项目中，特别有用。
当使用 `rootDirs` 时，TypeScript 编译器将把这些目录视为一个逻辑根目录，以便在生成输出文件时能够保持相对路径结构。

<br>**使用场景**

1. **代码分割**: 当你的项目文件结构分散在多个目录中，但希望它们在编译时表现为一个单一的逻辑结构时，`rootDirs` 非常有用。例如，一个项目可能在 `src` 和 `lib` 目录中都有源代码，通过设置 `rootDirs`，可以将这些目录视为同一根目录。

2. **避免路径问题**: 当在多个目录中有相同名称的文件时，`rootDirs` 可以帮助 TypeScript 处理这些文件，确保在编译时正确引用它们，而不会引发路径冲突。

3. **代码重用和共享**: 如果有多个项目共享相同的代码库，可以使用 `rootDirs` 指向这些共享代码的多个位置，从而使得编译器能够正确地处理这些共享代码。

**示例**

假设你的项目结构如下：

```
/project
  ├── src/
  │    ├── main.ts
  │    └── utils/
  │         └── helper.ts
  ├── lib/
  │    └── shared.ts
  └── tsconfig.json
```

在 `tsconfig.json` 中，你可以这样配置 `rootDirs`：

```json
{
  "compilerOptions": {
    "rootDirs": ["src", "lib"]
  }
}
```

在这个配置下，当你运行 TypeScript 编译时，输出的文件会保存在指定的 outDir 目录（这里是 dist），并保持原有目录结构。输出的文件结构将会是：

```
/project
  ├── dist/
  │    ├── main.js
  │    ├── utils/
  │    │    └── helper.js
  │    └── shared.js
  ├── src/
  ├── lib/
  └── tsconfig.json
```

通过使用 rootDirs，你可以将多个目录作为逻辑上的根目录，这样在输出编译后的文件时，能够保持原有的目录结构，避免了路径冲突，并使得项目结构更加灵活和清晰。输出的目录结构将与逻辑根目录中的文件相对路径一致。

#### compilerOptions.typeRoots

**类型**: `string[]`
<br>**默认值**: `["node_modules/@types"]`
<br>**作用**:
`typeRoots` 用于指定一个或多个目录，TypeScript 将在这些目录中查找类型声明文件（`.d.ts` 文件）。这通常用于定义自定义的类型库或指定特定位置的类型定义。
默认情况下，TypeScript 会在 `node_modules/@types` 目录中查找类型定义，但你可以通过 `typeRoots` 指定其他目录。

<br>**使用场景**:
当你有自定义的类型定义文件存放在特定目录时，可以使用 `typeRoots` 指定这些目录。
在大型项目中，如果你希望将第三方库的类型定义和项目自定义类型定义分开，可以通过设置多个 `typeRoots` 来实现。

**示例**:

```json
{
  "compilerOptions": {
    "typeRoots": ["./types", "./custom-types"]
  }
}
```

在这个示例中，TypeScript 将会在 `./types` 和 `./custom-types` 目录中查找类型定义文件。

#### compilerOptions.types

**类型**: `string[]`
<br>**默认值**: `[]`（空数组，表示包含所有类型）
<br>**作用**:
`types` 用于明确指定 TypeScript 在编译时需要包含的类型声明包。它允许你选择性地引入某些类型，而不是默认包含所有在 `typeRoots` 指定目录下的类型。
通过使用 `types`，你可以控制哪些类型声明文件被包含在编译过程中。

<br>**使用场景**:
当你只想要某些特定的类型库时，例如只使用 `@types/lodash` 和 `@types/jest`，而不希望 TypeScript 默认加载其他类型库。
有助于减少编译时间和内存使用，特别是在大型项目中。

**示例**:

```json
{
  "compilerOptions": {
    "types": ["lodash", "jest"]
  }
}
```

在这个示例中，TypeScript 只会加载 `lodash` 和 `jest` 的类型声明，而不会加载 `node_modules/@types` 下的所有其他类型声明。

#### compilerOptions.paths

**类型**: `{ [key: string]: string[] }`
<br>**默认值**: `undefined`
<br>**作用**: 设置模块导入的路径映射。配合 `baseUrl` 使用，指定模块导入时的别名或路径替换。
<br>**使用场景**: 配置路径别名，如将 `@app` 映射到 `src/app`，简化模块导入路径。

`paths` 允许你为模块设置**路径别名**或**自定义路径映射**，使得你可以使用简短或特定的路径来导入模块，而不用担心相对路径的层级问题。

`paths` 通常需要结合 `baseUrl` 一起使用。`paths` 的键表示导入模块的别名模式，值是一个数组，数组中的每一项表示实际对应的路径。

继续上面的项目结构，假设你希望为 `utils` 目录和 `components` 目录创建简短的别名，可以这样配置 `paths`：

```json
{
  "compilerOptions": {
    "baseUrl": "./src",
    "paths": {
      "@utils/*": ["utils/*"],
      "@components/*": ["components/*"]
    }
  }
}
```

这样，你可以在 `main.ts` 中使用别名来导入模块：

```typescript
import { helperFunction } from "@utils/helpers";
import { Header } from "@components/header";
```

这里，`@utils/*` 对应的是 `src/utils/*`，`@components/*` 对应的是 `src/components/*`，其中 `*` 是通配符，表示匹配任意名称。

**`baseUrl` 和 `paths` 的关系**
`baseUrl` 是基础路径：`baseUrl` 指定了非相对路径模块解析的起点。所有通过非相对路径导入的模块都会先基于 `baseUrl` 进行解析。

`paths` 是路径映射规则：`paths` 在 `baseUrl` 的基础上，提供了更加灵活的路径映射和别名机制。它允许你为特定的路径创建别名，简化模块导入。

<br>**使用场景**

1. 简化导入路径
   通过配置 `baseUrl` 和 `paths`，你可以避免在模块导入时使用复杂的相对路径，比如 `../../utils/helpers` 这样的路径。取而代之，你可以使用更简洁和清晰的路径，比如 `@utils/helpers`。

2. 模块重构更简单

如果项目中某个模块的位置发生了变化，只需修改 `paths` 配置，而不需要在整个项目中逐个修改导入路径。

**总结**
`baseUrl`：设定模块解析时的基准路径，使非相对路径的模块导入从指定目录开始查找。
`paths`：在 `baseUrl` 基础上提供路径别名或自定义路径映射，进一步简化和规范模块导入路径。

#### compilerOptions.noResolve

**类型**: `boolean`
<br>**默认值**: `false`
<br>**作用**:
当 `noResolve` 设置为 `true` 时，TypeScript 编译器将不会自动解析和导入未明确引用的模块。换句话说，编译器只会处理当前文件中显式引用的模块，而忽略其他文件中的模块和类型。
这意味着如果某个模块在文件中被引用但没有直接导入，编译器将不会考虑该模块的类型信息。

<br>**使用场景**

1. 严格模式

   在某些情况下，开发者可能希望限制编译器的行为，以确保代码的严格性。设置 `noResolve` 为 `true` 可以确保只有显式导入的模块会被考虑，这有助于发现和消除潜在的隐式依赖。

2. 避免类型冲突

   在大型项目中，多个文件可能会相互依赖。使用 `noResolve` 可以防止因未显式导入的模块而引起的类型冲突或错误。这对于清晰地管理项目中的依赖关系非常有帮助。

3. 快速编译
   在一些情况下，开发者可能希望提高编译速度，尤其是在大型代码库中。通过禁用模块解析，可以减少编译器的工作量，从而提高编译性能。

**示例**

在 `tsconfig.json` 中启用 `noResolve`：

```json
{
  "compilerOptions": {
    "noResolve": true
  }
}
```

在这种配置下，如果你在某个文件中引用了一个未显式导入的模块，TypeScript 编译器将不会考虑该模块的信息。例如：

```typescript
// myModule.ts
export const myFunction = () => {
  return "Hello, world!";
};

// app.ts
console.log(myFunction()); // 这里会引发错误，因为 myFunction 未显式导入
```

如果 `noResolve` 设置为 `true`，编译器将无法解析 `myFunction`，因为它没有在 `app.ts` 中被导入。

#### compilerOptions.allowJs

**类型**: `boolean`
<br>**默认值**: `false`
<br>**作用**:
`allowJs` 用于指定 TypeScript 是否允许编译 `.js` 文件。默认情况下，TypeScript 只会编译 `.ts` 和 `.tsx` 文件。如果你希望项目中同时包含 JavaScript 文件并让 TypeScript 处理这些文件，则需要将此选项设置为 `true`。
启用此选项后，TypeScript 会将 `.js` 文件纳入编译过程，允许你将现有的 JavaScript 代码逐步迁移到 TypeScript。

<br>**使用场景**

1. 渐进式迁移
   当你有一个大型的 JavaScript 项目，并希望逐步迁移到 TypeScript 时，启用 `allowJs` 可以使你在保留现有 JavaScript 代码的同时，引入 TypeScript 代码。

2. 混合代码库
   在一些项目中，可能需要同时使用 JavaScript 和 TypeScript 代码。此选项可以帮助你在一个项目中混合使用这两种语言。

**示例**

在 `tsconfig.json` 中启用 `allowJs`：

```json
{
  "compilerOptions": {
    "allowJs": true
  }
}
```

#### compilerOptions.checkJs

**类型**: `boolean`
<br>**默认值**: `false`
<br>**作用**:
`checkJs` 用于控制 TypeScript 是否对 JavaScript 文件进行类型检查。当该选项设置为 `true` 时，TypeScript 将会对 `.js` 文件进行类型检查，报告类型错误。这使得 JavaScript 开发者能够享受类型检查的好处，而不需要将所有文件转换为 TypeScript。
此选项通常与 `allowJs` 一起使用，以便在允许编译 JavaScript 文件的同时进行类型检查。

<br>**使用场景**

1. 提高代码质量
   启用 `checkJs` 后，TypeScript 将检查 JavaScript 文件中的类型错误，帮助开发者发现潜在的问题，从而提高代码的质量。

2. 逐步迁移
   在逐步将 JavaScript 代码迁移到 TypeScript 的过程中，启用 `checkJs` 可以帮助你在迁移过程中确保代码的正确性。

**示例**

在 `tsconfig.json` 中同时启用 `allowJs` 和 `checkJs`：

```json
{
  "compilerOptions": {
    "allowJs": true,
    "checkJs": true
  }
}
```

#### compilerOptions.maxNodeModuleJsDepth

**类型**: `number`
<br>**默认值**: `0`
<br>**作用**: 指定从 `node_modules` 中解析 JavaScript 文件的最大深度。
<br>**使用场景**: 控制编译器从 `node_modules` 中加载的文件深度，避免过深的依赖解析。

#### compilerOptions.declaration

**类型**: `boolean`
<br>**默认值**: `false`
<br>**作用**: 生成相应的 `.d.ts` 文件。
<br>**使用场景**: 当你希望发布一个 TypeScript 库并向外界提供类型声明文件时使用。

#### compilerOptions.declarationMap

**类型**: `boolean`
<br>**默认值**: `false`
<br>**作用**: 为 `.d.ts` 文件生成 source map 文件。
<br>**使用场景**: 在调试声明文件时，可以映射回源文件。

#### compilerOptions.emitDeclarationOnly

**类型**: `boolean`
<br>**默认值**: `false`
<br>**作用**: 仅生成声明文件，而不生成 JavaScript 文件。
<br>**使用场景**: 当你只需要生成类型声明文件（比如发布库时）。

#### compilerOptions.declarationDir

**类型**: `string`
<br>**默认值**: 输出目录
<br>**作用**: 指定生成的声明文件（`.d.ts` 文件）的输出目录。
<br>**使用场景**: 分离声明文件与编译的 JavaScript 文件时使用。

#### compilerOptions.sourceMap

**类型**: `boolean`
<br>**默认值**: `false`
<br>**作用**: 为编译输出生成 `.map` 文件，便于调试代码时映射回源文件。
<br>**使用场景**: 在调试编译后的 JavaScript 代码时使用，帮助开发者定位问题。

#### compilerOptions.outFile

**类型**: `string`
<br>**默认值**: `undefined`
<br>**作用**: 将所有输出文件合并成一个文件，通常用于 AMD 或 System 模块。
<br>**使用场景**: 当你需要将所有模块打包成一个文件进行部署时使用。

#### compilerOptions.removeComments

**类型**: `boolean`
<br>**默认值**: `false`
<br>**作用**: 在输出文件中删除所有注释。
<br>**使用场景**: 当你希望编译输出的文件更加精简时使用。

#### compilerOptions.noEmit

**类型**: `boolean`
<br>**默认值**: `false`
<br>**作用**: 不生成任何输出文件（包括 `.js` 和 `.d.ts` 文件）。
<br>**使用场景**: 仅进行类型检查，而不需要生成编译输出时使用。

#### compilerOptions.newLine

**类型**: `"crlf"` | `"lf"`
<br>**默认值**: 基于当前操作系统
<br>**作用**: 指定编译输出的换行符类型。
<br>**使用场景**: 强制输出文件使用特定的换行符，比如在跨平台项目中保持一致性。

#### compilerOptions.noEmitOnError

**类型**: `boolean`
<br>**默认值**: `false`
<br>**作用**: 在编译错误时不生成输出文件。
<br>**使用场景**: 保证在有编译错误时不会生成错误的编译输出。

#### compilerOptions.strict

**类型**: `boolean`
<br>**默认值**: `false`
<br>**作用**: 启用所有严格类型检查选项的总开关。
<br>**使用场景**: 保证代码的类型安全性，避免常见的类型错误。

#### compilerOptions.alwaysStrict

**类型**: `boolean`
<br>**默认值**: `false`
<br>**作用**: 强制每个文件在编译输出时都以严格模式运行，相当于自动在文件顶部添加 `"use strict";`。
<br>**使用场景**: 保证所有生成的 JavaScript 文件都以严格模式运行。

#### compilerOptions.strictNullChecks

**类型**: `boolean`
<br>**默认值**: `false`
<br>**作用**: 启用严格的空值检查，防止 `null` 和 `undefined` 被误用。
<br>**使用场景**: 提高代码的可靠性，避免因 `null` 和 `undefined` 造成的错误。

#### compilerOptions.strictFunctionTypes

**类型**: `boolean`
<br>**默认值**: `false`
<br>**作用**: 启用对函数类型的严格检查，特别是在处理协变和逆变的情况时。
<br>**使用场景**: 强化函数的类型安全性，防止错误的函数类型赋值。

#### compilerOptions.strictBindCallApply

**类型**: `boolean`
<br>**默认值**: `false`
<br>**作用**: 启用对 `bind`、`call` 和 `apply` 方法的严格检查。
<br>**使用场景**: 确保函数绑定和调用的参数类型是正确的。

#### compilerOptions.noImplicitAny

**类型**: `boolean`
<br>**默认值**: `false`
<br>**作用**: 禁止隐式的 `any` 类型。对于没有显式类型注解的变量或参数，如果编译器无法推断类型，将会报错。
<br>**使用场景**: 强制要求所有变量和函数参数都有明确的类型，减少类型错误。

#### compilerOptions.noImplicitThis

**类型**: `boolean`
<br>**默认值**: `false`
<br>**作用**: 禁止 `this` 的隐式 `any` 类型，要求显式定义 `this` 的类型。
<br>**使用场景**: 避免 `this` 在函数内部被错误使用，特别是在回调函数中。

#### compilerOptions.noImplicitReturns

- **类型**: `boolean`
- <br>**默认值**: `false`
- <br>**作用**: 确保函数中的每条代码路径都显式返回值，防止遗漏返回值的情况。
- <br>**使用场景**: 避免函数中有的路径没有返回值，导致运行时错误。

#### compilerOptions.noImplicitOverride

- **类型**: `boolean`
- <br>**默认值**: `false`
- <br>**作用**: 要求子类中的方法必须使用 `override` 关键字显式标记覆盖父类的方法。
- <br>**使用场景**: 提升代码的可读性和安全性，避免无意中覆盖父类方法。
-

## files、include、exclude 三者的关系和优先级

`exclude`、`include` 和 `files` 是 TypeScript 的 `tsconfig.json` 中用来控制哪些文件会被编译的三个配置选项。它们分别具有不同的作用和优先级，用来帮助开发者精准地选择或排除文件。以下是对这三者关系的详细讲解。

#### files

`files` 明确指定要编译的文件列表。这个选项允许你列出一个确切的文件数组，只有这些文件会被 TypeScript 编译。

当你只想编译某些特定文件时，比如在一个大型项目中只编译部分文件进行测试或调试。

**示例**:

```json
{
  "compilerOptions": { ... },
  "files": [
    "./src/index.ts",
    "./src/utils.ts"
  ]
}
```

在这个示例中，只有 `index.ts` 和 `utils.ts` 会被编译，其他文件即使在 `include` 中被提到或者存在于 `exclude` 外部，也不会被编译。

#### include

`include` 定义了一个模式数组，指定哪些文件或文件夹应该被编译。TypeScript 会根据这个模式匹配文件，并将其包括在编译过程中。

当需要需要对一组文件进行批量编译时，比如编译整个 `src` 目录下的所有 `.ts` 文件。

**示例**:

```json
{
  "compilerOptions": { ... },
  "include": [
    "./src/**/*.ts"
  ]
}
```

这个配置会编译 `src` 目录下的所有 TypeScript 文件，不论子目录层级如何。

#### exclude

`exclude` 定义了一个模式数组，指定哪些文件或文件夹应该被排除在编译之外。与 `include` 相反，`exclude` 是用来剔除不需要编译的文件的。

当某些文件夹中包含了不需要编译的文件时（例如测试文件夹，第三方库），可以使用 `exclude` 将它们排除。

**示例**

```json
{
  "compilerOptions": { ... },
  "exclude": [
    "node_modules",
    "**/*.spec.ts"
  ]
}
```

这个配置会排除所有 `node_modules` 目录中的文件以及所有测试文件（`.spec.ts`）。

#### 三者之间的关系和优先级

1. **`files` 的优先级最高**:

   - 如果你在 `tsconfig.json` 中设置了 `files`，那么 TypeScript 只会编译 `files` 中列出的文件，而忽略 `include` 和 `exclude`。即使这些文件在 `exclude` 中被明确排除，它们仍然会被编译。

2. **`include` 和 `exclude`**:

   - 如果没有 `files` 选项，TypeScript 会根据 `include` 和 `exclude` 来确定编译的文件。
   - `include` 决定哪些文件会被包括进来，而 `exclude` 则从 `include` 的结果中剔除掉一些文件。换句话说，TypeScript 先通过 `include` 选择文件，然后通过 `exclude` 过滤掉不需要编译的文件。

3. **默认行为**:
   - 如果既没有 `files` 也没有 `include`，那么 TypeScript 默认会编译 `tsconfig.json` 所在目录及其子目录中的所有 `.ts`、`.tsx` 和 `.d.ts` 文件，除了 `node_modules`、`bower_components` 和 `jspm_packages` 目录以及特定文件（如 `tsconfig.json` 中的 `exclude` 项指定的文件）。

**示例总结**

```json
{
  "compilerOptions": { ... },
  "files": [
    "./src/index.ts"
  ],
  "include": [
    "./src/**/*.ts"
  ],
  "exclude": [
    "node_modules",
    "**/*.spec.ts"
  ]
}
```

在这个示例中：

- 由于指定了 `files`，TypeScript 只会编译 `src/index.ts`，即使 `include` 中的其他文件符合条件，也不会被编译。
- 如果删除 `files`，TypeScript 将会编译 `src` 目录下的所有 `.ts` 文件，除了 `exclude` 中列出的文件（例如 `node_modules` 和 `.spec.ts` 文件）。

#### 总结

- **`files`**: 用于指定具体要编译的文件，优先级最高。
- **`include`**: 用于批量指定要编译的文件，优先级次于 `files`。
- **`exclude`**: 用于从 `include` 中排除不需要编译的文件，优先级最低。
