# Parla — 项目存档

> **状态**: 已存档 (2026-03-10)
> **品牌名**: Parla（意大利语"说"）
> **定位**: macOS AI 语音输入工具
> **Slogan**: 开口即文字。/ Speak. It's written.

---

## 一、为什么做这个产品

### 问题观察

知识工作者每天大量输入文字——邮件、Slack 消息、文档、代码注释。打字速度通常 40-80 WPM，但说话速度是 150+ WPM。语音输入理论上能提升 2-4 倍效率，但现有方案（macOS 自带听写、Google 语音输入）的问题是：

- **口语化严重** — "嗯那个就是我觉得那个方案不太好" → 用户还得手动删改
- **没有格式化** — 不会断句、不会分段、不会加标点
- **不区分场景** — 写邮件和发消息用同一种语气

我看到的机会：**ASR（语音识别）+ LLM（大语言模型）双引擎管线**。用 Whisper 做高精度转录，再用 LLM 做智能润色——去口语化、自动格式化、根据场景调整语气。说话即写作。

### 市场验证

调研发现已有 6 款同类产品在做这个方向：

| 产品 | 月费 | 核心特点 |
|------|------|---------|
| Typeoff | $9.90 | 8K 字/周免费，开发者定位，轻编辑 |
| Spokenly | $9.99 | 本地模式无限免费，Agent Mode 语音控制 Mac |
| Typeless | $30 | 跨平台最全（macOS/Win/iOS），中国用户多 |
| Wispr Flow | $12 | Command Mode 语音编辑，企业合规 HIPAA/SOC2 |
| VoiceInk | $25-49 一次性 | 开源 GPL v3，按应用自动切换配置 |
| Superwhisper | $8.49 | 最强离线，可定制 AI 模式和 Prompt |

说明市场存在真实需求。但也暗示了后来导致存档的隐忧——赛道拥挤，护城河薄弱。

> 完整的 Typeless 技术原理分析、竞品矩阵、成本模型和自研可行性评估见 [docs/typeless-research.md](docs/typeless-research.md)。

---

## 二、从 0 到 1 的过程

### 时间线

```
2026-03-05  Day 1    项目启动，Next.js 脚手架 + 基础 Web 版
2026-03-05  Day 1    完成 Web 版核心：录音 → ASR → LLM 润色 → 剪贴板
2026-03-06  Day 2    落地页设计 + 产品评审 + 6 款竞品深度分析
2026-03-06  Day 2    意识到 Web 版结构性缺陷：无法做全局快捷键、无法跨应用插入文字
2026-03-07  Day 3    决定转向 Electron 桌面客户端
2026-03-07  Day 3    Electron 主进程 + React 渲染层 + 悬浮窗 + 托盘图标
2026-03-08  Day 4    v2 架构重构：后端 API + 邮箱登录 + 用量追踪 + 邀请码
2026-03-08  Day 4    品牌从 Murmur 改名 Parla
2026-03-09  Day 5    落地页重设计 + 品牌图标轮播 + 无限滚动效果
2026-03-10  Day 6    商业化复盘 → 决定存档
```

### 关键版本

**v0.1 — Web 版 MVP（Day 1-2）**
- Next.js 16 + TypeScript + Tailwind CSS v4
- 双引擎管线：Groq Whisper（ASR）+ OpenAI GPT-4o mini（润色）
- 5 种场景模式：通用 / 邮件 / 聊天 / 文档 / 代码
- 波形可视化 + 脉冲动画 + 历史记录
- Mock 模式（无需 API Key 即可体验）
- 落地页：Hero + 功能卡片 + 定价 + FAQ

**v0.2 — Electron 桌面端（Day 3-5）**

做了一个重要判断：**语音输入必须是原生桌面应用**。

Web 版有两个结构性缺陷无法解决：
1. 浏览器里没法注册全局快捷键——用户必须切换到浏览器 tab 才能录音
2. 浏览器里没法在其他应用的光标位置插入文字——只能复制到剪贴板

于是用 Electron 重写：

- **主进程**（807 行 main.js）：托盘图标、全局快捷键 ⌘⇧M、IPC 通信、音频处理、AppleScript 光标插入、electron-store 数据持久化
- **渲染层**（React 18 + Vite）：Onboarding 6 步引导、Home 主界面、Settings 设置、History 历史、Sidebar 导航
- **悬浮窗**（float.html）：毛玻璃效果、录音状态指示、音效反馈
- **后端 API**（Next.js on Vercel）：邮箱 OTP 登录、Supabase 用户系统、用量追踪、邀请码 / 兑换码

