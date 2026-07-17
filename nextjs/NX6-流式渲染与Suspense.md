# NX6 · 流式渲染与 Suspense

> Next.js 专题 · 概念 → 原理 → loading/Suspense → 考点

## 一句话考点

Next.js App Router 原生支持**流式渲染(Streaming)**:页面不必等所有数据就绪才返回,可以先发送已就绪的部分,慢的部分用 `<Suspense>` 包裹、准备好后再"流"给浏览器;`loading.tsx` 是路由级 Suspense 的封装。

## 原理

### 传统 SSR 的问题

传统 SSR 要**等页面所有数据都取完**才能返回 HTML。如果某个数据慢,整个页面首屏都被拖慢(木桶效应)。

### 流式渲染

把页面拆成多块,**边渲染边发送**:
1. 先立即返回外壳(布局、已就绪内容)+ 慢部分的占位(fallback);
2. 慢的数据准备好后,服务端把这部分 HTML **流式追加**发给浏览器,替换占位。

好处:**首屏更快**(TTFB 低、用户先看到骨架和主要内容)、慢数据不阻塞整页。

## 用法

### 路由级:loading.tsx

```jsx
// app/dashboard/loading.tsx —— 自动包裹整个路由
export default function Loading() {
  return <Skeleton />;   // 页面数据加载时先显示这个
}
```
Next.js 自动用 `<Suspense fallback={<Loading/>}>` 包裹 page,数据 ready 前显示 loading,ready 后替换。

### 组件级:Suspense 细粒度流式

```jsx
import { Suspense } from 'react';

export default function Page() {
  return (
    <div>
      <h1>仪表盘</h1>          {/* 立即显示 */}
      <Suspense fallback={<Skeleton />}>
        <SlowChart />          {/* 慢组件:先占位,好了再流入 */}
      </Suspense>
      <Suspense fallback={<Spinner />}>
        <SlowTable />          {/* 各自独立,谁先好谁先显示 */}
      </Suspense>
    </div>
  );
}

// 慢的服务端组件
async function SlowChart() {
  const data = await slowFetch();   // 耗时数据
  return <Chart data={data} />;
}
```

**效果**:标题和外壳立即可见,图表和表格各自准备好后独立"流"进来,不互相阻塞。

## 与 CSR loading 的区别

- 传统 CSR:先白屏 → JS 加载 → 组件 mount → useEffect 发请求 → loading → 数据回来渲染(慢、SEO 差);
- 流式 SSR:服务端就开始渲染,外壳秒出,慢内容流式补充(快、SEO 好、用 Suspense 声明式管理加载态)。

## 考点

**Q:什么是流式渲染?解决什么问题?**
A:把页面拆块边渲染边发送——先返回外壳和已就绪内容 + 慢部分占位,慢数据准备好后流式追加替换占位。解决传统 SSR "必须等所有数据就绪才返回、慢数据拖慢整页首屏"的问题,降低 TTFB、让用户更快看到内容。

**Q:loading.tsx 的原理?**
A:它是路由级的 Suspense 封装。Next.js 自动用 `<Suspense fallback={<Loading/>}>` 包裹该路由的 page,页面数据加载期间显示 loading UI,加载完成后替换为真实内容,无需手写 Suspense。

**Q:Suspense 在这里的作用?**
A:声明式地标记"这块内容可能还没准备好,先显示 fallback"。用它包裹慢的服务端组件,该组件 await 的数据未就绪时显示占位,就绪后流式渲染进来,且多个 Suspense 边界互相独立、各自流入。

**Q:流式渲染和客户端 loading 有什么区别?**
A:客户端 loading 是浏览器端 JS 挂载后发请求再显示(有白屏、SEO 差);流式渲染在服务端进行,外壳立即返回、慢内容服务端流式补充,首屏更快、SEO 更好,且用 Suspense 声明式管理而非手动 state。

## 一句话总结

**流式渲染:页面拆块边渲染边发,外壳和就绪内容先返回、慢部分用 Suspense 占位、就绪后流式追加,降低 TTFB 不被慢数据阻塞;loading.tsx 是路由级 Suspense 封装、组件级用 `<Suspense>` 包裹慢的服务端组件做细粒度流式;比客户端 loading 首屏更快、SEO 更好、声明式管理加载态。**
