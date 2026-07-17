# B5 · Web Worker 多线程

> 热度:🔥🔥

## 一句话考点

Web Worker 让 JS 在**后台独立线程**运行,不阻塞主线程,适合 CPU 密集型计算;它**无法访问 DOM**,与主线程通过 `postMessage` 通信(数据是拷贝而非共享)。

## 原理精讲

### 1. 为什么需要 Web Worker

JS 主线程单线程,耗时计算(大数据处理、图像处理、加解密)会阻塞渲染和交互(见 B1)。Web Worker 开一个后台线程并行计算,算完把结果传回主线程。

### 2. 三种 Worker

| 类型 | 说明 |
|------|------|
| **Dedicated Worker** | 专用,只属于创建它的页面(最常用) |
| **Shared Worker** | 可被多个同源页面/标签页共享 |
| **Service Worker** | 特殊 worker,做离线缓存和代理(见 B6) |

### 3. 限制

- **不能访问 DOM、window、parent**(避免多线程操作 DOM 的竞态);
- 可以用:`self`、`XMLHttpRequest`/`fetch`、`setTimeout`、部分 Web API;
- 与主线程**不共享内存**,通信靠消息传递(结构化克隆,数据被拷贝)。

### 4. 通信机制

- `postMessage(data)` 发送,`onmessage` 接收;
- 数据默认**深拷贝**(结构化克隆),大数据拷贝有开销;
- 优化:用 **Transferable Objects**(如 ArrayBuffer)转移所有权,零拷贝。

## 代码示例

### 基本用法

```js
// main.js —— 主线程
const worker = new Worker('worker.js');

worker.postMessage({ nums: [1, 2, 3, ...bigArray] });   // 发送数据

worker.onmessage = (e) => {
  console.log('计算结果:', e.data);                      // 接收结果
  worker.terminate();                                    // 用完销毁
};

worker.onerror = (e) => console.error(e.message);
```

```js
// worker.js —— 后台线程
self.onmessage = (e) => {
  const { nums } = e.data;
  const sum = nums.reduce((a, b) => a + b, 0);   // 耗时计算不阻塞主线程
  self.postMessage(sum);                          // 传回结果
};
```

### Transferable 零拷贝(大数据优化)

```js
const buffer = new ArrayBuffer(1024 * 1024 * 8);
// 第二参数:转移所有权,主线程不再能访问 buffer,但无需拷贝
worker.postMessage(buffer, [buffer]);
```

## 高频追问

**Q:Web Worker 能访问 DOM 吗?为什么?**
A:不能。Worker 运行在独立线程,若允许操作 DOM 会产生多线程竞态(和主线程同时改 DOM)。它只能做计算,通过 postMessage 把结果传回主线程,由主线程更新 DOM。

**Q:主线程和 Worker 如何通信?数据是共享的吗?**
A:通过 postMessage 发送 / onmessage 接收。数据默认是**结构化克隆(深拷贝)**,不共享内存,所以修改互不影响。大数据可用 Transferable Objects 转移所有权避免拷贝开销。

**Q:什么场景适合 Web Worker?**
A:CPU 密集型任务:大数组计算、图像/视频处理、数据加解密、大 JSON 解析、复杂算法、离线数据处理。避免这些长任务阻塞主线程导致页面卡顿。

**Q:Web Worker 有什么限制/代价?**
A:不能访问 DOM/window;通信有序列化开销(拷贝数据);创建线程本身有开销,不适合频繁短任务;数量受限于 CPU 核数。适合"少量长任务"而非"大量短任务"。

**Q:Dedicated 和 Shared Worker 区别?**
A:Dedicated Worker 只服务创建它的那个页面;Shared Worker 可被多个同源标签页/窗口共享,通过 port 通信,适合跨标签页共享计算或状态。

## 一句话背诵版

**Web Worker 在后台独立线程跑 JS 不阻塞主线程,适合 CPU 密集计算;不能访问 DOM(防竞态),靠 postMessage/onmessage 通信、数据深拷贝(大数据用 Transferable 零拷贝);适合少量长任务,有创建和通信开销。**
