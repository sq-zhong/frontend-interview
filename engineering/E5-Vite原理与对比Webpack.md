# E5 · Vite 原理与对比 Webpack

> 热度:🔥🔥🔥

## 一句话考点

Vite 开发环境利用浏览器**原生 ESM**,不打包直接按需编译单个模块,启动秒开、热更新快;生产环境用 **Rollup** 打包。核心优势是 dev server 冷启动和 HMR 极快。

## 原理精讲

### 1. Webpack 的痛点

Webpack 开发时也要**先打包整个应用**再启动 dev server,项目越大,冷启动越慢、HMR 越慢(要重新构建相关 chunk)。

### 2. Vite 开发环境原理(no-bundle)

Vite **不打包**,而是:
1. 启动一个 dev server;
2. 浏览器请求入口,遇到 `import` 时**按需**向 server 请求对应模块;
3. server 对该单个模块做即时编译(TS/JSX/Vue → JS)并返回;
4. 利用浏览器**原生 ESM** 加载,用到才编译,启动几乎与项目大小无关。

### 3. 依赖预构建(esbuild)

第三方依赖(node_modules)用 **esbuild**(Go 编写,比 JS 打包器快 10-100 倍)预构建:
- 把 CommonJS/UMD 依赖转成 ESM;
- 把多文件的库(如 lodash-es 几百个模块)合并成一个,减少请求数。

### 4. 生产环境用 Rollup

生产仍需打包(否则大量 HTTP 请求、无法充分优化)。Vite 用 Rollup 打包,产出优化后的静态资源。

### 5. HMR 快的原因

Vite 的 HMR 基于原生 ESM,只需让浏览器重新请求**变更的那个模块**,与整体大小无关;Webpack 需重新构建相关模块链。

## 对比表

| 维度 | Webpack | Vite(dev) |
|------|---------|-----------|
| 开发启动 | 先打包全部,慢 | 不打包,秒开 |
| HMR | 重建相关 chunk,较慢 | 只更新变更模块,极快 |
| 依赖处理 | 打包进 bundle | esbuild 预构建 |
| 生产打包 | Webpack 自身 | Rollup |
| 原理 | 全量打包 | 原生 ESM 按需编译 |
| 生态/兼容 | 成熟、插件多 | 较新,基于 Rollup 插件 |

## 代码示例

### Vite 配置

```js
// vite.config.js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: { port: 3000 },
  build: {
    rollupOptions: {                  // 生产用 Rollup 配置
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router'],   // 手动分包
        },
      },
    },
  },
});
```

### 开发时浏览器实际请求

```html
<!-- Vite 注入的入口,浏览器原生 ESM 加载 -->
<script type="module" src="/src/main.js"></script>
<!-- main.js 里 import './App.vue' → 浏览器请求 /src/App.vue
     → Vite 即时把 .vue 编译成 JS 返回,用到才编译 -->
```

## 高频追问

**Q:Vite 为什么比 Webpack 启动快?**
A:Webpack 启动前要打包整个应用;Vite 开发时不打包,利用浏览器原生 ESM 按需请求、单个模块即时编译,启动时间几乎与项目规模无关。加上依赖用 esbuild 预构建(极快),所以冷启动秒级。

**Q:Vite 生产环境也用原生 ESM 吗?**
A:不。生产用 Rollup 打包。因为不打包会产生大量 HTTP 请求、无法做充分的压缩/tree-shaking/优化,不利于线上性能。dev 追求快、prod 追求优。

**Q:esbuild 在 Vite 里做什么?为什么快?**
A:用于依赖预构建(把 CJS 转 ESM、合并多文件库)和 TS/JSX 转译。它用 Go 编写、多线程、无 JS 运行时开销,比 JS 写的打包器快 10-100 倍。

**Q:什么是依赖预构建?解决什么问题?**
A:Vite 启动时用 esbuild 预处理 node_modules:① 把非 ESM 的依赖转成 ESM(浏览器才能原生加载);② 把一个库的几百个内部模块打包成一个文件,避免浏览器发起大量请求。

**Q:Vite 的 HMR 为什么快?**
A:基于原生 ESM,模块间边界清晰。文件变更时只需让浏览器重新请求那一个模块(及其少量依赖),无需像 Webpack 那样重新构建相关 chunk,更新速度与项目大小无关。

## 一句话背诵版

**Vite 开发不打包,用浏览器原生 ESM 按需请求 + 单模块即时编译,依赖用 esbuild 预构建(CJS 转 ESM、合并请求),所以启动秒开、HMR 只更新变更模块极快;生产用 Rollup 打包做优化;Webpack 则开发也要先全量打包,大项目慢。**
