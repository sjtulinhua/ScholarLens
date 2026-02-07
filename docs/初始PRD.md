项目背景
目标用户： 初中生（厦门中考体系）。

初期范围： 数学（Math）先行，架构预留全科接口。

网络环境： 中国部署，后端具备魔法上网能力。

核心功能模块 (Features)
多模态试卷录入 (Multimodal Entry)

功能： 拍照上传。

数学特化： 自动识别几何图形、函数图像（Gemini 优势）。

预处理： 支持用户手动选择“科目”和“年级”（如：九年级上册），这将决定 AI 使用哪个 Prompt 模板。

厦门中考知识图谱 (Xiamen Knowledge Graph)

前期不需硬编码，依靠 AI 动态归类，但需预设 Prompt 指令。

Prompt 注入： "你是一名厦门初中数学名师，熟悉《厦门市初中数学教学质量监测》标准。请将以下错题归类..."

标签体系（自动生成）：

知识点：e.g., "圆 - 垂径定理"

能力维度：e.g., "运算求解能力", "空间想象能力" (中考考纲术语)

错题归因分析 (Root Cause Analysis)

数学： 计算错误、概念混淆、审题不清、辅助线没做对。

未来拓展（文科）： 答题模板缺失、关键词遗漏（针对政史）。

举一反三 (Adaptive Practice)

变式题生成： 要求 AI 生成与错题“同构不同数”的题目。

难度控制： 初始 MVP 设定为“保持当前难度”。

数据结构设计 (Schema for Scalability)
为了支持未来的全科，数据库设计不能写死：

Table: Questions

content (Text/Markdown)

images (Array of URLs)

subject (Enum: Math, Chinese, Physics, Politics...)

meta_data (JSONB) -> 关键点。

数学存：{ "formula_tags": ["quadratic"], "graph_type": "parabola" }

政治存：{ "topic": "democracy", "exam_year": 2025 }

embedding (Vector) -> 用于相似题检索。