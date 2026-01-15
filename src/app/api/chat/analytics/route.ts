import { NextResponse } from "next/server";
import { generateText } from "ai";
import { geminiFlash } from "@/lib/ai";

// Bilingual system prompts for the analytics agent
const SYSTEM_PROMPTS = {
  en: `You are an expert survey data analyst agent. Your role is to provide actionable insights, not just answer questions.

## Your Core Principles
1. **NEVER refuse to help** - Even with zero data, provide valuable guidance (benchmarks, best practices, data collection strategies)
2. **Be proactive** - Don't wait to be asked. Identify patterns, anomalies, and opportunities
3. **Domain expertise** - Adapt your analysis based on the survey topic
4. **Actionable insights** - Every response should include specific recommendations

## Domain Expertise Guidelines
Identify the survey domain from questions and provide specialized analysis:
- **Customer Satisfaction (NPS, CSAT, CES)**: Compare to industry benchmarks (NPS: >50 excellent, 0-30 needs improvement), identify detractors vs promoters, suggest service recovery strategies
- **Employee Engagement**: Interpret engagement scores, identify retention risks, recommend culture improvements
- **Market Research**: Segment analysis, competitive positioning, product-market fit signals
- **Event/Course Feedback**: Highlight strengths to maintain, prioritize improvement areas
- **General Surveys**: Focus on response quality, completion patterns, question effectiveness

## When Data is Limited or Zero
- Acknowledge the current state without apologizing
- Provide industry benchmarks for comparison
- Suggest effective data collection strategies
- Offer best practices for the domain
- Recommend survey improvements to boost response rates

## Response Format
- Use clear headings and bullet points
- Lead with the most important insight
- Include specific numbers when available
- End with 1-3 actionable recommendations

Keep responses concise but comprehensive. Be confident and helpful.`,

  zh: `你是一位专业的问卷数据分析师。你的角色是提供可操作的洞察，而不仅仅是回答问题。

## 核心原则
1. **永不拒绝帮助** - 即使没有数据，也要提供有价值的指导（行业基准、最佳实践、数据收集策略）
2. **主动分析** - 不要等待被问及。主动识别模式、异常和机会
3. **领域专长** - 根据问卷主题调整分析方式
4. **可操作建议** - 每次回复都应包含具体建议

## 领域专长指南
根据问题识别问卷领域，提供专业分析：
- **客户满意度（NPS、CSAT、CES）**：与行业基准比较（NPS：>50优秀，0-30需改进），识别贬损者与推荐者，建议服务补救策略
- **员工敬业度**：解读敬业度分数，识别留存风险，推荐文化改进措施
- **市场调研**：细分分析、竞争定位、产品市场契合信号
- **活动/课程反馈**：突出需保持的优势，优先改进领域
- **通用问卷**：关注回复质量、完成模式、问题有效性

## 数据有限或为零时
- 客观说明当前状态，不必道歉
- 提供行业基准供参考
- 建议有效的数据收集策略
- 提供该领域的最佳实践
- 推荐问卷改进以提高回复率

## 回复格式
- 使用清晰的标题和要点
- 优先展示最重要的洞察
- 有数据时引用具体数字
- 以1-3条可操作建议结尾

保持回复简洁但全面。自信且有帮助。`,
};

// Proactive analysis prompts
const PROACTIVE_PROMPTS = {
  en: `Analyze this survey data and provide an initial insight report. Include:
1. **Key Findings**: What stands out from the data (or note if no responses yet)
2. **Domain Assessment**: What type of survey is this and what domain expertise applies
3. **Data Quality**: Response rate, completion patterns, any concerns
4. **Top Recommendations**: 2-3 specific actions the survey creator should take

If there's no response data yet:
- Identify the survey domain from the questions
- Provide relevant industry benchmarks
- Suggest strategies to increase response rates
- Offer tips for the specific survey type

Be direct and actionable. Start with the most valuable insight.`,

  zh: `分析此问卷数据并提供初始洞察报告。包括：
1. **关键发现**：数据中的突出点（如果还没有回复则说明）
2. **领域评估**：这是什么类型的问卷，适用什么领域专长
3. **数据质量**：回复率、完成模式、任何关注点
4. **首要建议**：问卷创建者应采取的2-3个具体行动

如果还没有回复数据：
- 从问题识别问卷领域
- 提供相关行业基准
- 建议提高回复率的策略
- 提供针对特定问卷类型的建议

直接且可操作。从最有价值的洞察开始。`,
};

interface SurveyContext {
  id: string;
  title: string;
  description?: string;
  questions: Array<{ id: string; text: string; type: string; options?: string[] }>;
  status: string;
}

interface ResponseContext {
  survey_id: string;
  answers: Record<string, unknown>;
  status: string;
  started_at: string;
}

interface StatsContext {
  totalResponses: number;
  completedResponses: number;
  partialResponses: number;
  completionRate: number;
  todayResponses: number;
}

interface AnalyticsRequest {
  message: string;
  creatorCode: string;
  language?: "en" | "zh";
  isInit?: boolean;
  context: {
    surveys: SurveyContext[];
    responses: ResponseContext[];
    stats: StatsContext | null;
  };
}

