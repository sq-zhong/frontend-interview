# J5 · 手写 call / apply / bind

> 热度:🔥🔥

## 一句话考点

三者都用于改变函数的 `this` 指向:call/apply **立即执行**(前者逐个传参、后者数组传参),bind **返回新函数**;手写核心是"把函数挂到目标对象上执行"。

## 原理精讲

改变 this 的本质技巧:**把要调用的函数临时作为目标对象的一个属性,再通过 `对象.方法()` 调用**,这样隐式绑定就让 this 指向了目标对象,调用完再删掉该属性。

bind 额外要点:
- 返回一个新函数,支持**参数柯里化**(bind 时传一部分,调用时再传一部分);
- 返回的函数若被 `new` 调用,this 应指向新实例而非绑定对象。

## 代码示例

### 手写 call

```js
Function.prototype.myCall = function (context, ...args) {
  context = context || window;              // null/undefined 时指向全局
  const key = Symbol('fn');                 // 避免覆盖原有属性
  context[key] = this;                      // this 是被调用的函数
  const result = context[key](...args);     // 隐式绑定,this 指向 context
  delete context[key];
  return result;
};
```

### 手写 apply

```js
Function.prototype.myApply = function (context, args = []) {
  context = context || window;
  const key = Symbol('fn');
  context[key] = this;
  const result = context[key](...args);     // 唯一区别:args 是数组
  delete context[key];
  return result;
};
```

### 手写 bind(含 new 场景)

```js
Function.prototype.myBind = function (context, ...preArgs) {
  const self = this;
  const bound = function (...laterArgs) {
    // 若作为构造函数被 new 调用,this 指向新实例,忽略绑定的 context
    const isNew = this instanceof bound;
    return self.apply(
      isNew ? this : context,
      [...preArgs, ...laterArgs]             // 柯里化:合并两次参数
    );
  };
  // 维持原型链,使 new bound() 的实例能访问原函数原型上的方法
  if (self.prototype) {
    bound.prototype = Object.create(self.prototype);
  }
  return bound;
};
```

### 验证

```js
function greet(greeting, punct) {
  return `${greeting}, ${this.name}${punct}`;
}
const user = { name: 'Tom' };

greet.myCall(user, 'Hi', '!');            // 'Hi, Tom!'
greet.myApply(user, ['Hello', '.']);      // 'Hello, Tom.'
const bound = greet.myBind(user, 'Hey');
bound('~');                               // 'Hey, Tom~'
```

## 高频追问

**Q:为什么用 Symbol 作 key?**
A:避免和目标对象已有属性冲突,保证挂载的临时属性唯一,用完再删除不污染对象。

**Q:bind 为什么要处理 new?**
A:规范要求:被 bind 返回的函数如果用 new 调用,绑定的 this 会失效,应指向新创建的实例。通过 `this instanceof bound` 判断是否 new 调用。

**Q:call 和 apply 性能差异?**
A:差别极小。历史上 call 略快(apply 需处理数组),现代引擎已优化。参数已经是数组用 apply,否则用 call;ES6 后可用扩展运算符 `fn(...args)` 替代 apply。

**Q:如何用 apply 求数组最大值?**
A:`Math.max.apply(null, arr)` 或 `Math.max(...arr)`。

## 一句话背诵版

**核心是把函数临时挂到目标对象上调用来改 this;call 逐个传参、apply 数组传参、都立即执行;bind 返回新函数、支持柯里化、且要处理 new 时 this 指向实例。**
