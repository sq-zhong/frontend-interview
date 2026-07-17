# V5 · 虚拟 DOM 与 Diff / key

> 热度:🔥🔥

## 一句话考点

Vue 用虚拟 DOM + **双端 diff**(Vue2)/ 快速 diff(Vue3)算法比较新旧节点;同层比较,列表用 **key** 标识复用;key 要稳定唯一,避免用 index。

## 原理精讲

### 1. Vue2:双端 diff(patch)

同层比较同一父节点下的子节点,用**四个指针**(新旧列表各头尾)两两比较:
1. 旧头 vs 新头;
2. 旧尾 vs 新尾;
3. 旧头 vs 新尾;
4. 旧尾 vs 新头;

命中则复用并移动指针;都不命中则用 key 建映射查找可复用节点。这样能高效处理头尾增删和位置移动。

### 2. Vue3:快速 diff(inspired by ivi/inferno)

优化步骤:
1. **预处理**:先同步头部、再同步尾部的相同节点(处理常见的头尾追加);
2. 剩余乱序部分建立 key→index 映射;
3. 用**最长递增子序列(LIS)**算法计算最少移动次数,只移动必要节点。

Vue3 还有**编译期优化**:静态提升(hoistStatic)、静态标记(PatchFlag,标记动态部分只 diff 动态节点)、事件缓存,使 diff 更快。

### 3. key 的作用

同 React:标识节点身份,帮助 diff 判断复用/移动/增删。无 key 或用 index 时,列表变动会导致错误复用、状态错位、动画异常。

## 代码示例

```vue
<!-- ✅ 用稳定唯一 id -->
<li v-for="item in list" :key="item.id">{{ item.name }}</li>

<!-- ❌ 用 index:列表增删排序时出错 -->
<li v-for="(item, index) in list" :key="index">
  <input v-model="item.name" />   <!-- 插入删除后 input 内容会错位 -->
</li>
```

```js
// Vue3 编译优化示意:PatchFlag 标记动态节点
// 模板 <div class="static">{{ msg }}</div> 编译后大致:
createVNode('div', { class: 'static' }, msg, 1 /* TEXT PatchFlag */)
// 1 表示只有文本是动态的,更新时只 diff 文本,跳过静态属性
```

## 高频追问

**Q:Vue 的 diff 算法特点?**
A:同层比较(不跨层),Vue2 用双端 diff(新旧头尾四指针两两比对 + key 映射),Vue3 用快速 diff(头尾预处理 + 最长递增子序列求最小移动),配合编译期的静态提升和 PatchFlag。

**Q:Vue3 diff 比 Vue2 快在哪?**
A:① 头尾预处理快速跳过相同节点;② LIS 算法最小化移动;③ 编译期静态提升(静态节点只创建一次)和 PatchFlag(只 diff 标记为动态的节点),大幅减少运行时比较量。

**Q:为什么列表要加 key?不加会怎样?**
A:key 让 diff 精准识别节点。不加 key 时 Vue 默认"就地复用"策略,按位置更新,列表顺序变化会导致复用错误的 DOM,引发状态(如输入框内容、勾选状态)错位。

**Q:为什么不建议用 index 作 key?**
A:index 随列表增删/排序而变,与节点内容错位,导致错误复用、状态混乱、过渡动画异常。仅在列表纯静态、不增删排序时才可用。

**Q:什么是"就地复用"(in-place patch)?**
A:Vue 默认列表更新时尽量复用已有 DOM、就地更新内容而非移动。它高效但要求 key 正确,否则带内部状态的节点会错乱。

## 一句话背诵版

**Vue 虚拟 DOM 同层 diff:Vue2 双端(四指针 + key 映射),Vue3 快速 diff(头尾预处理 + 最长递增子序列)+ 编译优化(静态提升、PatchFlag 只 diff 动态节点);列表用稳定唯一 key、别用 index,否则就地复用导致状态错位。**
