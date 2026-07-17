# R5 · useEffect 深入

> 热度:🔥🔥🔥

## 一句话考点

`useEffect` 处理副作用(请求、订阅、DOM 操作),在**渲染完成后异步执行**;依赖数组决定执行时机,return 的清理函数在**卸载前**和**下次 effect 执行前**调用。

## 原理精讲

### 1. 执行时机

- effect 在**浏览器绘制完成后**异步执行(不阻塞渲染);
- `useLayoutEffect` 在 DOM 变更后、**绘制前同步**执行(适合需要读取布局并同步修改的场景,避免闪烁)。

### 2. 依赖数组的三种情况

| 写法 | 执行时机 |
|------|---------|
| 不传依赖 | **每次渲染后**都执行 |
| `[]` | 只在**挂载后**执行一次 |
| `[a, b]` | 挂载后 + a 或 b 变化时执行 |

### 3. 清理函数

return 的函数用于清理副作用(取消订阅、清定时器、取消请求)。执行时机:
- 组件**卸载前**;
- **下一次 effect 执行前**(先清理上一次,再执行新的)。

### 4. 依赖项要诚实

effect 内用到的所有响应式值(props、state、函数)都应写进依赖数组,否则会读到**过期闭包**中的旧值(stale closure)。这是高频 bug 来源。

## 代码示例

### 请求数据 + 竞态处理

```jsx
function User({ id }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    let cancelled = false;               // 防竞态
    fetchUser(id).then(data => {
      if (!cancelled) setUser(data);     // 已切换则丢弃旧结果
    });
    return () => { cancelled = true; };  // id 变化时清理上一次
  }, [id]);                              // 依赖 id

  return <div>{user?.name}</div>;
}
```

### 过期闭包陷阱

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      console.log(count);   // ❌ 永远打印 0(闭包锁定初始 count)
    }, 1000);
    return () => clearInterval(timer);
  }, []);                    // 依赖空,effect 只跑一次,闭包停留在初始值

  // 修复:把 count 加入依赖,或用函数式更新
}
```

### useEffect vs useLayoutEffect

```jsx
// 需要在绘制前读取/修改 DOM,避免闪烁 → useLayoutEffect
useLayoutEffect(() => {
  const height = ref.current.offsetHeight;
  ref.current.style.transform = `translateY(${-height}px)`;
}, []);
```

## 高频追问

**Q:useEffect 和 useLayoutEffect 区别?**
A:useEffect 在绘制后异步执行,不阻塞渲染(绝大多数场景用它);useLayoutEffect 在 DOM 更新后、浏览器绘制前同步执行,适合需要同步测量/修改 DOM 避免视觉闪烁的场景,但会阻塞绘制。

**Q:依赖数组为空 `[]` 有什么坑?**
A:effect 只跑一次,内部闭包锁定首次渲染的 state/props(过期闭包)。若定时器/回调里用到会读到旧值。解决:补全依赖,或用函数式更新 `setX(prev => ...)`、useRef 存最新值。

**Q:清理函数什么时候执行?**
A:组件卸载前,以及每次重新执行 effect 之前(先清上一次再跑下一次)。用于取消订阅、清定时器、防竞态。

**Q:如何在 useEffect 里用 async?**
A:不能直接把 effect 回调写成 async(它会返回 Promise 而非清理函数)。在内部定义 async 函数再调用:`useEffect(() => { (async () => {...})(); }, [])`。

**Q:如何避免请求竞态?**
A:用一个 `cancelled` 标志或 `AbortController`,在清理函数中标记取消,回调里判断后再 setState,丢弃过期请求的结果。

## 一句话背诵版

**useEffect 绘制后异步执行、useLayoutEffect 绘制前同步(防闪烁);依赖 `[]` 只跑一次(小心过期闭包)、`[deps]` 变化时跑、不传每次跑;return 清理函数在卸载前和下次执行前调用;依赖要写全,请求要防竞态。**
