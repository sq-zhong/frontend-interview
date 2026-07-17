# R4 · Hooks 原理与常用 Hooks

> 热度:🔥🔥🔥

## 一句话考点

Hooks 让函数组件拥有状态和副作用能力;底层用**链表**按调用顺序存储每个 Hook 的状态,所以必须**在顶层按固定顺序调用**,不能放在条件/循环里。

## 原理精讲

### 1. 为什么 Hooks 不能写在条件里

React 用一个**链表(或数组)**保存组件的所有 Hook 状态,靠**调用顺序**做索引来对应。每次渲染必须以完全相同的顺序调用相同数量的 Hooks,否则索引错乱、状态对应错误。

因此两条规则(eslint-plugin-react-hooks 强制):
1. 只在**函数组件顶层**调用,不放在条件、循环、嵌套函数里;
2. 只在函数组件或自定义 Hook 中调用。

### 2. 常用 Hooks

| Hook | 作用 |
|------|------|
| `useState` | 状态 |
| `useEffect` | 副作用(见 R5) |
| `useContext` | 消费 Context |
| `useRef` | 保存可变值/DOM 引用(不触发渲染) |
| `useMemo` | 缓存计算结果 |
| `useCallback` | 缓存函数引用 |
| `useReducer` | 复杂状态逻辑(类 Redux) |
| `useLayoutEffect` | 同步执行的副作用(DOM 变更后、绘制前) |

### 3. useState 原理简述

React 内部为每个 useState 维护一个"记忆单元"。`setState` 是**异步批处理**的:同一事件里多次调用会合并,基于同一次渲染的旧值。要基于最新值更新用**函数式更新** `setX(prev => ...)`。

## 代码示例

### 自定义 Hook(逻辑复用)

```jsx
// 抽离可复用逻辑
function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return width;
}

// 使用
function Component() {
  const width = useWindowWidth();
  return <div>宽度:{width}</div>;
}
```

### setState 批处理陷阱

```jsx
function Counter() {
  const [count, setCount] = useState(0);
  const handleClick = () => {
    setCount(count + 1);   // 基于旧值 0
    setCount(count + 1);   // 还是基于 0 → 最终只 +1
  };
  const handleClick2 = () => {
    setCount(c => c + 1);  // 基于最新
    setCount(c => c + 1);  // 再 +1 → 最终 +2
  };
}
```

### useRef 保存不触发渲染的值

```jsx
function Timer() {
  const timerRef = useRef(null);   // 改变 .current 不会重渲染
  const start = () => {
    timerRef.current = setInterval(() => console.log('tick'), 1000);
  };
  const stop = () => clearInterval(timerRef.current);
}
```

## 高频追问

**Q:为什么 Hooks 不能写在 if 里?**
A:React 靠调用顺序把每次 useState/useEffect 与内部链表节点对应。条件调用会导致某次渲染 Hooks 数量/顺序变化,索引错位,状态串位甚至崩溃。

**Q:useState 是同步还是异步?**
A:setState 本身不是"异步函数",但更新是**批处理**的——在事件处理中多次调用会合并,当次不能立即拿到新值。React 18 中几乎所有场景都自动批处理。

**Q:useRef 和 useState 区别?**
A:useState 改变会触发重渲染;useRef 改变 `.current` 不触发渲染,适合存定时器 id、DOM 引用、上一次的值等"不需要驱动 UI"的可变数据。

**Q:useMemo 和 useCallback 区别?**
A:useMemo 缓存**计算结果(值)**;useCallback 缓存**函数引用**。`useCallback(fn, deps)` 等价于 `useMemo(() => fn, deps)`。

**Q:自定义 Hook 的意义?**
A:抽离和复用带状态的逻辑(如请求、订阅、表单),替代类时代的 HOC 和 render props,更简洁、无嵌套地狱。命名必须以 `use` 开头。

## 一句话背诵版

**Hooks 靠调用顺序用链表存状态,所以必须顶层固定顺序调用(不放条件/循环);setState 批处理、连续基于旧值要用函数式更新;useRef 存不触发渲染的可变值;useMemo 缓存值、useCallback 缓存函数;自定义 Hook(use 开头)复用逻辑。**
