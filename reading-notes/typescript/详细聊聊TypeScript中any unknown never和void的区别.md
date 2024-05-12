一 unknown: 未知类型
unknown: 未知类型是typescript 3.0 中引入的新类型。


1.1 所有类型的字面量都可以分配给unknown类型
unknown未知类型，代表变量类型未知，也就是可能为任意类型，所以， 所有类型的字面量都可以分配给unknown类型。
这里声明一个unknown的变量，先后为其赋值字符串、数字和对象类型的字面量取值，都可以成功赋值。

let notSure: unknown = 'sisterAn!'
// 可以被赋值任意类型
notSure = 'sisterAn!'
notSure = 512
notSure = { hello: () => 'Hello sisterAn!' }

1.2 unknown 类型不允许给 any 或 unknown 以外的变量赋值
unknown 未知变量，既然类型未知，也就无法赋值给具体的某个类型，unknown 未知变量不允许给 any 或 unknown 以外的变量赋值。


两个未知变量之间可以相互赋值

let notSure: unknown = 2
let notSure1: unknown = 'Hello'
notSure = notSure1

未知变量和any变量可以相互赋值

let notSure: unknown = 2
let any1: any = 12
notSure = any1
any1 = notSure

未知变量不可以为其他变量赋值

let notSure: unknown = 2
let num: number = 12
notSure = num
any1 = notSure
num = notSure // error: Type 'unknown' is not assignable to type 'number'.

1.3 unknown 类型变量不可以执行具体类型的方法
unknown 类型变量不可以执行具体类型的方法，即使它真的是这个类型，除非你使用断言。

let notSure: unknown = 'sisterAn'
let num: number = 12
notSure = num
notSure.toLowerCase()
// error: Object is of type 'unknown'.

二 never：永不存在的值
never类型表示的是那些永不存在的值的类型。


2.1 never：执行中断的函数返回值类型
never通常用来指由于种种原因，函数没有执行到最后，导致不存在返回值的返回值类型。

示例一：抛出异常会直接中断程序运行，这样程序就运行不到返回值那一步了，即具有不可达的终点，也就永不存在返回了

function error(msg: string): never {
    throw new Error(msg);
}
示例二：死循环，同样程序永远无法运行到函数返回值那一步，即永不存在返回。

function loopForever(): never {
    while (true) {};
}

2.2 never可以赋值给任何类型，但是不能被赋值
never类型是任何类型的子类型，也可以赋值给任何类型；然而，没有类型是never的子类型或可以赋值给never类型（除了never本身之外）。 即使 any也不可以赋值给never。


三 void：函数无返回值
函数则无返回值或者返回 undefined。

function a(): number { // ERROR: 其声明类型不为 "void" 或 "any" 的函数必须返回值
  console.log(123)
}

function a(): void {
  console.log(123)
}
你只能为它赋予undefined和null。


let a: void = 1 // ERROR: 不能将类型“number”分配给类型“void”
let a: void = undefined

四 any：在编译时可选择地包含或移除类型检查
any实际上是跳过类型检查的过程，所以允许你给它赋任意值，也可以调用任意的方法。相比较来说，Object类型的变量只是允许你给它赋任意值 - 但是却不能够在它上面调用任意的方法。

到此这篇关于详细聊聊TypeScript中any unknown never和void的区别的文章就介绍到这了,更多相关ypeScript中any unknown never和void区别内容请搜索脚本之家以前的文章或继续浏览下面的相关文章希望大家以后多多支持脚本之家！