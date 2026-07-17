# H4 · `<script>` 加载:defer vs async

> 热度:🔥🔥

## 一句话考点

普通 `<script>` 会**阻塞 HTML 解析**;`defer` 延迟到解析完成后**按顺序**执行;`async` 下载完**立即**执行、**不保证顺序**。

## 原理精讲

### 三种加载方式对比

| 方式 | 下载 | 执行时机 | 阻塞解析 | 顺序 |
|------|------|---------|---------|------|
| `<script>`(普通) | 遇到即停下下载 | 下载完立即执行 | **是**(下载+执行都阻塞) | 按文档顺序 |
| `<script defer>` | 并行下载(不阻塞) | HTML 解析完、`DOMContentLoaded` 前 | 否 | **按文档顺序** |
| `<script async>` | 并行下载(不阻塞) | 下载完立即执行(可能打断解析) | 下载不阻塞,执行时阻塞 | **不保证**(谁先下完谁先执行) |

### 图示(时间线)

```
普通:   解析 ──停── 下载JS ── 执行JS ── 继续解析
defer:  解析 ─────────────────── 解析完 → 执行(按序) → DCL
async:  解析 ───────── 下载完立即执行(打断解析)───── 继续解析
        (并行下载)
```

### 选择建议

- **defer**:脚本依赖 DOM、或脚本间有依赖顺序(推荐大多数场景);
- **async**:独立的、不依赖 DOM 和其他脚本的第三方脚本(如统计、埋点);
- 现代 `<script type="module">` **默认 defer** 行为。

## 代码示例

```html
<!-- 阻塞:不推荐放 head 顶部 -->
<script src="app.js"></script>

<!-- defer:并行下载,DOM 就绪后按顺序执行 -->
<script defer src="lib.js"></script>
<script defer src="app.js"></script>   <!-- lib 先于 app 执行 -->

<!-- async:适合独立脚本,执行顺序不确定 -->
<script async src="analytics.js"></script>

<!-- 传统做法:放 body 底部,保证 DOM 已解析 -->
<body>
  ...
  <script src="app.js"></script>
</body>
```

## 高频追问

**Q:defer 和 async 区别?**
A:两者都并行下载不阻塞解析。defer 等 HTML 解析完再按文档顺序执行(在 DOMContentLoaded 前);async 下载完立即执行、打断解析、多个 async 顺序不确定。

**Q:为什么传统上把 script 放 body 底部?**
A:避免脚本阻塞 HTML 解析导致白屏,且执行时 DOM 已构建完成,可安全操作 DOM。现在多用 defer 替代。

**Q:多个 defer 脚本的执行顺序?**
A:严格按它们在文档中出现的顺序执行。async 则谁先下载完谁先执行,顺序不定。

**Q:`DOMContentLoaded` 和 `load` 区别?**
A:DOMContentLoaded 在 DOM 解析完成(defer 脚本执行后)触发,不等图片/样式表等资源;load 在所有资源(图片、CSS、iframe)加载完成后触发,更晚。

**Q:`type="module"` 的脚本默认是什么行为?**
A:默认 defer(延迟执行、按序);加 async 则下载完立即执行。module 脚本还自动启用严格模式和作用域隔离。

## 一句话背诵版

**普通 script 阻塞解析(下载+执行都停);defer 并行下载、解析完按序执行(DCL 前);async 并行下载、下完立即执行、顺序不定;依赖 DOM/有序用 defer,独立第三方用 async;module 默认 defer。**
