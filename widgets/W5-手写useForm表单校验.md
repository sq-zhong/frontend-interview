# W5 · 手写 useForm 表单管理与校验

> 业务轮子专项 · 需求 → 设计要点 → 核心实现 → 使用 → 进阶考点

## 需求场景

表单是最常见的业务:管理多字段值、校验规则、错误提示、提交。手写一个迷你 useForm(类 react-hook-form / antd Form),体现对受控表单和校验流程的掌控。

## 设计要点

1. **值管理**:统一存所有字段值,提供 `getFieldProps` 绑定;
2. **校验**:支持 required、pattern、自定义 validator、异步校验;
3. **错误管理**:每个字段的错误信息,失焦/提交时触发;
4. **提交**:全量校验通过才回调 onSubmit;
5. **触发时机**:onChange / onBlur / onSubmit。

## 核心实现

```jsx
import { useState, useCallback, useRef } from 'react';

function useForm(options = {}) {
  const { initialValues = {}, rules = {} } = options;
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // 校验单个字段
  const validateField = useCallback(async (name, value) => {
    const fieldRules = rules[name];
    if (!fieldRules) return '';
    for (const rule of [].concat(fieldRules)) {
      if (rule.required && (value == null || value === '')) {
        return rule.message || `${name} 必填`;
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        return rule.message || `${name} 格式错误`;
      }
      if (rule.validator) {
        const err = await rule.validator(value, values);   // 支持异步
        if (err) return err;
      }
    }
    return '';
  }, [rules, values]);

  const setFieldValue = useCallback(async (name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    if (touched[name]) {   // 已触碰过的字段实时校验
      const err = await validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: err }));
    }
  }, [touched, validateField]);

  // 绑定到 input 的 props
  const getFieldProps = useCallback((name) => ({
    value: values[name] ?? '',
    onChange: (e) => setFieldValue(name, e.target.value),
    onBlur: async () => {
      setTouched(prev => ({ ...prev, [name]: true }));
      const err = await validateField(name, values[name]);
      setErrors(prev => ({ ...prev, [name]: err }));
    },
  }), [values, setFieldValue, validateField]);

  // 提交:全量校验
  const handleSubmit = useCallback((onSubmit) => async (e) => {
    e?.preventDefault();
    const newErrors = {};
    for (const name of Object.keys(rules)) {
      newErrors[name] = await validateField(name, values[name]);
    }
    setErrors(newErrors);
    setTouched(Object.keys(rules).reduce((a, k) => ((a[k] = true), a), {}));
    const hasError = Object.values(newErrors).some(Boolean);
    if (!hasError) onSubmit(values);
  }, [rules, values, validateField]);

  return { values, errors, touched, getFieldProps, setFieldValue, handleSubmit };
}
```

## 使用示例

```jsx
function LoginForm() {
  const { errors, getFieldProps, handleSubmit } = useForm({
    initialValues: { email: '', password: '' },
    rules: {
      email: [
        { required: true, message: '请输入邮箱' },
        { pattern: /^[^@]+@[^@]+$/, message: '邮箱格式错误' },
      ],
      password: [
        { required: true, message: '请输入密码' },
        { validator: (v) => v.length < 6 ? '至少6位' : '' },
      ],
    },
  });

  return (
    <form onSubmit={handleSubmit(vals => console.log('提交', vals))}>
      <input {...getFieldProps('email')} />
      {errors.email && <span className="error">{errors.email}</span>}

      <input type="password" {...getFieldProps('password')} />
      {errors.password && <span className="error">{errors.password}</span>}

      <button type="submit">登录</button>
    </form>
  );
}
```

## 面试考点

**Q:受控组件和非受控组件区别?表单用哪种?**
A:受控组件的值由 React state 驱动(value + onChange),每次输入都走 state;非受控组件用 ref 直接读 DOM 值(defaultValue)。受控便于实时校验和联动;大表单为性能可用非受控(react-hook-form 就靠非受控 + ref 减少渲染)。

**Q:校验触发时机怎么设计?**
A:通常 onBlur 首次校验(避免用户刚输入就报错)、之后 onChange 实时校验(已 touched 的字段)、onSubmit 全量校验。用 touched 标记控制"是否已该显示错误"。

**Q:如何支持异步校验(如用户名查重)?**
A:validator 返回 Promise,校验流程用 await;注意异步校验要防竞态(快速输入时丢弃过期结果)和防抖(避免频繁请求)。

**Q:react-hook-form 为什么性能好?**
A:它主要用非受控 + ref 收集值,输入时不触发整个表单重渲染,只在需要时(校验、提交)读取,大表单下渲染开销远小于全受控方案。

## 一句话总结

**useForm 统一管理 values/errors/touched,getFieldProps 绑定 input(value+onChange+onBlur);校验支持 required/pattern/自定义/异步,触发时机 onBlur 首校验+onChange 实时+onSubmit 全量,用 touched 控制错误显示;受控便于联动、非受控(react-hook-form)性能更好。**
