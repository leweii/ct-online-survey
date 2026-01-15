# 任务清单: 增强问卷平台

## 1. Gemini Pro 模型
- [x] 1.1 在 `src/lib/ai.ts` 添加 Pro 模型配置 (`gemini-2.5-pro`)
- [x] 1.2 更新 Creator prompt 增加专业问卷设计指导
- [x] 1.3 修改 `creator/route.ts` 使用 Pro 模型生成问卷

## 2. 中文界面
- [x] 2.1 修改 `src/app/page.tsx` 首页文本为中文
- [x] 2.2 修改 `src/app/create/page.tsx` 创建页文本为中文
- [x] 2.3 修改 `src/components/ModeSelector.tsx` 文本为中文
- [x] 2.4 修改 `src/components/ResponseModeSelector.tsx` 文本为中文
- [x] 2.5 修改 `src/components/FormResponse.tsx` 文本为中文
- [x] 2.6 修改 `src/app/dashboard/DashboardContent.tsx` 文本为中文
- [x] 2.7 修改 `src/components/SurveyCard.tsx` 文本为中文

## 3. 部分提交功能
- [x] 3.1 在 `src/types/database.ts` 添加 `partial` 状态
- [x] 3.2 修改 `src/components/FormResponse.tsx` 添加提前提交按钮
- [x] 3.3 添加提前提交确认对话框
- [x] 3.4 修改 `src/app/survey/[id]/page.tsx` 支持部分提交
- [x] 3.5 修改 `/api/responses` 支持 partial 状态

## 4. 数据分析聊天页面
- [x] 4.1 创建 `src/app/dashboard/chat/page.tsx` 页面结构
- [x] 4.2 创建 `src/app/api/chat/analytics/route.ts` API
- [x] 4.3 实现默认统计数据获取和展示
- [x] 4.4 实现 AI 问答功能
- [x] 4.5 在 DashboardContent 添加"数据分析"入口按钮

## 5. 测试
- [ ] 5.1 测试 Pro 模型生成问卷质量
- [ ] 5.2 验证所有页面中文显示正确
- [ ] 5.3 测试部分提交流程
- [ ] 5.4 测试数据分析问答功能
