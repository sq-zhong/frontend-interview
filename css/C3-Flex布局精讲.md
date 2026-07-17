# C3 · Flex 布局精讲

> 热度:🔥🔥🔥

## 一句话考点

Flex 是一维弹性布局,分**容器**(display: flex)和**项目**;核心是主轴(main axis)和交叉轴(cross axis),`justify-content` 管主轴对齐、`align-items` 管交叉轴对齐,`flex` 简写控制项目伸缩。

## 原理精讲

### 1. 主轴与交叉轴

- **主轴**:由 `flex-direction` 决定(默认 row 水平,从左到右);
- **交叉轴**:垂直于主轴。
- 所有对齐概念都基于这两根轴,`flex-direction` 一改,主轴/交叉轴方向也跟着变。

### 2. 容器属性

| 属性 | 作用 | 常用值 |
|------|------|--------|
| `flex-direction` | 主轴方向 | row / column / row-reverse |
| `flex-wrap` | 是否换行 | nowrap(默认) / wrap |
| `justify-content` | 主轴对齐 | flex-start / center / space-between / space-around / space-evenly |
| `align-items` | 交叉轴对齐(单行) | stretch(默认) / center / flex-start / baseline |
| `align-content` | 多行交叉轴对齐 | 仅在换行时生效 |

### 3. 项目属性

| 属性 | 作用 |
|------|------|
| `flex-grow` | 放大比例(默认 0,不放大) |
| `flex-shrink` | 缩小比例(默认 1,空间不足时缩小) |
| `flex-basis` | 主轴初始尺寸(默认 auto) |
| `flex` | 上述三者简写 |
| `align-self` | 单个项目覆盖 align-items |
| `order` | 排列顺序(默认 0,越小越靠前) |

### 4. flex 简写含义(高频)

- `flex: 1` = `flex: 1 1 0%`:可放大、可缩小、basis 为 0,**等分剩余空间**;
- `flex: auto` = `flex: 1 1 auto`:基于内容大小再分配;
- `flex: none` = `flex: 0 0 auto`:不伸不缩,固定尺寸。

## 代码示例

```css
/* 经典:两栏布局,左侧固定,右侧自适应 */
.container { display: flex; }
.sidebar { flex: 0 0 200px; }   /* 固定 200px,不伸缩 */
.main { flex: 1; }              /* 占满剩余空间 */

/* 三等分 */
.item { flex: 1; }              /* 每个占 1/3 */

/* 水平垂直居中 */
.center {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 两端对齐的导航 */
.nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
```

### space-between vs around vs evenly

```
between: |A    B    C|      两端贴边,间隔相等
around:  | A   B   C |      每项两侧等距(两端是中间的一半)
evenly:  |  A  B  C  |      所有间隔完全相等
```

## 高频追问

**Q:`flex: 1` 具体代表什么?**
A:`flex-grow:1; flex-shrink:1; flex-basis:0%`。basis 为 0 意味着不保留内容初始宽度,所有项目按 grow 比例等分容器空间,所以多个 `flex:1` 会等宽。

**Q:`flex:1` 和 `flex:auto` 区别?**
A:flex:1 的 basis 是 0,完全等分空间;flex:auto 的 basis 是 auto,会先按内容分配,再分配剩余空间,内容多的项目更宽。

**Q:justify-content 和 align-items 分别管什么?**
A:justify-content 管主轴(默认水平)对齐,align-items 管交叉轴(默认垂直)对齐。flex-direction 改成 column 后两者作用轴对调。

**Q:Flex 和 Grid 怎么选?**
A:Flex 是一维(一行或一列),适合导航、工具栏、列表项内部对齐;Grid 是二维(行列同时),适合整体页面/卡片网格布局。

**Q:flex-shrink 默认值导致的坑?**
A:默认 shrink 为 1,空间不足时项目会被压缩,可能导致设定的固定宽度失效。固定尺寸的项目要设 `flex-shrink: 0`。

## 一句话背诵版

**Flex 一维弹性布局:容器设 `display:flex`,主轴用 `justify-content`、交叉轴用 `align-items`;`flex:1`=等分剩余空间(basis 0)、`flex:auto`=按内容再分、`flex:none`=固定;固定宽度项目记得 `flex-shrink:0`。**
