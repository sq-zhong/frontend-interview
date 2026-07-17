# J8 · async / await 原理

> 热度:🔥🔥

## 一句话考点

`async/await` 是 **Generator + Promise 的语法糖**,用同步的写法处理异步;`async` 函数返回 Promise,`await` 会暂停函数执行、等待 Promise 敲定后取值。

## 原理精讲

### 1. async 函数特点

- 总是返回一个 Promise:return 的值被 `Promise.resolve` 包裹,抛出的错误变成 rejected。
- 函数内可用 `await`。

### 2. await 做了什么

- `await expr`:等待 expr(通常是 Promise)敲定;
- 敲定前**暂停** async 函数执行,把控制权交还调用者;
- 敲定后,后续代码作为**微任务**恢复执行;
- 若 Promise 拒绝,await 会抛出错误(可用 try/catch 捕获)。

### 3. 本质

async/await 底层是 Generator 函数配合自动执行器(类似 co 库),`await` 对应 `yield`,执行器在每个 Promise 敲定后调用 `.next()` 恢复执行。

## 代码示例

### 错误处理

```js
async function getData() {
  try {
    const user = await fetchUser();     // 任一步失败都会被 catch
    const posts = await fetchPosts(user.id);
    return posts;
  } catch (err) {
    console.error('请求失败', err);
    throw err;                          // 可继续向上抛
  }
}
```

### 串行 vs 并行(高频优化点)

```js
// ❌ 串行:总耗时 = a + b(互不依赖却白等)
const a = await taskA();   // 1s
const b = await taskB();   // 1s → 共 2s

// ✅ 并行:总耗时 = max(a, b)
const [a, b] = await Promise.all([taskA(), taskB()]);  // 共 1s
```

### 循环中的 await

```js
// 串行(需要顺序)
for (const url of urls) {
  await fetch(url);       // 一个接一个
}

// 并行(无顺序依赖)
await Promise.all(urls.map(url => fetch(url)));

// ⚠️ forEach 不会等待 await(常见错误)
urls.forEach(async url => { await fetch(url); }); // 不会串行!
```

## 高频追问

**Q:async/await 相比 Promise 的优势?**
A:① 写法更接近同步,可读性高;② 用 try/catch 统一处理错误,比 .catch 更直观;③ 调试更方便(可打断点)。

**Q:await 后面可以跟非 Promise 吗?**
A:可以。会用 `Promise.resolve()` 包裹,`await 1` 直接返回 1(但仍会让出一个微任务时机)。

**Q:如何并行执行多个 await?**
A:先发起所有请求拿到 Promise,再用 `Promise.all` 等待;或直接 `await Promise.all([...])`。切忌对互不依赖的任务逐个 await。

**Q:async 函数里的错误如何被外部捕获?**
A:async 返回 rejected Promise,外部用 `.catch()` 或 `await` + try/catch 捕获。

**Q:一个 await 报错会影响后续吗?**
A:会。await 抛错后,后续代码不再执行,函数返回 rejected Promise,除非用 try/catch 兜住。

## 一句话背诵版

**async 函数返回 Promise;await 暂停执行等待敲定、之后作为微任务恢复;本质是 Generator+Promise 语法糖;错误用 try/catch;互不依赖的任务用 `Promise.all` 并行,别逐个 await、别在 forEach 里 await。**
