# ND4 · HTTP 服务与框架中间件

> Node.js 专题 · 原生 HTTP → 中间件模型 → 洋葱模型 → 考点

## 一句话考点

Node 用 `http` 模块可裸写服务;Express/Koa 用**中间件(middleware)**组织请求处理流程;Koa 的中间件是 **async + 洋葱模型**(可在 await next() 前后做事),比 Express 的线性 next() 更优雅。

## 原理

### 1. 原生 HTTP 服务

```js
const http = require('http');
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ msg: 'ok' }));
});
server.listen(3000);
```
裸写要手动解析 URL、method、body,繁琐——所以有了框架。

### 2. 中间件模型

中间件是处理请求的函数链,每个中间件可以:处理请求 → 决定是否传给下一个(next)。用于日志、鉴权、body 解析、错误处理等横切关注点。

### 3. Express 中间件(线性)

```js
const express = require('express');
const app = express();

app.use(express.json());                    // body 解析中间件
app.use((req, res, next) => {               // 自定义中间件
  console.log(`${req.method} ${req.url}`);
  next();                                    // 传给下一个,不调则请求挂起
});
app.get('/users', (req, res) => res.json([]));

// 错误处理中间件(4 个参数)
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});
```

### 4. Koa 洋葱模型(重点)

Koa 中间件是 async 函数,`await next()` 把控制权交给下一个中间件,**next 之后的代码在返回时执行**——形成"洋葱"层层进入再层层退出:

```js
const Koa = require('koa');
const app = new Koa();

app.use(async (ctx, next) => {
  console.log('1 进入');
  const start = Date.now();
  await next();                    // 进入下一层
  console.log('1 离开', Date.now() - start);   // 回来时执行
});
app.use(async (ctx, next) => {
  console.log('2 进入');
  await next();
  console.log('2 离开');
});
app.use(async (ctx) => {
  console.log('3 处理');
  ctx.body = 'hello';
});

// 输出:1进入 → 2进入 → 3处理 → 2离开 → 1离开
```

**洋葱模型**:请求从外层向内层进入(next 前),响应从内层向外层返回(next 后)。适合"计时、错误捕获、响应加工"等需要在前后都做事的场景。

### Express vs Koa

| | Express | Koa |
|--|---------|-----|
| 中间件 | 回调 + next() 线性 | async/await + 洋葱模型 |
| 异步错误 | 需手动 try/catch 或包装 | try/catch await 自然捕获 |
| 内置功能 | 多(路由、静态等) | 精简(洋葱内核,功能靠中间件) |
| 上下文 | req/res 分离 | ctx 聚合 req/res |

## 考点

**Q:什么是中间件?**
A:处理请求的函数链上的一环,能读写请求/响应、执行逻辑、决定是否调 next 传给下一个。用于日志、鉴权、body 解析、CORS、错误处理等横切逻辑,让请求处理流程可组合。

**Q:Koa 的洋葱模型是什么?**
A:中间件用 async 函数,await next() 进入下一层,next 之后的代码在下层执行完返回时运行。形成"进入时从外到内、返回时从内到外"的洋葱结构,便于在请求前后都做处理(计时、统一错误捕获、响应加工)。

**Q:Express 和 Koa 区别?**
A:Express 中间件是回调 + next() 线性执行、内置功能多、异步错误要手动处理;Koa 用 async/await + 洋葱模型、内核精简、能用 try/catch 自然捕获异步错误、用 ctx 聚合上下文。Koa 更现代轻量。

**Q:Express 怎么做统一错误处理?**
A:定义一个有 4 个参数 `(err, req, res, next)` 的中间件放在最后,Express 识别为错误处理中间件;同步错误会自动进入,异步错误要 next(err) 传入或用 try/catch(Express 5 改善了 async 支持)。

**Q:中间件顺序重要吗?**
A:非常重要。中间件按注册顺序执行,如 body 解析要在用到 req.body 的路由之前、鉴权要在业务之前、错误处理中间件要放最后。顺序错了逻辑就不对。

## 一句话总结

**Node 原生 http 可裸写服务但繁琐;中间件把请求处理拆成可组合的函数链(日志/鉴权/解析/错误);Express 线性 next()、内置多、异步错误要手动;Koa 是 async 洋葱模型(next 前后都能做事、try/catch 自然捕获错误、ctx 聚合)、内核精简;中间件按注册顺序执行,顺序很关键。**
