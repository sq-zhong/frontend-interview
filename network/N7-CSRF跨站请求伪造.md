# N7 · CSRF 跨站请求伪造

> 热度:🔥🔥🔥

## 一句话考点

CSRF(跨站请求伪造)是诱导已登录用户在**不知情下**向目标站发送请求,利用浏览器**自动携带 cookie** 的特性冒用身份;核心防御是 **CSRF Token + SameSite Cookie**。

## 原理精讲

### 1. 攻击原理

前提:用户已登录 A 网站(浏览器存有 A 的登录 cookie)。
1. 攻击者诱导用户访问恶意页面 B;
2. B 页面暗中向 A 发起请求(如转账),`<img src="http://a.com/transfer?to=hacker&amount=1000">` 或自动提交表单;
3. 浏览器**自动带上 A 的 cookie**,A 服务器以为是用户本人操作,执行成功。

**关键**:攻击者**看不到响应**(有同源策略),但**能触发有副作用的请求**。所以 CSRF 攻击的是"写操作"。

### 2. XSS vs CSRF 区别(高频对比)

| | XSS | CSRF |
|--|-----|------|
| 本质 | 注入并执行恶意脚本 | 冒用用户身份发请求 |
| 是否需在目标站运行脚本 | 是 | 否(在第三方站发起) |
| 利用 | 用户对网站的信任 | 网站对浏览器 cookie 的信任 |
| 能否读响应 | 能(窃取数据) | 不能(只能触发操作) |

### 3. 防御手段

**① CSRF Token(最主流)**
服务器生成随机 token 返回给页面(藏在表单/请求头),提交时带上验证。攻击者的第三方页面**拿不到这个 token**,伪造请求会被拒。

**② SameSite Cookie**
给 cookie 设 `SameSite` 属性,限制跨站携带:
- `Strict`:完全禁止跨站带 cookie(最严,可能影响正常跳转体验);
- `Lax`(现代浏览器默认):导航类 GET 可带,跨站 POST/表单不带(平衡);
- `None`:允许跨站带(必须配 Secure)。

**③ 校验来源**
检查 `Origin` / `Referer` 头是否来自可信域。

**④ 双重提交 Cookie**
把 token 同时放 cookie 和请求参数,服务端比对是否一致。

**⑤ 关键操作二次验证**
敏感操作(转账、改密码)要求验证码、短信码或重新输密码。

## 代码示例

```html
<!-- 攻击示例:恶意页面自动提交 -->
<form action="http://bank.com/transfer" method="POST">
  <input name="to" value="hacker">
  <input name="amount" value="10000">
</form>
<script>document.forms[0].submit();</script>  <!-- 自动提交,带上银行 cookie -->
```

```js
// 防御1:请求头带 CSRF Token
axios.defaults.headers.common['X-CSRF-Token'] = getTokenFromMeta();

// 防御2:后端设置 SameSite cookie
// Set-Cookie: sessionId=xxx; HttpOnly; Secure; SameSite=Lax
```

## 高频追问

**Q:CSRF 的攻击原理?**
A:利用浏览器对同域请求自动携带 cookie 的机制。用户登录目标站后被诱导访问恶意页,恶意页悄悄向目标站发请求,cookie 被自动带上,服务器误以为是本人操作。

**Q:XSS 和 CSRF 区别?**
A:XSS 是注入脚本在页面执行、利用用户对网站的信任、能读数据;CSRF 是从第三方站冒用身份发请求、利用网站对 cookie 的信任、读不到响应只能触发操作。XSS 危害更大且可用于绕过 CSRF 防御。

**Q:CSRF Token 为什么能防御?**
A:token 是服务器随机生成、只在合法页面里、攻击者的跨站页面因同源策略读不到。伪造请求缺少正确 token 就会被服务端拒绝。

**Q:SameSite 的三个值?**
A:Strict(完全禁跨站带 cookie)、Lax(现代默认,允许安全的导航 GET,禁跨站 POST)、None(允许跨站,需配 Secure)。Lax 能防御大部分 CSRF 且不太影响体验。

**Q:只用验证码能防 CSRF 吗?为什么不普遍用?**
A:能有效防御(攻击者不知道验证码),但每个操作都加验证码严重影响体验,所以只用于转账、改密等敏感操作,常规请求靠 Token + SameSite。

## 一句话背诵版

**CSRF = 诱导已登录用户在不知情下发请求,利用浏览器自动带 cookie 冒用身份(只能触发写操作、读不到响应);防御:CSRF Token(第三方页拿不到)+ SameSite Cookie(Lax/Strict)+ 校验 Origin/Referer + 敏感操作二次验证;与 XSS 的区别是它利用网站对 cookie 的信任。**
