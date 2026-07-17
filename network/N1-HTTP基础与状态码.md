# N1 · HTTP 基础与状态码

> 热度:🔥🔥🔥

## 一句话考点

HTTP 是**无状态**的应用层协议;请求由方法 + URL + 头 + 体组成;状态码分五类:**1xx 信息、2xx 成功、3xx 重定向、4xx 客户端错误、5xx 服务端错误**。

## 原理精讲

### 1. HTTP 报文结构

**请求报文**:
```
GET /api/user HTTP/1.1        ← 请求行(方法 路径 版本)
Host: example.com             ← 请求头
Content-Type: application/json
                              ← 空行
{ "name": "Tom" }             ← 请求体
```

**响应报文**:
```
HTTP/1.1 200 OK               ← 状态行(版本 状态码 短语)
Content-Type: application/json
                              ← 空行
{ "id": 1 }                   ← 响应体
```

### 2. 常用请求方法

| 方法 | 语义 | 幂等 | 安全 |
|------|------|------|------|
| GET | 获取资源 | ✅ | ✅ |
| POST | 创建/提交 | ❌ | ❌ |
| PUT | 全量更新 | ✅ | ❌ |
| PATCH | 部分更新 | ❌ | ❌ |
| DELETE | 删除 | ✅ | ❌ |
| HEAD | 只取响应头 | ✅ | ✅ |
| OPTIONS | 预检/能力查询 | ✅ | ✅ |

> **安全**=不改变服务器状态;**幂等**=多次请求效果相同。

### 3. 状态码五大类(高频)

| 码 | 含义 |
|----|------|
| **200** OK | 成功 |
| **201** Created | 创建成功 |
| **204** No Content | 成功但无返回体 |
| **301** Moved Permanently | 永久重定向(SEO 权重转移) |
| **302** Found | 临时重定向 |
| **304** Not Modified | 协商缓存命中(见 N4) |
| **307/308** | 重定向且不改方法(308 永久、307 临时) |
| **400** Bad Request | 请求参数错误 |
| **401** Unauthorized | 未认证(需登录) |
| **403** Forbidden | 已认证但无权限 |
| **404** Not Found | 资源不存在 |
| **405** Method Not Allowed | 方法不允许 |
| **429** Too Many Requests | 请求过多(限流) |
| **500** Internal Server Error | 服务器内部错误 |
| **502** Bad Gateway | 网关收到无效响应 |
| **503** Service Unavailable | 服务不可用(过载/维护) |
| **504** Gateway Timeout | 网关超时 |

## 代码示例

```js
// fetch 处理状态码
const res = await fetch('/api/user');
if (res.status === 200) {
  const data = await res.json();
} else if (res.status === 401) {
  location.href = '/login';        // 未认证跳登录
} else if (res.status >= 500) {
  showError('服务器繁忙');
}

// fetch 不会对 4xx/5xx reject,要手动判断 res.ok
if (!res.ok) throw new Error(`HTTP ${res.status}`);
```

## 高频追问

**Q:GET 和 POST 区别?**
A:① 语义:GET 取数据、POST 提交数据;② GET 参数在 URL(有长度限制、会被缓存/记录历史),POST 在请求体;③ GET 幂等且安全,POST 不是;④ GET 可被缓存/收藏。本质是语义约定,非技术强制。

**Q:301 和 302 区别?**
A:301 永久重定向,浏览器/搜索引擎会缓存并转移权重,适合域名迁移;302 临时重定向,不缓存,适合临时跳转(如登录后回跳)。

**Q:401 和 403 区别?**
A:401 是"未认证"(没登录或 token 失效,需要身份验证);403 是"已认证但无权限"(登录了但不允许访问该资源)。

**Q:什么是幂等?哪些方法幂等?**
A:同一请求执行一次和多次的效果相同。GET、PUT、DELETE、HEAD 幂等;POST、PATCH 不幂等。幂等性对失败重试很重要。

**Q:504 和 502 区别?**
A:都是网关/代理错误。502 是网关收到了上游返回的无效响应;504 是网关等待上游响应超时。

## 一句话背诵版

**HTTP 无状态、报文=行+头+体;方法看语义与幂等(GET/PUT/DELETE 幂等,POST 不);状态码 1 信息/2 成功/3 重定向/4 客户端错/5 服务端错;记牢 200/301/302/304/400/401/403/404/429/500/502/503/504。**
