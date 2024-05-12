在 TypeScript 中，分布式条件类型是一种高级类型系统特性，它允许你在条件类型中对联合类型进行操作，从而将条件应用于联合类型的每个成员。这种机制使得类型操作更加灵活和强大。

### 基本概念

分布式条件类型的基本形式如下：

```typescript
T extends U ? X : Y
```

这里，`T` 和 `U` 是类型变量，`X` 和 `Y` 是在条件成立或不成立时的类型结果。当 `T` 是一个联合类型（比如 `A | B | C`）时，条件类型会被应用到联合类型的每个成员上，结果也是一个联合类型，每个成员都是应用了条件类型的结果。

### 示例

假设我们有以下类型定义：

```typescript
type ExampleType = string | number | boolean;
```

我们想要创建一个新的类型，这个类型将 `ExampleType` 中的 `string` 和 `number` 转换为 `true`，其他类型转换为 `false`：

```typescript
type IsStringOrNumber<T> = T extends string | number ? true : false;
type ResultType = IsStringOrNumber<ExampleType>;
```

在这个例子中，`IsStringOrNumber<T>` 是一个条件类型，它检查类型 `T` 是否是 `string` 或 `number`。当我们将 `ExampleType` 应用到这个条件类型上时，由于 `ExampleType` 是一个联合类型（`string | number | boolean`），条件类型会分别应用于每个成员：

- `string` extends `string | number` ? true : false  -> true
- `number` extends `string | number` ? true : false  -> true
- `boolean` extends `string | number` ? true : false -> false

因此，`ResultType` 的结果是 `true | true | false`，简化后就是 `true | false`。

### 使用场景

分布式条件类型在 TypeScript 中非常有用，特别是在处理泛型和联合类型时。它们可以用于：

- **过滤类型**：从联合类型中选择符合特定条件的类型。
- **类型转换**：根据条件改变类型。
- **类型检查**：检查类型是否符合某些条件，并据此进行类型断言。

### 总结

分布式条件类型是 TypeScript 类型系统中一个强大的工具，它提供了对联合类型成员逐一应用条件的能力，从而使类型操作更加灵活和精确。这种机制在库的类型定义、类型转换和类型安全检查中非常有用，是高级 TypeScript 使用的一个重要特性。