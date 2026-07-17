# AI2 · SSE 流式渲染

> AI 时代专题 · 需求 → 原理 → 核心实现 → 难点 → 考点

## 需求场景

AI 回复往往很长,若等全部生成完再显示,用户要干等好几秒。**流式输出**(打字机效果)让文字一个个蹦出来,大幅改善体验——这是 AI 应用的标配。前端实现流式的核心技术是 **SSE(Server-Sent Events)**。

## 原理:为什么用 SSE

| 方案 | 适用 | 特点 |
|------|------|------|
| **SSE** | 服务器→客户端**单向**流 | HTTP 长连接、自动重连、文本流、实现简单 ← AI 流式首选 |
| WebSocket | 双向实时通信 | 全双工,更重,适合聊天室/协作 |
| 轮询 | 兼容兜底 | 低效 |

AI 流式是"服务器持续推送生成的 token"——**单向**,所以 SSE 最合适。大模型 API 的 stream 模式返回的就是 SSE 格式的数据流。

### SSE 数据格式

```
data: {"content": "闭"}

data: {"content": "包"}

data: {"content": "是"}

data: [DONE]
```

每条以 `data:` 开头,`\n\n` 分隔,`[DONE]` 表示结束。

## 核心实现

### 方式一:EventSource(原生,但只支持 GET)

```js
const es = new EventSource('/api/chat/stream?q=hello');
es.onmessage = (e) => {
  if (e.data === '[DONE]') { es.close(); return; }
  const { content } = JSON.parse(e.data);
  appendToUI(content);         // 逐块追加到界面
};
es.onerror = () => es.close();
```
**局限**:只支持 GET、不能自定义 header(带 token 不便)、不能传复杂 body。

### 方式二:fetch + ReadableStream(主流,推荐)

支持 POST、自定义 header,灵活可控:

```js
async function streamChat(messages, onChunk) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,       // 可带鉴权
    },
    body: JSON.stringify({ messages, stream: true }),
  });

  const reader = res.body.getReader();          // 读取流
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // 按 SSE 格式按行解析
    const lines = buffer.split('\n\n');
    buffer = lines.pop();                        // 最后一段可能不完整,留到下次
    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (data === '[DONE]') return;
      const { content } = JSON.parse(data);
      onChunk(content);                          // 回调:逐块更新 UI
    }
  }
}

// 使用
let answer = '';
await streamChat(messages, (chunk) => {
  answer += chunk;
  setAnswer(answer);                             // React setState 逐步渲染
});
```

## 难点

1. **分块边界**:网络返回的 chunk 不一定按 SSE 消息对齐,要用 buffer 缓存不完整的行,拆分时保留残余(上面 `buffer = lines.pop()`);
2. **中断/取消**:用户点"停止"要能中断——用 AbortController;
3. **错误处理**:流中途报错要给用户反馈、支持重试;
4. **性能**:高频 setState 可能卡顿,可节流批量更新(见 AI3)。

## 考点

**Q:AI 流式输出用什么技术?为什么不用 WebSocket?**
A:用 SSE(Server-Sent Events)。因为 AI 流式是服务器单向持续推送 token,SSE 基于 HTTP 长连接、专为服务器→客户端单向流设计、实现简单还自动重连;WebSocket 是双向全双工、更重,单向场景没必要。

**Q:EventSource 和 fetch 流式怎么选?**
A:EventSource 原生简单但只支持 GET、不能自定义 header 和 body;fetch + ReadableStream 支持 POST、自定义鉴权头、传复杂 body,更灵活可控,是 AI 应用主流方案。

**Q:流式解析要注意什么?**
A:网络 chunk 边界不一定和 SSE 消息对齐,要用 buffer 累积、按 `\n\n` 拆分并保留最后不完整的一段到下次;处理 `[DONE]` 结束标记;支持 AbortController 中断。

**Q:如何实现"停止生成"?**
A:用 AbortController,把 signal 传给 fetch,点停止时调 `controller.abort()` 中断流读取。

## 一句话总结

**AI 流式输出用 SSE(服务器单向推 token、HTTP 长连接、比 WebSocket 轻);前端主流用 fetch + ReadableStream(支持 POST/鉴权,优于只能 GET 的 EventSource):getReader 逐块读、TextDecoder 解码、用 buffer 处理分块边界、按 data:/[DONE] 解析、回调逐步更新 UI;配 AbortController 支持停止,高频更新要节流。**
