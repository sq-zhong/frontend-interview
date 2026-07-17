# ND5 · 进程、线程与集群

> Node.js 专题 · 进程 → 子进程 → worker_threads → cluster → 考点

## 一句话考点

Node 单线程,用 **cluster/PM2** 多进程利用多核(共享端口);CPU 密集任务用 **worker_threads**(共享内存的多线程)或 **child_process**(独立进程);进程间用 IPC 通信。

## 原理

### 1. 为什么需要多进程/多线程

Node 单线程执行 JS,无法利用多核 CPU;CPU 密集任务会阻塞事件循环(见 ND1)。解决靠多进程/多线程。

### 2. child_process(子进程)

创建独立进程执行任务或外部命令:

| 方法 | 用途 |
|------|------|
| `spawn` | 流式,适合大输出/长任务 |
| `exec` | 带缓冲,适合小输出的 shell 命令 |
| `execFile` | 执行可执行文件 |
| `fork` | 专为创建 Node 子进程,带 IPC 通道 |

```js
const { fork } = require('child_process');
const child = fork('./worker.js');
child.send({ task: 'compute' });          // 主 → 子(IPC)
child.on('message', (result) => { ... });  // 子 → 主
```

### 3. worker_threads(工作线程)

Node 10+ 的多线程方案,**同一进程内多线程**,可**共享内存**(SharedArrayBuffer),比子进程更轻:

```js
const { Worker } = require('worker_threads');
const worker = new Worker('./heavy-task.js');
worker.postMessage(data);
worker.on('message', (result) => { ... });
```
适合 **CPU 密集计算**(图像处理、加密、大数据),不阻塞主线程。

### 4. cluster(集群)

利用多核:主进程 fork 多个 worker 进程,**共享同一个端口**(主进程负责分发连接),充分利用多核提升吞吐:

```js
const cluster = require('cluster');
const os = require('os');
if (cluster.isPrimary) {
  for (let i = 0; i < os.cpus().length; i++) cluster.fork();  // 每核一个进程
  cluster.on('exit', () => cluster.fork());   // 进程挂了重启(容错)
} else {
  require('./server');   // 每个 worker 跑一个服务实例
}
```

生产中常用 **PM2** 管理(cluster 模式 + 自动重启 + 负载均衡 + 日志),不用手写。

### 对比

| 方案 | 隔离 | 通信 | 适用 |
|------|------|------|------|
| child_process | 独立进程 | IPC(消息拷贝) | 执行命令/隔离任务 |
| worker_threads | 同进程多线程 | 消息 + 共享内存 | CPU 密集计算 |
| cluster | 多进程共享端口 | IPC | 多核提升服务吞吐 |

## 考点

**Q:Node 单线程如何利用多核?**
A:用 cluster 模块(或 PM2),主进程 fork 多个 worker 子进程,共享同一端口,由主进程分发连接到各 worker,从而利用多核提升并发吞吐;每个 worker 是独立进程有独立事件循环。

**Q:worker_threads 和 child_process 区别?**
A:child_process 创建独立进程(内存隔离、通过 IPC 消息拷贝通信、开销大);worker_threads 是同进程内多线程(更轻、可通过 SharedArrayBuffer 共享内存)。CPU 密集计算优先 worker_threads,执行外部命令/需强隔离用 child_process。

**Q:cluster 多进程怎么共享端口?**
A:主进程监听端口并创建 socket,fork 出的 worker 通过 IPC 共享该 socket 的文件描述符,由主进程(或 OS)把新连接分发给某个 worker。所以多个进程能"监听同一端口"而不冲突。

**Q:CPU 密集任务在 Node 里怎么处理?**
A:不能直接在主线程做(会阻塞事件循环)。用 worker_threads 放到工作线程计算,或 child_process 交给子进程,或拆分成小任务用 setImmediate 分片。计算完通过消息传回主线程。

**Q:PM2 是什么?**
A:Node 进程管理工具,提供 cluster 模式(多进程负载均衡)、进程守护(崩溃自动重启)、零停机重载、日志管理、监控。生产环境用它管理 Node 服务,省去手写 cluster。

## 一句话总结

**Node 单线程,多核靠 cluster/PM2(多进程共享端口、主进程分发连接);CPU 密集用 worker_threads(同进程多线程、可共享内存、更轻)或 child_process(独立进程、IPC 通信、强隔离);进程间用 IPC 通信;生产用 PM2 做进程守护+负载均衡+自动重启。**
