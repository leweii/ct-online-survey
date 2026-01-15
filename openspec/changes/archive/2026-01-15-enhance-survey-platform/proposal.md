# Change: 增强问卷平台功能

## 概述
本提案包含四项增强功能，提升问卷平台的专业性和用户体验。

## 变更内容

### 1. 专业化问卷生成 (Gemini Pro)
- **问题**: 当前使用 gemini-2.0-flash 模型生成问卷，问题质量一般
- **方案**: 使用 Gemini Pro 模型（gemini-2.5-pro）生成更专业的问卷问题
- **对话**: Responder 和 Analytics 保持使用 Flash 模型（gemini-2.0-flash）
- **效果**: 生成的问题更具针对性、专业性，选项设计更合理

### 2. 默认语言改为中文
- **问题**: 当前所有 UI 文本为英文
- **方案**: 将所有页面的默认文本改为中文
- **影响文件**:
  - `src/app/page.tsx` - 首页
  - `src/app/create/page.tsx` - 创建页
  - `src/app/dashboard/DashboardContent.tsx` - 仪表盘
  - `src/components/*.tsx` - 所有组件

### 3. 支持部分提交问卷
- **问题**: 当前必须回答所有必填问题才能提交
- **方案**: 添加"提前提交"按钮，允许用户在回答部分问题后提交
- **状态**: 部分提交的问卷标记为 `partial`，与完整提交区分

### 4. 数据分析聊天页面
- **问题**: 当前仪表盘只显示问卷列表，无法深入分析数据
- **方案**: 新增 `/dashboard/chat` 页面，提供：
  - 默认展示统计报表（总问卷数、总回复数、完成率等）
  - AI 聊天问答，用户可询问数据相关问题
  - 可视化图表展示

## 影响范围

| 功能 | 影响文件 | 新增文件 |
|------|---------|---------|
| Extended Thinking | `src/lib/ai.ts`, `creator/route.ts` | - |
| 中文界面 | 所有 `.tsx` 页面和组件 | - |
| 部分提交 | `FormResponse.tsx`, `survey/[id]/page.tsx`, `responses API` | - |
| 分析聊天 | - | `dashboard/chat/page.tsx`, `api/chat/analytics/route.ts` |

## 技术选型

### AI 模型配置
- **Creator 模式**: `gemini-2.5-pro` - 用于生成专业问卷
- **Responder 模式**: `gemini-2.0-flash` - 用于对话回复
- **Analytics 模式**: `gemini-2.0-flash` - 用于数据分析问答

### 数据分析
- 使用现有 Supabase 数据
- AI 生成 SQL 查询或直接分析数据
- 返回文字描述 + 简单统计数据
