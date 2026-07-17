# T2 · interface 与 type 的区别

> 热度:🔥🔥🔥

## 一句话考点

两者都能描述对象结构;**interface** 可声明合并、适合定义对象/类的契约;**type** 更灵活,能表达联合、交叉、元组、条件类型等**任意类型**。

## 原理精讲

### 1. 相同点

都能定义对象类型,都支持扩展、泛型、被类实现:

```ts
interface Point { x: number; y: number; }
type Point2 = { x: number; y: number; };
```

### 2. 核心区别

| 维度 | interface | type |
|------|-----------|------|
| 声明合并 | ✅ 同名自动合并 | ❌ 重复定义报错 |
| 扩展方式 | `extends` | `&`(交叉类型) |
| 联合类型 | ❌ | ✅ `A \| B` |
| 元组/原始类型别名 | ❌ | ✅ `type T = [number, string]` |
| 映射/条件类型 | ❌ | ✅ |
| 被 class implements | ✅ | ✅(非联合时) |
| 性能(大型) | 略优(缓存) | 复杂类型可能慢 |

### 3. 声明合并(interface 独有)

同名 interface 会自动合并,常用于扩展第三方类型(如给 window 加属性):

```ts
interface Window { myGlobal: string; }
interface Window { anotherGlobal: number; }
// 合并为同时拥有两个属性
```

### 4. type 的独有能力

```ts
type Status = 'success' | 'error' | 'loading';    // 联合
type Pair = [number, string];                      // 元组
type ID = string | number;                         // 原始类型联合
type Keys = keyof SomeType;                         // 映射
type NonNull<T> = T extends null ? never : T;       // 条件类型
```

## 代码示例

### 扩展方式对比

```ts
// interface 用 extends
interface Animal { name: string; }
interface Dog extends Animal { bark(): void; }

// type 用交叉 &
type Animal2 = { name: string };
type Dog2 = Animal2 & { bark(): void };

// 互相扩展也可以
interface C extends Type1 {}      // interface 扩展 type
type D = Interface1 & { x: 1 };   // type 扩展 interface
```

### 选型建议

```ts
// ✅ 对象/类的契约、可能需要被扩展/合并 → interface
interface UserProps {
  name: string;
  age: number;
}

// ✅ 联合、交叉、元组、工具类型、复杂类型运算 → type
type Theme = 'light' | 'dark';
type Result<T> = { data: T } | { error: string };
```

## 高频追问

**Q:interface 和 type 的主要区别?**
A:① interface 支持声明合并(同名自动合并),type 不行;② type 能定义联合、交叉、元组、条件/映射类型等任意类型,interface 只能描述对象/函数结构;③ 扩展语法不同(extends vs &)。

**Q:实际开发怎么选?**
A:定义对象结构、类的契约、需要被继承或声明合并(如扩展库类型)用 interface;需要联合类型、工具类型、复杂类型运算用 type。团队常约定"对象优先 interface,其余用 type"。

**Q:什么是声明合并?**
A:TS 会把多个同名 interface 自动合并成一个。常用于扩展已有类型(如给全局 Window、第三方库类型追加属性),这是 interface 独有、type 无法做到的能力。

**Q:type 能被 class implements 吗?**
A:可以,只要它描述的是对象结构(非联合类型)。联合类型的 type 无法被 implements,因为类需要确定的结构。

**Q:两者性能有差异吗?**
A:大型项目中 interface 因可缓存、增量检查,类型检查略快;复杂的 type(大量条件/映射类型)可能拖慢编译。一般项目差异可忽略。

## 一句话背诵版

**都能描述对象;interface 支持声明合并、用 extends 扩展,适合对象/类契约;type 更灵活,能表达联合/交叉/元组/条件/映射等任意类型,用 & 扩展但不能合并;选型:对象结构优先 interface,复杂类型运算用 type。**
