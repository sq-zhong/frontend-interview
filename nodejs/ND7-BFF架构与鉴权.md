# ND7 · BFF 架构与鉴权

> Node.js 专题 · BFF 是什么 → 职责 → 鉴权方案 → 考点

## 一句话考点

**BFF(Backend for Frontend)** 是前端专属的后端层,聚合裁剪多个后端接口、适配前端需求;常由前端团队用 Node 实现;鉴权主流用 **JWT / Session**,BFF 层做鉴权、聚合、缓存、限流。

## 原理

### 1. 为什么需要 BFF

前端直连众多微服务有痛点:
- 一个页面要调多个服务、多次请求(瀑布);
- 后端返回的数据结构不贴合前端(要前端做大量转换);
- 不同端(Web/App)需要不同的数据裁剪;
- 敏感逻辑/密钥不宜放前端。

**BFF 是"为前端定制的后端"**,在前后端之间加一层:

```
前端(Web/App)
     ↓
   BFF 层(Node)—— 聚合、裁剪、鉴权、缓存、适配
     ↓
多个后端微服务 / 数据库 / 第三方 API
```

### 2. BFF 的职责

| 职责 | 说明 |
|------|------|
| **接口聚合** | 一个 BFF 接口内并行调多个后端服务,合并返回(减少前端请求数) |
| **数据裁剪/转换** | 只返回前端需要的字段、转成前端友好的结构 |
| **鉴权** | 统一校验登录态、权限 |
| **多端适配** | Web/App 各有 BFF,返回各自需要的数据 |
| **缓存/限流** | 缓存热点数据、限流保护后端 |
| **安全** | 密钥/敏感逻辑放 BFF,前端不接触 |

Next.js 的 Route Handlers / Server Actions(见 NX5/NX7)、Node 中间层都可作为 BFF。

### 3. 鉴权方案

**Session(有状态)**:
- 登录后服务端创建 session、返回 sessionId(存 cookie);
- 每次请求带 cookie,服务端查 session 存储(Redis)验证;
- 优点:可主动失效;缺点:服务端要存储、分布式需共享 session。

**JWT(无状态)**:
- 登录后签发 JWT(header.payload.signature),客户端存储(cookie/localStorage);
- 每次请求带 token,服务端**验签**即可(无需查库);
- 优点:无状态、易扩展;缺点:签发后**难主动失效**(需黑名单/短过期+refresh token)。

```js
// JWT 鉴权中间件(BFF 层)
function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);   // 验签
    next();
  } catch {
    res.status(401).json({ error: '未授权' });
  }
}
```

### 4. Token 安全(呼应 N7/H5)

- token 存 **HttpOnly + Secure + SameSite cookie** 防 XSS/CSRF;
- 用 **短期 access token + 长期 refresh token**,平衡安全和体验;
- 敏感操作后端二次校验(前端/BFF 鉴权可绕过,真正安全在最终服务端)。

## 考点

**Q:BFF 是什么?解决什么问题?**
A:Backend for Frontend,为前端定制的后端中间层。解决前端直连微服务的痛点:接口聚合(减少请求数)、数据裁剪转换(贴合前端)、多端适配、统一鉴权、缓存限流、隐藏密钥。常由前端团队用 Node 实现。

**Q:JWT 和 Session 鉴权区别?**
A:Session 有状态——服务端存 session,返回 sessionId,请求时查库验证,可主动失效但要存储和分布式共享;JWT 无状态——服务端签发 token,请求时验签即可(不查库),易扩展但签发后难主动失效(靠短过期+refresh token 或黑名单)。

**Q:JWT 的结构?**
A:三段用点分隔:header(算法类型)、payload(用户信息等声明,注意不加密只是 base64)、signature(用密钥对前两段签名)。服务端验签确认未被篡改。payload 不能放敏感明文。

**Q:JWT 怎么实现登出/主动失效?**
A:JWT 无状态本身不支持失效。方案:① 短期 access token(15 分钟)+ refresh token,登出删 refresh;② 服务端维护 token 黑名单(牺牲部分无状态性);③ 改密钥使所有 token 失效(影响全部用户)。

**Q:BFF 层的鉴权能保证安全吗?**
A:BFF 鉴权是重要一层,但和前端一样可能被绕过(直接调后端服务)。真正的安全需要最终的后端服务对每个敏感操作独立鉴权。BFF 做统一入口鉴权 + 后端兜底(呼应 D8)。

## 一句话总结

**BFF(为前端定制的后端中间层,常用 Node)负责接口聚合、数据裁剪转换、多端适配、鉴权、缓存限流、隐藏密钥;鉴权:Session 有状态(服务端存、可失效)、JWT 无状态(验签不查库、易扩展但难主动失效,用短 access+refresh token);token 存 HttpOnly+Secure+SameSite cookie,敏感操作最终后端必须二次鉴权。**
