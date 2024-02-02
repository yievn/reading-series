在JavaScript中，typeof操作符返回一个字符串，其通常用于判别变量的类型

```javascript
const a = 1;
const b = '1';
const c = () => void;
const d = []
const e = true

typeof a; // 'number'
typeof b; // 'string'
typeof c; // 'function'
typeof d; // 'object'
typeof e; // 'boolean'
```

在Typescript中，当typeof用在`类型声明（标注）`上时，通常时用来获取在类型上下文中变量或属性的类型。

```typescript
let varibleA = 1;
const varibleB = 1;
const varibleC = {
    name: 'yivn',
    age: 18
}
function varibleD(name: number) {
    return true
}
class VaribleE {}

let varA: typeof varibleA // number
let varB: typeof varibleB // 1
let varC: typeof varibleC // { name: string; age: number; }
let varD: typeof varibleD // (name: number) => boolean
let varE: typeof VaribleE // VaribleE
```
上面可以看到，当用typeof声明类型时，声明的类型为变量的类型，这里有两个注意点：

1. 当变量是使用let和const声明并且其值为基础类型时，对于let来说，Typescript通常会推断它的类型为值所属的基础类型，例如上面的varibleA，获取到的是 `number`；而对于const声明的变量，Typescript会将其推断为常量，当值为基础类型时，获取到的类型就是字面量类型，例如上面的varibleB。

2. 当变量值为类时，使用typeof来获取类型，是为了获取变量值所属的构造类，因为对类引用的变量有多个，但类构造器只有一个。

```typescript
class Func {
  name = 'yivn'
  getName() {}
}

const Func1 = Func;
const Func2 = Func1;

let Func3: typeof Func2 // Func
```