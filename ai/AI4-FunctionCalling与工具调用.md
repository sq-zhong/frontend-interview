# AI4 · Function Calling 与工具调用

> AI 时代专题 · 需求 → 原理 → 流程 → 实现 → 考点

## 需求场景

大模型本身只会"生成文本",不能查数据库、调接口、执行操作。**Function Calling(工具调用)** 让模型能"决定调用哪个函数、传什么参数",从而连接真实世界——这是 **AI Agent** 的基础。比如"帮我查北京天气"→模型调用 `getWeather('北京')`。

## 原理

模型不真正执行函数,而是:
1. 你告诉模型有哪些**可用工具**(名字、功能描述、参数 schema);
2. 模型根据用户问题**决定**是否要调用某个工具、生成调用参数(结构化 JSON);
3. **你的代码**执行这个函数,把结果返回给模型;
4. 模型基于函数结果生成最终自然语言回复。

**关键**:模型负责"决策和参数生成",实际执行由你的前端/后端完成。

## 完整流程

```
用户:"北京今天天气怎么样?"
   ↓
① 请求模型(附带 tools 定义)
   ↓
② 模型返回:要调用 getWeather，参数 { city: "北京" }
   （不是文本回复，是工具调用指令）
   ↓
③ 你的代码执行 getWeather("北京") → { temp: 25, desc: "晴" }
   ↓
④ 把结果作为 tool 消息再发给模型
   ↓
⑤ 模型生成："北京今天晴,气温 25 度,适合出行。"
```

## 实现

### 定义工具

```js
const tools = [{
  type: 'function',
  function: {
    name: 'getWeather',
    description: '查询指定城市的实时天气',      // 描述很重要,模型靠它判断何时调用
    parameters: {
      type: 'object',
      properties: {
        city: { type: 'string', description: '城市名称' },
      },
      required: ['city'],
    },
  },
}];
```

### 处理调用循环(前端可映射到真实操作)

```js
// 前端场景:工具可以是"操作页面/调接口"
const toolImpls = {
  getWeather: async ({ city }) => fetchWeather(city),
  navigateTo: async ({ path }) => router.push(path),   // AI 控制路由跳转
  fillForm: async ({ data }) => setFormData(data),     // AI 填表单
};

async function runWithTools(messages) {
  while (true) {
    const res = await callLLM(messages, { tools });    // 经后端代理
    const msg = res.choices[0].message;

    if (msg.tool_calls) {
      messages.push(msg);
      // 执行模型要求的每个工具
      for (const call of msg.tool_calls) {
        const args = JSON.parse(call.function.arguments);
        const result = await toolImpls[call.function.name](args);
        messages.push({
          role: 'tool',
          tool_call_id: call.id,
          content: JSON.stringify(result),
        });
      }
      // 带着工具结果再次请求模型(循环直到模型给出文本回复)
    } else {
      return msg.content;   // 没有工具调用 = 最终回复
    }
  }
}
```

## 考点

**Q:Function Calling 的原理?模型会自己执行函数吗?**
A:不会。模型只负责**决策**——根据工具描述判断该不该调、生成结构化的调用参数;实际执行由你的代码完成,再把结果回传给模型生成最终回复。它让模型能"连接"真实能力(查数据、调接口、操作 UI)。

**Q:工具的 description 为什么重要?**
A:模型完全靠工具的 name、description 和参数 schema 来判断"什么时候该调用这个工具、怎么传参"。描述不清模型会调错或不调。这也是提示词工程的一部分(见 AI7)。

**Q:前端做工具调用有什么典型场景?**
A:AI 助手控制页面——如根据自然语言帮用户跳转路由、填写表单、筛选数据、执行操作;把 UI 能力封装成工具给模型调用,实现"对话式操作界面"。

**Q:多轮工具调用怎么处理?**
A:用循环:请求模型→若返回 tool_calls 就执行并把结果作为 tool 消息追加→再次请求→直到模型返回纯文本回复。模型可能连续调用多个工具(如先查用户再查订单)。

**Q:工具调用的安全风险?**
A:模型可能被诱导(prompt 注入)调用危险操作。要对工具做权限校验、危险操作二次确认、参数校验,绝不让模型直接触发不可逆的敏感操作(删除、支付),后端也要独立鉴权(见 AI8)。

## 一句话总结

**Function Calling 让模型"决策调用哪个工具+生成参数",实际由你的代码执行再回传结果,是 AI Agent 基础;流程:定义 tools(name/description/参数 schema)→模型返回 tool_calls→执行→结果作为 tool 消息回传→循环到纯文本回复;前端可把路由/表单/接口封装成工具实现对话式操作;description 决定调用准确性,危险操作要校验+二次确认。**
