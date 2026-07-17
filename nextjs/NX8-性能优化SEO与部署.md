# NX8 · 性能优化、SEO 与部署

> Next.js 专题 · 内置优化 → SEO → 部署 → 考点

## 一句话考点

Next.js 内置多项优化:`next/image`(图片)、`next/font`(字体)、`next/script`(脚本)、自动代码分割;SEO 靠 SSR/SSG + Metadata API;部署首选 Vercel,也可 Node 自托管 / 静态导出 / Docker。

## 一、内置性能优化

### next/image —— 图片优化

```jsx
import Image from 'next/image';
<Image src="/hero.jpg" width={800} height={600} alt="" priority />
```
自动做:懒加载、响应式尺寸(srcset)、格式转换(WebP/AVIF)、防布局偏移(CLS,占位)、按需生成。`priority` 标记首屏关键图(预加载,优化 LCP)。

### next/font —— 字体优化

```jsx
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'] });
```
构建时自托管字体、消除外部请求、自动 `font-display` 优化,**避免字体导致的布局偏移(CLS)和 FOUT**。

### next/script —— 脚本优化

```jsx
import Script from 'next/script';
<Script src="/analytics.js" strategy="lazyOnload" />
```
控制第三方脚本加载时机(`beforeInteractive`/`afterInteractive`/`lazyOnload`),避免阻塞(呼应 H4)。

### 其他

- **自动代码分割**:每个路由单独 chunk,按需加载;
- **RSC**:减小客户端 JS(见 NX3);
- **流式渲染**:降低首屏 TTFB(见 NX6);
- `next/dynamic`:组件级懒加载。

## 二、SEO

Next.js 的 SSR/SSG 天生利于 SEO(爬虫拿到完整 HTML,见 NX1)。配合 **Metadata API**:

```jsx
// 静态 metadata
export const metadata = {
  title: '首页',
  description: '页面描述',
  openGraph: { title: '...', images: ['/og.png'] },
};

// 动态 metadata(根据数据)
export async function generateMetadata({ params }) {
  const post = await getPost(params.slug);
  return { title: post.title, description: post.excerpt };
}
```

还有:`sitemap.ts`/`robots.ts` 自动生成、结构化数据、`generateStaticParams` 预生成动态路由。

## 三、部署方式

| 方式 | 说明 |
|------|------|
| **Vercel** | 官方平台,零配置,自动 CDN/Serverless/ISR/Edge |
| **Node 自托管** | `next build && next start`,跑在自己的服务器 |
| **静态导出** | `output: 'export'`,纯静态(无 SSR/API),托管到任意静态服务/CDN |
| **Docker** | `output: 'standalone'` 精简产物,容器化部署 |

选择:需要 SSR/ISR/API → Vercel 或 Node 自托管;纯静态站 → 静态导出;私有化 → Docker standalone。

## 考点

**Q:Next.js 有哪些内置性能优化?**
A:next/image(懒加载/响应式/WebP/防 CLS)、next/font(自托管字体防 CLS)、next/script(控制脚本加载时机)、自动代码分割(路由级 chunk)、RSC 减小客户端 JS、流式渲染降 TTFB、next/dynamic 组件懒加载。

**Q:为什么 Next.js 对 SEO 友好?**
A:SSR/SSG 让服务端返回带完整内容的 HTML,爬虫能直接抓取(不像 CSR 返回空壳);配合 Metadata API 动态生成 title/description/OG 标签、自动 sitemap/robots,SEO 支持完善。

**Q:next/image 解决了什么?**
A:自动懒加载、按设备生成响应式尺寸、转 WebP/AVIF 减小体积、通过指定宽高占位防止布局偏移(CLS),priority 预加载首屏关键图优化 LCP。手动优化这些很繁琐,它开箱即用。

**Q:Next.js 有哪些部署方式?**
A:① Vercel(官方,零配置,自动 CDN/Serverless/ISR);② Node 自托管(next build/start);③ 静态导出(output: 'export',纯静态无 SSR);④ Docker(output: 'standalone' 精简产物容器化)。按是否需要 SSR/API 和私有化要求选。

**Q:generateStaticParams 是什么?**
A:App Router 里为动态路由(如 [slug])预生成静态页面的参数列表(相当于 Pages Router 的 getStaticPaths),构建时按这些参数把动态路由预渲染成静态页(SSG/ISR)。

## 一句话总结

**Next 内置优化:next/image(懒加载/响应式/WebP/防CLS/priority优化LCP)、next/font(自托管防CLS)、next/script(控制加载时机)、自动代码分割、RSC、流式;SEO 靠 SSR/SSG+Metadata API(动态 generateMetadata、自动 sitemap/robots);部署:Vercel(零配置)/Node 自托管/静态导出/Docker standalone。**
