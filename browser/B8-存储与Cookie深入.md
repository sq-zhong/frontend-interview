# B8 · 存储与 Cookie 深入

> 热度:🔥🔥

> 本篇聚焦 **Cookie 属性、跨标签页通信、存储选型**,与 H5(存储方案对比)互补。

## 一句话考点

Cookie 靠 `HttpOnly/Secure/SameSite` 等属性保障安全;跨标签页通信可用 `storage` 事件、`BroadcastChannel`、`SharedWorker`;存储选型看容量、生命周期、是否随请求发送。

## 原理精讲

### 1. Cookie 安全属性(高频)

| 属性 | 作用 |
|------|------|
| `HttpOnly` | 禁止 JS 读取(`document.cookie`),防 XSS 窃取(见 N6) |
| `Secure` | 仅 HTTPS 传输 |
| `SameSite` | 限制跨站携带,防 CSRF(见 N7):Strict/Lax/None |
| `Domain` / `Path` | 控制作用域 |
| `Expires` / `Max-Age` | 过期时间(不设为会话 cookie,关浏览器失效) |

### 2. 跨标签页通信方案

| 方案 | 说明 |
|------|------|
| **storage 事件** | 同源下一个页改 localStorage,其他页触发 `storage` 事件 |
| **BroadcastChannel** | 同源页面间广播消息,API 简洁(推荐) |
| **SharedWorker** | 多标签页共享一个 worker,通过它中转 |
| **postMessage** | 跨窗口/iframe(可跨源)通信 |
| **Service Worker** | 通过 SW 中转消息 |

### 3. 存储选型速记(详见 H5)

- 少量、需发服务器、认证 → **Cookie**;
- 长期本地、用户设置 → **localStorage**;
- 单次会话、临时 → **sessionStorage**;
- 大量结构化、离线 → **IndexedDB**。

## 代码示例

### storage 事件跨标签页

```js
// 标签页 A 修改
localStorage.setItem('theme', 'dark');

// 标签页 B 监听(A 的修改会触发,自身修改不触发)
window.addEventListener('storage', (e) => {
  if (e.key === 'theme') {
    console.log('主题变了:', e.newValue, '旧值:', e.oldValue);
  }
});
```

### BroadcastChannel(推荐)

```js
// 所有同源标签页
const channel = new BroadcastChannel('app');

// 发送
channel.postMessage({ type: 'logout' });

// 接收
channel.onmessage = (e) => {
  if (e.data.type === 'logout') {
    location.href = '/login';        // 一处登出,所有标签页同步登出
  }
};
```

### 安全的登录 Cookie(服务端设置)

```
Set-Cookie: token=xxx; HttpOnly; Secure; SameSite=Lax; Max-Age=7200; Path=/
```

## 高频追问

**Q:Cookie 有哪些安全相关属性?**
A:HttpOnly(禁 JS 读取,防 XSS 偷 cookie)、Secure(仅 HTTPS 传输)、SameSite(限制跨站携带,防 CSRF)、Domain/Path(作用域)、Expires/Max-Age(有效期)。

**Q:如何实现跨标签页通信?**
A:① storage 事件(改 localStorage 触发其他同源页);② BroadcastChannel(同源广播,API 简洁,推荐);③ SharedWorker(共享 worker 中转);④ postMessage(跨窗口/iframe,可跨源);⑤ Service Worker 中转。

**Q:storage 事件有什么注意点?**
A:只有**其他**同源标签页的修改会触发,当前页自己修改不触发;只监听 localStorage/sessionStorage(且 sessionStorage 不跨标签页共享);值都是字符串。

**Q:SameSite 的作用和取值?**
A:控制 cookie 是否随跨站请求发送,防 CSRF。Strict(完全禁跨站)、Lax(现代默认,允许安全的顶级导航 GET)、None(允许跨站但必须配 Secure)。

**Q:为什么敏感 token 建议放 HttpOnly Cookie 而非 localStorage?**
A:localStorage 可被 JS 读取,一旦 XSS 就能窃取 token;HttpOnly Cookie 无法被 JS 读取,XSS 也偷不到,配合 Secure + SameSite 更安全。代价是要防范 CSRF。

## 一句话背诵版

**Cookie 安全靠 HttpOnly(防 XSS 读)、Secure(仅 HTTPS)、SameSite(防 CSRF);跨标签页通信用 storage 事件 / BroadcastChannel(推荐)/ SharedWorker / postMessage;存储选型:认证用 Cookie、长期用 localStorage、临时用 sessionStorage、大数据用 IndexedDB。**
