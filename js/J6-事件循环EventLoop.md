# J6 · 事件循环 Event Loop

> 热度:🔥🔥🔥

## 一句话考点

JS 是单线程,通过**事件循环**处理异步:同步代码走主栈,异步回调进任务队列;每轮先清空**同步栈**,再清空所有**微任务**,再取**一个宏任务**,如此循环。

## 原理精讲

### 1. 为什么需要事件循环

JS 单线程(避免 DOM 操作冲突),为了不阻塞,把耗时操作交给宿主(浏览器/Node),完成后把回调放入队列,主线程空闲时取出执行。

### 2. 宏任务 vs 微任务

| 类型 | 包含 |
|------|------|
| **宏任务(macrotask)** | `script` 整体、`setTimeout`、`setInterval`、`setImmediate`(Node)、I/O、UI 渲染 |
| **微任务(microtask)** | `Promise.then/catch/finally`、`queueMicrotask`、`MutationObserver`、`process.nextTick`(Node,优先级最高) |

### 3. 执行顺序(关键规则)

1. 执行同步代码(一个宏任务:script);
2. 同步执行完,**清空所有微任务队列**;
3. (浏览器可能进行渲染);
4. 从宏任务队列取**一个**宏任务执行;
5. 再次清空所有微任务;
6. 重复 4-5。

**记忆点:一个宏任务 → 清空所有微任务 → 下一个宏任务。**

## 代码示例

### 经典输出题

```js
console.log('1');                          // 同步

setTimeout(() => console.log('2'), 0);     // 宏任务

Promise.resolve().then(() => {
  console.log('3');                        // 微任务
  setTimeout(() => console.log('4'), 0);   // 微任务里注册宏任务
});

Promise.resolve().then(() => console.log('5')); // 微任务

console.log('6');                          // 同步

// 输出:1 6 3 5 2 4
// 解析:同步 1、6 → 清空微任务 3、5 → 宏任务 2 → 宏任务 4
```

### async/await 版本

```js
async function async1() {
  console.log('a1 start');
  await async2();
  console.log('a1 end');   // await 后面相当于 .then 里的微任务
}
async function async2() {
  console.log('a2');
}
console.log('script start');
async1();
setTimeout(() => console.log('timeout'), 0);
Promise.resolve().then(() => console.log('promise'));
console.log('script end');

// 输出:
// script start
// a1 start
// a2
// script end
// a1 end        ← await 之后是微任务
// promise
// timeout
```

## 高频追问

**Q:微任务为什么优先于宏任务?**
A:微任务是在当前宏任务结束后、下一个宏任务开始前"一次性清空"的,保证异步结果尽快处理,避免 UI 渲染前状态不一致。

**Q:Node 和浏览器的事件循环区别?**
A:Node 有 6 个阶段(timers、pending、poll、check 等),`process.nextTick` 优先级高于 Promise 微任务;浏览器只有宏/微两级。Node 11+ 行为已向浏览器对齐(每个宏任务后清空微任务)。

**Q:`setTimeout(fn, 0)` 真的是 0ms 吗?**
A:不是。HTML 规范规定最小延迟约 4ms(嵌套超过 5 层),且要等主线程空闲和微任务清空后才执行。

**Q:`await` 后面的代码何时执行?**
A:`await x` 相当于把后续代码包进 `Promise.resolve(x).then(...)`,即作为微任务在当前同步代码结束后执行。

## 一句话背诵版

**单线程 + 事件循环;同步走栈,异步回调进队列;每轮:清空同步 → 清空所有微任务(Promise.then)→ 取一个宏任务(setTimeout)→ 再清空微任务,循环往复。**
