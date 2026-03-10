# Typeless 产品调研报告

> 调研日期: 2026-03-06

---

## 一、Typeless 产品概览

**定位**: AI 智能语音听写工具，将自然语音转换为结构化、专业的文本
**创始团队**: Stanford 校友、连续创业者
**荣誉**: 2026 App of the Year
**平台**: macOS / Windows / iOS / Android / Web

### 定价

| 方案 | 价格 | 额度 |
|------|------|------|
| Free | $0 | 4,000 词/周 |
| Pro (年付) | **$12/月** ($144/年) | 无限 |
| Pro (月付) | **$30/月** | 无限 |

新用户有 30 天 Pro 试用期。

### 核心能力

1. **语气词自动清除** — 移除"嗯、啊、那个"等
2. **重复表达消除** — 口吃/卡顿自动去重
3. **自我纠正识别** — 识别"不对，我是说..."这类纠正
4. **结构化输出** — 口述列表、步骤自动格式化
5. **上下文感知** — 根据当前应用（邮件/Slack/文档）自动调整语气和格式
6. **轻声识别 (Whisper mode)** — 小声说话也能准确识别
7. **100+ 语言** — 支持多语言混合输入

---

## 二、技术原理分析

### 2.1 核心架构：ASR + LLM 两阶段管线

Typeless（及同类产品）的技术架构可以分解为：

```
┌──────────────┐    原始转写     ┌──────────────┐    结构化文本
│  ASR 引擎     │ ─────────────→ │  LLM 后处理   │ ─────────────→  输出
│ (语音→原始文字) │               │ (清洗+格式化)  │
└──────────────┘                └──────────────┘
```

**第一阶段 — ASR（自动语音识别）**
- 大概率使用 **OpenAI Whisper** 或其变体
- Whisper 架构：Encoder-Decoder Transformer
  - 音频 → 16kHz 重采样 → 80 通道 Log-Mel 频谱图 → 两层卷积 → Transformer Encoder → Decoder 输出 token
  - 支持 98 种语言，68 万小时多语言训练数据
- 也可能使用 Deepgram Nova-3 等商业 ASR（更低延迟）

**第二阶段 — LLM 后处理**
- 使用大语言模型对 ASR 原始输出进行"润色"
- 具体处理：
  - 移除语气词（um, uh, 嗯, 啊）
  - 消除重复表达
  - 识别自我纠正并保留正确版本
  - 添加标点符号和段落
  - 根据上下文调整语气（邮件正式、短信口语）
  - 将口述的列表/步骤格式化为结构化文本
- 可能使用 GPT-4o mini 或微调的 Llama 模型

### 2.2 竞品 Wispr Flow 的已知架构（可参考）

Wispr Flow 是 Typeless 的直接竞品，技术架构已公开：

| 组件 | 技术选型 |
|------|----------|
| ASR | Whisper（或自研） |
| LLM | **微调 Meta Llama** |
| 推理优化 | Baseten TensorRT-LLM |
| 编排 | Baseten Chains (多步推理管线) |
| 基础设施 | AWS，自动扩缩容 |
| 端到端延迟 | **< 700ms (p99)** |
| Token 生成 | **100+ tokens < 250ms** |

**关键洞察**: Wispr Flow 选择微调开源 Llama 而非调用 GPT API，目的是：
1. 更低延迟（自建推理服务）
2. 更低成本（不按 token 计费）
3. 完全控制模型行为
4. 数据隐私（不经过第三方）

### 2.3 Typeless 的模型推测

Typeless 未公开具体模型，但基于以下线索可以推断：

1. **少数派评测**提到支持"Whisper 轻声输入" → 确认使用 Whisper 系列
2. **云端处理**（非纯本地）→ 使用云端 ASR API + 云端 LLM
3. **"Zero data retention"** 隐私声明 → 可能用 OpenAI API 的零保留模式
4. **100+ 语言支持** → Whisper large-v3 或 GPT-4o Transcribe
5. **上下文感知格式化** → 需要强大的 LLM，可能是 GPT-4o mini 或类似

**最可能的技术栈**:
- ASR: OpenAI Whisper API / GPT-4o Transcribe
- LLM: GPT-4o mini（成本低、速度快、效果好）
- 或自己微调的模型部署在云端

---

## 三、竞品分析

### 3.1 海外竞品

| 产品 | 定价 | 技术特点 | 优劣 |
|------|------|----------|------|
| **Wispr Flow** | $12/月 | 微调 Llama + 自建推理，<700ms 延迟 | 融资 $81M，技术最强，但贵 |
| **Superwhisper** | $249 终身 | 纯本地 Whisper，隐私极好 | 无 LLM 后处理，格式化弱 |
| **VoiceInk** | $39 终身 | 开源，whisper.cpp 本地，智能上下文 | Mac 专属，后处理能力有限 |
| **Voibe** | $99 终身 | 本地 Whisper，隐私优先 | 功能相对简单 |
| **Aqua Voice** | 订阅制 | 将语音转为"润色散文" | 侧重写作场景 |
| **Willow Voice** | $15/月 | 专注邮件/Slack 回复场景 | 场景较窄 |
| **Monologue** | $10/月 | AI 听写 | 生态较小 |

