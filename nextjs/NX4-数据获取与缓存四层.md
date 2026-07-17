# NX4 · 数据获取与缓存四层

> Next.js 专题 · 核心难点 · 数据获取 → 缓存四层 → revalidate → 考点

## 一句话考点

App Router 里数据获取直接在服务端组件 `async/await`;Next.js 有**四层缓存**(Request Memoization、Data Cache、Full Route Cache、Router Cache),用 `fetch` 的 `cache`/`next.revalidate` 选项和 `revalidatePath/revalidateTag` 控制。

## 数据获取(App Router)

服务端组件直接 async 取数据,不再需要 getServerSideProps:

```jsx
async function Page() {
  const res = await fetch('https://api.example.com/data');   // 服务端执行
  const data = await res.json();
  return <div>{data.title}</div>;
}
```

**并行取数据**避免瀑布(见 J8):

```jsx
// ✅ 并行:两个请求同时发
const [user, posts] = await Promise.all([getUser(), getPosts()]);
```

## 四层缓存(重点,易混)

```
① Request Memoization  (单次请求内)  —— 同一次渲染中相同 fetch 只发一次
② Data Cache           (跨请求持久)  —— fetch 结果缓存,可跨用户跨请求复用
③ Full Route Cache     (构建/再生)   —— 整个路由的渲染结果(HTML+RSC)缓存
④ Router Cache         (客户端内存)  —— 客户端导航时缓存访问过的路由段
```

| 缓存 | 位置 | 生命周期 | 作用 |
|------|------|---------|------|
| Request Memoization | 服务端 | 单次请求 | 去重同次渲染的重复请求 |
| Data Cache | 服务端 | 持久(可 revalidate) | 缓存 fetch 数据,跨请求 |
| Full Route Cache | 服务端 | 构建时/revalidate | 缓存整个路由输出 |
| Router Cache | 客户端 | 会话内 | 加速前进后退/导航 |

## 控制缓存

```jsx
// fetch 默认行为(Next 15 起默认不缓存,需显式开启)
fetch(url, { cache: 'force-cache' });    // 强缓存(SSG 行为)
fetch(url, { cache: 'no-store' });       // 不缓存(每次都取,SSR 行为)

// 定时重新验证(ISR)
fetch(url, { next: { revalidate: 60 } });   // 60 秒后过期再生

// 打标签,便于按需失效
fetch(url, { next: { tags: ['products'] } });
```

### 按需重新验证(数据变更后主动刷新)

```js
'use server';
import { revalidatePath, revalidateTag } from 'next/cache';

async function updateProduct() {
  await db.update(/* ... */);
  revalidateTag('products');       // 让带此 tag 的缓存失效
  revalidatePath('/products');     // 让该路径的缓存失效
}
```

## 路由级配置

```jsx
export const revalidate = 3600;              // 该路由 ISR 时间
export const dynamic = 'force-dynamic';       // 强制动态(禁用缓存)
export const dynamic = 'force-static';        // 强制静态
export const fetchCache = 'force-no-store';   // 覆盖所有 fetch 缓存行为
```

## 考点

**Q:Next.js App Router 怎么取数据?和 Pages Router 区别?**
A:App Router 直接在服务端组件里 async/await fetch,更简洁;Pages Router 用 getServerSideProps(SSR)/getStaticProps(SSG)。App Router 还能在组件树任意层级取数据、天然支持并行和流式。

**Q:Next.js 的缓存有哪几层?**
A:四层——Request Memoization(单次请求内 fetch 去重)、Data Cache(fetch 结果跨请求持久缓存)、Full Route Cache(整个路由渲染结果缓存)、Router Cache(客户端导航缓存已访问路由)。前三在服务端,最后一层在客户端。

**Q:怎么控制 fetch 的缓存?**
A:`cache: 'force-cache'`(缓存/静态)、`cache: 'no-store'`(不缓存/动态)、`next: { revalidate: N }`(N 秒后再生/ISR)、`next: { tags: [...] }`(打标签便于按需失效)。Next 15 起 fetch 默认不缓存。

**Q:数据更新后怎么刷新缓存?**
A:用 `revalidatePath(path)` 让指定路径缓存失效、`revalidateTag(tag)` 让打了该标签的数据缓存失效,通常在 Server Action 或 Route Handler 里数据变更后调用,实现按需再生(on-demand ISR)。

**Q:什么情况路由会变成动态渲染?**
A:用了动态函数(cookies()、headers()、searchParams)、fetch 设了 no-store、或显式 `dynamic = 'force-dynamic'`,该路由会在每次请求时渲染(SSR),不使用 Full Route Cache。

## 一句话总结

**App Router 服务端组件直接 async fetch 取数(并行用 Promise.all);四层缓存:Request Memoization(单请求去重)、Data Cache(fetch 结果跨请求持久)、Full Route Cache(路由输出)、Router Cache(客户端导航);用 cache/next.revalidate/tags 控制,数据变更后 revalidatePath/revalidateTag 按需失效;动态函数或 no-store 会转为动态渲染。**
