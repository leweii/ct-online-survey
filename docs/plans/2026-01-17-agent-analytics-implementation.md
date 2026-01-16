# Agent-Based Analytics Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace data-dump analytics with agentic tool-calling approach using Vercel AI SDK.

**Architecture:** LLM receives survey metadata only (not responses). When it needs data, it calls typed tools that query Supabase directly. Tools return structured results, LLM interprets and responds.

**Tech Stack:** Vercel AI SDK (`ai` package), Zod for validation, Supabase for queries.

---

## Task 1: Create Analytics Tools File

**Files:**
- Create: `src/lib/analytics-tools.ts`

**Step 1: Create the tools file with getSurveyOverview**

```typescript
import { tool } from "ai";
import { z } from "zod";
import { supabase } from "./supabase";

// Tool: Get survey metadata and high-level response stats
export const getSurveyOverview = tool({
  description: "Get survey metadata including title, questions, and response statistics. Call this first to understand the survey structure.",
  parameters: z.object({
    surveyId: z.string().describe("The survey ID to get overview for"),
  }),
  execute: async ({ surveyId }) => {
    // Fetch survey
    const { data: survey, error: surveyError } = await (supabase.from("surveys") as any)
      .select("id, title, description, questions, status")
      .eq("id", surveyId)
      .single();

    if (surveyError || !survey) {
      return { error: "Survey not found" };
    }

    // Count responses by status
    const { data: responses, error: respError } = await (supabase.from("responses") as any)
      .select("status")
      .eq("survey_id", surveyId);

    if (respError) {
      return { error: "Failed to fetch responses" };
    }

    const total = responses?.length || 0;
    const completed = responses?.filter((r: any) => r.status === "completed").length || 0;
    const partial = responses?.filter((r: any) => r.status === "partial").length || 0;

    return {
      id: survey.id,
      title: survey.title,
      description: survey.description,
      status: survey.status,
      questions: survey.questions.map((q: any) => ({
        id: q.id,
        text: q.text,
        type: q.type,
        options: q.options,
        required: q.required,
      })),
      stats: {
        totalResponses: total,
        completedResponses: completed,
        partialResponses: partial,
        inProgressResponses: total - completed - partial,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      },
    };
  },
});
```

**Step 2: Add getQuestionStats tool**

```typescript
// Tool: Get aggregated statistics for a specific question
export const getQuestionStats = tool({
  description: "Get aggregated statistics for a specific question. Returns distribution for choice questions, average/min/max for numeric questions, or sample responses for text questions.",
  parameters: z.object({
    surveyId: z.string().describe("The survey ID"),
    questionId: z.string().describe("The question ID to get stats for"),
    completedOnly: z.boolean().optional().default(true).describe("Only include completed responses"),
  }),
  execute: async ({ surveyId, questionId, completedOnly }) => {
    // Fetch survey to get question type
    const { data: survey } = await (supabase.from("surveys") as any)
      .select("questions")
      .eq("id", surveyId)
      .single();

    if (!survey) {
      return { error: "Survey not found" };
    }

    const question = survey.questions.find((q: any) => q.id === questionId);
    if (!question) {
      return { error: "Question not found" };
    }

    // Fetch responses
    let query = (supabase.from("responses") as any)
      .select("answers")
      .eq("survey_id", surveyId);

    if (completedOnly) {
      query = query.eq("status", "completed");
    }

    const { data: responses, error } = await query;

    if (error) {
      return { error: "Failed to fetch responses" };
    }

    // Extract answers for this question
    const answers = (responses || [])
      .map((r: any) => r.answers[questionId])
      .filter((a: any) => a !== undefined && a !== null && a !== "");

    const totalAnswers = answers.length;

    // Return stats based on question type
    if (question.type === "multiple_choice" || question.type === "dropdown" || question.type === "yes_no") {
      const distribution: Record<string, number> = {};
      answers.forEach((a: any) => {
        const key = String(a);
        distribution[key] = (distribution[key] || 0) + 1;
      });
      return {
        questionId,
        questionText: question.text,
        questionType: question.type,
        totalAnswers,
        distribution,
      };
    }

    if (question.type === "rating" || question.type === "number" || question.type === "slider") {
      const nums = answers.map((a: any) => Number(a)).filter((n: number) => !isNaN(n));
      if (nums.length === 0) {
        return { questionId, questionText: question.text, questionType: question.type, totalAnswers: 0 };
      }
      const sum = nums.reduce((a: number, b: number) => a + b, 0);
      const distribution: Record<string, number> = {};
      nums.forEach((n: number) => {
        const key = String(n);
        distribution[key] = (distribution[key] || 0) + 1;
      });
      return {
        questionId,
        questionText: question.text,
        questionType: question.type,
        totalAnswers: nums.length,
        average: Number((sum / nums.length).toFixed(2)),
        min: Math.min(...nums),
        max: Math.max(...nums),
        distribution,
      };
    }

    if (question.type === "multi_select") {
      const distribution: Record<string, number> = {};
      answers.forEach((a: any) => {
        const selections = Array.isArray(a) ? a : [a];
        selections.forEach((s: any) => {
          const key = String(s);
          distribution[key] = (distribution[key] || 0) + 1;
        });
      });
      return {
        questionId,
        questionText: question.text,
        questionType: question.type,
        totalAnswers,
        distribution,
      };
    }

    // Text, email, phone, date - return samples
    return {
      questionId,
      questionText: question.text,
      questionType: question.type,
      totalAnswers,
      sampleResponses: answers.slice(0, 5).map((a: any) => String(a).slice(0, 200)),
    };
  },
});
```

