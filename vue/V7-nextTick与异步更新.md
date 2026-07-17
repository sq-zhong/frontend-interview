# V7 · nextTick 与异步更新

> 热度:🔥🔥

## 一句话考点

Vue 的 DOM 更新是**异步批处理**的:同一事件循环内多次修改数据只触发一次渲染;`nextTick` 让回调在**DOM 更新完成后**执行,用于拿到更新后的 DOM。

## 原理精讲

### 1. 为什么异步更新

如果每次数据变化都立即同步更新 DOM,一次操作改多个数据会触发多次重排,性能差。Vue 把同一事件循环内的所有数据变更**缓冲**起来,去重后在**微任务**里统一更新一次。

### 2. 更新流程

1. 数据变化 → 触发 setter → 通知 watcher;
2. watcher 不立即更新,而是被推入**异步更新队列**(去重,同一 watcher 只入队一次);
3. 本轮同步代码执行完,在**微任务**(`Promise.then`,降级 MutationObserver/setTimeout)中清空队列,批量更新 DOM;
4. `nextTick` 的回调也在这个微任务队列里,排在 DOM 更新之后。

### 3. nextTick 的作用

数据改变后,DOM 不是立即更新的。若要在数据变化后操作**更新后的 DOM**,必须放在 `nextTick` 回调里。

## 代码示例

### 拿不到更新后的 DOM

```vue
<script setup>
import { ref, nextTick } from 'vue';

const count = ref(0);
const el = ref(null);

async function update() {
  count.value = 1;
  console.log(el.value.textContent);        // ❌ 还是旧值 '0'(DOM 未更新)

  await nextTick();                          // 等待 DOM 更新完成
  console.log(el.value.textContent);         // ✅ '1'

  // 或回调形式
  nextTick(() => {
    console.log(el.value.textContent);       // '1'
  });
}
</script>
<template>
  <div ref="el">{{ count }}</div>
</template>
```

### 批处理示例

```js
// 同一事件里改多次,只渲染一次
count.value++;
count.value++;
count.value++;
// DOM 只更新一次(最终值 3),中间过程不渲染
```

## 高频追问

**Q:Vue 的 DOM 更新是同步还是异步?**
A:异步。数据变化后 watcher 入异步队列并去重,在当前同步代码执行完后的微任务中批量更新一次 DOM,避免重复渲染。

**Q:nextTick 的原理?**
A:它把回调加入微任务队列(优先 Promise.then,不支持则降级 MutationObserver、setTimeout)。由于 DOM 更新也在同一批微任务里且排在前面,nextTick 回调执行时 DOM 已更新完成。

**Q:什么场景需要 nextTick?**
A:数据变化后需要立即操作更新后的 DOM:如获取更新后元素的尺寸/位置、操作新渲染的列表、基于新 DOM 初始化第三方库、v-if 显示后聚焦输入框等。

**Q:为什么在同一方法里改了数据,马上读 DOM 是旧的?**
A:因为 DOM 更新被推迟到微任务,当前同步代码执行时 DOM 还没更新。需 await nextTick 或用其回调。

**Q:Vue2 和 Vue3 的 nextTick 实现有区别吗?**
A:核心思路相同(微任务批处理)。Vue3 直接基于 Promise 实现,更简洁;Vue2 有一套优雅降级(Promise → MutationObserver → setImmediate → setTimeout)。

## 一句话背诵版

**Vue 异步批处理更新:数据变化后 watcher 入队去重,同步代码执行完在微任务里统一更新一次 DOM;所以改完数据马上读 DOM 是旧值,要用 nextTick(基于 Promise.then 微任务)在 DOM 更新后执行回调。**
