# NX7 · 中间件与路由处理器(Route Handlers)

> Next.js 专题 · Middleware → Route Handlers → 用途 → 考点

## 一句话考点

**Middleware**(中间件)在请求到达路由**之前**运行,用于鉴权、重定向、A/B、国际化等,运行在 Edge 运行时;**Route Handlers**(`route.ts`)是 App Router 里写 API 接口的方式,取代 Pages Router 的 `pages/api`。

## 一、Middleware(中间件)

### 作用与位置

在请求命中页面/接口前拦截处理,`middleware.ts` 放项目根目录。

**典型用途**:
- 鉴权/权限拦截(未登录重定向到 login);
- 重定向 / 重写(rewrite);
- 国际化(按语言前缀路由);
- A/B 测试、灰度;
- 设置请求/响应头、读写 cookie。

```ts
// middleware.ts
import { NextResponse } from 'next/server';

export function middleware(request) {
  const token = request.cookies.get('token');
  // 未登录访问后台 → 重定向到登录
  if (request.nextUrl.pathname.startsWith('/dashboard') && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}

// 只对匹配的路径生效(性能)
export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
};
```

### 注意

- 运行在 **Edge Runtime**(轻量、快、离用户近),**不能用 Node.js 全部 API**(如 fs);
- 要轻量——每个匹配的请求都会跑,别做重计算或慢 IO;
- 鉴权只做粗粒度拦截,细粒度权限仍需页面/接口层校验(见 D8)。

## 二、Route Handlers(API 路由)

App Router 里用 `route.ts` 定义 API,导出 HTTP 方法同名函数:

```ts
// app/api/users/route.ts
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page');
  const users = await db.user.findMany();
  return NextResponse.json(users);
}

export async function POST(request) {
  const body = await request.json();
  const user = await db.user.create({ data: body });
  return NextResponse.json(user, { status: 201 });
}
```

- 支持 GET/POST/PUT/DELETE/PATCH 等,函数名即方法名;
- 用 Web 标准的 `Request`/`Response`(NextResponse 是增强);
- 动态段:`app/api/users/[id]/route.ts` → `params.id`;
- 也支持缓存控制(GET 可静态缓存)。

### Route Handler vs Server Action

| | Route Handler | Server Action |
|--|--------------|---------------|
| 形式 | REST API 接口 | 服务端函数 |
| 调用 | fetch / 外部调用 | 客户端直接调 / 表单 action |
| 适合 | 对外 API、webhook、第三方调用 | 应用内的 mutation |

## 考点

**Q:Middleware 的作用和运行时机?**
A:在请求到达路由之前运行(放 middleware.ts),用于鉴权重定向、国际化、A/B、改 header/cookie 等。运行在 Edge Runtime,要轻量;用 matcher 限定生效路径避免全量拦截影响性能。

**Q:Middleware 能做完整鉴权吗?**
A:只适合粗粒度拦截(如未登录重定向)。它运行在 Edge、不能用全部 Node API、且要轻量,细粒度的资源权限和数据鉴权仍需在页面/Route Handler/Server Action 层做(前端和边缘拦截都只是第一道,后端必须兜底)。

**Q:Route Handler 是什么?和 pages/api 区别?**
A:App Router 里写 API 的方式(app/xx/route.ts,导出 GET/POST 等同名函数,用 Web 标准 Request/Response)。取代 Pages Router 的 pages/api 目录写法,更贴近 Web 标准、和 App Router 统一。

**Q:什么时候用 Route Handler,什么时候用 Server Action?**
A:Route Handler 适合对外 REST API、webhook、需要被第三方或外部 fetch 调用的接口;Server Action 适合应用内部的数据变更(表单提交、按钮操作),更简洁、免手写接口。应用内 mutation 优先 Server Action。

## 一句话总结

**Middleware(middleware.ts)在请求到路由前运行于 Edge,做鉴权重定向/国际化/AB,用 matcher 限定路径且要轻量、只做粗粒度拦截;Route Handlers(route.ts 导出 GET/POST 等)是 App Router 写 API 的方式、用 Web 标准 Request/Response,取代 pages/api;对外 API 用 Route Handler、应用内 mutation 用 Server Action。**