**Step 3: Add getFilteredResponses tool**

```typescript
// Filter operators for querying responses
const FilterOperatorSchema = z.enum(["eq", "neq", "gt", "gte", "lt", "lte", "contains"]);

// Tool: Get filtered responses
export const getFilteredResponses = tool({
  description: "Fetch responses matching specific filters. Use this to segment data, e.g., 'responses where Q1 is Yes' or 'responses with rating > 3'.",
  parameters: z.object({
    surveyId: z.string().describe("The survey ID"),
    filters: z.array(z.object({
      questionId: z.string().describe("Question ID to filter on"),
      operator: FilterOperatorSchema.describe("Comparison operator"),
      value: z.union([z.string(), z.number(), z.boolean()]).describe("Value to compare against"),
    })).optional().describe("Filters to apply"),
    completedOnly: z.boolean().optional().default(true).describe("Only include completed responses"),
    limit: z.number().optional().default(50).describe("Maximum responses to return"),
  }),
  execute: async ({ surveyId, filters, completedOnly, limit }) => {
    let query = (supabase.from("responses") as any)
      .select("id, answers, status, started_at, completed_at")
      .eq("survey_id", surveyId);

    if (completedOnly) {
      query = query.eq("status", "completed");
    }

    const { data: allResponses, error } = await query;

    if (error) {
      return { error: "Failed to fetch responses" };
    }

    let filtered = allResponses || [];

    // Apply filters in JS (Supabase JSONB filtering is limited)
    if (filters && filters.length > 0) {
      filtered = filtered.filter((r: any) => {
        return filters.every((f) => {
          const answer = r.answers[f.questionId];
          if (answer === undefined || answer === null) return false;

          switch (f.operator) {
            case "eq": return answer === f.value || String(answer) === String(f.value);
            case "neq": return answer !== f.value && String(answer) !== String(f.value);
            case "gt": return Number(answer) > Number(f.value);
            case "gte": return Number(answer) >= Number(f.value);
            case "lt": return Number(answer) < Number(f.value);
            case "lte": return Number(answer) <= Number(f.value);
            case "contains": return String(answer).toLowerCase().includes(String(f.value).toLowerCase());
            default: return true;
          }
        });
      });
    }

    const total = filtered.length;
    const limited = filtered.slice(0, limit);

    return {
      total,
      returned: limited.length,
      responses: limited.map((r: any) => ({
        id: r.id,
        answers: r.answers,
        status: r.status,
        completedAt: r.completed_at,
      })),
    };
  },
});
```

**Step 4: Add crossTabulate tool**

