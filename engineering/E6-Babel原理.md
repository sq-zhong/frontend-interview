# E6 · Babel 原理

> 热度:🔥🔥

## 一句话考点

Babel 是 JS 编译器,把 ES6+/JSX/TS 转成兼容目标环境的代码;流程为 **解析(parse)→ 转换(transform)→ 生成(generate)**,核心在 AST 转换。

## 原理精讲

### 1. Babel 三阶段

```
源码 ──parse──> AST ──transform──> 新 AST ──generate──> 目标代码
```

1. **解析(Parse)**:词法分析(源码 → tokens)+ 语法分析(tokens → **AST 抽象语法树**);由 `@babel/parser` 完成;
2. **转换(Transform)**:遍历 AST,用**插件(plugin)**访问并修改节点(如把箭头函数节点改成普通函数);由 `@babel/traverse` + 插件完成;
3. **生成(Generate)**:把转换后的 AST 转回代码字符串 + source map;由 `@babel/generator` 完成。

### 2. Plugin 与 Preset

- **Plugin**:单个转换功能(如 `@babel/plugin-transform-arrow-functions`);
- **Preset**:一组 plugin 的集合(如 `@babel/preset-env` 按目标环境自动选择需要的转换)。

`@babel/preset-env` 根据 `browserslist` / `targets` 配置,只转换目标环境不支持的语法,避免过度转译。

### 3. 语法转换 vs API polyfill

Babel 默认只转**语法**(箭头函数、解构、class),不处理新 **API**(Promise、includes、Map)。这些新 API 需要 polyfill:
- `core-js` 提供实现;
- `preset-env` 的 `useBuiltIns: 'usage'` 按需注入所需 polyfill;
- 库开发用 `@babel/plugin-transform-runtime` 避免污染全局。

### 4. AST 是什么

抽象语法树,用树形结构描述代码结构。每个节点有 `type`(如 `ArrowFunctionExpression`、`VariableDeclaration`)和相关属性。所有代码转换工具(Babel、ESLint、Prettier、Webpack)都基于 AST。

## 代码示例

### 转换前后

```js
// 源码(ES6+)
const add = (a, b) => a + b;

// Babel 转换后(ES5)
var add = function add(a, b) {
  return a + b;
};
```

### 手写简单 Babel 插件(箭头函数 → 普通函数思路)

```js
// 插件是一个返回 visitor 的函数
module.exports = function () {
  return {
    visitor: {
      // 访问所有 ArrowFunctionExpression 节点
      ArrowFunctionExpression(path) {
        const { node } = path;
        // 把箭头函数节点替换为普通函数表达式节点
        // (实际需处理 this 绑定、隐式返回等细节)
        node.type = 'FunctionExpression';
      },
    },
  };
};
```

### 配置

```js
// babel.config.js
module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: '> 0.5%, last 2 versions',   // 目标环境
      useBuiltIns: 'usage',                  // 按需 polyfill
      corejs: 3,
    }],
    '@babel/preset-react',
    '@babel/preset-typescript',
  ],
};
```

## 高频追问

**Q:Babel 的工作流程?**
A:三阶段——parse(源码经词法+语法分析生成 AST)、transform(遍历 AST,插件访问并修改节点)、generate(AST 转回代码 + source map)。核心是基于 AST 的转换。

**Q:preset 和 plugin 区别?**
A:plugin 是单个转换功能;preset 是一组 plugin 的预设集合。preset-env 会根据目标环境自动决定启用哪些转换插件,避免手动逐个配置和过度转译。

**Q:Babel 能转换所有 ES6+ 特性吗?**
A:默认只转**语法**(箭头函数、class、解构等)。新增的 **API**(Promise、Array.includes、Map)需要 polyfill(core-js),通过 preset-env 的 useBuiltIns 按需注入,否则老环境仍会报错。

**Q:什么是 AST?哪些工具用到?**
A:抽象语法树,用树结构表示代码。Babel、ESLint、Prettier、Webpack、TS 编译器都基于 AST 做分析和转换。节点有 type 和属性,遍历时可访问和修改。

**Q:@babel/plugin-transform-runtime 的作用?**
A:把 helper 函数(如 _classCallCheck)和 polyfill 以模块方式引入,而非注入到全局或每个文件重复内联。避免全局污染、减少重复代码,适合开发库。

## 一句话背诵版

**Babel 是 JS 编译器,流程 parse(源码→AST)→transform(插件遍历修改 AST)→generate(AST→代码);plugin 单功能、preset(如 preset-env 按 browserslist 目标)是插件集合;默认只转语法、新 API 需 core-js polyfill(useBuiltIns 按需);一切基于 AST。**
