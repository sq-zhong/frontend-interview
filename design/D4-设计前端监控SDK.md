# D4 · 设计前端监控 SDK

> 系统设计专项 · 题目 → 需求澄清 → 架构 → 难点与取舍 → 追问

## 题目

设计一个前端监控 SDK,采集错误、性能、用户行为并上报。

## 需求澄清

- **监控什么**:JS 错误、资源加载错误、接口错误、性能指标(Web Vitals)、用户行为(PV/UV、点击);
- **核心约束**:① 不能影响主应用性能;② SDK 体积小;③ 数据不能大量丢失;④ 尽量不侵入业务代码。

## 整体架构

```
采集(Collect) → 上报(Report) → 服务端接收 → 存储 → 分析聚合 → 告警 + 可视化
       ↑ 前端 SDK 核心是采集 + 上报两层
```

## 核心模块设计

### 1. 错误采集(见 S7)

| 类型 | 采集方式 |
|------|---------|
| JS 运行时错误 | `window.addEventListener('error')` |
| Promise 未捕获 | `window.addEventListener('unhandledrejection')` |
| 资源加载错误 | error 事件**捕获阶段**(资源错误不冒泡) |
| 接口错误 | 重写 `fetch` / `XMLHttpRequest`(拦截) |
| 框架错误 | React 错误边界 / Vue errorHandler |

配合 **sourcemap** 还原压缩代码的堆栈(勿泄露公网)。

### 2. 性能采集

- 用 **PerformanceObserver** 采集 Web Vitals(LCP/INP/CLS)、FCP、TTFB;
- 用 `performance.getEntries()` 拿资源加载耗时。

### 3. 行为采集

- PV/UV:页面加载、路由变化(监听 history/hashchange);
- 点击行为:事件委托 + `data-track` 埋点属性;
- 用户操作路径(面包屑):记录最近 N 个操作,报错时一起上报,帮助复现。

### 4. 上报策略(重点权衡)

| 方式 | 优点 | 缺点 | 用途 |
|------|------|------|------|
| `sendBeacon` | 页面卸载也能发、不阻塞 | 数据量限制 | **首选**,尤其离开页面时 |
| `img.src`(GIF) | 无跨域限制、兼容好 | 只能 GET、数据量小 | 兜底 |
| `fetch/XHR` | 灵活 | 页面卸载可能丢 | 常规批量上报 |

**优化**:
- **批量上报**:攒够 N 条或每隔 T 秒发一次,减少请求;
- **采样**:高频数据(如性能)按比例采样,降低量级;
- **错峰**:用 `requestIdleCallback` 在空闲时上报,不抢主线程;
- **去重/限流**:相同错误合并,避免一个死循环错误刷爆。

## 难点与取舍

**Q:如何保证不影响主应用性能?**
- 采集用被动监听,不做重计算;
- 上报错峰(requestIdleCallback)+ 批量,减少请求;
- 大计算(如 hash)放 Web Worker;
- SDK 异步加载,不阻塞主流程。

**Q:如何保证数据不丢?**
- 页面卸载(unload/visibilitychange)时用 `sendBeacon` 兜底发送未上报的数据;
- 上报失败可暂存 localStorage,下次进入补报。

**Q:如何降低数据量级?**
- 采样(尤其性能和行为数据);错误去重合并;字段精简。

## 追问

**Q:sendBeacon 为什么适合上报?**
A:它异步发送、不阻塞页面卸载,即使在 unload/页面关闭时也能可靠送达(浏览器保证),特别适合"离开页面时上报剩余数据"这种 fetch 会被中断的场景。

**Q:资源错误为什么要用捕获阶段?**
A:资源加载错误(img/script 404)不会冒泡到 window,只能在捕获阶段(addEventListener 第三参 true)捕获(见 B2/S7)。

**Q:怎么定位到具体代码?**
A:上报压缩后的错误堆栈,服务端结合 sourcemap 还原到源码行。sourcemap 上传到监控平台而非公网,防源码泄露。

## 一句话总结

**监控 SDK:采集(JS/Promise/资源[捕获阶段]/接口[重写fetch]错误 + PerformanceObserver 性能 + 行为埋点面包屑)→ 上报(sendBeacon 首选/img 兜底/批量+采样+错峰 requestIdleCallback)→ 服务端 sourcemap 还原堆栈;核心权衡:不影响主应用性能、数据不丢(卸载 sendBeacon+localStorage 补报)、降量级(采样去重)。**
