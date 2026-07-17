# S7 · 线上错误监控与偶现 bug 定位

> 场景排错专项 · 现象 → 排查路径 → 常见根因 → 解决 → 举一反三

## 现象

用户反馈"点了没反应""偶尔报错",但你本地复现不了;线上有报错但只有一句 `Script error.`,看不到堆栈;想知道到底有多少用户受影响。

## 排查路径

```
① 有没有错误监控?没有的话,你根本"看不见"线上问题 → 先接监控
② 监控平台(Sentry 等)看这条错误:
   - 错误堆栈能定位到源码行吗?(需要 sourcemap)
   - 影响用户数、设备/浏览器/系统分布、发生时间(是否某次发布后激增)
   - 用户操作路径(面包屑 breadcrumbs)、当时的请求/状态
③ 报错是 "Script error." 且无堆栈?→ 跨域脚本错误被浏览器屏蔽了
④ 结合设备分布:是不是只在某类机型/浏览器出现(兼容性)?
⑤ 结合时间线:是否与某次发布、某个接口变更相关?
```

## 常见根因(分类)

**1. 没有监控 → 全靠用户反馈(最大的问题)**
不接监控,你只能被动等投诉,无法量化影响、无法主动发现。

**2. `Script error.` —— 跨域脚本报错被屏蔽**
JS 部署在 CDN(跨域),出错时浏览器出于安全只给一句 `Script error.`,拿不到具体堆栈。

**3. 生产代码压缩混淆,堆栈看不懂**
报错定位到 `a.min.js:1:2345`,没有 sourcemap 无法还原到源码。

**4. 偶现问题的典型来源**
- 特定机型/浏览器/系统版本的兼容性;
- 竞态、时序问题(见 S4);
- 弱网/接口超时下的边界;
- 用户特定数据触发(空数据、超长、特殊字符)。

## 解决方案

### 让错误"可见 + 可定位"

| 问题 | 解决 |
|------|------|
| 看不见线上错误 | 接入 Sentry / 自建监控,上报 JS 错误、Promise rejection、资源加载错误、接口错误 |
| Script error. | `<script crossorigin>` + 服务端返回 `Access-Control-Allow-Origin`,让浏览器暴露堆栈 |
| 堆栈看不懂 | 上传 sourcemap 到监控平台(注意:sourcemap 不要部署到公网) |
| 不知影响面 | 监控上报用户数、设备分布、发生趋势 |
| 复现难 | 用面包屑记录用户操作路径 + 快照当时状态 |

### 错误捕获方式

```js
// 1. 全局同步错误
window.addEventListener('error', (e) => report(e));

// 2. 未处理的 Promise 拒绝
window.addEventListener('unhandledrejection', (e) => report(e.reason));

// 3. 资源加载错误(要用捕获阶段,资源错误不冒泡)
window.addEventListener('error', (e) => {
  if (e.target?.tagName === 'IMG' || e.target?.tagName === 'SCRIPT') {
    report({ type: 'resource', url: e.target.src });
  }
}, true);   // ← true 捕获阶段

// 4. React 错误边界 / Vue errorHandler 捕获渲染错误
```

## 举一反三(面试如何答)

**Q:线上偶现 bug、本地复现不了,怎么定位?**
> 关键是**让线上错误变得可见和可定位**。首先必须有错误监控(如 Sentry),上报 JS 错误、Promise rejection、资源和接口错误。然后看这条错误的**堆栈(靠 sourcemap 还原源码)、影响用户数、设备和浏览器分布、发生时间**——比如是不是某次发布后激增、是不是集中在某类机型(那就是兼容性)。再用**面包屑还原用户操作路径**帮助复现。如果报错只有 `Script error.`,那是跨域脚本问题,给 script 加 crossorigin 并让 CDN 返回 CORS 头就能拿到真实堆栈。

**关键补充**:
- **"先让问题可见"**这个意识本身就是高级信号——很多人只会本地 debug;
- `Script error.` + crossorigin 是经典考点;
- sourcemap **不能暴露到公网**(会泄露源码),要上传到监控平台或构建后删除。

## 一句话总结

**偶现 bug 靠监控:接 Sentry 上报 JS 错误/Promise rejection/资源/接口错误,用 sourcemap 还原堆栈(勿泄露公网)、看用户数与设备分布定位兼容性、用面包屑还原路径;`Script error.` 是跨域屏蔽,加 crossorigin + CORS 头解决;核心意识是先让线上问题可见可量化。**
