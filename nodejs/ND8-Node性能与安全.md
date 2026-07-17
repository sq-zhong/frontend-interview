# ND8 · Node 性能与安全

> Node.js 专题 · 性能优化 → 安全防护 → 排查 → 考点

## 一句话考点

Node 性能优化围绕"**别阻塞事件循环 + 减少 IO 开销**":异步化、缓存、集群、流;安全要防**注入、越权、依赖漏洞、DoS**,不信任任何外部输入。

## 一、性能优化

| 方向 | 手段 |
|------|------|
| **别阻塞事件循环** | CPU 密集用 worker_threads;避免同步 API(readFileSync)、避免大 JSON 同步解析 |
| **利用多核** | cluster / PM2 多进程 |
| **减少 IO** | 缓存(Redis/内存)、连接池(DB)、批量、避免 N+1 查询 |
| **流式处理** | 大文件/大响应用 Stream,不全读进内存 |
| **HTTP** | keep-alive 复用连接、Gzip 压缩、CDN 静态资源 |
| **减少同步计算** | 大计算分片或移到 worker |

### 常见性能陷阱

```js
// ❌ 同步 API 阻塞事件循环(高并发下灾难)
const data = fs.readFileSync('big.file');
// ✅ 异步
const data = await fs.promises.readFile('big.file');

// ❌ 循环里 await(串行,慢)
for (const id of ids) await queryDB(id);
// ✅ 并行(注意控制并发,见 W6)
await Promise.all(ids.map(id => queryDB(id)));
```

## 二、安全防护(重点)

| 风险 | 防护 |
|------|------|
| **SQL/NoSQL 注入** | 参数化查询 / ORM,不拼接 SQL |
| **命令注入** | 不把用户输入拼进 exec;用 execFile + 参数数组 |
| **XSS**(SSR 场景) | 输出转义、CSP(见 N6) |
| **CSRF** | CSRF Token + SameSite cookie(见 N7) |
| **越权** | 每个接口校验用户对资源的权限(见 D8) |
| **依赖漏洞** | `npm audit`、锁版本、及时更新 |
| **DoS** | 限流、限制 body 大小、超时、限制并发 |
| **敏感信息** | 密钥用环境变量,别硬编码/进 Git;错误信息别暴露堆栈给用户 |
| **原型污染** | 校验/冻结对象,警惕 `__proto__` 注入 |

### 关键实践

```js
// 参数化查询防注入
db.query('SELECT * FROM users WHERE id = ?', [userId]);   // ✅
// db.query(`... WHERE id = ${userId}`);                  // ❌ 注入风险

// 限流(防暴力破解/DoS)
const rateLimit = require('express-rate-limit');
app.use(rateLimit({ windowMs: 60000, max: 100 }));

// 安全响应头
const helmet = require('helmet');
app.use(helmet());                        // 设置一系列安全 header

// 限制 body 大小(防大请求 DoS)
app.use(express.json({ limit: '1mb' }));

// 密钥用环境变量
const secret = process.env.JWT_SECRET;    // 不硬编码
```

## 三、排查(呼应 S 系列)

- **内存泄漏**:heap snapshot 对比、监控 RSS 增长(定时器/闭包/缓存未清,见 S3);
- **CPU 高**:`--prof` 或 clinic.js 采样,找热点/阻塞事件循环的同步代码;
- **事件循环延迟**:监控 event loop lag,过高说明有阻塞;
- **日志与监控**:结构化日志 + APM(如 Sentry、Prometheus)。

## 考点

**Q:Node 性能优化有哪些手段?**
A:核心是别阻塞事件循环——避免同步 API、CPU 密集移到 worker_threads;利用多核用 cluster/PM2;减少 IO 用缓存、连接池、批量、避免 N+1;大数据用 Stream;HTTP 层 keep-alive、Gzip、CDN;循环里别串行 await,用 Promise.all 并行(控制并发)。

**Q:Node 应用有哪些安全风险?**
A:注入(SQL/NoSQL/命令)、XSS(SSR)、CSRF、越权、依赖漏洞、DoS、敏感信息泄露、原型污染。防护:参数化查询、输入校验、鉴权、npm audit、限流、helmet 安全头、密钥用环境变量、错误不暴露堆栈。

**Q:为什么同步 API 在 Node 高并发下危险?**
A:同步 API(如 readFileSync)会阻塞单线程的事件循环,期间无法处理其他请求。低并发看不出问题,高并发时所有请求排队、吞吐骤降甚至假死。应始终用异步 API。

**Q:怎么防止 Node 服务被 DoS?**
A:接口限流(express-rate-limit)、限制请求 body 大小、设置超时、控制并发、CPU 密集任务隔离、上层加 CDN/WAF/网关防护。避免单个恶意请求耗尽资源。

**Q:怎么排查 Node 内存泄漏和 CPU 问题?**
A:内存——用 heap snapshot 对比找持续增长对象、看 Retainers(见 S3);CPU——用 --prof 或 clinic.js 火焰图找热点和阻塞事件循环的同步代码;配合 event loop lag 监控和 APM。

## 一句话总结

**Node 性能核心是别阻塞事件循环(避免同步 API、CPU 密集移 worker)+ 多核(cluster/PM2)+ 减 IO(缓存/连接池/批量)+ Stream + 并行 await;安全防注入(参数化查询)、越权、依赖漏洞(npm audit)、DoS(限流+限 body)、密钥环境变量、helmet 安全头、错误不暴露;排查用 heap snapshot、--prof/clinic、event loop lag 监控。**