### 3.2 国内竞品

| 产品 | 定价 | 技术特点 | 优劣 |
|------|------|----------|------|
| **豆包输入法** | **免费** | 字节 Seed-ASR 2.0，15 种方言，离线支持 | 免费且强大，但仅限输入法形态 |
| **讯飞语音输入** | 免费/付费 | 传统 ASR 强者 | 识别率已被 AI 新玩家超越 |
| **搜狗/百度输入法** | 免费 | 大厂语音输入 | 缺乏 AI 后处理能力 |
| **Spokenly** | — | AI 语音输入 | 国内新秀 |

### 3.3 开源方案

| 项目 | 技术栈 | 适合场景 |
|------|--------|----------|
| **OpenWhispr** | Whisper + 多 LLM 提供商（OpenAI/Claude/Gemini/本地） | 最完整的开源替代方案 |
| **Whispering** | 本地 Whisper + 可选云端 | 隐私优先 |
| **WhisperWriter** | Whisper + LLM 后处理 | 已有 LLM cleanup 功能 |
| **open-wispr** | 纯本地 Whisper，MIT 协议 | 零成本，零网络请求 |

---

## 四、自研可行性分析

### 4.1 结论：完全可行，且成本极低

Typeless 的核心并非不可逾越的技术壁垒，而是 **ASR + LLM 的工程整合 + 产品体验打磨**。

### 4.2 推荐技术方案

#### 方案 A：云端方案（最快上线、效果最好）

```
用户语音
   ↓
Groq Whisper API (ASR，超快)
   ↓ 原始转写文本
LLM 后处理 (GPT-4o mini / Claude Haiku)
   ↓
结构化、格式化的文本
   ↓
粘贴到用户当前应用
```

**成本估算**:

| 组件 | 价格 | 说明 |
|------|------|------|
| Groq Whisper large-v3 | **$0.111/小时** | 164x 实时速度 |
| Groq Whisper large-v3-turbo | **$0.04/小时** | 216x 实时速度，性价比最高 |
| Groq Distil-Whisper | **$0.02/小时** | 240x 实时速度，最便宜 |
| OpenAI Whisper API | $0.36/小时 | 稳定但较贵 |
| OpenAI GPT-4o mini (后处理) | ~$0.15/百万输入 token | 极便宜 |
| Deepgram Nova-3 | $0.26/小时 (batch) | 准确率最高 |

**假设用户每天语音输入 30 分钟**:
- ASR: Groq Turbo = $0.02/天 = **$0.60/月**
- LLM 后处理: ~$0.01/天 = **$0.30/月**
- **每用户总成本: ~$0.90/月**

对比 Typeless 收费 $12/月，**毛利率可达 92%**。

#### 方案 B：混合方案（本地 ASR + 云端 LLM）

```
用户语音
   ↓
本地 whisper.cpp / mlx-whisper (ASR, 零成本)
   ↓ 原始转写文本
云端 LLM (GPT-4o mini / Claude Haiku)
   ↓
结构化文本
```

- ASR 成本: **$0**（本地运行）
- LLM 后处理: ~$0.30/月
- **每用户总成本: ~$0.30/月**
- 需要 Apple Silicon Mac（M1+）
- mlx-whisper 比 whisper.cpp 快 30-100%

#### 方案 C：纯本地方案（零成本但效果稍差）

```
用户语音
   ↓
本地 whisper.cpp / mlx-whisper
   ↓
本地 LLM (Ollama + Llama 3.2 / Qwen2.5)
   ↓
结构化文本
```

- 总成本: **$0**
- 延迟较高，LLM 后处理质量不如云端大模型
- 适合隐私敏感场景

### 4.3 关键技术挑战

| 挑战 | 难度 | 解法 |
|------|------|------|
| 实时流式识别 | 中 | Whisper 的 30s 分块 + VAD（语音活动检测）|
| LLM 后处理延迟 | 低 | Groq/GPT-4o mini 延迟 < 500ms |
| 上下文感知（邮件/Slack） | 中 | 检测当前前台应用 + prompt 模板切换 |
| 自我纠正识别 | 低 | LLM prompt 设计即可 |
| 多语言混合 | 低 | Whisper 原生支持 |
| 系统级热键集成 | 中 | macOS: Accessibility API; Windows: Global Hotkey |
| 跨应用粘贴 | 低 | 模拟 Cmd+V / Ctrl+V |

### 4.4 LLM 后处理 Prompt 示例

```
你是一个语音转文本后处理引擎。将 ASR 原始转写优化为干净、专业的文本。

规则：
1. 删除所有语气词（嗯、啊、那个、um、uh、like）
2. 合并重复表达，保留最后一次正确的版本
3. 识别自我纠正（"不对，应该是..."），只保留纠正后的内容
4. 添加合适的标点符号和分段
5. 如果用户口述了列表或步骤，格式化为编号列表
6. 保持用户原意，不添加信息，不改变语义
7. 当前上下文：{context}（邮件/即时消息/文档/代码注释）

ASR 原始输入：{raw_transcript}
优化后文本：
```

