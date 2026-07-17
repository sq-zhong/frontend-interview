# E8 · 包管理与 Monorepo

> 热度:🔥🔥

## 一句话考点

npm/yarn/pnpm 管理依赖;**pnpm** 用硬链接 + 内容寻址,节省磁盘且解决幽灵依赖;**Monorepo** 用一个仓库管理多个包,靠 workspace 共享依赖。

## 原理精讲

### 1. 三大包管理器对比

| | npm | yarn(classic) | pnpm |
|--|-----|------|------|
| 依赖结构 | 扁平化(node_modules) | 扁平化 | 硬链接 + 符号链接 |
| 磁盘占用 | 高(重复) | 高 | **低**(全局存储,硬链接复用) |
| 安装速度 | 较慢 | 快 | **最快** |
| 幽灵依赖 | 有 | 有 | **杜绝** |
| lock 文件 | package-lock.json | yarn.lock | pnpm-lock.yaml |

### 2. 扁平化与幽灵依赖问题

npm/yarn 把依赖**扁平化**提升到 node_modules 顶层(解决嵌套过深和重复)。副作用:
- **幽灵依赖**:你能 import 一个没在 package.json 声明、但被别的包间接装上的模块。一旦那个间接依赖变动,项目就会莫名报错。
- **依赖分身**:同一个包多版本被重复安装。

### 3. pnpm 的解决方案

- 所有包存在**全局内容寻址仓库**(`~/.pnpm-store`),项目里通过**硬链接**引用,不重复占磁盘;
- node_modules 用**符号链接**构建**嵌套但非扁平**的结构:只有 package.json 声明的依赖出现在顶层,间接依赖藏在 `.pnpm` 里 → **杜绝幽灵依赖**;
- 安装快(硬链接近乎瞬时)。

### 4. Monorepo

一个仓库管理多个 package(如设计系统、工具库、多个应用)。

**优点**:代码/依赖共享、统一工具链、原子化提交跨包改动、便于复用。
**工具**:pnpm workspace、Yarn workspace、Turborepo、Nx、Lerna。

**workspace**:声明多个子包,包间可直接引用(本地 link),共享公共依赖,只装一份。

## 代码示例

### pnpm workspace

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

```json
// apps/web/package.json —— 直接引用内部包
{
  "dependencies": {
    "@my/ui": "workspace:*"      // 指向本地 packages/ui,无需发布
  }
}
```

```bash
# 只给某个子包安装依赖
pnpm --filter @my/ui add lodash
# 运行某个子包的脚本
pnpm --filter web dev
```

### Turborepo 加速(缓存任务)

```json
// turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],    // 先构建依赖的包
      "outputs": ["dist/**"]       // 缓存构建产物,未变则跳过
    }
  }
}
```

## 高频追问

**Q:pnpm 相比 npm/yarn 的优势?**
A:① 磁盘节省——全局内容寻址仓库 + 硬链接,同一包只存一份;② 安装快;③ 杜绝幽灵依赖——用符号链接构建非扁平 node_modules,只有声明的依赖能被访问;④ 严格的依赖隔离。

**Q:什么是幽灵依赖?**
A:项目能 import 一个未在 package.json 中声明、但因扁平化被间接安装到 node_modules 顶层的包。风险:该间接依赖升级/移除后项目突然报错。pnpm 通过非扁平结构杜绝。

**Q:npm 为什么要扁平化 node_modules?**
A:早期嵌套安装导致目录层级过深、相同依赖重复安装(体积大、路径超长)。扁平化把依赖尽量提升到顶层复用,减少冗余。副作用是幽灵依赖和依赖分身。

**Q:Monorepo 的优缺点?**
A:优点:代码/依赖共享、统一工具链、跨包改动原子提交、便于复用重构。缺点:仓库体积大、权限粒度粗、构建需要缓存优化(否则慢)、工具链有学习成本。

**Q:Monorepo 用什么工具?**
A:包管理用 pnpm/yarn workspace 做本地 link 和依赖共享;任务编排和缓存用 Turborepo/Nx;版本发布用 Changesets/Lerna。

## 一句话背诵版

**npm/yarn 扁平化 node_modules 带来幽灵依赖;pnpm 用全局内容寻址+硬链接省磁盘、符号链接构建非扁平结构杜绝幽灵依赖、安装最快;Monorepo 一仓多包靠 workspace 共享依赖(workspace:* 本地引用),用 Turborepo/Nx 缓存加速、Changesets 发版。**