---

## 三、产品设计决策

### 决策 1：BYOK（Bring Your Own Key）→ 后端 API

最初用 BYOK 模式——用户自带 Groq API Key。优势是零后端成本，但有两个问题：
- 普通用户不知道什么是 API Key
- 无法做用量限制和付费转化

v0.2 改为后端 API 模式：用户注册邮箱 → 后端统一调用 Groq → 按用量计费。

### 决策 2：双引擎管线

```
语音 → [Groq Whisper large-v3-turbo] → 原始文本 → [Groq LLaMA-3.3-70b] → 润色文本
```

为什么用两个模型而不是一个：
- Whisper 专注 ASR，准确率高、速度快（216x 实时速度）
- LLM 专注语言理解，能做口语化去除、自我更正检测、格式化
- 分离后可以独立优化、独立替换

为什么选 Groq 而不是 OpenAI：
- Groq 的 Whisper 推理速度极快（$0.04/小时）
- LLaMA-3.3-70b 质量接近 GPT-4o，但延迟更低
- 一个 API 搞定两个模型，简化架构

### 决策 3：场景化润色

不做"一刀切"的格式化。根据用户选择的场景，LLM 使用不同的 Prompt：

| 场景 | 润色策略 |
|------|---------|
| 通用 | 清理口语、加标点 |
| 邮件 | 正式语气、自动加称呼和落款 |
| 聊天 | 简洁、口语化保留、短句 |
| 文档 | 分段、结构化、书面语 |
| 代码 | 技术用语、注释风格 |

### 决策 4：AppleScript 光标插入

最关键的体验细节——说完话，文字自动出现在光标位置。

实现方式：
1. 保存用户当前剪贴板内容
2. 将润色后的文字写入剪贴板
3. 通过 AppleScript 执行 ⌘V 粘贴
4. 500ms 后恢复原始剪贴板内容

这需要 macOS 辅助功能权限，但效果是跨所有应用通用——VSCode、Slack、微信、浏览器都能用。

### 决策 5：悬浮窗状态指示

录音时弹出一个小悬浮窗（always-on-top，毛玻璃），显示状态：
- 🎤 正在听... + 波形动画 + 880Hz 提示音
- ⏱️ 正在处理... + 旋转图标
- ✅ 已插入到光标位置 + 文字预览
- ❌ 错误信息

用户不需要切换到应用窗口就能看到当前状态。

---

## 四、技术亮点（Portfolio 重点）

### 1. Electron 多窗口架构

```
┌─────────────────────────────────────────────┐
│                Electron App                  │
│                                             │
│  ┌─────────────┐   ┌─────────────────────┐  │
│  │ Main Process │   │ Renderer (React/Vite)│  │
│  │             │   │                     │  │
│  │ - Tray      │   │ - Onboarding (6步)  │  │
│  │ - Shortcuts │   │ - Home (录音/统计)   │  │
│  │ - IPC bridge│   │ - Settings          │  │
│  │ - API calls │   │ - History           │  │
│  │ - Clipboard │   │ - Sidebar           │  │
│  │ - Paste     │   └─────────────────────┘  │
│  │ - Store     │                             │
│  └──────┬──────┘   ┌─────────────────────┐  │
│         │          │ Float Window (HTML)  │  │
│         │          │ - Glass morphism     │  │
│         │          │ - Status indicator   │  │
│         │          │ - Audio beep (Web    │  │
│         │          │   Audio API 正弦波)  │  │
│         │          └─────────────────────┘  │
└─────────┼────────────────────────────────────┘
          │
          ▼
┌──────────────────┐    ┌──────────────────┐
│ Groq API         │    │ Backend (Vercel) │
│ - Whisper (ASR)  │    │ - Auth (OTP)     │
│ - LLaMA (LLM)   │    │ - Usage tracking │
└──────────────────┘    │ - Invite codes   │
                        └──────────────────┘
```

