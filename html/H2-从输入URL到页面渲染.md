# H2 · 从输入 URL 到页面渲染

> 热度:🔥🔥🔥

## 一句话考点

经典大题,主线:**URL 解析 → DNS 查询 → 建立 TCP 连接 → (TLS 握手) → 发送 HTTP 请求 → 服务器响应 → 浏览器解析渲染 → 断开连接**。

## 原理精讲

### 完整流程

**1. URL 解析**
浏览器解析 URL 的协议、域名、端口、路径;检查是否命中 HSTS(强制 HTTPS)。

**2. DNS 解析(域名 → IP)**
按顺序查缓存:浏览器缓存 → 系统 hosts → 本地 DNS 缓存 → 递归查询(根 → 顶级域 → 权威域名服务器)。

**3. 建立 TCP 连接(三次握手)**
- 客户端发 SYN;
- 服务器回 SYN + ACK;
- 客户端回 ACK,连接建立。

**4. TLS 握手(HTTPS)**
协商加密套件、验证证书、交换密钥,建立加密通道。

**5. 发送 HTTP 请求**
发送请求行、请求头(含 Cookie、缓存标识如 If-None-Match)、请求体。

**6. 服务器处理并响应**
返回状态码、响应头、响应体(HTML)。可能命中强缓存(200 from cache)或协商缓存(304)。

**7. 浏览器解析与渲染**(见 H3 详解)
- 解析 HTML 构建 **DOM 树**;
- 解析 CSS 构建 **CSSOM 树**;
- 合并成**渲染树**(Render Tree);
- **布局(Layout/Reflow)**:计算每个节点的几何位置;
- **绘制(Paint)**:填充像素;
- **合成(Composite)**:分层合成显示到屏幕。

**8. 断开连接(四次挥手)**
若非 keep-alive,则 TCP 四次挥手关闭连接。

## 关键细节

### 渲染阻塞
- **CSS 阻塞渲染**:CSSOM 未构建完,渲染树无法生成,页面白屏;
- **JS 阻塞解析**:`<script>` 默认会暂停 HTML 解析(见 H4 defer/async);
- **JS 依赖 CSSOM**:JS 若要读样式,须等前面的 CSS 加载完。

### DNS 与连接优化
- `dns-prefetch`、`preconnect` 预解析/预连接;
- HTTP/2 多路复用减少连接开销;
- 缓存(强缓存 Cache-Control/Expires、协商缓存 ETag/Last-Modified)。

## 高频追问

**Q:为什么 TCP 要三次握手?**
A:确认双方收发能力都正常。两次无法确认客户端的接收能力,可能因历史失效连接导致服务器误建连接。

**Q:DNS 解析用的什么协议?**
A:通常 UDP(端口 53,快、无需连接);当响应超过 512 字节或区域传送时用 TCP。

**Q:强缓存和协商缓存区别?**
A:强缓存(Cache-Control: max-age / Expires)命中直接用本地,不发请求(状态 200 from cache);协商缓存(ETag/If-None-Match、Last-Modified/If-Modified-Since)会发请求问服务器,未变返回 304 用本地。

**Q:输入 URL 后哪一步最耗时?如何优化?**
A:常见瓶颈在 DNS、TCP/TLS 建连、资源加载。优化:DNS 预解析、preconnect、CDN、HTTP/2、缓存、压缩、资源合并与懒加载。

**Q:重定向发生在哪一步?**
A:服务器返回 3xx(如 301/302)后,浏览器根据 Location 重新发起请求,循环上述流程。

## 一句话背诵版

**URL 解析 → DNS(缓存链+递归)→ TCP 三次握手 →(TLS)→ 发 HTTP 请求 → 服务器响应(可能命中缓存/304)→ 浏览器构建 DOM+CSSOM→渲染树→布局→绘制→合成 → 四次挥手;CSS 阻塞渲染、JS 阻塞解析。**
