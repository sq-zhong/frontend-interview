# ND6 · 异步模式与错误处理

> Node.js 专题 · 回调 → Promise → async/await → 错误处理 → 考点

## 一句话考点

Node 异步演进:**回调(error-first)→ Promise → async/await**;错误处理关键是**回调用 error-first 约定、Promise 用 catch、async 用 try/catch**,且**未捕获的 rejection 和异常要有兜底**避免进程崩溃。

## 原理

### 1. 异步演进

**回调(error-first 约定)**:Node 回调第一个参数是 error:

```js
fs.readFile('a.txt', (err, data) => {
  if (err) return handle(err);   // 先判错
  use(data);
});
```
问题:回调地狱、错误处理散乱。

**Promise 化**:用 `util.promisify` 把回调 API 转 Promise:

```js
const { promisify } = require('util');
const readFile = promisify(fs.readFile);
// 或直接用 fs.promises
const data = await fs.promises.readFile('a.txt');
```

**async/await**:同步写法处理异步(见 J8),配 try/catch。

### 2. 错误处理分层

| 场景 | 处理方式 |
|------|---------|
| 回调 | error-first,先判 `if (err)` |
| Promise | `.catch()` |
| async/await | `try/catch` |
| EventEmitter | 监听 `'error'` 事件(不监听会抛并可能崩溃) |
| Stream | 监听 `'error'` 事件 |

### 3. 进程级兜底(重点)

未被捕获的错误会导致**进程崩溃**,要有兜底:

```js
// 未捕获的同步异常
process.on('uncaughtException', (err) => {
  logger.error('未捕获异常', err);
  // 建议:记录日志后优雅退出(进程状态可能已不可靠)
  process.exit(1);   // 交给 PM2/cluster 重启
});

// 未处理的 Promise rejection
process.on('unhandledRejection', (reason) => {
  logger.error('未处理的 rejection', reason);
});
```

**重要观念**:uncaughtException 后进程状态可能已损坏,**不应继续运行**——记录日志后优雅退出,由进程管理器(PM2/cluster)重启,而非"吞掉错误继续跑"。

### 4. 框架层错误处理

- Express:错误处理中间件(见 ND4);
- Koa:洋葱模型最外层 try/catch await next()(统一捕获下游所有错误);
- 异步路由:确保 await 的错误能传到统一处理器。

## 代码示例

```js
// Koa 统一错误处理(洋葱最外层)
app.use(async (ctx, next) => {
  try {
    await next();                         // 捕获下游所有中间件的错误
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = { error: err.message };
    ctx.app.emit('error', err, ctx);      // 触发日志
  }
});
```

## 考点

**Q:Node 的 error-first 回调是什么?**
A:Node 回调约定第一个参数是错误对象(没错误则为 null),后续参数是结果。调用时先判断 err 再用数据。这是回调时代统一的错误传递约定。

**Q:async/await 里怎么处理错误?多个 await 呢?**
A:用 try/catch 包裹。多个 await 可以放同一个 try/catch 统一捕获;互不依赖的用 Promise.all 并行(注意 all 短路,一个失败全失败,要全部结果用 allSettled)。(见 J8)

**Q:uncaughtException 应该怎么处理?**
A:监听它记录日志,但**不应假装无事继续运行**——此时进程状态可能已损坏。正确做法是记录后优雅退出(process.exit),由 PM2/cluster 重启一个干净的进程。它是最后的兜底而非常规错误处理。

**Q:unhandledRejection 是什么?**
A:未被 .catch 处理的 Promise 拒绝。要监听 process 的 unhandledRejection 事件记录,避免静默失败。新版 Node 默认未处理的 rejection 会导致进程退出,所以更要处理好每个 Promise 的错误。

**Q:EventEmitter/Stream 的错误怎么处理?**
A:必须监听它们的 `'error'` 事件。如果 error 事件没有监听器,EventEmitter 会把错误抛出,可能导致进程崩溃。Stream 同理,pipe 时也要对各端监听 error。

## 一句话总结

**Node 异步:回调(error-first,先判 err)→ Promise(.catch/promisify)→ async/await(try/catch);EventEmitter/Stream 必须监听 'error' 事件否则崩溃;进程级兜底 uncaughtException(记录后优雅退出交 PM2 重启,别硬撑)和 unhandledRejection;框架层用 Express 错误中间件 / Koa 洋葱最外层 try/catch 统一处理。**
