# NX1 · 渲染模式(CSR / SSR / SSG / ISR)

> Next.js 专题 · 核心必考 · 概念 → 对比 → 选型 → 实现 → 考点

## 一句话考点

Next.js 支持多种渲染模式:**CSR**(客户端渲染)、**SSR**(服务端渲染,请求时生成)、**SSG**(静态生成,构建时生成)、**ISR**(增量静态再生,定时/按需更新静态页);核心权衡是**首屏速度、SEO、数据实时性、服务器成本**。

## 四种模式对比

| 模式 | 生成时机 | 首屏 | SEO | 数据实时性 | 适用 |
|------|---------|------|-----|-----------|------|
| **CSR** | 浏览器运行时 | 慢(白屏等 JS) | 差 | 实时 | 后台管理、强交互内页 |
| **SSR** | 每次请求时(服务端) | 快 | 好 | 实时 | 个性化、频繁变化页面 |
| **SSG** | 构建时(一次) | 最快(纯静态) | 好 | 构建时固定 | 博客、文档、营销页 |
| **ISR** | 构建时 + 定时/按需再生 | 最快 | 好 | 准实时(可控) | 电商列表、内容站 |

## 原理

### CSR(Client-Side Rendering)
服务器返回近乎空的 HTML,浏览器下载 JS 后才渲染内容。**首屏慢**(要等 JS)、**SEO 差**(爬虫可能看到空页)。传统 SPA 就是 CSR。

### SSR(Server-Side Rendering)
**每次请求**时服务端执行、生成完整 HTML 返回,浏览器直接显示,再"注水"(hydration)绑定交互。首屏快、SEO 好,但每次请求都要服务端计算(有 TTFB 和服务器成本)。

### SSG(Static Site Generation)
**构建时**就把页面生成好静态 HTML,部署到 CDN。请求时直接返回静态文件,**最快最省**。但数据是构建时的快照,更新要重新构建。

### ISR(Incremental Static Regeneration)
SSG 的增强:静态页面可以**设置过期时间**,过期后下一次请求触发后台重新生成,兼顾静态的快和数据的新。也支持**按需重新验证**(on-demand revalidation)。

### Hydration(注水)
SSR/SSG 返回的是静态 HTML,React 在客户端把事件、状态"附加"上去让页面可交互的过程。注水前页面可见但不可交互。

## 实现(App Router)

```jsx
// SSG:默认静态(无动态数据)
export default async function Page() {
  const data = await getData();   // 构建时执行
  return <div>{data.title}</div>;
}

// ISR:设置重新验证时间
export const revalidate = 60;     // 每 60 秒最多再生一次

// SSR:强制动态(每次请求)
export const dynamic = 'force-dynamic';
// 或用了动态函数(cookies()/headers()/searchParams)会自动转 SSR

// CSR:客户端组件 + 客户端请求
'use client';
function ClientPage() {
  const { data } = useSWR('/api/data');   // 浏览器端请求
}
```

## 考点

**Q:CSR、SSR、SSG、ISR 区别?怎么选?**
A:CSR 浏览器渲染(首屏慢、SEO 差,适合后台);SSR 每次请求服务端生成(首屏快、SEO 好、实时,适合个性化页);SSG 构建时生成静态页(最快最省,适合博客文档);ISR 是 SSG + 定时/按需再生(兼顾快和新,适合电商内容站)。选型看 SEO 要求、数据实时性、服务器成本的权衡。

**Q:SSR 和 CSR 的首屏和 SEO 差异为什么?**
A:CSR 返回空 HTML,要等 JS 下载执行才有内容,首屏慢、爬虫可能抓到空页;SSR 服务端直接返回带内容的 HTML,首屏立即可见、爬虫能抓到完整内容,所以 SEO 好。

**Q:什么是 Hydration?有什么问题?**
A:注水——SSR/SSG 的静态 HTML 在客户端被 React 附加事件和状态变成可交互的过程。问题:注水前页面可见但点击无反应;大页面注水耗时;服务端和客户端渲染不一致会报 hydration error。RSC 和流式注水可缓解。

**Q:ISR 怎么工作?解决什么问题?**
A:给静态页设 revalidate 时间,过期后下一个请求返回旧页面同时后台重新生成新页面,之后请求拿新的。解决 SSG "数据更新必须重新构建全站"的痛点,兼顾静态性能和数据新鲜度,还支持按需触发再生。

## 一句话总结

**CSR 浏览器渲染(首屏慢/SEO 差/后台);SSR 每次请求服务端生成(快/SEO 好/实时/有服务器成本);SSG 构建时静态生成(最快最省/数据固定/博客文档);ISR = SSG + 定时或按需再生(兼顾快与新/电商内容站);Hydration 是静态 HTML 在客户端附加交互的过程,选型权衡 SEO、实时性、成本。**