function buildDataContext(
  context: AnalyticsRequest["context"],
  language: "en" | "zh"
): string {
  const isEn = language === "en";
  let dataContext = isEn ? "\n\n## Current Data\n" : "\n\n## 当前数据\n";

  // Survey info
  if (context.surveys.length > 0) {
    const survey = context.surveys[0];
    dataContext += isEn ? `\n### Survey: "${survey.title}"\n` : `\n### 问卷：「${survey.title}」\n`;
    if (survey.description) {
      dataContext += isEn ? `Description: ${survey.description}\n` : `描述：${survey.description}\n`;
    }
    dataContext += isEn
      ? `Status: ${survey.status}, Questions: ${survey.questions.length}\n`
      : `状态：${survey.status}，问题数：${survey.questions.length}\n`;

    // List questions for domain detection
    dataContext += isEn ? `\n### Questions:\n` : `\n### 问题列表：\n`;
    survey.questions.forEach((q, idx) => {
      dataContext += `${idx + 1}. [${q.type}] ${q.text}`;
      if (q.options && q.options.length > 0) {
        dataContext += ` (${isEn ? "Options" : "选项"}: ${q.options.join(", ")})`;
      }
      dataContext += "\n";
    });
  }

  // Stats
  if (context.stats) {
    dataContext += isEn ? `\n### Statistics:\n` : `\n### 统计数据：\n`;
    dataContext += isEn
      ? `- Total responses: ${context.stats.totalResponses}\n`
      : `- 回复总数：${context.stats.totalResponses}\n`;
    dataContext += isEn
      ? `- Completed: ${context.stats.completedResponses}\n`
      : `- 已完成：${context.stats.completedResponses}\n`;
    dataContext += isEn
      ? `- Partial: ${context.stats.partialResponses}\n`
      : `- 部分完成：${context.stats.partialResponses}\n`;
    dataContext += isEn
      ? `- Completion rate: ${context.stats.completionRate}%\n`
      : `- 完成率：${context.stats.completionRate}%\n`;
    dataContext += isEn
      ? `- Today's new: ${context.stats.todayResponses}\n`
      : `- 今日新增：${context.stats.todayResponses}\n`;
  } else {
    dataContext += isEn
      ? `\n### Statistics: No responses yet\n`
      : `\n### 统计数据：暂无回复\n`;
  }

  // Response details
  if (context.responses.length > 0 && context.surveys.length > 0) {
    const survey = context.surveys[0];
    const responses = context.responses.filter((r) => r.survey_id === survey.id);

    if (responses.length > 0) {
      dataContext += isEn ? `\n### Response Details:\n` : `\n### 回复详情：\n`;

      // Analyze answer distribution for each question
      survey.questions.forEach((q, qIndex) => {
        const answersForQuestion = responses
          .map((r) => r.answers[q.id])
          .filter((a) => a !== undefined && a !== null && a !== "");

        if (answersForQuestion.length > 0) {
          dataContext += `Q${qIndex + 1} "${q.text}": ${answersForQuestion.length} ${isEn ? "answers" : "个回答"}`;

          if (q.type === "multiple_choice" && q.options) {
            const distribution: Record<string, number> = {};
            answersForQuestion.forEach((a) => {
              const answer = String(a);
              distribution[answer] = (distribution[answer] || 0) + 1;
            });
            const distStr = Object.entries(distribution)
              .map(([opt, count]) => `${opt}(${count})`)
              .join(", ");
            dataContext += ` - ${distStr}`;
          } else if (q.type === "rating") {
            const nums = answersForQuestion.map((a) => Number(a)).filter((n) => !isNaN(n));
            if (nums.length > 0) {
              const avg = (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1);
              const min = Math.min(...nums);
              const max = Math.max(...nums);
              dataContext += isEn
                ? ` - Avg: ${avg}, Range: ${min}-${max}`
                : ` - 平均：${avg}，范围：${min}-${max}`;
            }
          } else if (q.type === "yes_no") {
            const yesCount = answersForQuestion.filter((a) => a === "yes").length;
            const noCount = answersForQuestion.filter((a) => a === "no").length;
            dataContext += isEn
              ? ` - Yes: ${yesCount}, No: ${noCount}`
              : ` - 是：${yesCount}，否：${noCount}`;
          } else if (q.type === "text") {
            // Show sample text responses
            const samples = answersForQuestion.slice(0, 3).map((a) => `"${String(a).slice(0, 50)}..."`);
            dataContext += isEn ? ` - Samples: ${samples.join("; ")}` : ` - 示例：${samples.join("；")}`;
          }

          dataContext += "\n";
        } else {
          dataContext += `Q${qIndex + 1} "${q.text}": ${isEn ? "No answers yet" : "暂无回答"}\n`;
        }
      });
    }
  }

  return dataContext;
}

export async function POST(request: Request) {
  try {
    const body: AnalyticsRequest = await request.json();
    const { message, context, language = "zh", isInit = false } = body;

    // For init requests, we don't require a message
    if (!isInit && !message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const systemPrompt = SYSTEM_PROMPTS[language];
    const dataContext = buildDataContext(context, language);

    // Determine the prompt
    const userPrompt = isInit ? PROACTIVE_PROMPTS[language] : message;

    const { text } = await generateText({
      model: geminiFlash,
      system: systemPrompt + dataContext,
      prompt: userPrompt,
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