技术要点：
- 主进程与渲染进程通过 `contextBridge` + IPC 安全通信
- 悬浮窗独立 BrowserWindow，`alwaysOnTop` + `transparent` + `skipTaskbar`
- 所有 API 调用使用 `exec(curl)` 而非 Node.js fetch，绕过 Electron 的 TLS 限制
- 全异步架构，主进程不阻塞

### 2. 音频处理管线

```
用户按 ⌘⇧M
    │
    ▼
MediaRecorder 开始录制（WebM Opus 格式）
    │  ← 实时音量数据 → 7 个频率柱状图
    │  ← 最长 5 分钟自动停止
    │
用户再按 ⌘⇧M
    │
    ▼
音频 → base64 编码 → IPC 发送到主进程
    │
    ▼
主进程 curl → 后端 /api/process-audio
    │
    ├─→ Groq Whisper API（ASR）→ 原始转录
    │
    └─→ Groq LLaMA API（LLM 润色）→ 清洁文本
    │
    ▼
返回润色文本 → AppleScript ⌘V 插入光标位置
    │
    ▼
更新本地统计 + 异步同步到后端
```

### 3. 6 步 Onboarding 流程

精心设计的首次引导（参考 Typeoff 10 步，精简为 6 步）：

1. **欢迎** — 品牌展示 + 产品介绍
2. **语言选择** — 支持 auto/zh/en/ja/ko/fr/de/es
3. **权限检查** — 麦克风 + 辅助功能，带一键跳转系统设置
4. **试一试** — 实际录音 → 转写 → 展示结果（首次 "Aha moment"）
5. **登录** — 邮箱 OTP（无密码）
6. **完成** — 撒花庆祝 + 开始使用

设计原则：**每一步都有目的，没有纯展示步骤。**

### 4. 用户增长系统

完整的增长闭环设计（代码已实现，未上线）：

- **邀请码**：推荐人 +5,000 字/周额度，被推荐人首周翻倍
- **兑换码**：`MUR-PRO-XXXXXXXXXXXX` 格式，可兑换 1/3/6/12 个月 Pro
- **社区推广**：V2EX/即刻/少数派分级赠送策略
- **免费额度**：10,000 字/周（超过所有竞品）

### 5. 数据库设计

Supabase 4 表结构：

```sql
profiles     — 用户档案（plan, 到期时间, 额度）
usage        — 周用量追踪（字数, 周起始日）
invite_codes — 邀请码（创建者, 使用者, 奖励字数）
redeem_codes — 兑换码（类型, 使用者, 兑换时间）
```

RLS（Row Level Security）策略确保用户只能访问自己的数据。

### 6. 落地页设计

Next.js 16 + Tailwind CSS v4 + next-intl 4 语言支持：

- 渐变文字 Hero + 无限滚动品牌轮播
- 实时转写动画 Demo（typing → processing → result）
- 速度对比可视化
- 6 个功能卡片 + 3 步使用流程
- 定价对比表
- 6 条 FAQ
- 完整 i18n（en/zh/ja/ko）

---

## 五、定价与成本模型

### 单用户成本

| 组件 | 每日成本（30分钟使用） | 每月成本 |
|------|---------------------|---------|
| Groq Whisper | $0.02 | $0.60 |
| Groq LLaMA | $0.01 | $0.30 |
| **合计** | **$0.03** | **$0.90** |

### 定价设计

| 套餐 | 价格 | 毛利率 |
|------|------|-------|
| Free | $0（10,000 字/周） | 亏损（获客成本） |
| Pro | ¥59/月 或 ¥499/年（约 $8/月） | ~88% |

定价逻辑：比所有竞品便宜，用价格优势 + 最大免费额度抢占中文市场。

---

## 六、为什么存档

### 结论

**单纯的语音输入桌面工具，作为独立商业产品，长期不成立。**

### 原因分析

1. **技术无护城河** — Whisper 开源，Apple 自带听写越来越强。核心技术在被平台层吞噬。
2. **功能天花板低** — 语音转文字就这么多事：识别、标点、格式化、多语言。做完就做完了，没有持续迭代空间支撑订阅制。
3. **零切换成本** — 没有数据沉淀，没有网络效应，没有 lock-in。用户随时可以换。
4. **使用场景受限** — 开放办公室、会议室、公共场所都不能用。能用的场景比想象中窄。
5. **定价压力** — 用户心智里"打字"是免费的。为"说话代替打字"持续付费的人很少。
6. **赛道拥挤** — 6 款同类产品，都在做同样的事，差异化空间极小。

