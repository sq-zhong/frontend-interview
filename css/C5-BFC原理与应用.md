# C5 · BFC 原理与应用

> 热度:🔥🔥

## 一句话考点

BFC(块级格式化上下文)是一个**独立的渲染区域**,内部布局不影响外部;能解决 **margin 塌陷、清除浮动、阻止文字环绕**等经典问题。

## 原理精讲

### 1. 什么是 BFC

Block Formatting Context——块级格式化上下文,是页面上一块独立的渲染区域,内部元素的布局与外界隔离,遵循自己的规则。

### 2. 如何触发 BFC(记住常用几个)

- 根元素 `<html>`;
- `float` 不为 none;
- `position: absolute / fixed`;
- `display: inline-block / flex / grid / table-cell / flow-root`;
- `overflow` 不为 visible(如 `hidden` / `auto` / `scroll`)。

> **最佳实践**:`display: flow-root` 专门用来创建 BFC 且无副作用(不像 overflow:hidden 会裁剪内容)。

### 3. BFC 的特性(即能解决的问题)

1. 内部块级盒子垂直排列;
2. **同一 BFC 内**垂直 margin 会合并;不同 BFC 之间不会;
3. BFC 区域不与浮动元素重叠(阻止文字环绕);
4. 计算 BFC 高度时,**浮动子元素也参与计算**(清除浮动);
5. BFC 是独立容器,内外互不影响。

## 代码示例

### 应用1:清除浮动(解决高度塌陷)

```css
/* 父元素高度塌陷:子元素全浮动后父元素高度为 0 */
.parent {
  overflow: hidden;    /* 触发 BFC,包含浮动子元素 */
  /* 更优:display: flow-root; */
}
.child { float: left; }
```

### 应用2:阻止 margin 塌陷

```html
<!-- 两个相邻元素 margin 合并,用 BFC 隔离 -->
<div class="box">上</div>
<div class="bfc-wrap">
  <div class="box">下</div>
</div>
```
```css
.box { margin: 20px 0; }
.bfc-wrap { display: flow-root; }  /* 包裹后 margin 不再与外部合并 */
```

### 应用3:自适应两栏(阻止文字环绕)

```css
.left { float: left; width: 100px; }
.right { overflow: hidden; }  /* 触发 BFC,不与浮动重叠,自适应剩余宽度 */
```

## 高频追问

**Q:什么是 BFC?**
A:块级格式化上下文,一块独立的渲染区域,内部布局(浮动、margin)不影响外部,常用于清浮动、防 margin 塌陷。

**Q:如何创建 BFC?**
A:overflow 非 visible、float 非 none、position absolute/fixed、display 为 flex/grid/inline-block/flow-root 等。推荐 `display: flow-root`(无副作用)。

**Q:BFC 如何清除浮动?**
A:BFC 在计算自身高度时会把内部浮动元素也算进去,所以给父元素触发 BFC 后,它能正确包裹浮动子元素,高度不再塌陷。

**Q:为什么 overflow:hidden 能清浮动但有风险?**
A:它触发 BFC 达到清浮动效果,但会裁剪掉溢出内容(如阴影、下拉菜单)。用 `display: flow-root` 更安全。

**Q:margin 塌陷和 BFC 的关系?**
A:垂直 margin 合并只发生在**同一个 BFC 内**。把元素放进不同的 BFC 即可阻止合并。

## 一句话背诵版

**BFC 是独立渲染区域,内外互不影响;触发方式:overflow 非 visible、float、absolute/fixed、flex/grid/flow-root;能清浮动(包含浮动子元素算高度)、防 margin 塌陷、阻止文字环绕;首选 `display:flow-root` 无副作用。**