```typescript
// Tool: Cross-tabulate two questions
export const crossTabulate = tool({
  description: "Analyze the relationship between two questions. Shows how answers to one question correlate with answers to another. Best for choice-based questions.",
  parameters: z.object({
    surveyId: z.string().describe("The survey ID"),
    questionId1: z.string().describe("First question ID (rows)"),
    questionId2: z.string().describe("Second question ID (columns)"),
    completedOnly: z.boolean().optional().default(true).describe("Only include completed responses"),
  }),
  execute: async ({ surveyId, questionId1, questionId2, completedOnly }) => {
    // Fetch survey to get question details
    const { data: survey } = await (supabase.from("surveys") as any)
      .select("questions")
      .eq("id", surveyId)
      .single();

    if (!survey) {
      return { error: "Survey not found" };
    }

    const q1 = survey.questions.find((q: any) => q.id === questionId1);
    const q2 = survey.questions.find((q: any) => q.id === questionId2);

    if (!q1 || !q2) {
      return { error: "One or both questions not found" };
    }

    // Fetch responses
    let query = (supabase.from("responses") as any)
      .select("answers")
      .eq("survey_id", surveyId);

    if (completedOnly) {
      query = query.eq("status", "completed");
    }

    const { data: responses, error } = await query;

    if (error) {
      return { error: "Failed to fetch responses" };
    }

    // Build cross-tabulation matrix
    const matrix: Record<string, Record<string, number>> = {};
    let total = 0;

    (responses || []).forEach((r: any) => {
      const a1 = r.answers[questionId1];
      const a2 = r.answers[questionId2];

      if (a1 !== undefined && a1 !== null && a2 !== undefined && a2 !== null) {
        const key1 = String(a1);
        const key2 = String(a2);

        if (!matrix[key1]) matrix[key1] = {};
        matrix[key1][key2] = (matrix[key1][key2] || 0) + 1;
        total++;
      }
    });

    return {
      question1: { id: q1.id, text: q1.text },
      question2: { id: q2.id, text: q2.text },
      matrix,
      total,
    };
  },
});

// Export all tools as a single object for use with generateText
export const analyticsTools = {
  getSurveyOverview,
  getQuestionStats,
  getFilteredResponses,
  crossTabulate,
};
```

**Step 5: Verify file compiles**

Run: `npx tsc --noEmit src/lib/analytics-tools.ts`
Expected: No errors (or only errors from external imports which is fine)

**Step 6: Commit**

```bash
git add src/lib/analytics-tools.ts
git commit -m "feat: add analytics tools for agent-based data querying"
```

---

## Task 2: Update Analytics API Route

**Files:**
- Modify: `src/app/api/chat/analytics/route.ts`

**Step 1: Update imports and add tool imports**

Replace line 1-3:
```typescript
import { NextResponse } from "next/server";
import { generateText } from "ai";
import { geminiFlash } from "@/lib/ai";
import { analyticsTools } from "@/lib/analytics-tools";
```

**Step 2: Update system prompts to include tool usage instructions**

Replace `SYSTEM_PROMPTS` (lines 6-68) with:

```typescript
const SYSTEM_PROMPTS = {
  en: `You are an expert survey data analyst agent with access to data querying tools.

## How to Work
1. **Always use tools to get data** - Never guess or assume data. Call tools to fetch actual statistics.
2. **Start with getSurveyOverview** - Understand the survey structure and response counts first.
3. **Use getQuestionStats for specifics** - Get detailed stats for individual questions.
4. **Use getFilteredResponses for segments** - When asked about subgroups or specific criteria.
5. **Use crossTabulate for relationships** - When asked how answers relate to each other.

## Analysis Guidelines
- **Be data-driven** - Only cite numbers from tool results, never invent statistics.
- **Domain expertise** - Interpret results based on survey type (NPS >50 excellent, 0-30 needs improvement, etc.)
- **Actionable insights** - Always provide 2-3 specific recommendations based on the data.
- **Handle zero data gracefully** - If no responses, suggest data collection strategies and provide industry benchmarks.

## Response Format
- Use clear headings and bullet points
- Lead with the most important insight
- Include specific numbers from tool results
- End with actionable recommendations

Be confident, helpful, and data-driven.`,

  zh: `你是一位专业的问卷数据分析师，可以使用数据查询工具。

## 工作方式
1. **始终使用工具获取数据** - 不要猜测或假设数据，调用工具获取真实统计信息。
2. **首先使用 getSurveyOverview** - 先了解问卷结构和回复数量。
3. **使用 getQuestionStats 获取详情** - 获取单个问题的详细统计。
4. **使用 getFilteredResponses 进行分段** - 当被问及子群体或特定条件时。
5. **使用 crossTabulate 分析关系** - 当被问及答案之间的关联时。

## 分析指南
- **以数据为驱动** - 只引用工具返回的数字，不要编造统计数据。
- **领域专长** - 根据问卷类型解读结果（NPS >50 优秀，0-30 需改进等）
- **可操作建议** - 始终根据数据提供2-3条具体建议。
- **优雅处理零数据** - 如果没有回复，建议数据收集策略并提供行业基准。

## 回复格式
- 使用清晰的标题和要点
- 优先展示最重要的洞察
- 引用工具返回的具体数字
- 以可操作建议结尾

自信、有帮助、以数据为驱动。`,
};
```

**Step 3: Update proactive prompts**

Replace `PROACTIVE_PROMPTS` (lines 71-99) with:

