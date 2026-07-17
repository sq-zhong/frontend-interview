# N5 · 跨域(同源策略 / CORS / JSONP)

> 热度:🔥🔥🔥

## 一句话考点

浏览器**同源策略**(协议+域名+端口相同)限制跨源请求;解决跨域主流用 **CORS**(服务端设响应头),历史方案 **JSONP**(利用 script 标签,只支持 GET),开发用**代理**。

## 原理精讲

### 1. 同源策略

同源 = **协议、域名、端口三者完全相同**。非同源会被限制:
- Ajax/fetch 请求被拦截(实际会发出,但响应被浏览器拦下);
- Cookie、localStorage、DOM 无法跨源访问。

目的:防止恶意网站读取其他站点的敏感数据(如你的银行 cookie)。

> 注意:`<img>`、`<script>`、`<link>`、`<iframe>` 等标签**天然允许跨源加载**(不受同源策略读取限制),JSONP 正是利用这点。

### 2. CORS(跨源资源共享,主流方案)

由**服务端**设置响应头声明允许哪些源访问。浏览器分两种:

**简单请求**(GET/POST/HEAD + 简单头 + 特定 Content-Type):直接发,服务器返回 `Access-Control-Allow-Origin` 即可。

**预检请求**(PUT/DELETE、自定义头、application/json 等):浏览器先发 **OPTIONS** 预检,服务器允许后才发真实请求。

关键响应头:
```
Access-Control-Allow-Origin: https://a.com   # 允许的源(或 *)
Access-Control-Allow-Methods: GET, POST, PUT
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true       # 允许带 cookie
Access-Control-Max-Age: 86400                # 预检结果缓存时间
```

### 3. JSONP(历史方案)

利用 `<script>` 可跨源加载,后端返回一个函数调用包裹数据。**缺点:只支持 GET、有 XSS 风险、错误处理弱**。

### 4. 其他方案

- **开发代理**:webpack devServer proxy / Nginx 反向代理(同源转发,绕过浏览器限制);
- **postMessage**:跨窗口/iframe 通信;
- **WebSocket**:不受同源策略限制。

## 代码示例

### CORS 带 cookie

```js
// 前端
fetch('https://api.b.com/data', {
  credentials: 'include',        // 带上跨域 cookie
});
// 后端必须:
// Access-Control-Allow-Origin: https://a.com  (不能用 *)
// Access-Control-Allow-Credentials: true
```

### JSONP 实现

```js
function jsonp(url, callbackName) {
  return new Promise((resolve) => {
    window[callbackName] = (data) => {   // 全局回调
      resolve(data);
      document.body.removeChild(script);
    };
    const script = document.createElement('script');
    script.src = `${url}?callback=${callbackName}`;
    document.body.appendChild(script);   // 发起跨源请求
  });
}
// 后端返回:myCallback({ "name": "Tom" })
```

### 开发代理(vite)

```js
// vite.config.js
export default {
  server: {
    proxy: {
      '/api': {
        target: 'http://backend.com',
        changeOrigin: true,        // 服务端转发,浏览器看到同源
      },
    },
  },
};
```

## 高频追问

**Q:什么是同源策略?为什么需要?**
A:同源指协议、域名、端口都相同。它限制跨源的脚本读取数据,防止恶意站点利用你的登录状态窃取其他网站的敏感信息(如 cookie、响应数据)。

**Q:CORS 的简单请求和预检请求区别?**
A:简单请求(GET/POST/HEAD + 简单头 + 表单类 Content-Type)直接发送;复杂请求(PUT/DELETE、自定义头、application/json)会先发 OPTIONS 预检,服务器许可后再发真实请求。

**Q:CORS 跨域带 cookie 要注意什么?**
A:前端设 `credentials: 'include'`;后端 `Access-Control-Allow-Credentials: true` 且 `Access-Control-Allow-Origin` 必须是**具体源**(不能是 `*`)。

**Q:JSONP 的原理和缺点?**
A:利用 script 标签能跨源加载,服务器返回函数调用包裹数据在全局执行。缺点:只能 GET、安全性差(执行任意返回的脚本,易被 XSS/注入)、无法可靠处理错误和超时。

**Q:跨域时请求到底发出去了吗?**
A:CORS 的简单请求发出去了,只是响应被浏览器拦截不给 JS 读;预检请求会先被 OPTIONS 挡住。服务端其实收到了请求(所以 CSRF 仍需防范)。代理方案则是绕开浏览器,请求真实发到目标。

## 一句话背诵版

**同源=协议+域名+端口相同,限制跨源读取以防数据窃取;CORS 由服务端设 Access-Control-Allow-* 头(复杂请求先 OPTIONS 预检,带 cookie 时 Origin 不能为 *);JSONP 靠 script 跨源只支持 GET;开发用 proxy/Nginx 反向代理绕过。**
