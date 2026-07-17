# V8 · Composition API 与 Pinia

> 热度:🔥🔥🔥

## 一句话考点

Composition API(`setup`、`ref`、`reactive`)按**逻辑关注点**组织代码,解决 Options API 逻辑分散、复用难的问题;Pinia 是 Vue3 官方推荐的状态管理库,替代 Vuex,更简洁、类型友好。

## 原理精讲

### 1. 为什么有 Composition API

Options API(data/methods/computed 分块)在组件复杂时,**同一个功能的代码被拆散**在不同选项里,难以维护;逻辑复用靠 mixin 有命名冲突、来源不清等问题。

Composition API 把相关逻辑聚合在一起,可抽成**组合函数(composable)**复用,类似 React 自定义 Hook。

### 2. 核心 API

| API | 作用 |
|-----|------|
| `ref` | 包装任意值为响应式(访问 `.value`) |
| `reactive` | 把对象变响应式(Proxy) |
| `computed` | 计算属性 |
| `watch / watchEffect` | 侦听 |
| `toRefs` | 把 reactive 对象解构为 ref,保持响应式 |
| 生命周期 `onMounted` 等 | 见 V3 |

### 3. ref vs reactive

- `ref`:任意类型(含原始值),需 `.value`,可整体替换;
- `reactive`:仅对象/数组,直接访问属性,**解构会丢失响应式**(要用 `toRefs`)。

### 4. Pinia vs Vuex

| | Vuex | Pinia |
|--|------|-------|
| 概念 | state/getters/mutations/actions | state/getters/actions(**去掉 mutations**) |
| 异步 | 只能在 actions | actions 直接写(同步异步都行) |
| TS 支持 | 弱 | 强(自动推导) |
| 模块 | modules 嵌套繁琐 | 扁平的多个 store |
| 体积 | 较大 | 极小 |

Pinia 去掉了 mutation,action 里可直接改 state,简化了心智模型。

## 代码示例

### 组合式函数(逻辑复用)

```js
// composables/useCounter.js
import { ref } from 'vue';
export function useCounter(initial = 0) {
  const count = ref(initial);
  const inc = () => count.value++;
  const dec = () => count.value--;
  return { count, inc, dec };
}
```

```vue
<script setup>
import { useCounter } from '@/composables/useCounter';
const { count, inc } = useCounter(10);   // 任意组件复用
</script>
```

### toRefs 保持解构响应式

```js
import { reactive, toRefs } from 'vue';
const state = reactive({ name: '张三', age: 18 });

// ❌ 直接解构丢失响应式
// const { name } = state;

// ✅ toRefs 保持响应式
const { name, age } = toRefs(state);
```

### Pinia store

```js
// stores/counter.js
import { defineStore } from 'pinia';

export const useCounterStore = defineStore('counter', {
  state: () => ({ count: 0 }),
  getters: {
    double: (state) => state.count * 2,
  },
  actions: {
    async increment() {           // 同步异步都可,无需 mutation
      this.count++;
    },
  },
});
```

```vue
<script setup>
import { useCounterStore } from '@/stores/counter';
import { storeToRefs } from 'pinia';

const store = useCounterStore();
const { count, double } = storeToRefs(store);  // 解构保持响应式
store.increment();                              // 直接调 action
</script>
```

## 高频追问

**Q:Composition API 相比 Options API 的优势?**
A:① 按逻辑关注点组织代码,相关逻辑聚合;② 逻辑复用更好(组合函数替代 mixin,无命名冲突、来源清晰);③ 更好的 TS 类型推导;④ 更好的 tree-shaking。

**Q:ref 和 reactive 怎么选?**
A:ref 适合原始值和需要整体替换的场景(需 .value);reactive 适合对象/数组。常见约定:统一用 ref 更一致,或对象用 reactive。注意 reactive 解构会失去响应式,要用 toRefs。

**Q:Pinia 相比 Vuex 的改进?**
A:去掉了 mutations(action 直接改 state)、完整 TS 支持、扁平化 store(无嵌套 module)、更小体积、组合式风格、支持多 store。是 Vue3 官方推荐。

**Q:为什么 Pinia 解构 store 要用 storeToRefs?**
A:store 是 reactive 对象,直接解构 state/getters 会丢失响应式;storeToRefs 把它们转成 ref 保持响应式(方法/action 不需要,可直接解构)。

**Q:setup 里为什么不能用 this?**
A:setup 在组件实例创建之前执行,此时还没有 this。所需的属性通过参数(props、context)或直接 import 的 API 获取。

## 一句话背诵版

**Composition API 按逻辑聚合代码、用组合函数(useXxx)复用,替代分散的 Options API 和 mixin;ref 包装任意值(.value)、reactive 包装对象(解构丢响应式用 toRefs);Pinia 替代 Vuex:去掉 mutations、action 直接改 state、TS 友好、扁平 store,解构用 storeToRefs。**
