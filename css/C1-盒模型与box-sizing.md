# C1 · 盒模型与 box-sizing

> 热度:🔥🔥🔥

## 一句话考点

每个元素都是一个盒子,由 `content + padding + border + margin` 组成;**标准盒模型**(`content-box`)的 width 只算内容区,**IE/怪异盒模型**(`border-box`)的 width 包含 padding 和 border。

## 原理精讲

### 1. 盒子的四层结构

从内到外:
- **content**:内容区,放文本/子元素;
- **padding**:内边距,内容与边框之间;
- **border**:边框;
- **margin**:外边距,盒子与其他元素之间。

### 2. 两种盒模型

| 模型 | box-sizing | width 含义 | 实际宽度 |
|------|-----------|-----------|---------|
| 标准(W3C) | `content-box`(默认) | 仅内容区 | width + padding + border |
| 怪异(IE) | `border-box` | 内容+padding+border | 就是 width |

**例**:`width: 100px; padding: 10px; border: 5px`
- content-box:实际占宽 = 100 + 20 + 10 = **130px**;
- border-box:实际占宽 = **100px**,内容区被压缩为 70px。

### 3. 为什么推荐 border-box

设置尺寸更直观(所见即所得),不用手动扣减 padding/border,布局更好控制。项目里常全局设置:

```css
*, *::before, *::after {
  box-sizing: border-box;
}
```

## 代码示例

```css
/* 标准盒模型 */
.standard {
  box-sizing: content-box;   /* 默认 */
  width: 200px;
  padding: 20px;
  border: 5px solid;
  /* 实际宽度 = 200 + 40 + 10 = 250px */
}

/* 怪异盒模型 */
.border-box {
  box-sizing: border-box;
  width: 200px;
  padding: 20px;
  border: 5px solid;
  /* 实际宽度 = 200px,内容区 = 150px */
}
```

### margin 塌陷与合并

```css
/* 1. 相邻兄弟元素的上下 margin 会合并(取较大值) */
/* 上 20px + 下 30px → 实际间距 30px 而非 50px */

/* 2. 父子元素 margin 塌陷:子元素 margin-top 溢出到父元素 */
/* 解决:给父元素加 overflow:hidden(触发 BFC)/ padding / border */
```

## 高频追问

**Q:标准盒模型和怪异盒模型区别?**
A:width/height 的计算范围不同。标准盒模型只算 content;怪异(border-box)把 padding 和 border 也算进去。通过 `box-sizing` 切换。

**Q:如何设置怪异盒模型?**
A:`box-sizing: border-box`。项目常全局 `* { box-sizing: border-box }`。

**Q:margin 合并(塌陷)是什么?怎么解决?**
A:垂直方向相邻的 margin 会合并为较大者。兄弟间:合理设计布局或改用 padding;父子间:给父元素触发 BFC(overflow/display:flow-root)、加 border 或 padding。

**Q:`margin: 0 auto` 为什么能水平居中?**
A:块级元素设定宽度后,左右 margin 设为 auto 会平分剩余空间,从而水平居中。垂直方向 auto 不生效(计算为 0)。

## 一句话背诵版

**盒子 = content+padding+border+margin;标准盒模型(content-box)width 只含内容、怪异盒模型(border-box)width 含 padding+border;推荐全局 `box-sizing:border-box`;垂直 margin 会合并取较大值。**