### 市场反思

这个品类的竞品（Superwhisper、Wispr 等）目前还活着，但没有哪个纯语音输入工具靠自身盈利跑出来了。它们要么靠融资，要么在赌 AI agent 的未来入口。

### 正确的做法

语音输入的价值不在于替代打字，而在于成为更大产品的一个能力模块。比如：
- 语音驱动的自动化工作流
- 垂直场景深耕（医疗、法律、田野调研）
- 嵌入到已有产品中作为输入方式

Parla 的代码和经验作为技术储备保留，未来如果有合适的产品需要语音输入能力，随时可以复用。

---

## 七、学到了什么

### 产品认知

1. **不要爱上解决方案，要爱上问题** — "语音输入"是解决方案，"高效文字输入"是问题。问题有很多种解法，不该锁死在一种上。
2. **"更方便一点"撑不起付费** — 语音输入在大多数场景里只是"比打字方便一点"。用户为"方便一点"付费的意愿极低。要找的是"不可替代"或"10x 提升"的场景。
3. **平台层会吞噬工具层** — Apple Intelligence、Google Gemini 正在把语音输入变成系统级能力。做平台层会免费提供的功能，是在和时间赛跑。
4. **低频高价值 > 高频低价值** — 用户不会为"每天省 5 分钟打字"付 $10/月，但会为"看清自己的职业定位"付 $30 一次。

### 技术收获

1. **Electron 桌面应用开发** — 多窗口架构、系统集成（托盘/快捷键/辅助功能）、IPC 通信、electron-store
2. **ASR + LLM 双引擎管线** — Groq Whisper 集成、LLM Prompt 工程（场景化润色）、音频处理
3. **macOS 系统集成** — AppleScript 光标插入、剪贴板管理、权限申请流程
4. **全栈产品开发** — 前端（React/Vite）+ 后端（Next.js API）+ 数据库（Supabase）+ 认证 + 支付设计
5. **产品设计流程** — 竞品分析 → 差异化定位 → Onboarding 设计 → 增长机制 → 定价策略

---

## 八、技术栈清单

| 层 | 技术 | 用途 |
|----|------|------|
| 桌面框架 | Electron 35 | 主进程、系统集成 |
| 渲染层 | React 18 + Vite 6 | UI 组件 |
| 落地页 | Next.js 16 + React 19 | SSR 落地页 + API 路由 |
| 样式 | Tailwind CSS v4 | 全局样式 |
| 语言 | TypeScript / JavaScript | 类型安全 |
| ASR | Groq Whisper large-v3-turbo | 语音识别 |
| LLM | Groq LLaMA-3.3-70b-versatile | 文本润色 |
| 数据库 | Supabase (PostgreSQL) | 用户/用量/邀请码 |
| 认证 | Supabase Auth (OTP) | 邮箱验证码登录 |
| 数据持久化 | electron-store | 客户端加密存储 |
| 国际化 | next-intl | 4 语言支持 (en/zh/ja/ko) |
| 图标 | Lucide React | UI 图标 |
| 动画 | Framer Motion | 落地页动效 |
| 打包 | electron-builder | .dmg 安装包 |

---

## 九、文件结构

