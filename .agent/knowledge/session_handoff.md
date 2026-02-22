# ScholarLens Session Handoff Report
# Date: 2026-02-22

## 📝 会话改动摘要 (Session Summary)

### 1. 后端性能大跃进
- **并行优化**: 彻底优化了真题附件上传 API。将原本的单条循环 Embedding + 插入改为 **5并发并行生成向量** + **批量单次 SQL 插入**。
- **性能结果**: 25道题目的试卷处理速度从 **70秒+ 缩减至 ~10秒**，极大提升了用户体验。

### 2. 科目体系全面扩容 (3 → 9 科)
- **核心科目**: 已完成 语文、数学、英语、物理、化学、历史、政治、地理、生物 的全量支持。
- **架构升级**: 设计并实施了“应用层校验”模式。通过 `src/lib/subjects.ts` 集中管理，彻底**解耦了数据库 CHECK 约束**。以后新增科目只需修改代码，无需迁移数据库。

### 3. UI 界面重构
- **布局优化**: 真题库页面改用 **双行非截断布局**。
  - 第一行：科目 Pill Tabs（自动换行，不再产生横向滚动）。
  - 第二行：难度筛选、批量管理等功能按钮，右对齐排列。
- **视觉风格**: 延续 Soft Professional 风格，使用紧凑型尺寸。

## 🎯 接下来的原子任务 (Next Steps)
1. **数据库云端同步**: 
   - 在终端运行 `npx supabase db push` 将本地的 schema 变更（移除 CHECK 约束）同步至远程 Supabase。
2. **仪表盘精细化**: 
   - 实现首页雷达图/趋势图的科目过滤功能。
3. **知识点热力图**: 
   - 基于收录的 9 科数据，实现知识点“红黄绿灯”分级诊断系统。

## 📂 关键文件索引 (Critical Files)
- `src/lib/subjects.ts`: 科目定义的唯一源头。
- `src/app/api/admin/upload-reference/route.ts`: 核心上传并行处理逻辑。
- `src/app/reference/ReferenceListView.tsx`: 最新重构的双行布局筛选页。
- `.agent/project_experience.md`: 记录了 3072 维向量、性能优化、科目解耦的所有“深坑”。

---
*会话结束，准备接管请读取此文档。*
