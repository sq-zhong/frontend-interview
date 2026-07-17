# E2 · Webpack 构建流程

> 热度:🔥🔥🔥

## 一句话考点

Webpack 是模块打包器,把各种资源当模块,从**入口**出发构建**依赖图**,经 loader 转换、plugin 处理,最终打包成 **bundle**;核心流程:初始化 → 编译 → 输出。

## 原理精讲

### 1. 核心概念

| 概念 | 作用 |
|------|------|
| **entry** | 入口,依赖图起点 |
| **output** | 输出配置(路径、文件名) |
| **loader** | 转换非 JS 模块(见 E3) |
| **plugin** | 扩展构建能力(见 E3) |
| **mode** | development / production(影响默认优化) |
| **chunk** | 代码块(拆分后的产物单元) |
| **module** | 一切皆模块(js/css/图片) |

### 2. 构建流程(核心)

```
① 初始化:合并配置,创建 Compiler,加载插件
② 编译:
   - 从 entry 开始,调用 loader 转换每个模块
   - 用 AST 分析模块的依赖(import/require)
   - 递归处理依赖,构建完整依赖图
③ 输出:
   - 根据依赖关系组装 chunk
   - 把 chunk 转成 bundle 文件
   - 写入 output 目录
```

关键阶段:**make(构建模块)→ seal(封装 chunk)→ emit(生成文件)**。

### 3. 依赖图与打包产物

Webpack 从入口递归收集所有依赖,形成依赖图;然后把模块包裹进一个运行时(实现 `__webpack_require__` 模拟模块系统),浏览器不支持模块时也能运行。

### 4. Tapable 与钩子

Webpack 基于 **Tapable** 事件流,Compiler 和 Compilation 暴露大量生命周期钩子,plugin 通过 tap 到这些钩子来介入构建(见 E3)。

## 代码示例

### 基本配置

```js
// webpack.config.js
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './src/index.js',              // 入口
  output: {
    path: __dirname + '/dist',
    filename: '[name].[contenthash].js', // contenthash 用于缓存
    clean: true,
  },
  module: {
    rules: [                             // loader 配置
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
      { test: /\.js$/, exclude: /node_modules/, use: 'babel-loader' },
    ],
  },
  plugins: [                             // plugin 配置
    new HtmlWebpackPlugin({ template: './src/index.html' }),
  ],
};
```

### 打包产物简化示意

```js
// bundle 大致结构:一个 IIFE 包裹所有模块 + 运行时
(function(modules) {
  function __webpack_require__(moduleId) {
    // 缓存 + 执行模块函数,注入 require/exports
  }
  return __webpack_require__('./src/index.js');   // 从入口启动
})({
  './src/index.js': function(module, exports, require) { /* 模块代码 */ },
  './src/utils.js': function(module, exports, require) { /* ... */ },
});
```

## 高频追问

**Q:Webpack 的构建流程?**
A:① 初始化:合并配置、创建 Compiler、注册插件;② 编译:从入口出发,用 loader 转换模块、解析 AST 收集依赖、递归构建依赖图;③ 输出:根据依赖组装 chunk、生成 bundle、写入磁盘。关键阶段 make→seal→emit。

**Q:Webpack 打包后为什么能在浏览器跑模块?**
A:Webpack 把模块包裹进自实现的运行时(`__webpack_require__`),用一个对象存所有模块函数、模拟 require/exports,并做缓存。即使浏览器不支持 CommonJS/ESM,也能按依赖顺序执行。

**Q:什么是 chunk、bundle、module?**
A:module 是单个模块(一个文件);chunk 是构建过程中按入口/异步/拆分规则组织的代码块;bundle 是最终输出的文件(通常一个 chunk 对应一个 bundle)。

**Q:contenthash、chunkhash、hash 区别?**
A:hash 是整个构建的哈希(任何改动都变);chunkhash 基于 chunk 内容(该 chunk 变才变);contenthash 基于文件内容(最精细,常用于 CSS/JS 长期缓存,内容不变哈希不变)。

**Q:Webpack 如何实现按需加载?**
A:动态 `import()` 会被 Webpack 识别为分割点,单独打成一个异步 chunk,运行时通过 JSONP 动态加载,实现路由/组件懒加载。

## 一句话背诵版

**Webpack 从 entry 出发、loader 转换模块、解析 AST 递归构建依赖图、组装 chunk 输出 bundle(初始化→编译 make→封装 seal→输出 emit);产物用自实现的 `__webpack_require__` 运行时模拟模块系统;contenthash 用于长期缓存;动态 import 实现按需加载。**
