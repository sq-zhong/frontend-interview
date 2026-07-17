import { defineConfig } from 'vitepress'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

// 板块顺序与标题(目录名 → 展示名)
const boards = [
  { dir: 'html', text: 'HTML' },
  { dir: 'css', text: 'CSS' },
  { dir: 'js', text: 'JavaScript' },
  { dir: 'react', text: 'React' },
  { dir: 'vue', text: 'Vue' },
  { dir: 'nextjs', text: 'Next.js' },
  { dir: 'nodejs', text: 'Node.js / BFF' },
  { dir: 'network', text: '网络与安全' },
  { dir: 'browser', text: '浏览器原理' },
  { dir: 'typescript', text: 'TypeScript' },
  { dir: 'engineering', text: '工程化' },
  { dir: 'algorithm', text: '算法' },
  { dir: 'scenario', text: '场景排错(实战)' },
  { dir: 'widgets', text: '业务手写轮子(实战)' },
  { dir: 'design', text: '项目表达 + 系统设计' },
  { dir: 'ai', text: 'AI 时代专题' },
  { dir: 'misc', text: '综合与手写题' },
]

// 从文件名前缀提取字母+数字用于自然排序(J2 在 J10 之前)
function sortKey(file) {
  const m = file.match(/^([A-Za-z]+)(\d+)/)
  if (!m) return [file, 0]
  return [m[1], parseInt(m[2], 10)]
}

// 读取文件第一个 # 标题作为侧边栏文字
function titleOf(absFile, fallback) {
  try {
    const content = fs.readFileSync(absFile, 'utf-8')
    const m = content.match(/^#\s+(.+)$/m)
    if (m) return m[1].trim()
  } catch {}
  return fallback
}

// 扫描一个目录,生成侧边栏 items
function itemsOf(dir) {
  const abs = path.join(root, dir)
  if (!fs.existsSync(abs)) return []
  const files = fs
    .readdirSync(abs)
    .filter((f) => f.endsWith('.md'))
    .sort((a, b) => {
      const [la, na] = sortKey(a)
      const [lb, nb] = sortKey(b)
      if (la !== lb) return la.localeCompare(lb)
      return na - nb
    })
  return files.map((f) => ({
    text: titleOf(path.join(abs, f), f.replace(/\.md$/, '')),
    link: `/${dir}/${encodeURIComponent(f.replace(/\.md$/, ''))}`,
  }))
}

// 生成完整侧边栏(所有板块,可折叠)
const sidebar = boards
  .map((b) => ({ text: b.text, collapsed: true, items: itemsOf(b.dir) }))
  .filter((g) => g.items.length > 0)

// 顶部导航:挑几个核心板块 + 实战
const nav = [
  { text: '首页', link: '/' },
  {
    text: '八股地基',
    items: [
      { text: 'JavaScript', link: sidebar.find((s) => s.text === 'JavaScript').items[0].link },
      { text: 'CSS', link: sidebar.find((s) => s.text === 'CSS').items[0].link },
      { text: 'HTML', link: sidebar.find((s) => s.text === 'HTML').items[0].link },
      { text: '网络与安全', link: sidebar.find((s) => s.text === '网络与安全').items[0].link },
      { text: '浏览器原理', link: sidebar.find((s) => s.text === '浏览器原理').items[0].link },
      { text: 'TypeScript', link: sidebar.find((s) => s.text === 'TypeScript').items[0].link },
      { text: '工程化', link: sidebar.find((s) => s.text === '工程化').items[0].link },
      { text: '算法', link: sidebar.find((s) => s.text === '算法').items[0].link },
    ],
  },
  {
    text: '框架 / 全栈',
    items: [
      { text: 'React', link: sidebar.find((s) => s.text === 'React').items[0].link },
      { text: 'Vue', link: sidebar.find((s) => s.text === 'Vue').items[0].link },
      { text: 'Next.js', link: sidebar.find((s) => s.text === 'Next.js').items[0].link },
      { text: 'Node.js / BFF', link: sidebar.find((s) => s.text === 'Node.js / BFF').items[0].link },
    ],
  },
  {
    text: '实战',
    items: [
      { text: '场景排错', link: sidebar.find((s) => s.text === '场景排错(实战)').items[0].link },
      { text: '业务手写轮子', link: sidebar.find((s) => s.text === '业务手写轮子(实战)').items[0].link },
      { text: '项目表达 + 系统设计', link: sidebar.find((s) => s.text === '项目表达 + 系统设计').items[0].link },
      { text: 'AI 时代专题', link: sidebar.find((s) => s.text === 'AI 时代专题').items[0].link },
    ],
  },
]

export default defineConfig({
  title: '前端面试精讲',
  description: '面向面试 / 复习的前端知识精讲 · 17 板块 130 篇',
  lang: 'zh-CN',
  base: '/frontend-interview/',
  cleanUrls: true,
  lastUpdated: true,
  ignoreDeadLinks: true,
  markdown: {
    // 单个换行也渲染为 <br>,与 GitHub GFM 行为一致
    // 修复"高频追问"里 Q 与 A 挤在同一行的问题
    breaks: true,
  },
  head: [
    ['meta', { name: 'theme-color', content: '#3c8772' }],
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/frontend-interview/favicon.svg' }],
  ],
  themeConfig: {
    logo: '/favicon.svg',
    outline: { label: '本页目录', level: [2, 3] },
    docFooter: { prev: '上一篇', next: '下一篇' },
    nav,
    sidebar,
    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜索', buttonAriaLabel: '搜索' },
          modal: {
            noResultsText: '没有找到结果',
            resetButtonTitle: '清除',
            footer: { selectText: '选择', navigateText: '切换' },
          },
        },
      },
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/sq-zhong/frontend-interview' }],
    lastUpdatedText: '最后更新',
    returnToTopLabel: '返回顶部',
    darkModeSwitchLabel: '主题',
    sidebarMenuLabel: '菜单',
  },
})
