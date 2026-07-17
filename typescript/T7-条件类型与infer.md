# T7 · 条件类型与 infer

> 热度:🔥🔥

## 一句话考点

条件类型 `T extends U ? X : Y` 按类型关系做分支;`infer` 在 extends 里**声明并推断**一个待定类型;联合类型进入条件类型会**分布式**逐个处理。

## 原理精讲

### 1. 条件类型

类似三元运算符,作用在类型层面:

```ts
type IsString<T> = T extends string ? true : false;
type A = IsString<'a'>;   // true
type B = IsString<1>;     // false
```

### 2. infer —— 推断待定类型

在条件类型的 extends 子句中用 `infer` 声明一个类型变量,让 TS 自动推断它:

```ts
// 提取数组元素类型
type ElementType<T> = T extends (infer U)[] ? U : never;
type E = ElementType<number[]>;   // number

// 提取函数返回类型(ReturnType 原理)
type MyReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

// 提取 Promise 的值类型
type Unwrap<T> = T extends Promise<infer V> ? V : T;
type V = Unwrap<Promise<string>>;   // string
```

### 3. 分布式条件类型

当条件类型作用于**裸的泛型联合类型**时,会**对联合的每个成员分别求值再合并**:

```ts
type ToArray<T> = T extends any ? T[] : never;
type R = ToArray<string | number>;
// 分布式:ToArray<string> | ToArray<number> = string[] | number[]
```

**阻止分布式**:用 `[T] extends [U]` 把类型包成元组:

```ts
type ToArray2<T> = [T] extends [any] ? T[] : never;
type R2 = ToArray2<string | number>;   // (string | number)[]
```

这也是 `Exclude`、`Extract` 能逐个筛选联合成员的原理。

## 代码示例

### 手写工具类型(条件类型 + infer)

```ts
// Exclude 的实现(利用分布式)
type MyExclude<T, U> = T extends U ? never : T;
type R = MyExclude<'a' | 'b' | 'c', 'a'>;   // 'b' | 'c'
// 分布式:('a'→never) | ('b'→'b') | ('c'→'c') = 'b' | 'c'

// 提取 Promise / 数组 / 函数参数
type Awaited2<T> = T extends Promise<infer V> ? V : T;
type First<T extends any[]> = T extends [infer F, ...any[]] ? F : never;
type F = First<[string, number]>;          // string

// 提取对象某属性的类型
type PropType<T, K extends keyof T> = T[K];
```

### 递归条件类型(深层处理)

```ts
// 深度 Readonly
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};

// 递归解包嵌套 Promise
type DeepAwaited<T> = T extends Promise<infer V> ? DeepAwaited<V> : T;
type D = DeepAwaited<Promise<Promise<number>>>;   // number
```

## 高频追问

**Q:条件类型是什么?**
A:类型层面的三元表达式 `T extends U ? X : Y`,根据 T 是否可赋值给 U 选择不同的结果类型。是实现工具类型和类型逻辑的核心。

**Q:infer 的作用?**
A:在条件类型的 extends 子句里声明一个"待推断"的类型变量,让 TS 自动填充。用于从复杂类型里提取部分,如从函数提取返回值/参数、从数组提取元素、从 Promise 提取值类型。

**Q:什么是分布式条件类型?**
A:当条件类型作用于裸泛型联合类型时,会对联合的每个成员分别应用条件再合并结果。如 `ToArray<A|B>` = `ToArray<A> | ToArray<B>`。Exclude/Extract 就靠它逐个筛选成员。

**Q:如何阻止分布式行为?**
A:把泛型参数用方括号包成元组 `[T] extends [U] ? ...`,这样 T 不再是"裸"的联合类型,条件类型整体判断而不分发到每个成员。

**Q:ReturnType 的实现原理?**
A:`T extends (...args: any[]) => infer R ? R : never`。用 infer R 捕获函数返回值类型,若 T 是函数则返回 R,否则 never。Parameters 同理用 `infer P` 捕获参数元组。

## 一句话背诵版

**条件类型 `T extends U ? X : Y` 做类型分支;infer 在 extends 里声明并推断待定类型(提取返回值/元素/Promise 值);裸泛型联合会分布式逐成员处理(Exclude/Extract 的原理),用 `[T] extends [U]` 可阻止分布;配合递归可做 DeepReadonly 等。**