```
murmur/
├── desktop/                          # Electron 桌面客户端
│   ├── main.js                       # 主进程 (807 行) — 核心逻辑
│   ├── preload.js                    # IPC 桥接 (82 行)
│   ├── float.html                    # 悬浮窗 (184 行)
│   ├── renderer/                     # React 渲染层
│   │   └── src/
│   │       ├── App.jsx               # 根组件 + 状态管理
│   │       └── components/
│   │           ├── Onboarding.jsx    # 6步引导 (460 行)
│   │           ├── Home.jsx          # 主界面 (248 行)
│   │           ├── Settings.jsx      # 设置面板 (233 行)
│   │           ├── History.jsx       # 历史记录 (132 行)
│   │           ├── Sidebar.jsx       # 侧边栏 (85 行)
│   │           └── Titlebar.jsx      # 自定义标题栏
│   ├── icon.icns                     # macOS 图标
│   └── package.json                  # Electron 配置
│
├── src/                              # Next.js Web 应用（落地页 + 后端 API）
│   ├── app/
│   │   ├── [locale]/
│   │   │   └── page.tsx              # 落地页 (497 行)
│   │   └── api/
│   │       ├── process-audio/        # 核心管线：ASR + LLM (220 行)
│   │       ├── auth/                 # 邮箱 OTP 登录
│   │       ├── user/                 # 用户档案 + 用量
│   │       ├── invite/               # 邀请码系统
│   │       └── redeem/               # 兑换码系统
│   ├── components/                   # Web 组件
│   ├── lib/                          # 工具库（类型、Prompt、Supabase）
│   ├── i18n/                         # 国际化配置
│   └── messages/                     # 4 语言翻译文件
│
├── docs/                             # 产品文档
│   ├── product-design.md             # 完整产品设计方案 (567 行)
│   ├── PRD.md                        # 产品需求文档
│   ├── product-review-2026-03-06.md  # 竞品分析 + 产品评审
│   ├── typeless-research.md          # Typeless 深度调研 (331 行，含技术原理 + 竞品矩阵 + 自研方案)
│   └── pre-delivery-gate-2026-03-06.md
│
├── supabase/
│   └── migrations/
│       └── 001_initial.sql           # 数据库 Schema (4 表)
│
└── ARCHIVE.md                        # 本文档
```

---

## 十、Git 提交历史

```
3bd3531  Initial commit from Create Next App
6aeeecf  Parla — AI voice dictation app (web + desktop)
3b4f5b9  Redesign desktop client: full-size window, sidebar nav, light theme
604b76b  Landing page: warm color scheme + yellow CTA
c9546fd  Parla v2: 落地页重设计 + 桌面端重构 + 后端 API       ← 最大里程碑
de3c4ac  落地页: 删除在线体验入口，hero 区加入适用 app 场景展示
c4aacc4  hero 区 app 展示改为无限滚动轮播条 (marquee)
d3f5105  Works everywhere 改为真实品牌图标轮播条               ← 最后一次提交
```

**总开发时间**: 约 6 天（2026-03-05 ~ 2026-03-10）

---

## 十一、如何复用

如果未来某个产品需要语音输入能力，以下模块可以直接复用：

| 模块 | 文件 | 说明 |
|------|------|------|
| ASR + LLM 管线 | `src/app/api/process-audio/route.ts` | 220 行，完整的 Groq 双引擎调用 |
| 润色 Prompt | `src/lib/prompts.ts` | 5 种场景的 System Prompt |
| 音频录制 | `desktop/renderer/src/App.jsx` | MediaRecorder + 音量可视化 |
| 光标插入 | `desktop/main.js` (handlePaste) | AppleScript ⌘V + 剪贴板恢复 |
| 悬浮窗 | `desktop/float.html` | 毛玻璃状态指示 + 音效 |
| 邮箱 OTP 登录 | `src/app/api/auth/` | Supabase Auth 无密码登录 |
| 用量追踪 | `src/app/api/user/usage/` | 按周重置的字数计量 |
| 邀请码系统 | `src/app/api/invite/` | 双向奖励机制 |
| Electron 托盘/快捷键 | `desktop/main.js` | 系统级集成模板 |
| Onboarding 流程 | `desktop/renderer/src/components/Onboarding.jsx` | 6 步引导框架 |

---

## 十二、讲故事的角度

### 给面试官 / Portfolio 展示

> "我在 6 天内独立完成了一个 macOS AI 语音输入工具的 0 到 1。从市场调研（深度分析 6 款竞品）到产品设计，从 Web 原型到 Electron 桌面端重构，从双引擎 AI 管线到完整的用户增长系统。最终因为对品类商业化的判断——技术无护城河、平台层吞噬工具层——主动选择存档。这个决策本身也是产品判断力的体现。"

### 展示的核心能力

1. **全栈工程能力** — Electron + React + Next.js + Supabase + AI API，前后端 + 桌面端独立完成
2. **产品思维** — 不是接到需求就写代码。先做竞品分析、找差异化、设计 Onboarding 和增长机制
3. **技术判断力** — Web → Electron 的架构转型决策（Web 无法做全局快捷键和跨应用插入）
4. **商业判断力** — 不是做完就上线。分析了商业化路径后主动存档，避免无效投入
5. **执行速度** — 6 天从 0 到可打包 .dmg 的完整产品

---

*存档于 2026-03-10。代码完整保留，随时可复用。*
