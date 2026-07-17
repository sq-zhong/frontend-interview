# E3 · Loader 与 Plugin

> 热度:🔥🔥🔥

## 一句话考点

**Loader** 是文件转换器,把非 JS 资源转成 Webpack 能处理的模块(链式、从右到左执行);**Plugin** 基于事件钩子扩展构建全流程能力,功能更强大。

## 原理精讲

### 1. Loader

- **作用**:转换单个文件(源码 → Webpack 能识别的模块);
- **本质**:一个函数,输入源文件内容,返回转换后的内容;
- **链式执行**:多个 loader **从右到左、从下到上** 依次处理;
- **职责单一**:每个 loader 只做一件事。

常见 loader:

| loader | 作用 |
|--------|------|
| `babel-loader` | ES6+ / JSX 转 ES5 |
| `css-loader` | 解析 CSS 的 import/url |
| `style-loader` | 把 CSS 注入 DOM(`<style>`) |
| `sass-loader` | Sass → CSS |
| `ts-loader` | TS → JS |
| `file/url-loader`(webpack5 用 asset module) | 处理图片/字体 |

### 2. Plugin

- **作用**:在构建生命周期的各个钩子上做事,能力覆盖打包全过程;
- **本质**:一个带 `apply(compiler)` 方法的类,通过 `compiler.hooks.xxx.tap()` 监听钩子;
- 基于 **Tapable** 事件流。

常见 plugin:

| plugin | 作用 |
|--------|------|
| `HtmlWebpackPlugin` | 生成 HTML 并自动注入 bundle |
| `MiniCssExtractPlugin` | 把 CSS 抽成单独文件 |
| `DefinePlugin` | 注入全局常量(如环境变量) |
| `TerserPlugin` | JS 压缩 |
| `CleanWebpackPlugin` | 清理输出目录 |

### 3. Loader vs Plugin 区别

| | Loader | Plugin |
|--|--------|--------|
| 职责 | 转换特定类型文件 | 扩展构建流程 |
| 作用时机 | 模块加载时 | 整个生命周期钩子 |
| 本质 | 函数 | 带 apply 的类 |
| 能力范围 | 单文件转换 | 全流程(打包、优化、资源管理) |

## 代码示例

### Loader 链式(从右到左)

```js
{
  test: /\.scss$/,
  use: [
    'style-loader',    // ③ 最后:注入到 DOM
    'css-loader',      // ② 解析 CSS
    'sass-loader',     // ① 最先:Sass 编译成 CSS
  ],
}
// 执行顺序:sass-loader → css-loader → style-loader
```

### 手写简单 Loader

```js
// 一个把内容转大写的 loader
module.exports = function (source) {
  // this 上有 loader API(如 this.async、this.query)
  return source.toUpperCase();
};
```

### 手写简单 Plugin

```js
class MyPlugin {
  apply(compiler) {
    // 监听 emit 钩子(生成文件到输出目录之前)
    compiler.hooks.emit.tapAsync('MyPlugin', (compilation, callback) => {
      // 生成一个文件清单
      const list = Object.keys(compilation.assets).join('\n');
      compilation.assets['filelist.txt'] = {
        source: () => list,
        size: () => list.length,
      };
      callback();
    });
  }
}
```

## 高频追问

**Q:Loader 和 Plugin 的区别?**
A:Loader 是文件转换器,在模块加载时把非 JS 资源转成模块,本质是链式执行的函数;Plugin 基于事件钩子扩展整个构建流程,本质是带 apply 方法的类,能力更广(资源管理、优化、注入等)。

**Q:Loader 的执行顺序?**
A:从右到左、从下到上。如 `['style-loader', 'css-loader', 'sass-loader']`,先执行 sass-loader,再 css-loader,最后 style-loader。可理解为函数嵌套 `style(css(sass(source)))`。

**Q:Plugin 的原理?**
A:Webpack 基于 Tapable 在 Compiler/Compilation 上暴露大量生命周期钩子。Plugin 通过 apply(compiler) 里 `compiler.hooks.某钩子.tap()` 注册回调,在特定时机介入构建流程。

**Q:如何处理 CSS?为什么需要多个 loader?**
A:css-loader 解析 CSS 中的 @import/url 依赖;style-loader 把 CSS 通过 `<style>` 注入 DOM(开发)或 MiniCssExtractPlugin 抽成文件(生产)。职责分离,链式配合。

**Q:babel-loader 和 Babel 是什么关系?**
A:Babel 是 JS 编译器(见 E6);babel-loader 是 Webpack 与 Babel 之间的桥接 loader,让 Webpack 在处理 JS 模块时调用 Babel 做语法转换。

## 一句话背诵版

**Loader 是文件转换器(函数、链式从右到左、模块加载时转换非 JS 资源,如 babel/css/sass-loader);Plugin 是流程扩展器(带 apply 的类、基于 Tapable 钩子介入全生命周期,如 HtmlWebpackPlugin);Loader 管转换、Plugin 管全流程。**
