# AI3 · Markdown 流式渲染与打字机效果

> AI 时代专题 · 需求 → 难点 → 核心实现 → 优化 → 考点

## 需求场景

AI 回复通常是 Markdown(标题、列表、**代码块**、表格),且是**流式**逐字返回的。前端要一边接收流(见 AI2)一边把不断增长的 Markdown 实时渲染成富文本,还要处理代码高亮、打字机节奏、性能和安全。这是 AI 聊天界面最核心也最容易踩坑的一环。

## 难点(为什么不能简单 `innerHTML`)

1. **不完整的 Markdown**:流式中途,Markdown 语法可能不闭合(` ``` ` 代码块还没结束、`**` 只有一半),直接渲染会错乱/闪烁;
2. **性能**:每来一个 token 就全量重新解析 + 重渲染整段,长回复会卡(见 S2);
3. **安全**:Markdown 里可能含恶意 HTML,直接渲染有 **XSS** 风险(见 N6);
4. **代码高亮**:代码块要语法高亮,且流式中代码不完整;
5. **体验节奏**:token 到达不均匀,打字机效果要平滑。

## 核心实现

### 基础:流式追加 + Markdown 渲染

```jsx
import { marked } from 'marked';
import DOMPurify from 'dompurify';

function ChatMessage() {
  const [raw, setRaw] = useState('');   // 累积的原始 Markdown 文本

  useEffect(() => {
    streamChat(messages, (chunk) => {
      setRaw(prev => prev + chunk);      // 逐块累加原始文本
    });
  }, []);

  // 渲染时才解析,且必须净化防 XSS
  const html = useMemo(
    () => DOMPurify.sanitize(marked.parse(raw)),
    [raw]
  );

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
```

**关键**:累积**原始文本**,渲染时整体 parse(marked 能容忍大部分不完整语法),而不是把 HTML 片段拼接。

### 优化 1:节流渲染(性能)

token 可能每秒几十个,每个都 setState + 重新解析会卡。批量节流:

```js
// 累积 chunk,用 requestAnimationFrame 批量刷新(见 S2)
let pending = '';
let scheduled = false;
function onChunk(chunk) {
  pending += chunk;
  if (!scheduled) {
    scheduled = true;
    requestAnimationFrame(() => {
      setRaw(prev => prev + pending);
      pending = '';
      scheduled = false;
    });
  }
}
```

### 优化 2:代码块高亮

```js
marked.setOptions({
  highlight: (code, lang) => hljs.highlightAuto(code, [lang]).value,
});
// 流式中代码块可能未闭合,marked 会把剩余部分当代码渲染,
// 结束时再整体高亮一次,视觉更稳
```

### 优化 3:打字机平滑(可选)

若模型返回不均匀,可把 chunk 放入队列,用固定节奏(定时器/rAF)逐字"吐"出来,视觉更顺滑。代价是牺牲一点实时性。

## 安全(重点)

**AI 输出不可信**——它可能生成含 `<script>`、`onerror` 的内容,或被 prompt 注入诱导输出恶意 HTML。**渲染前必须用 DOMPurify 净化**(见 N6),不能直接 `innerHTML`。代码块要转义,链接要校验协议(防 `javascript:`)。

## 考点

**Q:AI 流式 Markdown 渲染的难点?**
A:① 流式中途 Markdown 不闭合,要累积原始文本整体解析而非拼 HTML;② 性能——高频 token 全量重渲染会卡,要节流批量更新;③ 安全——AI 输出不可信,渲染前必须 DOMPurify 净化防 XSS;④ 代码高亮和打字机节奏。

**Q:为什么要累积原始文本而不是拼接渲染后的 HTML?**
A:Markdown 是有上下文的(代码块、列表跨多行),流式中途片段单独渲染会出错。累积完整原始文本、每次整体用 marked 解析,能正确处理跨块语法,marked 也能容忍未闭合的中间状态。

**Q:AI 渲染的 XSS 风险怎么防?**
A:把 AI 输出当不可信数据。Markdown 转 HTML 后用 DOMPurify 净化再渲染,过滤 script、事件属性、危险协议;绝不直接 innerHTML 原始内容。还要防 prompt 注入导致的恶意输出。

**Q:流式渲染卡顿怎么优化?**
A:节流批量更新——用 requestAnimationFrame 或定时器把多个 token 攒起来一次性 setState + 解析,而非每个 token 都触发;长内容可考虑只重渲染变化的最后部分。

## 一句话总结

**AI 流式 Markdown 渲染:累积原始文本、渲染时整体 marked 解析(容忍未闭合语法),别拼 HTML 片段;性能靠 rAF 节流批量更新;安全铁律是 AI 输出不可信,marked 转 HTML 后必须 DOMPurify 净化防 XSS(N6);代码块高亮 + 可选打字机队列平滑节奏。**
