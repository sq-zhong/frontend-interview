# ND2 · 模块系统与包管理

> Node.js 专题 · CommonJS → ESM → 加载机制 → 考点

## 一句话考点

Node 支持 **CommonJS**(`require`/`module.exports`,运行时同步、值拷贝)和 **ESM**(`import`/`export`,静态、异步、值引用);CommonJS 有模块缓存和包裹函数机制;两者互操作有限制。

## 原理

### 1. CommonJS(Node 传统)

```js
// 导出
module.exports = { add };
// 或 exports.add = add;(exports 是 module.exports 的引用)

// 导入
const { add } = require('./math');
```

**加载机制**:
- **同步加载**:require 立即读文件、执行、返回 exports;
- **模块缓存**:同一模块只执行一次,后续 require 返回缓存的 exports(单例);
- **包裹函数**:Node 把模块代码包进一个函数,注入 `exports, require, module, __filename, __dirname`:
  ```js
  (function (exports, require, module, __filename, __dirname) {
    // 模块代码
  });
  ```
  这就是为什么模块里能直接用这些变量、且变量默认不污染全局。

### 2. ESM(ES Module)

```js
import { add } from './math.js';
export function add() {}
```

- Node 中启用:文件用 `.mjs` 后缀,或 package.json 设 `"type": "module"`;
- **静态**:编译时确定依赖,支持 tree-shaking;
- **异步加载**、值是**引用**(动态绑定,见 E1);
- ESM 里没有 `require/__dirname`,要用 `import.meta.url` 等替代。

### 3. exports 与 module.exports 陷阱

```js
exports = { add };          // ❌ 无效!只是让局部变量 exports 指向新对象
module.exports = { add };   // ✅ 真正导出
exports.add = add;          // ✅ 有效(修改的是 module.exports 引用的对象)
```
`exports` 只是 `module.exports` 的引用,直接重新赋值 `exports` 会断开这个引用,导出的还是原来的 module.exports。

### 4. 模块查找顺序

`require('x')`:核心模块 → 相对/绝对路径文件(.js/.json/.node)→ node_modules 逐级向上查找。

## 考点

**Q:CommonJS 和 ESM 区别?**
A:CJS 运行时同步加载、值拷贝、有模块缓存、用 require/module.exports;ESM 编译时静态分析、异步、值引用(动态绑定)、支持 tree-shaking、用 import/export。Node 两者都支持(ESM 需 .mjs 或 type:module)。(详见 E1)

**Q:require 的加载机制?**
A:同步读取并执行模块,返回 module.exports;有模块缓存——同一路径只执行一次,之后返回缓存(实现单例);模块代码被包进注入了 exports/require/module/__filename/__dirname 的函数里执行。

**Q:exports 和 module.exports 区别?**
A:exports 初始是 module.exports 的引用。可以 `exports.xx = ` 添加属性(有效),但不能 `exports = {}` 重新赋值(会断开引用,实际导出的仍是 module.exports)。真正替换导出对象要用 module.exports = 。

**Q:CommonJS 循环依赖会怎样?**
A:返回当前已执行部分的 exports(可能不完整)。因为 require 是运行时执行,遇到循环时拿到的是模块尚未执行完的中间状态。设计时应避免循环依赖或延迟 require。

**Q:Node 里 ESM 和 CJS 能互相引用吗?**
A:ESM 可以 import CJS 模块(CJS 的 module.exports 作为 default);CJS **不能直接 require ESM**(ESM 是异步的),需用动态 `import()`。混用有边界,新项目建议统一用一种。

## 一句话总结

**CommonJS:require/module.exports,运行时同步加载、值拷贝、模块缓存(单例)、代码被包进注入 exports/require/module/__dirname 的函数;exports 是 module.exports 的引用不能重新赋值;ESM:import/export,静态异步、值引用、可 tree-shaking,需 .mjs 或 type:module;CJS 不能直接 require ESM(用动态 import)。**
