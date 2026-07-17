# J4 · this 指向全解析

> 热度:🔥🔥🔥

## 一句话考点

`this` 的指向在**函数调用时**决定,遵循优先级:**new > 显式绑定(call/apply/bind)> 隐式绑定(对象调用)> 默认绑定(全局/undefined)**;箭头函数没有自己的 this。

## 原理精讲

### 四条绑定规则(优先级从低到高)

1. **默认绑定**:独立函数调用,`this` 指向全局对象(严格模式下为 `undefined`)。
   ```js
   function f() { console.log(this); }
   f();  // window / undefined(严格模式)
   ```

2. **隐式绑定**:作为对象方法调用,`this` 指向调用它的对象(谁调用指向谁)。
   ```js
   obj.f();  // this === obj
   ```
   ⚠️ 隐式丢失:把方法赋值给变量再调用,或作为回调传递,会退回默认绑定。

3. **显式绑定**:`call`/`apply`/`bind` 强制指定 this。

4. **new 绑定**:`this` 指向新创建的实例。

### 箭头函数

箭头函数**没有自己的 this**,它的 this 取决于**定义时外层的 this**(词法作用域),且无法被 call/apply/bind 改变。

## 代码示例

```js
// 隐式丢失(高频陷阱)
const obj = {
  name: 'obj',
  getName() { return this.name; },
};
const fn = obj.getName;
fn();            // undefined(退回默认绑定,this 是 window)
obj.getName();   // 'obj'

// 回调中丢失
const arr = [1, 2];
arr.forEach(obj.getName);  // this 不是 obj

// 箭头函数固定 this(解决回调丢失)
const timer = {
  seconds: 0,
  start() {
    setInterval(() => {
      this.seconds++;      // 箭头函数 this = start 的 this = timer
    }, 1000);
  },
};

// 优先级:new > bind
function Foo(v) { this.v = v; }
const BoundFoo = Foo.bind({ v: 'bound' });
const o = new BoundFoo('new');
o.v;  // 'new'(new 优先级高于 bind)
```

### 输出题

```js
var name = 'global';
const obj = {
  name: 'obj',
  regular: function () { return this.name; },
  arrow: () => this.name,
};
obj.regular();  // 'obj'(隐式绑定)
obj.arrow();    // 'global'(箭头函数,this 指向定义时外层=全局)
```

## 高频追问

**Q:箭头函数和普通函数区别?**
A:① 箭头函数无自己的 this(继承外层),无法用 call 等改变;② 无 `arguments`(用 rest 参数);③ 不能作构造函数(不能 new);④ 无 `prototype`。

**Q:`call`、`apply`、`bind` 区别?**
A:三者都改 this。call 参数逐个传、apply 参数数组传,两者立即执行;bind 返回一个绑定后的新函数,不立即执行。

**Q:为什么 `setTimeout` 里的 this 是 window?**
A:setTimeout 的回调是独立调用(默认绑定),且延迟执行时脱离了原对象上下文。用箭头函数或 bind 解决。

**Q:如何判断一段代码的 this?**
A:看调用方式:有没有 new → 有没有 call/apply/bind → 是不是 obj.fn() 形式 → 都不是就是默认绑定;箭头函数则看外层。

## 一句话背诵版

**this 在调用时确定,优先级 new > 显式(call/apply/bind)> 隐式(obj.fn)> 默认(window/undefined);箭头函数无自己的 this,继承定义时外层且不可改。**