### 4.5 MVP 开发路线

**Phase 1 (1-2 周) — 核心功能**
- macOS 菜单栏应用 (Electron / Tauri / Swift)
- 全局热键触发录音
- Groq Whisper API 转写
- GPT-4o mini 后处理
- 自动粘贴到当前应用

**Phase 2 (2-3 周) — 体验优化**
- 流式识别（边说边显示）
- 上下文感知（检测当前应用）
- 历史记录
- 多语言支持

**Phase 3 (可选) — 降本增效**
- 本地 Whisper (mlx-whisper) 替代云端 ASR
- 微调小型 LLM 替代 GPT-4o mini
- 自部署推理服务

### 4.6 技术栈建议

| 组件 | 推荐 | 备选 |
|------|------|------|
| 桌面框架 | **Tauri 2.0** (Rust, 体积小) | Electron, Swift (Mac only) |
| ASR | **Groq Whisper Turbo** | Deepgram Nova-3, 本地 mlx-whisper |
| LLM | **GPT-4o mini** | Claude Haiku 4.5, DeepSeek |
| 流式显示 | SSE / WebSocket | — |
| 热键 | tauri-plugin-global-shortcut | — |

---

## 五、总结

### 可以做吗？

**完全可以。** 技术壁垒不高，核心就是 Whisper + LLM 的管线。

### 成本对比

| 方案 | 每用户月成本 | vs Typeless $12/月 |
|------|-------------|-------------------|
| 云端 (Groq + GPT-4o mini) | ~$0.90 | 节省 93% |
| 混合 (本地 ASR + 云端 LLM) | ~$0.30 | 节省 97% |
| 纯本地 | ~$0 | 节省 100% |

### Typeless 的真正护城河

不是技术，而是：
1. **产品打磨** — 热键响应速度、流式体验、上下文感知的细节
2. **用户习惯** — 已积累的用户基础和品牌
3. **持续迭代** — 团队全职优化体验

### 建议

如果目标是**自用或小团队使用**：直接用 OpenWhispr（开源免费）或搭建方案 A 的 MVP，2 周内可用。

如果目标是**做成产品**：用方案 A 快速验证，后续切换到方案 B 降本。关键差异化可以是：
- 更低价格（$5/月 或终身买断）
- 中文/亚洲语言优化
- 本地优先的隐私卖点
- 与特定工作流深度集成（如飞书、企业微信）

---

## Sources

- [Typeless Official](https://www.typeless.com/)
- [Typeless Pricing](https://www.typeless.com/pricing)
- [Typeless - 少数派评测](https://sspai.com/post/105358)
- [Typeless 深度测评 - WenHaoFree](https://blog.wenhaofree.com/posts/articles/2026-02-02-typeless-ai-voice-dictation-guide/)
- [AI 语音输入法爆火 - 知乎](https://zhuanlan.zhihu.com/p/1977487670344189009)
- [Wispr Flow uses Llama on Baseten](https://www.baseten.co/resources/customers/wispr-flow/)
- [Wispr Raises $25M](https://www.prnewswire.com/news-releases/wispr-raises-25m-to-build-its-voice-operating-system-302621858.html)
- [OpenAI Whisper](https://openai.com/index/whisper/)
- [Groq Whisper Pricing](https://groq.com/pricing)
- [Groq Whisper 164x Speed](https://groq.com/blog/groq-runs-whisper-large-v3-at-a-164x-speed-factor-according-to-new-artificial-analysis-benchmark)
- [OpenAI Whisper API Pricing](https://costgoat.com/pricing/openai-transcription)
- [Deepgram Pricing](https://deepgram.com/pricing)
- [OpenWhispr - Open Source](https://openwhispr.com/)
- [WhisperWriter + LLM Post-Processing](https://github.com/savbell/whisper-writer/pull/102)
- [Whispering - Open Source](https://news.ycombinator.com/item?id=44942731)
- [mlx-whisper vs whisper.cpp Benchmark](https://notes.billmill.org/dev_blog/2026/01/updated_my_mlx_whisper_vs._whisper.cpp_benchmark.html)
- [V2EX - 模仿 Typeless](https://www.v2ex.com/t/1187679)
- [豆包输入法](https://shurufa.doubao.com/)
- [Typeless Alternatives - Voibe](https://www.getvoibe.com/blog/typeless-alternatives/)
- [Best AI Dictation Apps - TechCrunch](https://techcrunch.com/2025/12/30/the-best-ai-powered-dictation-apps-of-2025/)
- [Best Open Source STT Models 2026 - Northflank](https://northflank.com/blog/best-open-source-speech-to-text-stt-model-in-2026-benchmarks)
- [VoiceInk](https://tryvoiceink.com/superwhisper-alternative)
