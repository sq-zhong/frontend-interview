# AI1 · 前端接入大模型基础

> AI 时代专题 · 需求 → 核心概念 → 接入方式 → 关键实现 → 考点

## 需求场景

给产品加 AI 能力(智能问答、内容生成、AI 助手)已经是 2026 年前端的常见需求。前端需要理解:如何调用大模型、消息结构、流式 vs 非流式、以及**为什么密钥不能放前端**。

## 核心概念

### 1. 对话消息结构(通用格式)

大模型 API(OpenAI/Claude 等)都用**消息数组**表达对话:

```js
const messages = [
  { role: 'system', content: '你是一个专业的前端助手' },  // 设定角色/行为
  { role: 'user', content: '什么是闭包?' },              // 用户输入
  { role: 'assistant', content: '闭包是...' },            // 模型回复
  { role: 'user', content: '举个例子' },                  // 多轮对话
];
```

- **system**:系统提示,设定 AI 的角色、语气、约束(见 AI7);
- **user / assistant**:交替出现,构成多轮上下文;
- 每轮请求要**带上完整历史**(模型无状态,不记得之前),受 **上下文窗口(token 上限)** 限制。

### 2. 关键参数

| 参数 | 作用 |
|------|------|
| `model` | 模型选择(能力 vs 成本/速度权衡) |
| `temperature` | 随机性,0 稳定/确定,越高越发散(创意) |
| `max_tokens` | 限制回复长度 |
| `stream` | 是否流式返回(见 AI2) |

### 3. Token 与成本

模型按 **token**(约 0.75 个英文单词 / 1-2 个汉字)计费,输入 + 输出都算。前端要有**成本意识**:控制上下文长度、历史裁剪、避免无意义重复请求(见 AI8)。

## 接入方式(关键安全点)

```
❌ 前端直接调大模型 API
   浏览器里带 API Key → 密钥泄露、无法限流、无法审计、被盗刷

✅ 前端 → 自己的后端(BFF)→ 大模型
   密钥存服务端、统一鉴权限流、审计日志、内容审核、计费控制
```

**API Key 绝对不能出现在前端代码/请求里**——这是 AI 接入的首要安全铁律。前端调用自己的后端代理接口,由后端持密钥转发。

## 关键实现(非流式基础版)

```js
// 前端调用自己的后端代理(不是直接调大模型)
async function chat(messages) {
  const res = await fetch('/api/chat', {          // 自己的后端
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });
  const data = await res.json();
  return data.content;   // 后端转发大模型结果
}

// 后端(Node)持密钥转发
// app.post('/api/chat', async (req, res) => {
//   const result = await callLLM(req.body.messages, { apiKey: process.env.LLM_KEY });
//   res.json({ content: result });
// });
```

## 考点

**Q:为什么大模型 API Key 不能放前端?**
A:前端代码和网络请求用户都能看到,密钥会直接泄露,导致被盗刷(产生巨额费用)、无法做限流/鉴权/审计。正确做法是前端调自己的后端(BFF),由后端持密钥转发,并在这一层做鉴权、限流、内容审核、计费。

**Q:大模型是有状态的吗?多轮对话怎么实现?**
A:无状态,模型不记得之前的对话。多轮对话靠前端每次请求都带上完整的 messages 历史(system + 之前所有 user/assistant)。受上下文窗口 token 上限限制,过长要裁剪或摘要。

**Q:temperature 参数怎么用?**
A:控制输出随机性。0 附近输出稳定确定,适合分类、抽取、代码等需要确定性的任务;调高(0.7-1)更有创意和多样性,适合文案、头脑风暴。

**Q:如何控制 AI 功能的成本?**
A:选合适的模型(简单任务用小模型)、限制 max_tokens、裁剪/摘要历史上下文、缓存常见问答、防抖去重避免重复请求、设置用户额度(见 AI8)。

## 一句话总结

**前端接入大模型:用 messages 数组(system 设定 + user/assistant 多轮,模型无状态需每次带全历史,受 token 窗口限制)、参数控制(temperature 随机性/max_tokens/model);铁律是 API Key 绝不放前端,必须走"前端→自己后端(BFF)→大模型",在后端持密钥并做鉴权限流审计计费;按 token 计费要有成本意识。**
