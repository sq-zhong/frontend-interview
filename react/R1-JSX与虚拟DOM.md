# R1 · JSX 与虚拟 DOM

> 热度:🔥🔥🔥

## 一句话考点

JSX 是 `React.createElement` 的语法糖,最终生成**虚拟 DOM**(描述 UI 的 JS 对象);虚拟 DOM 通过 diff 算法计算最小更新,批量操作真实 DOM,减少昂贵的 DOM 操作。

## 原理精讲

### 1. JSX 的本质

JSX 不是 HTML,是语法糖。Babel 会把它编译成 `React.createElement`(React 17 后为 `jsx()` 函数)调用:

```jsx
const el = <div className="box">Hello</div>;
// 编译后 ↓
const el = React.createElement('div', { className: 'box' }, 'Hello');
```

`createElement` 返回一个**虚拟 DOM 对象**:

```js
{
  type: 'div',
  props: { className: 'box', children: 'Hello' },
  key: null,
  ref: null,
}
```

### 2. 虚拟 DOM 是什么

用 JS 对象描述真实 DOM 结构的轻量表示。渲染流程:
1. JSX → 虚拟 DOM 树;
2. 状态变化 → 生成新虚拟 DOM 树;
3. **diff** 新旧两棵树,找出差异(patch);
4. 把差异批量应用到真实 DOM(reconciliation)。

### 3. 为什么用虚拟 DOM

- **性能**:直接操作真实 DOM 昂贵(触发重排重绘),虚拟 DOM 在内存计算最小差异,批量更新;
- **跨平台**:虚拟 DOM 是抽象描述,可渲染到不同平台(ReactDOM、React Native);
- **声明式**:开发者描述"UI 应该长什么样",框架负责 DOM 操作。

> ⚠️ 虚拟 DOM 不一定比手动操作 DOM 快,它的价值是在**复杂应用中提供可维护的、够快的**更新方式。

## 代码示例

```jsx
// JSX 常见规则
function App() {
  const name = 'React';
  return (
    <div className="app">          {/* class 要写 className */}
      <h1>Hello {name}</h1>         {/* {} 插入表达式 */}
      {name && <p>已登录</p>}        {/* 条件渲染 */}
      <ul>
        {[1, 2, 3].map(n => (
          <li key={n}>{n}</li>      {/* 列表要加 key */}
        ))}
      </ul>
    </div>
  );
}
```

```jsx
// JSX 必须有单一根节点,用 Fragment 避免多余 DOM
function List() {
  return (
    <>                              {/* React.Fragment 简写 */}
      <li>a</li>
      <li>b</li>
    </>
  );
}
```

## 高频追问

**Q:JSX 编译成什么?**
A:`React.createElement(type, props, ...children)`(React 17+ 用自动运行时的 `_jsx`),返回描述 UI 的虚拟 DOM 对象。

**Q:虚拟 DOM 一定比真实 DOM 操作快吗?**
A:不一定。单次简单操作,直接操作真实 DOM 更快。虚拟 DOM 的优势在于:批量 diff 减少不必要的 DOM 操作、屏蔽手动操作的复杂度、跨平台。它是"可维护性 + 足够好的性能"的折中。

**Q:为什么 JSX 里用 `className` 而不是 `class`?**
A:`class` 是 JS 保留字。JSX 最终是 JS,所以用 `className`;类似地 `for` 写作 `htmlFor`。

**Q:JSX 中 `{}` 能放什么?**
A:任何 JS 表达式(变量、函数调用、三元、map 等),但不能放语句(if、for)。`true/false/null/undefined` 不渲染。

**Q:为什么组件名必须大写?**
A:JSX 中小写标签被当作 HTML 原生标签(字符串 type),大写才被当作组件(变量引用)。

## 一句话背诵版

**JSX 是 `React.createElement` 语法糖,生成虚拟 DOM(描述 UI 的 JS 对象);状态变化时 diff 新旧虚拟 DOM 求最小差异再批量更新真实 DOM;价值是声明式、可维护、跨平台,而非绝对最快。**
