# Handoff: ScholarLens Project Memory

> 从 Windows (PC) 迁移至 MacBook 的交接文档

## 1. 核心状态
- **主题**: Soft Professional / Linear Light (已完成)
- **适配**: 已完成 iPad Pro 11" 和 iPhone 15 Pro Max 适配
- **部署**: 正在准备 Zeabur 部署
- **数据库**: 已升级至 3072 维向量 (OpenAI 兼容模式)，用于 RAG 相似题检索

## 2. 下一步优先级 (Roadmap)
- 🚀 **Zeabur Deployment**: 配置环境变量并上线。
- 📈 **Growth Charts**: (头脑风暴结论) 实现消灭进度趋势图。
- 🚥 **KP Health**: 知识点“红黄绿灯”分级诊断系统。

## 3. 技术注意事项
- **Env**: 注意 `GEMINI_BASE_URL` 在 Mac 下如果需要翻墙可能不同，生产环境需移除。
- **Build**: 已经修复了 `middleware.ts` 和 `server.ts` 的隐式 any 类型错误，本地 `npm run build` 已通过。
- **Storage**: 记得在 Supabase 后台配置 CORS。

## 4. AI 续航与跨设备同步协议 (AI Sync Protocol)

> **重要**：为了保证在 Windows 和 MacBook 之间无缝切换，所有 AI 助手必须遵守以下协议：

### A. 切换前动作 (PC -> Mac / Mac -> PC)
在结束当前设备的工作前，**必须**命令 AI 执行：“**同步项目记忆并推送**”。
AI 应确保：
1. 更新 `.agent/task.md` 的任务进度。
2. 在 `.agent/handoff.md` 的【当前进度】中记录最后的操作。
3. 执行 `git push`。

### B. 接管后动作 (新设备开工)
打开项目后，**必须**命令 AI 执行：“**拉取最新记忆并接管项目**”。
AI 应确保：
1. 执行 `git pull`。
2. **深度阅读** `.agent/` 目录下的所有文件。
3. 自动同步其内部的 `Brain` 状态与 `.agent/task.md` 一致。

### C. 长期维护规则
- **`.agent/` 是一等公民**：它不是垃圾箱，而是项目的“灵魂”。所有非代码类的重要决策、Prompt 调优结论、业务逻辑变更都应记录在此。
- **避免 Brain 泄漏**：不要将 `~/.gemini/antigravity/brain` 目录下的私有文件直接存入 Git，只同步人类可读的 `.md` 文档。

---

## 5. 给下一个 AI 助手的指令
请优先读取 `.agent/` 下的所有 `.md` 文件。本项目采用 **"Soft Professional"** 美学风格，请在后续 UI 改动中严格遵守 `globals.css` 中的变量定义，不要引入多余的 Utility Colors。
