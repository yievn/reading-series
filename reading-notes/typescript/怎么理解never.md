never 类型
缩小类型时，你可以将联合的选项减少到你已消除所有可能性并且一无所有的程度。在这些情况下，TypeScript 将使用 never 类型来表示不应该存在的状态。（引用自ts中文网）
在介绍never类型之前，先有必要了解什么是类型缩小。

在if else，switch case等条件分支中，TypeScript对变量类型精炼为比声明时更具体的类型，这一过程称为类型收缩。

例如：
``` Typescript
type requestMethods = 'GET' | 'POST'
function doSomething(method: requestMethods) {
if(method === 'GET') {
console.log(method) // 此时在编译器中，可以看到，method的类型为明确的值'GET'而非requestMethods
}
 //xxx
}
```

现在再回过头看看never类型的概述时，就好理解多了。

``` Typescript
type paramIn = 'GET' | 'POST' | 'DELETE'
function doRequest(methods: paramIn) {
  switch (methods) {
    case 'GET':
      // xxx
      break;
    case 'POST':
      // xxx
      break;
    case 'DELETE':
      // xxx
      break;
    default:
      console.log(methods)
      break;
  }
}
```

上面示例代码中，default分支在 typeparamIn = 'GET' | 'POST' | 'DELETE',保持不变的情况下，default分支是永远走不到的，在此分支里，methods的类型，就被收缩成了never。由此可认为，never是任何类型的子类型。never可以赋值给任何类型，任何值不能赋值给never.

never的用途

在typeparamIn = 'GET' | 'POST' | 'DELETE',保持不变的情况下，代码可以一直愉快的运行着。当有一天

``` Typescript
type paramIn = 'GET' | 'POST' | 'DELETE' | 'OPTION'，扩展了一个'OPTION',

type paramIn = 'GET' | 'POST' | 'DELETE' | 'OPTION'
function doRequest(methods: paramIn) {
  switch (methods) {
    case 'GET':
      // xxx
      break;
    case 'POST':
      // xxx
      break;
    case 'DELETE':
      // xxx
      break;
    default:
      let result: never = methods // Type 'string' is not assignable to type 'never'. <tsCheck>
      // xxx
      break;
  }
}

```

试想一下，上面代码中，在default分支中，如果在没有给result定义为never类型，并且扩展了paramIn，代码运行就会超出预期。有了never类型，在扩展分支条件时，仅仅在代码编写阶段，就会提示需要补充条件分支。避免了潜在的bug风险。


