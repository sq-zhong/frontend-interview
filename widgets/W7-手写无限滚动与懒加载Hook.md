# W7 · 手写无限滚动与懒加载 Hook

> 业务轮子专项 · 需求 → 设计要点 → 核心实现 → 使用 → 进阶考点

## 需求场景

信息流、商品列表要**滚到底部自动加载下一页**;图片要**进入视口才加载**。两者核心都是"检测元素是否接近/进入视口",现代方案用 `IntersectionObserver`(见 B7),封装成 Hook 复用。

## 设计要点

1. 用 **IntersectionObserver** 监听哨兵元素(sentinel)是否进入视口;
2. 进入视口时触发加载回调;
3. 管理 loading、hasMore 状态,防止重复触发;
4. 组件卸载时 disconnect,避免泄漏(见 S3);
5. 通用化:`useIntersectionObserver` 底层 + `useInfiniteScroll` 上层。

## 核心实现

### 底层:useIntersectionObserver

```jsx
import { useEffect, useRef } from 'react';

function useIntersectionObserver(callback, options = {}) {
  const targetRef = useRef(null);

  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) callback(entry);   // 进入视口触发
    }, {
      rootMargin: options.rootMargin || '0px',     // 提前量
      threshold: options.threshold || 0,
    });

    observer.observe(el);
    return () => observer.disconnect();            // 卸载清理(防泄漏)
  }, [callback, options.rootMargin]);

  return targetRef;
}
```

### 上层:useInfiniteScroll

```jsx
import { useState, useCallback } from 'react';

function useInfiniteScroll(loadMore, { hasMore }) {
  const [loading, setLoading] = useState(false);

  const handleIntersect = useCallback(async () => {
    if (loading || !hasMore) return;   // 防重复触发
    setLoading(true);
    try {
      await loadMore();
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, loadMore]);

  // 提前 100px 触发,体验更顺
  const sentinelRef = useIntersectionObserver(handleIntersect, { rootMargin: '100px' });

  return { sentinelRef, loading };
}
```

### 图片懒加载 Hook

```jsx
function useLazyImage() {
  const imgRef = useIntersectionObserver((entry) => {
    const img = entry.target;
    img.src = img.dataset.src;         // 进入视口才加载真实图片
  });
  return imgRef;
}
```

## 使用示例

```jsx
function Feed() {
  const [list, setList] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = async () => {
    const data = await fetchPage(page);
    setList(prev => [...prev, ...data.items]);
    setPage(p => p + 1);
    setHasMore(data.hasMore);
  };

  const { sentinelRef, loading } = useInfiniteScroll(loadMore, { hasMore });

  return (
    <div>
      {list.map(item => <Card key={item.id} data={item} />)}
      {/* 哨兵元素:它进入视口就触发加载 */}
      <div ref={sentinelRef} style={{ height: 1 }} />
      {loading && <Spinner />}
      {!hasMore && <p>没有更多了</p>}
    </div>
  );
}
```

## 面试考点

**Q:为什么用 IntersectionObserver 而不是监听 scroll?**
A:scroll 事件高频触发、需要手动节流并调 getBoundingClientRect(强制同步布局,见 H3),性能差;IntersectionObserver 由浏览器底层异步实现,不占主线程、无需手动计算位置,天然高效,专为"元素是否进入视口"设计。

**Q:无限滚动如何防止重复触发?**
A:用 loading 标志和 hasMore 判断:正在加载或没有更多数据时,直接 return 不再触发。哨兵进入视口的回调里先检查这两个状态。

**Q:rootMargin 的作用?**
A:给视口设置扩展边距,如 `100px` 表示元素距视口还有 100px 时就算"进入",提前触发加载,让用户滚到底前数据已就绪,体验更顺滑。

**Q:为什么要 disconnect?**
A:IntersectionObserver 会持有 DOM 引用,组件卸载时不 disconnect 会导致观察器和回调无法回收,造成内存泄漏(见 S3)。在 useEffect 的清理函数里 disconnect。

## 一句话总结

**无限滚动/懒加载用 IntersectionObserver(不占主线程、无需手动算位置,优于 scroll 监听):监听哨兵元素进视口触发加载,rootMargin 提前量优化体验,loading+hasMore 防重复触发,卸载时 disconnect 防泄漏;封装成 useIntersectionObserver + useInfiniteScroll 复用。**
