# NX2 · App Router 与路由系统

> Next.js 专题 · 概念 → 约定 → 特殊文件 → 对比 Pages Router → 考点

## 一句话考点

Next.js 13+ 的 **App Router** 基于文件系统约定,用 `app/` 目录、文件夹即路由、特殊文件(`page/layout/loading/error`)组织;默认组件是**服务端组件(RSC)**;取代了老的 `pages/` 目录(Pages Router)。

## 路由约定

### 文件夹 = 路由段

```
app/
├── page.tsx              → /            (页面,必须有才能访问)
├── layout.tsx            → 根布局(必须,含 <html><body>)
├── about/
│   └── page.tsx          → /about
├── blog/
│   ├── page.tsx          → /blog
│   └── [slug]/
│       └── page.tsx      → /blog/:slug  (动态路由)
└── (marketing)/          → 路由组(不影响 URL,仅组织)
    └── page.tsx
```

### 特殊文件(约定式)

| 文件 | 作用 |
|------|------|
| `page.tsx` | 页面内容(该路由可访问) |
| `layout.tsx` | 布局,包裹子路由,**导航时不重渲染**(保持状态) |
| `loading.tsx` | 加载 UI(自动包 Suspense,见 NX6) |
| `error.tsx` | 错误 UI(错误边界,客户端组件) |
| `not-found.tsx` | 404 页 |
| `template.tsx` | 类似 layout 但每次导航都重新创建 |
| `route.ts` | API 路由处理器(见 NX7) |

### 动态路由

```
[slug]        → 单段动态         /blog/hello
[...slug]     → 捕获所有段        /docs/a/b/c
[[...slug]]   → 可选捕获所有      /docs 或 /docs/a/b
```

## 嵌套布局

layout 会**嵌套包裹**子路由,共享的 UI(导航栏、侧边栏)放 layout 里,切换子页面时 layout 不重新渲染、状态保留:

```jsx
// app/dashboard/layout.tsx
export default function DashboardLayout({ children }) {
  return (
    <div>
      <Sidebar />        {/* 切换子页面时侧边栏不重渲染 */}
      <main>{children}</main>
    </div>
  );
}
```

## App Router vs Pages Router

| 维度 | Pages Router(旧) | App Router(新,13+) |
|------|------------------|---------------------|
| 目录 | `pages/` | `app/` |
| 默认组件 | 客户端组件 | **服务端组件(RSC)** |
| 数据获取 | getServerSideProps/getStaticProps | 组件内直接 async/await |
| 布局 | 手动 _app/_document | 嵌套 layout.tsx |
| 加载态 | 手动 | loading.tsx 约定 |
| 流式渲染 | 有限 | 原生支持(Suspense) |

## 考点

**Q:App Router 和 Pages Router 区别?**
A:App Router(Next 13+,app/ 目录)默认服务端组件、支持嵌套布局、组件内直接 async 取数据、约定式 loading/error、原生流式渲染;Pages Router(pages/ 目录)默认客户端组件、用 getServerSideProps/getStaticProps 取数据、布局要手动处理。App Router 是新方向。

**Q:layout 和 template 区别?**
A:layout 在导航时**保持挂载、不重渲染**(状态、滚动位置保留),适合导航栏等持久 UI;template 每次导航都**重新创建实例**,适合需要每次重置状态或触发进入动画的场景。

**Q:App Router 的特殊文件有哪些?**
A:page(页面)、layout(嵌套布局)、loading(加载 UI,自动 Suspense)、error(错误边界)、not-found(404)、template(每次重建的布局)、route(API 处理器)。都是文件系统约定。

**Q:动态路由怎么写?**
A:`[slug]` 匹配单段(如 /blog/hello);`[...slug]` 捕获所有后续段(/docs/a/b/c);`[[...slug]]` 可选捕获(/docs 也匹配)。在组件里通过 params 拿到值。

**Q:路由组 `(name)` 是什么?**
A:用括号包裹的文件夹,仅用于**组织代码**(如按功能分组、给不同分组套不同 layout),**不影响 URL 路径**。

## 一句话总结

**App Router(Next 13+,app/ 目录)文件夹即路由 + 特殊文件约定(page/layout/loading/error/not-found/route),默认服务端组件、组件内直接 async 取数、嵌套 layout 导航不重渲染保状态;动态路由 [slug]/[...slug]/[[...slug]];路由组 (name) 只组织不影响 URL;相比 Pages Router 更现代(RSC/流式/约定式加载)。**
