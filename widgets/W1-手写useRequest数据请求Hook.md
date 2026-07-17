# W1 · 手写 useRequest 数据请求 Hook

> 业务轮子专项 · 需求 → 设计要点 → 核心实现 → 使用 → 进阶考点

## 需求场景

几乎每个页面都要:发请求、管理 loading/error/data、组件卸载或参数变化时取消上一个请求(防竞态)、手动重试、轮询。把这些封装成一个 `useRequest` Hook,是 React 工程能力的直接体现(ahooks 的核心)。

## 设计要点

1. **三态管理**:data / loading / error;
2. **防竞态**:参数变化或卸载时,丢弃过期请求的结果(见 S4);
3. **手动触发**:支持 `manual` 模式和 `run()` 方法;
4. **刷新/重试**:`refresh()` 重新执行上次请求;
5. **回调**:onSuccess / onError;
6. 可扩展:轮询、防抖、缓存。

## 核心实现

```jsx
import { useState, useEffect, useRef, useCallback } from 'react';

function useRequest(service, options = {}) {
  const {
    manual = false,        // 是否手动触发
    defaultParams = [],
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState(undefined);
  const [loading, setLoading] = useState(!manual);
  const [error, setError] = useState(undefined);

  // 用 ref 保存"当前请求序号",防竞态
  const countRef = useRef(0);
  // 保存最近一次参数,供 refresh 复用
  const lastParamsRef = useRef(defaultParams);

  const run = useCallback(async (...params) => {
    const currentCount = ++countRef.current;   // 本次请求序号
    lastParamsRef.current = params;
    setLoading(true);
    setError(undefined);
    try {
      const res = await service(...params);
      // 只有"最新"的请求才写入状态,过期的丢弃
      if (currentCount === countRef.current) {
        setData(res);
        setLoading(false);
        onSuccess?.(res, params);
      }
      return res;
    } catch (err) {
      if (currentCount === countRef.current) {
        setError(err);
        setLoading(false);
        onError?.(err, params);
      }
      throw err;
    }
  }, [service]);

  const refresh = useCallback(() => run(...lastParamsRef.current), [run]);

  // 自动模式:挂载时执行
  useEffect(() => {
    if (!manual) run(...defaultParams);
    // 卸载时让计数失配,丢弃在途请求结果
    return () => { countRef.current++; };
  }, []);

  return { data, loading, error, run, refresh };
}
```

## 使用示例

```jsx
function UserList() {
  const { data, loading, error, refresh } = useRequest(
    () => fetch('/api/users').then(r => r.json()),
    { onSuccess: (d) => console.log('加载成功', d) }
  );

  if (loading) return <Skeleton />;
  if (error) return <button onClick={refresh}>加载失败,重试</button>;
  return <List items={data} />;
}

// 手动模式(如搜索、提交)
function Search() {
  const { data, loading, run } = useRequest(
    (keyword) => api.search(keyword),
    { manual: true }
  );
  return <input onChange={e => run(e.target.value)} />;
}
```

## 进阶扩展(体现深度)

```jsx
// 轮询:在 onSuccess 后延迟再次执行
if (pollingInterval) {
  timerRef.current = setTimeout(() => run(...params), pollingInterval);
}

// 防抖:run 用 debounce 包裹(搜索场景)
// 缓存:用 cacheKey 把 data 存 Map,相同 key 先返缓存再更新(SWR 思路)
// loading 延迟:loadingDelay 内不显示 loading,避免闪烁
```

## 面试考点

**Q:useRequest 如何防止竞态?**
A:用一个自增的请求序号(useRef)。每次 run 时 `++countRef.current` 记录本次序号,请求返回后判断 `currentCount === countRef.current`,只有最新请求才写状态,过期请求的结果直接丢弃。卸载时也自增计数,丢弃在途结果。

**Q:为什么用 useRef 而不是 useState 存计数?**
A:计数是控制逻辑、不需要触发渲染,用 useRef 避免额外渲染,且 ref 的 `.current` 是可变的最新值,不受闭包快照影响。

**Q:manual 模式的意义?**
A:自动模式适合"进页面就加载"的展示数据;manual 模式适合"用户触发才请求"的场景(搜索、提交表单),暴露 run 方法由业务主动调用。

## 一句话总结

**useRequest 封装 data/loading/error 三态 + run/refresh + onSuccess/onError;核心是用 useRef 自增序号防竞态(只采纳最新请求、卸载丢弃在途);manual 控制自动/手动触发;可扩展轮询、防抖、缓存(SWR)、loadingDelay。**
