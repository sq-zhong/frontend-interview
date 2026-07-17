# NX5 · Server Actions

> Next.js 专题 · 概念 → 原理 → 用法 → 安全 → 考点

## 一句话考点

Server Actions 是运行在**服务端的异步函数**,用 `'use server'` 标记,可直接在客户端(如表单 `action`、事件)调用,**无需手写 API 接口**即可安全地做数据变更(mutation),配合 `revalidatePath` 刷新数据。

## 原理

传统流程:前端写 fetch → 调后端 API 路由 → 处理。Server Actions 把这一步简化:直接定义一个服务端函数,Next.js 自动建立"客户端调用 → 服务端执行"的桥接(底层是一次 POST 请求),你不用手写 API endpoint。

- 函数在**服务端执行**,能访问 DB、密钥、文件;
- 可用于表单 `action`、按钮事件、useTransition;
- 天然配合缓存重新验证(见 NX4)。

## 用法

### 表单提交(渐进增强,无 JS 也能用)

```jsx
// app/actions.ts
'use server';
import { revalidatePath } from 'next/cache';

export async function createTodo(formData) {
  const title = formData.get('title');
  await db.todo.create({ data: { title } });   // 直接操作数据库
  revalidatePath('/todos');                      // 刷新列表缓存
}
```

```jsx
// 服务端组件里直接用作 form action
import { createTodo } from './actions';

export default function TodoForm() {
  return (
    <form action={createTodo}>       {/* 提交时直接调用服务端函数 */}
      <input name="title" />
      <button type="submit">添加</button>
    </form>
  );
}
```

### 客户端组件中调用 + 处理状态

```jsx
'use client';
import { useActionState } from 'react';    // React 19
import { createTodo } from './actions';

function Form() {
  const [state, formAction, isPending] = useActionState(createTodo, null);
  return (
    <form action={formAction}>
      <input name="title" />
      <button disabled={isPending}>{isPending ? '提交中...' : '添加'}</button>
    </form>
  );
}
```

### 非表单调用

```jsx
'use client';
function DeleteButton({ id }) {
  return <button onClick={() => deleteItem(id)}>删除</button>;
  // deleteItem 是导入的 Server Action
}
```

## 安全(重点)

Server Action 是暴露的端点(相当于自动生成的 API),**必须像对待 API 一样做安全**:

1. **鉴权**:在 action 内校验用户登录和权限(不能假设只有 UI 会调用它);
2. **输入校验**:校验/清洗入参(用 zod 等),不信任客户端传的数据;
3. **不越权**:确认用户有权操作该资源;
4. 别在 action 里泄露敏感信息给客户端。

```js
'use server';
export async function deleteItem(id) {
  const user = await getCurrentUser();
  if (!user) throw new Error('未登录');              // 鉴权
  const item = await db.item.findUnique({ where: { id } });
  if (item.userId !== user.id) throw new Error('无权限');  // 越权校验
  await db.item.delete({ where: { id } });
  revalidatePath('/items');
}
```

## 考点

**Q:Server Actions 是什么?解决什么问题?**
A:运行在服务端的异步函数(用 'use server' 标记),客户端可直接调用(表单 action、事件),Next.js 自动桥接客户端调用到服务端执行。它免去了手写 API 接口的样板,直接在服务端做数据变更并刷新缓存,简化了 mutation 流程。

**Q:Server Action 和传统 API 路由区别?**
A:API 路由要手写 endpoint + 前端 fetch;Server Action 直接定义函数、客户端直接调用,更简洁、类型安全、支持表单渐进增强。但本质底层还是一次 POST 请求,安全要求一样。

**Q:Server Actions 有什么安全风险?**
A:它是自动暴露的端点,任何人都能构造请求调用,**不能假设只有你的 UI 会调**。必须在 action 内做鉴权、输入校验、越权检查,像对待公开 API 一样,不能只靠前端隐藏按钮做权限控制(呼应 D8:前端权限只是体验)。

**Q:数据变更后怎么更新页面?**
A:在 Server Action 里调 revalidatePath/revalidateTag 让相关缓存失效,页面数据自动刷新;客户端可用 useActionState 拿到返回状态和 pending 状态做 UI 反馈。

**Q:Server Action 支持渐进增强吗?**
A:支持。用作 `<form action={action}>` 时,即使 JS 未加载,表单也能正常提交(浏览器原生表单 POST),JS 加载后再增强为无刷新体验。

## 一句话总结

**Server Actions:'use server' 标记的服务端函数,客户端(表单 action/事件)直接调用、免写 API,底层是自动桥接的 POST;直接操作 DB 后用 revalidatePath 刷新缓存;客户端用 useActionState 管 pending/状态;安全铁律——它是暴露端点,必须在函数内鉴权+输入校验+越权检查,不能只靠前端隐藏;表单用法支持渐进增强。**
