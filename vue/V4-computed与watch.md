# V4 · computed 与 watch

> 热度:🔥🔥🔥

## 一句话考点

`computed` 是**带缓存的派生值**,依赖不变不重新计算,适合"由其他数据算出的值";`watch` 是**侦听器**,监听数据变化执行副作用(异步、复杂逻辑)。

## 原理精讲

### 1. computed 计算属性

- 基于依赖**缓存**:依赖未变化时,多次访问返回缓存结果,不重新计算;
- 声明式,返回一个值,用于模板/其他计算;
- 默认只读,也可配置 getter/setter。

### 2. watch 侦听器

- 监听指定数据源,变化时执行回调(可拿到新值和旧值);
- 适合**副作用**:异步请求、操作 DOM、耗时操作;
- 可配置 `immediate`(立即执行一次)、`deep`(深度监听)。

### 3. 核心区别

| 维度 | computed | watch |
|------|----------|-------|
| 缓存 | 有 | 无 |
| 返回值 | 必须返回值 | 无返回,执行副作用 |
| 适用 | 一个值由多个依赖计算 | 一个数据变化引发一系列操作 |
| 异步 | 不支持 | 支持 |
| 触发 | 惰性(被访问时) | 数据变化立即触发回调 |

### 4. watch vs watchEffect(Vue3)

- `watch`:显式指定依赖源,能拿新旧值,惰性(默认不立即执行);
- `watchEffect`:自动收集回调内用到的依赖,立即执行一次,拿不到旧值。

## 代码示例

### computed

```vue
<script setup>
import { ref, computed } from 'vue';

const firstName = ref('张');
const lastName = ref('三');

// 依赖不变时返回缓存
const fullName = computed(() => firstName.value + lastName.value);

// 可写 computed
const fullName2 = computed({
  get: () => firstName.value + lastName.value,
  set: (val) => { [firstName.value, lastName.value] = val.split(' '); },
});
</script>
```

### watch

```vue
<script setup>
import { ref, watch, watchEffect } from 'vue';

const keyword = ref('');

// 监听搜索词,变化时请求(副作用 + 异步)
watch(keyword, async (newVal, oldVal) => {
  const res = await search(newVal);
}, { immediate: true });               // 初始就执行一次

// 深度监听对象
const form = ref({ name: '', age: 0 });
watch(form, () => console.log('表单变了'), { deep: true });

// watchEffect:自动追踪依赖,立即执行
watchEffect(() => {
  console.log(keyword.value);          // 用到谁就监听谁
});
</script>
```

## 高频追问

**Q:computed 和 watch 区别?怎么选?**
A:computed 有缓存、必须返回值,用于"由其他数据派生出一个值"(如全名、总价);watch 无缓存、执行副作用,用于"数据变化后要做一系列操作(异步请求、复杂逻辑)"。能用 computed 就别用 watch。

**Q:computed 的缓存机制?**
A:computed 内部有一个 dirty 标志。依赖变化时标记为脏,下次访问才重新计算并缓存;依赖不变时直接返回缓存值,避免重复计算。

**Q:watch 的 immediate 和 deep?**
A:immediate: true 让回调在初始化时立即执行一次(否则只在变化时触发);deep: true 深度监听对象内部属性变化(否则只监听引用变化)。deep 有性能开销。

**Q:watch 和 watchEffect 区别?**
A:watch 需显式指定监听源、能拿新旧值、默认惰性;watchEffect 自动收集回调内的响应式依赖、立即执行、拿不到旧值,更简洁但依赖不透明。

**Q:computed 可以是异步的吗?**
A:不能。computed 必须同步返回值。异步派生数据要用 watch/watchEffect 触发请求,再把结果存到 ref 里。

## 一句话背诵版

**computed:有缓存、必须返回值、依赖不变不重算,用于派生值;watch:无缓存、执行副作用、能拿新旧值、支持异步和 immediate/deep,用于变化后做操作;watchEffect 自动收集依赖并立即执行;能用 computed 就不用 watch。**
