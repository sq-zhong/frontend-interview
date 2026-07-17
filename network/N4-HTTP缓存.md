# N4 · HTTP 缓存(强缓存与协商缓存)

> 热度:🔥🔥🔥

## 一句话考点

HTTP 缓存分两级:**强缓存**(Cache-Control / Expires,命中不发请求)优先;未命中走**协商缓存**(ETag / Last-Modified,发请求问服务器,未变返回 304 用本地)。

## 原理精讲

### 1. 缓存查找顺序

```
请求资源
  → 有强缓存且未过期? ── 是 → 用本地(200 from cache,不发请求)
  → 否 → 发请求带协商缓存标识
      → 服务器判断资源是否变化
          → 未变 → 304 Not Modified(用本地缓存)
          → 已变 → 200 + 新资源
```

### 2. 强缓存(不发请求)

| 字段 | 说明 |
|------|------|
| `Cache-Control: max-age=3600` | 相对时间,资源 3600 秒内有效(**优先级高**) |
| `Cache-Control: no-cache` | 不用强缓存,每次走协商缓存 |
| `Cache-Control: no-store` | 完全不缓存 |
| `Cache-Control: private/public` | 是否允许代理缓存 |
| `Expires: <日期>` | HTTP/1.0 的绝对过期时间(受本地时钟影响,已被 max-age 取代) |

**优先级**:`Cache-Control` > `Expires`。

### 3. 协商缓存(发请求,304)

| 响应头(服务器给) | 请求头(浏览器带) | 说明 |
|-------------------|------------------|------|
| `ETag: "abc"` | `If-None-Match: "abc"` | 资源内容指纹(**优先级高**、更精确) |
| `Last-Modified: <日期>` | `If-Modified-Since: <日期>` | 最后修改时间(秒级,有精度局限) |

服务器比对:未变化返回 **304**(空体,省流量),变化返回 200 + 新内容。

**优先级**:`ETag` > `Last-Modified`。

### 4. 为什么 ETag 优于 Last-Modified

- Last-Modified 只精确到**秒**,1 秒内多次修改无法识别;
- 文件内容没变但修改时间变了(如重新生成)会误判;
- 有些资源周期性改动但内容相同。
- ETag 基于内容生成指纹,更精确。

## 代码示例

```
# 强缓存响应头
Cache-Control: max-age=31536000, immutable   # 一年,适合带 hash 的静态资源

# 协商缓存响应头
ETag: "5d8c72a5edda8"
Last-Modified: Wed, 16 Jul 2026 10:00:00 GMT

# 下次请求头(浏览器自动带上)
If-None-Match: "5d8c72a5edda8"
If-Modified-Since: Wed, 16 Jul 2026 10:00:00 GMT
# → 未变化时服务器返回:HTTP/1.1 304 Not Modified
```

### 前端工程化实践

```
index.html          → Cache-Control: no-cache(每次协商,保证更新)
app.a1b2c3.js       → Cache-Control: max-age=31536000, immutable(hash 命名,强缓存一年)
```
文件名带内容 hash,内容变则文件名变,天然更新;HTML 不强缓存以拉取最新引用。

## 高频追问

**Q:强缓存和协商缓存区别?**
A:强缓存命中直接用本地、**不发请求**(状态 200 from disk/memory cache),靠 Cache-Control/Expires 控制;协商缓存**会发请求**问服务器,靠 ETag/Last-Modified 判断,未变返回 304 用本地。强缓存优先。

**Q:Cache-Control 有哪些常用值?**
A:max-age(有效秒数)、no-cache(跳过强缓存直接协商)、no-store(完全不存)、private(仅浏览器缓存)、public(允许代理缓存)、immutable(有效期内不发协商请求)。

**Q:ETag 和 Last-Modified 谁优先?为什么?**
A:ETag 优先。因为 Last-Modified 只精确到秒、且"修改时间变但内容没变"会误判;ETag 是内容指纹,更精确可靠。

**Q:304 是谁返回的?意味着什么?**
A:服务器返回。表示协商缓存命中——资源未变化,响应体为空,浏览器使用本地缓存,节省了传输资源体的流量。

**Q:如何做到发布后立即更新又能长期缓存?**
A:静态资源文件名加内容 hash 并设长期强缓存(max-age 一年);入口 HTML 用 no-cache(协商缓存)。内容变→hash 变→文件名变→自动请求新文件,旧文件缓存自然失效。

## 一句话背诵版

**先强缓存(Cache-Control:max-age / Expires,命中不发请求,Cache-Control 优先)、再协商缓存(ETag/If-None-Match、Last-Modified/If-Modified-Since,发请求未变返回 304,ETag 优先更精确);工程实践:静态资源 hash 命名长期强缓存 + HTML no-cache。**
