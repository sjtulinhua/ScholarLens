# Handoff: ScholarLens Project Memory

> 从 Windows (PC) 迁移至 MacBook 的交接文档

## 1. 核心状态 (Current Status)
- **UI/UX**: 已经全量上线 "Soft Professional" 主题，清爽专业。
- **Mobile**: 针对 iPhone 15 Pro Max 和 iPad Pro 11" 深度优化，布局完美。
- **Centering**: 上传页面和指标卡文字重叠问题已修复。
- **Build**: 本地 `npm run build` 成功，类型错误已清除。
- **Ready for Deployment**: 已经准备就绪，但用户决定**先进行充分测试**再发布。
- **Focus**: 当前重点是本地/开发环境的功能验证。

## 2. 下一步优先级 (Roadmap)
- 📸 **Universal Multi-Image Upload**: (Priority High) 支持多图/PDF上传，解决试卷+答题卡分离、正反面多页等复杂场景。
- 🚀 **Zeabur Deployment**: 配置环境变量并上线 (待本地测试后)。
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
