# Parla — 开口即文字。

> **状态: 已存档** — 详见 [ARCHIVE.md](ARCHIVE.md)

macOS AI 语音输入工具。按下快捷键说话，AI 自动去口语化、格式化，文字直接出现在光标位置。

## 为什么存档

语音输入工具品类的结构性问题：技术无护城河（Whisper 开源，Apple 听写越来越强）、功能天花板低、零切换成本、赛道拥挤。详细分析见 [ARCHIVE.md](ARCHIVE.md#六为什么存档)。

## 核心技术

- **桌面端**: Electron 35 + React 18 + Vite 6
- **AI 管线**: Groq Whisper (ASR) → Groq LLaMA-3.3-70b (润色)
- **后端**: Next.js 16 + Supabase (Auth/DB)
- **系统集成**: 全局快捷键、AppleScript 光标插入、托盘图标、悬浮窗

## 项目亮点

- 6 天从 0 到可打包 .dmg 的完整产品
- 6 款竞品深度分析 → 差异化定位
- 双引擎 AI 管线（ASR + LLM）
- Electron 多窗口架构（主窗口 + 毛玻璃悬浮窗）
- 完整增长系统（邀请码 / 兑换码 / 分级推广）
- 4 语言 i18n 支持

## 文档

- [ARCHIVE.md](ARCHIVE.md) — **完整存档**（产品故事、技术细节、决策过程、复用指南）
- [docs/product-design.md](docs/product-design.md) — 产品设计方案（567 行，含竞品分析）
- [docs/PRD.md](docs/PRD.md) — 产品需求文档
- [docs/product-review-2026-03-06.md](docs/product-review-2026-03-06.md) — 产品评审报告

## 本地运行

```bash
# Web 落地页
npm install && npm run dev

# Electron 桌面端
cd desktop && npm install
npm run renderer:build
npm run start
```

需要配置 `.env.local`（Groq API Key + Supabase）。

---

*Built in 6 days. Archived with intent.*
