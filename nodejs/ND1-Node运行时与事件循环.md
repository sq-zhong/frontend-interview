# ND1 · Node 运行时与事件循环

> Node.js 专题 · 核心必考 · 运行时 → 事件循环六阶段 → 对比浏览器 → 考点

## 一句话考点

Node 是基于 **V8 + libuv** 的 JS 运行时,单线程执行 JS + 事件循环处理异步 IO;事件循环有**六个阶段**(timers/pending/poll/check/close 等),`process.nextTick` 和微任务优先级最高;耗时 IO 交给 libuv 线程池,不阻塞主线程。

## 原理

### 1. Node 架构

```
JS 代码
  ↓
V8(执行 JS)  +  Node API(fs/net/http...)
  ↓
libuv(事件循环 + 线程池 + 异步 IO 封装)
  ↓
操作系统
```

- **V8**:执行 JS;
- **libuv**:C 库,提供事件循环、线程池(默认 4 个)、跨平台异步 IO。

Node **单线程执行 JS**(和浏览器一样),但底层 IO 由 libuv 的线程池并发处理,所以能高并发。

### 2. 事件循环六阶段(重点)

每一轮 tick 按顺序经过这些阶段,每阶段有自己的回调队列:

```
① timers        —— 执行到期的 setTimeout / setInterval 回调
② pending        —— 执行系统层回调(如 TCP 错误)
③ idle/prepare   —— 内部使用
④ poll           —— 核心:等待并处理 IO 事件(读文件、网络)
⑤ check          —— 执行 setImmediate 回调
⑥ close          —— 执行 close 事件回调(如 socket.on('close'))
```

### 3. 微任务的插入时机(高频)

- `process.nextTick` 队列:**每个阶段结束后立即清空**,优先级最高;
- Promise 微任务队列:紧随 nextTick 之后清空;
- 顺序:**同步代码 → process.nextTick → Promise 微任务 → 进入/继续事件循环阶段**。

### 4. setTimeout vs setImmediate

- `setImmediate` 在 **check** 阶段执行;
- `setTimeout(fn, 0)` 在 **timers** 阶段执行;
- 在主模块中两者顺序**不确定**(取决于进入循环的耗时);但在 **IO 回调内**,setImmediate **一定先于** setTimeout(因为 poll 之后紧接着就是 check)。

## 代码示例

```js
console.log('1');                         // 同步
setTimeout(() => console.log('timeout'), 0);   // timers 阶段
setImmediate(() => console.log('immediate'));  // check 阶段
Promise.resolve().then(() => console.log('promise'));  // 微任务
process.nextTick(() => console.log('nextTick'));       // nextTick(最高优先级)
console.log('2');                         // 同步

// 输出:1 2 nextTick promise (timeout/immediate 顺序不定)
// 同步 1、2 → nextTick → promise 微任务 → 进入事件循环 timers/check
```

```js
// IO 回调内:immediate 必先于 timeout
const fs = require('fs');
fs.readFile(__filename, () => {
  setTimeout(() => console.log('timeout'), 0);
  setImmediate(() => console.log('immediate'));
});
// 输出:immediate → timeout(poll 后紧接 check 阶段)
```

## 考点

**Q:Node 事件循环和浏览器事件循环区别?**
A:浏览器只有宏任务/微任务两级;Node 的事件循环有六个阶段(timers/pending/poll/check/close 等),每阶段有独立队列。Node 多了 `process.nextTick`(优先级最高)和 `setImmediate`(check 阶段)。Node 11+ 已对齐浏览器"每个宏任务后清空微任务"的行为。

**Q:process.nextTick 和 Promise.then 谁先?**
A:process.nextTick 先。nextTick 队列在每个阶段结束后立即清空,优先级高于 Promise 微任务队列。nextTick 过度使用会"饿死"事件循环(一直插队导致 IO 得不到执行)。

**Q:setTimeout(fn,0) 和 setImmediate 谁先执行?**
A:主模块中顺序不确定(看进入事件循环的耗时);但在 IO 回调内,setImmediate 一定先执行——因为 IO 回调在 poll 阶段,紧接着就是 check 阶段(setImmediate),而 timers 要等下一轮。

**Q:Node 单线程为什么能高并发?**
A:JS 执行是单线程,但耗时的 IO(文件、网络、DNS)交给 libuv 的线程池和操作系统异步处理,主线程不阻塞,通过事件循环在 IO 完成后回调。适合 IO 密集,不适合 CPU 密集(会阻塞主线程)。

**Q:CPU 密集任务在 Node 里怎么办?**
A:会阻塞事件循环。解决:用 worker_threads 工作线程、child_process 子进程,或拆分任务分片,避免长时间占用主线程。

## 一句话总结

**Node = V8(执行 JS)+ libuv(事件循环+线程池);单线程执行 JS、IO 交 libuv 线程池实现高并发(适合 IO 密集);事件循环六阶段(timers→pending→poll→check→close),process.nextTick 优先级最高、其次 Promise 微任务、每阶段后清空;IO 回调内 setImmediate 先于 setTimeout;CPU 密集用 worker_threads。**