```typescript
const PROACTIVE_PROMPTS = {
  en: `Analyze this survey and provide an initial insight report.

First, call getSurveyOverview to understand the survey structure and response statistics.
Then, call getQuestionStats for key questions to gather specific data.

Your report should include:
1. **Overview**: Survey type, total responses, completion rate
2. **Key Findings**: Highlight interesting patterns from the data
3. **Question Analysis**: Stats for the most important questions
4. **Recommendations**: 2-3 actionable next steps

If there are no responses yet, analyze the survey design and provide guidance on data collection.`,

  zh: `分析此问卷并提供初始洞察报告。

首先，调用 getSurveyOverview 了解问卷结构和回复统计。
然后，调用 getQuestionStats 获取关键问题的具体数据。

报告应包括：
1. **概览**：问卷类型、总回复数、完成率
2. **关键发现**：突出数据中的有趣模式
3. **问题分析**：最重要问题的统计数据
4. **建议**：2-3个可操作的下一步

如果还没有回复，分析问卷设计并提供数据收集指导。`,
};
```

**Step 4: Simplify request interface**

Replace `AnalyticsRequest` interface (lines 124-134) with:

```typescript
interface AnalyticsRequest {
  message: string;
  surveyId: string;
  language?: "en" | "zh";
  isInit?: boolean;
}
```

**Step 5: Remove buildDataContext function**

Delete lines 136-247 (the entire `buildDataContext` function).

**Step 6: Update POST handler to use tools**

Replace the POST handler (lines 249-279) with:

```typescript
export async function POST(request: Request) {
  try {
    const body: AnalyticsRequest = await request.json();
    const { message, surveyId, language = "zh", isInit = false } = body;

    if (!surveyId) {
      return NextResponse.json({ error: "Survey ID is required" }, { status: 400 });
    }

    if (!isInit && !message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const systemPrompt = SYSTEM_PROMPTS[language];
    const userPrompt = isInit ? PROACTIVE_PROMPTS[language] : message;

    // Include surveyId in the prompt so the agent knows which survey to query
    const contextualPrompt = `Survey ID: ${surveyId}\n\n${userPrompt}`;

    const { text } = await generateText({
      model: geminiFlash,
      system: systemPrompt,
      prompt: contextualPrompt,
      tools: analyticsTools,
      maxSteps: 5,
    });

    return NextResponse.json({ text });
  } catch (error) {
    console.error("Analytics chat error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
```

**Step 7: Run lint check**

Run: `npm run lint`
Expected: No errors in analytics route

**Step 8: Commit**

```bash
git add src/app/api/chat/analytics/route.ts
git commit -m "feat: use tool-calling agent for analytics instead of data dump"
```

---

## Task 3: Update Analytics Chat UI

**Files:**
- Modify: `src/app/dashboard/chat/page.tsx`

**Step 1: Read current file to understand the context structure**

The UI currently sends `context: { surveys, responses, stats }`. We need to simplify this to just send `surveyId`.

**Step 2: Update the sendMessage function**

Find the `sendMessage` function and update the fetch body to use the new simplified API:

```typescript
// Old: body included full context with surveys, responses, stats
// New: just surveyId
body: JSON.stringify({
  message,
  surveyId: selectedSurvey,
  language,
  isInit,
}),
```

**Step 3: Remove client-side stats computation**

The stats are now fetched by the agent tools, so we can simplify or remove client-side stats aggregation that was only used for the context.

**Step 4: Run lint check**

Run: `npm run lint`
Expected: No errors

**Step 5: Commit**

```bash
git add src/app/dashboard/chat/page.tsx
git commit -m "refactor: simplify analytics chat to use agent-based API"
```

---

## Task 4: Test the Implementation

**Step 1: Start dev server**

Run: `npm run dev`

**Step 2: Manual testing checklist**

1. Navigate to `/dashboard/chat`
2. Select a survey from dropdown
3. Verify initial analysis loads (agent should call tools)
4. Ask: "What's the average rating for [question]?" - verify tool is called
5. Ask: "Show me responses where [question] is [value]" - verify filtering works
6. Ask: "How do answers to Q1 relate to Q2?" - verify cross-tabulation works

**Step 3: Verify no data dump in logs**

Check server logs - you should NOT see all response data being logged, only tool calls.

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: address issues found during testing"
```

---

## Task 5: Final Build Verification

**Step 1: Run production build**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 2: Run lint**

Run: `npm run lint`
Expected: No errors

**Step 3: Final commit and push**

```bash
git push
```
