# B6 · Service Worker 与 PWA

> 热度:🔥🔥

## 一句话考点

Service Worker 是运行在浏览器后台的**代理线程**,拦截网络请求实现**离线缓存**和推送,是 PWA 的核心;它有独立生命周期,只能在 **HTTPS** 下运行。

## 原理精讲

### 1. Service Worker 是什么

一种特殊的 Web Worker,充当**浏览器与网络之间的代理**:
- 拦截页面发出的所有请求,可返回缓存或转发网络;
- 独立于页面运行,页面关闭后仍可存活(处理推送、后台同步);
- **不能访问 DOM**;只能用 HTTPS(localhost 除外),防中间人篡改。

### 2. 生命周期

```
register(注册) → install(安装,缓存静态资源) → activate(激活,清理旧缓存) → 运行(拦截 fetch)
```

- `install`:通常在此预缓存核心资源;
- `activate`:清理过期缓存;
- 更新:SW 文件有变化会安装新版本,默认等旧的所有页面关闭后才接管(可用 `skipWaiting` 立即接管)。

### 3. 缓存策略(Cache API)

| 策略 | 说明 | 适用 |
|------|------|------|
| Cache First | 优先缓存,没有再请求网络 | 静态资源 |
| Network First | 优先网络,失败用缓存 | 频繁更新的数据 |
| Stale-While-Revalidate | 先返缓存,同时后台更新 | 兼顾速度与新鲜度 |
| Cache Only / Network Only | 只用缓存 / 只用网络 | 特定场景 |

### 4. PWA(渐进式 Web 应用)

用 Web 技术提供接近原生 App 的体验:
- **Service Worker**:离线可用、缓存、推送;
- **Web App Manifest**:可"添加到主屏幕"、全屏、图标、启动画面;
- 特点:可离线、可安装、可推送通知、渐进增强。

## 代码示例

### 注册与安装

```js
// main.js —— 注册
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(reg => console.log('SW 注册成功', reg.scope));
}
```

```js
// sw.js —— Service Worker
const CACHE = 'v1';

// 安装:预缓存核心资源
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      cache.addAll(['/', '/index.html', '/app.js', '/style.css'])
    )
  );
});

// 激活:清理旧缓存
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
});

// 拦截请求:Cache First 策略
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
```

## 高频追问

**Q:Service Worker 和 Web Worker 区别?**
A:Web Worker 是通用后台计算线程,随页面存活;Service Worker 是网络代理,拦截请求做缓存/推送,独立于页面生命周期(页面关了还能运行),只能 HTTPS,是 PWA 核心。两者都不能访问 DOM。

**Q:Service Worker 为什么必须 HTTPS?**
A:它能拦截和篡改所有网络请求,权限很大。若在 HTTP 下,中间人可注入恶意 SW 劫持站点,所以强制 HTTPS(localhost 开发例外)保证来源可信。

**Q:Service Worker 的生命周期?**
A:register → install(预缓存资源)→ activate(清理旧缓存)→ 运行拦截 fetch。新版本默认等所有旧页面关闭才接管,可用 skipWaiting + clients.claim 立即接管。

**Q:常见缓存策略有哪些?**
A:Cache First(静态资源)、Network First(动态数据)、Stale-While-Revalidate(先返缓存再后台更新)、Cache Only、Network Only。按资源特性选择。

**Q:PWA 是什么?核心技术?**
A:渐进式 Web 应用,用 Web 技术实现接近原生的体验(离线、可安装、推送)。核心:Service Worker(离线缓存/推送)+ Web App Manifest(添加到主屏、图标、全屏)。

## 一句话背诵版

**Service Worker 是浏览器后台的网络代理线程,拦截请求做离线缓存和推送、独立于页面存活、只能 HTTPS、不能访问 DOM;生命周期 install(预缓存)→activate(清旧缓存)→fetch(拦截);缓存策略 Cache First/Network First/SWR;是 PWA(+Manifest 可安装)的核心。**
