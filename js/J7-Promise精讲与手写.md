# J7 · Promise 精讲与手写

> 热度:🔥🔥🔥

## 一句话考点

Promise 是异步编程解决方案,用**状态机**(pending→fulfilled/rejected)管理异步结果,解决回调地狱;状态一旦改变不可逆,`then` 返回新 Promise 实现链式调用。

## 原理精讲

### 1. 三种状态

- `pending`(进行中)→ 可转为 `fulfilled` 或 `rejected`;
- 状态只能改变**一次**,且不可逆;
- 状态改变后,`then`/`catch` 回调异步执行(微任务)。

### 2. 核心方法

| 方法 | 作用 |
|------|------|
| `then(onFulfilled, onRejected)` | 注册成功/失败回调,返回新 Promise |
| `catch(fn)` | 等价 `then(null, fn)`,捕获错误 |
| `finally(fn)` | 无论成败都执行,不接收参数 |

### 3. 静态方法

| 方法 | 行为 |
|------|------|
| `Promise.all` | 全部成功才成功;有一个失败即失败(短路) |
| `Promise.race` | 第一个敲定(成功或失败)的结果 |
| `Promise.allSettled` | 等所有敲定,返回每个的状态(不短路) |
| `Promise.any` | 第一个**成功**的;全失败才失败 |

## 代码示例

### 链式与错误处理

```js
fetch('/api')
  .then(res => res.json())
  .then(data => process(data))
  .catch(err => console.error(err))   // 捕获链上任意错误
  .finally(() => hideLoading());
```

### 手写符合 Promise/A+ 的简版

```js
class MyPromise {
  constructor(executor) {
    this.status = 'pending';
    this.value = undefined;
    this.reason = undefined;
    this.onFulfilledCbs = [];    // 缓存 pending 期间的回调
    this.onRejectedCbs = [];

    const resolve = value => {
      if (this.status !== 'pending') return;
      this.status = 'fulfilled';
      this.value = value;
      this.onFulfilledCbs.forEach(fn => fn());
    };
    const reject = reason => {
      if (this.status !== 'pending') return;
      this.status = 'rejected';
      this.reason = reason;
      this.onRejectedCbs.forEach(fn => fn());
    };

    try {
      executor(resolve, reject);
    } catch (e) {
      reject(e);
    }
  }

  then(onFulfilled, onRejected) {
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : v => v;
    onRejected = typeof onRejected === 'function' ? onRejected : e => { throw e; };

    const promise2 = new MyPromise((resolve, reject) => {
      const handleFulfilled = () => {
        queueMicrotask(() => {          // 异步执行,保证微任务语义
          try {
            resolve(onFulfilled(this.value));
          } catch (e) { reject(e); }
        });
      };
      const handleRejected = () => {
        queueMicrotask(() => {
          try {
            resolve(onRejected(this.reason));
          } catch (e) { reject(e); }
        });
      };

      if (this.status === 'fulfilled') handleFulfilled();
      else if (this.status === 'rejected') handleRejected();
      else {                            // pending:缓存回调
        this.onFulfilledCbs.push(handleFulfilled);
        this.onRejectedCbs.push(handleRejected);
      }
    });
    return promise2;
  }
}
```

### 手写 Promise.all

```js
Promise.myAll = function (promises) {
  return new Promise((resolve, reject) => {
    const results = [];
    let count = 0;
    if (promises.length === 0) return resolve(results);
    promises.forEach((p, i) => {
      Promise.resolve(p).then(
        val => {
          results[i] = val;             // 按顺序存,不用 push
          if (++count === promises.length) resolve(results);
        },
        reject                          // 任一失败立即 reject
      );
    });
  });
};
```

## 高频追问

**Q:Promise 解决了什么问题?**
A:回调地狱(嵌套难维护)和控制反转(信任问题)。用链式调用替代嵌套,统一错误处理。

**Q:`then` 里 return 一个 Promise 会怎样?**
A:外层 then 会等待这个 Promise 敲定,并采用它的结果,实现异步串行。

**Q:`Promise.all` 和 `allSettled` 区别?**
A:all 短路——一个失败整体失败,拿不到其他成功结果;allSettled 等所有完成,返回 `{status, value/reason}` 数组,不短路,适合"都要拿到结果"的场景。

**Q:Promise 能取消吗?**
A:原生不能。可用 `Promise.race` 配合一个可 reject 的"取消 Promise",或用 `AbortController`(fetch)。

**Q:`.then` 的回调是同步还是异步?**
A:异步(微任务)。即使 Promise 已敲定,回调也会放入微任务队列,在当前同步代码后执行。

## 一句话背诵版

**Promise 是状态机(pending→fulfilled/rejected,一次且不可逆),then 返回新 Promise 支持链式;all 全成功/一败即败、race 取最快、allSettled 全等待、any 取最快成功;手写核心是缓存 pending 回调 + then 里用微任务执行。**
