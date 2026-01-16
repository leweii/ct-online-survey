import { NextResponse } from "next/server";
import { generateText } from "ai";
import { geminiFlash } from "@/lib/ai";
import { analyticsTools } from "@/lib/analytics-tools";

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

interface AnalyticsRequest {
  message: string;
  surveyId: string;
  language?: "en" | "zh";
  isInit?: boolean;
}

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
