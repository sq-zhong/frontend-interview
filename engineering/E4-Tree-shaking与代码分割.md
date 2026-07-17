# E4 · Tree-shaking 与代码分割

> 热度:🔥🔥🔥

## 一句话考点

**Tree-shaking** 基于 ESM 静态结构删除未使用代码(死代码消除);**代码分割**(Code Splitting)把代码拆成多个 chunk 按需加载,减小首屏体积。

## 原理精讲

### 1. Tree-shaking

**原理**:依赖 ESM 的静态结构(import/export 顶层、可静态分析),构建时标记未被使用的导出,压缩阶段(Terser)删除它们。

**生效条件**:
1. 使用 **ESM**(import/export,不能是 CommonJS);
2. `mode: production`(自动开启);
3. 无副作用,或在 package.json 标记 `"sideEffects": false`;
4. 避免会阻止摇树的写法(如整体引入 `import _ from 'lodash'`)。

**sideEffects**:告诉打包器哪些文件有副作用(如全局 CSS、polyfill),不能被摇掉。标 false 表示所有模块无副作用,可安全删除未用导出。

### 2. 代码分割(Code Splitting)

把大 bundle 拆成多个 chunk,好处:并行加载、按需加载、更好利用缓存。

三种方式:
1. **入口分割**:多入口配置 entry;
2. **动态导入**:`import()` 自动分割(路由/组件懒加载);
3. **SplitChunksPlugin**:提取公共依赖(如把 node_modules 抽成 vendor)。

### 3. 按需引入(避免全量打包)

```js
// ❌ 全量引入,tree-shaking 可能失效
import _ from 'lodash';
_.debounce(fn, 300);

// ✅ 按需引入,只打包用到的
import debounce from 'lodash/debounce';
// 或用支持 ESM 的 lodash-es + tree-shaking
import { debounce } from 'lodash-es';
```

## 代码示例

### 动态导入分割

```js
// 路由懒加载:每个路由单独 chunk
const routes = [
  { path: '/home', component: () => import('./Home.vue') },
  { path: '/about', component: () => import('./About.vue') },
];

// 交互时才加载重型库
button.onclick = async () => {
  const { Chart } = await import('chart.js');   // 单独 chunk,点击才下载
  new Chart(/* ... */);
};
```

### SplitChunks 提取公共代码

```js
// webpack.config.js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',            // 第三方库抽成 vendors.js
          priority: 10,
        },
      },
    },
    runtimeChunk: 'single',            // 运行时单独抽出,利于缓存
  },
};
```

### sideEffects 配置

```json
// package.json
{
  "sideEffects": false,               // 所有模块无副作用,可放心摇树
  // 或指定有副作用的文件不被摇掉:
  "sideEffects": ["*.css", "./src/polyfill.js"]
}
```

## 高频追问

**Q:Tree-shaking 的原理和生效条件?**
A:原理是利用 ESM 静态结构在编译期分析出未使用的导出,压缩阶段删除。条件:用 ESM(非 CJS)、production 模式、正确配置 sideEffects、避免全量引入等阻止摇树的写法。

**Q:为什么 CommonJS 不能 tree-shaking?**
A:CommonJS 的 require 是运行时动态的(可条件引入、路径可拼接、导出可动态改),无法在编译期静态确定哪些导出未被使用,所以不能安全删除。

**Q:sideEffects 的作用?**
A:标记模块是否有副作用。有副作用的文件(全局 CSS、polyfill、注册全局)即使"未被引用"也不能删。`"sideEffects": false` 声明全部无副作用,打包器可放心删除未用导出;也可用数组指定例外。

**Q:代码分割有哪些方式?**
A:① 多入口配置;② 动态 import() 自动分割(路由/组件懒加载);③ SplitChunksPlugin 提取公共依赖(如 vendor)。目的:减小首屏、并行加载、优化缓存。

**Q:如何优化 lodash 的打包体积?**
A:按需引入 `import debounce from 'lodash/debounce'`,或用 ESM 版 `lodash-es` 配合 tree-shaking,避免 `import _ from 'lodash'` 全量引入。

## 一句话背诵版

**Tree-shaking 靠 ESM 静态结构在编译期删除未用导出(需 ESM+production+正确 sideEffects,CJS 不支持);代码分割把 bundle 拆 chunk 按需加载(多入口/动态 import/SplitChunks 抽 vendor);按需引入(lodash/debounce 或 lodash-es)避免全量打包。**
