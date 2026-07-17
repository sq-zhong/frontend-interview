# T6 · keyof / typeof / 索引类型与映射类型

> 热度:🔥🔥

## 一句话考点

`keyof` 取类型的键组成联合;`typeof` 从值反推类型;索引访问 `T[K]` 取属性类型;映射类型 `[K in Keys]` 遍历键构造新类型——这些是类型编程的基础。

## 原理精讲

### 1. keyof —— 取键的联合

```ts
interface User { id: number; name: string; }
type UserKeys = keyof User;   // 'id' | 'name'
```

### 2. typeof —— 从值取类型

在类型上下文中,`typeof` 把一个**值**转成它的**类型**:

```ts
const config = { host: 'localhost', port: 8080 };
type Config = typeof config;   // { host: string; port: number }

const colors = ['red', 'green'] as const;
type Color = typeof colors[number];   // 'red' | 'green'
```

### 3. 索引访问类型 T[K]

用键取出对应的属性类型:

```ts
interface User { id: number; name: string; }
type IdType = User['id'];              // number
type Values = User[keyof User];        // number | string(所有值类型)
```

### 4. 映射类型 [K in Keys]

遍历一个键的联合,批量构造属性,是工具类型的基础:

```ts
type MyReadonly<T> = { readonly [K in keyof T]: T[K] };
type MyPartial<T> = { [K in keyof T]?: T[K] };
```

**修饰符操作**:
- `?` / `-?`:添加/移除可选;
- `readonly` / `-readonly`:添加/移除只读;
- `as`:键重映射(见下)。

### 5. 键重映射(as,TS 4.1+)

在映射时用 `as` 改键名,配合模板字面量类型:

```ts
// 给每个属性生成 getXxx 方法名
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};
interface User { name: string; age: number; }
type UserGetters = Getters<User>;
// { getName: () => string; getAge: () => number }
```

## 代码示例

### 组合运用:类型安全的取值

```ts
// keyof + 索引访问 + 泛型约束
function pluck<T, K extends keyof T>(items: T[], key: K): T[K][] {
  return items.map(item => item[key]);
}
const users = [{ id: 1, name: 'a' }, { id: 2, name: 'b' }];
pluck(users, 'name');   // string[]
pluck(users, 'id');     // number[]
```

### as const + typeof 生成联合类型

```ts
// 常量对象生成类型,避免手动同步
const STATUS = {
  SUCCESS: 'success',
  ERROR: 'error',
} as const;

type Status = typeof STATUS[keyof typeof STATUS];   // 'success' | 'error'
```

## 高频追问

**Q:keyof 的作用?**
A:取一个对象类型的所有键,组成字符串字面量联合类型。如 `keyof {a:1;b:2}` 得到 `'a' | 'b'`。常配合泛型约束 `K extends keyof T` 实现类型安全的属性访问。

**Q:类型里的 typeof 和 JS 的 typeof 一样吗?**
A:不一样。JS 的 typeof 是运行时操作符返回字符串;类型上下文中的 typeof 是编译期操作,把一个值推断为它的类型,用于从已有值反推类型定义。

**Q:什么是映射类型?**
A:通过 `[K in Keys]: ...` 遍历键的联合,批量为每个键构造属性类型,是 Partial/Readonly/Pick 等工具类型的实现基础。可加 `?`、`readonly` 修饰符和 `as` 键重映射。

**Q:`as const` 有什么用?**
A:把值断言为字面量类型(只读、不拓宽)。对象/数组加 as const 后,属性变只读且推断为精确字面量,常配合 `typeof` + `keyof` 从常量生成联合类型,避免手动维护。

**Q:索引访问类型 `T[keyof T]` 得到什么?**
A:得到 T 所有属性值类型组成的联合。如 `User['id' | 'name']` 即 `number | string`。用于提取一个对象所有值的类型。

## 一句话背诵版

**keyof 取键联合、typeof 从值反推类型、`T[K]` 索引访问取属性类型、`[K in Keys]` 映射类型遍历键构造新类型(工具类型的基础,支持 ?/readonly/-修饰符和 as 键重映射);`as const` + typeof + keyof 常用于从常量对象生成字面量联合。**
