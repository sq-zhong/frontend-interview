# NX3 · React Server Components(RSC)

> Next.js 专题 · 核心必考 · 概念 → 服务端 vs 客户端组件 → 边界 → 考点

## 一句话考点

RSC(React 服务端组件)在**服务端渲染、不打包进客户端 JS**,可直接访问数据库/文件、不含交互;需要交互(useState/事件/浏览器 API)的部分用 `'use client'` 标记为客户端组件。App Router 默认全是服务端组件。

## 原理

### 服务端组件(Server Component,默认)

- 在**服务端执行**,结果以特殊格式流式传给客户端;
- **代码不打包进客户端 bundle**(减小体积);
- 可以直接 `async/await` 取数据、访问后端资源(DB、文件、密钥);
- **不能**用 useState/useEffect/事件处理/浏览器 API(它不在浏览器跑)。

### 客户端组件(Client Component)

- 文件顶部加 `'use client'`;
- 会打包进客户端 JS,在浏览器运行(经 SSR + hydration);
- 可以用 state、effect、事件、浏览器 API;
- 传统 React 组件就是这种。

## 对比

| 能力 | 服务端组件 | 客户端组件 |
|------|-----------|-----------|
| 取数据(async) | ✅ 直接 | 需 useEffect/库 |
| 访问后端资源/密钥 | ✅ | ❌ 会泄露 |
| useState/useEffect | ❌ | ✅ |
| 事件(onClick) | ❌ | ✅ |
| 浏览器 API | ❌ | ✅ |
| 打包进客户端 | ❌(体积小) | ✅ |

## 边界规则(高频易错)

1. **默认服务端**:App Router 里不加 `'use client'` 就是服务端组件;
2. **`'use client'` 是边界**:一旦标记,该组件**及其 import 的所有子组件**都成为客户端组件;
3. **服务端组件可以 import 客户端组件**(反过来受限);
4. **客户端组件不能直接 import 服务端组件**,但可以通过 **children/props 传入**(组合模式):

```jsx
// ✅ 服务端组件作为 children 传给客户端组件
// ClientWrapper 是 'use client'
<ClientWrapper>
  <ServerComponent />   {/* 作为 children,仍在服务端渲染 */}
</ClientWrapper>
```

5. **序列化限制**:服务端组件传给客户端组件的 props 必须可序列化(不能传函数、Date 等)。

## 代码示例

```jsx
// 服务端组件(默认)—— 直接取数据
async function ProductList() {
  const products = await db.query('SELECT * FROM products');   // 直接访问 DB
  return (
    <ul>
      {products.map(p => (
        <li key={p.id}>
          {p.name}
          <AddToCart id={p.id} />    {/* 交互部分交给客户端组件 */}
        </li>
      ))}
    </ul>
  );
}

// 客户端组件 —— 负责交互
'use client';
import { useState } from 'react';
function AddToCart({ id }) {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>加购 {count}</button>;
}
```

**最佳实践**:服务端组件做数据和静态结构(默认),把交互"叶子"下沉为小的客户端组件,尽量减小客户端 JS。

## 考点

**Q:服务端组件和客户端组件区别?**
A:服务端组件在服务端渲染、不打包进客户端 JS、能直接 async 取数据和访问后端资源,但不能用 state/事件/浏览器 API;客户端组件加 'use client',打包进浏览器运行,能用交互能力。App Router 默认服务端组件。

**Q:'use client' 是什么?加在哪影响什么?**
A:标记客户端组件的指令,加在文件顶部。它是一个边界——该组件及其**导入的所有子组件**都变成客户端组件、打包进客户端 JS。所以应加在真正需要交互的"叶子"组件,而非顶层,以减小 bundle。

**Q:RSC 的好处?**
A:① 减小客户端 JS 体积(服务端组件代码不下发);② 可直接安全访问后端资源(DB、密钥不泄露);③ 数据获取离数据源近、更快;④ 更好的首屏和 SEO。代价是心智模型复杂、有服务端/客户端边界限制。

**Q:客户端组件能 import 服务端组件吗?**
A:不能直接 import(会把它变成客户端组件)。但可以把服务端组件作为 **children 或 props** 传给客户端组件,这样它仍在服务端渲染。这是常见的组合模式。

**Q:服务端组件传给客户端组件的 props 有什么限制?**
A:必须**可序列化**(字符串、数字、对象、数组等),不能传函数、Class 实例、Date、Symbol 等不可序列化的值,因为要跨越服务端到客户端的边界传输。

## 一句话总结

**RSC:服务端组件(App Router 默认)服务端渲染、不进客户端 bundle、可直接 async 取数据和访问后端,但无 state/事件/浏览器 API;'use client' 标记客户端组件(该组件及其子树都进客户端 JS),负责交互;最佳实践是服务端组件做数据+结构、交互下沉为小客户端叶子;客户端组件不能 import 服务端组件但可用 children 传入,跨界 props 须可序列化。**
