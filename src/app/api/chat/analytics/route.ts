import { NextResponse } from "next/server";
import { generateText } from "ai";
import { geminiFlash } from "@/lib/ai";

const ANALYTICS_SYSTEM_PROMPT = `你是一个问卷数据分析助手。你的任务是根据提供的问卷数据回答用户的问题。

## 可用数据
用户会提供以下数据：
- 问卷列表：每个问卷的标题、问题、状态
- 回复数据：每个回复的答案、状态（completed/partial/in_progress）、时间
- 统计概览：问卷总数、回复总数、完成率、今日新增

## 回答原则
1. 用中文回答
2. 数据要准确，从提供的数据中计算
3. 回答要简洁明了
4. 如果数据不足以回答问题，诚实告知用户
5. 可以给出数据洞察和建议

## 常见问题类型
- 概览统计：回复总数、完成率等
- 问卷对比：哪个问卷表现最好
- 问题分析：某个问题的回答分布
- 趋势分析：时间维度的变化

保持回答简洁、准确、有用。`;

interface AnalyticsRequest {
  message: string;
  creatorCode: string;
  context: {
    surveys: Array<{
      id: string;
      title: string;
      questions: unknown[];
      status: string;
    }>;
    responses: Array<{
      survey_id: string;
      answers: Record<string, unknown>;
      status: string;
      started_at: string;
    }>;
    stats: {
      totalSurveys: number;
      totalResponses: number;
      completedResponses: number;
      partialResponses: number;
      completionRate: number;
      todayResponses: number;
    } | null;
  };
}

export async function POST(request: Request) {
  try {
    const body: AnalyticsRequest = await request.json();
    const { message, context } = body;

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Build context string for AI
    let dataContext = "\n\n## 当前数据\n";

    if (context.stats) {
      dataContext += `\n### 统计概览\n`;
      dataContext += `- 问卷总数: ${context.stats.totalSurveys}\n`;
      dataContext += `- 回复总数: ${context.stats.totalResponses}\n`;
      dataContext += `- 完成回复: ${context.stats.completedResponses}\n`;
      dataContext += `- 部分回复: ${context.stats.partialResponses}\n`;
      dataContext += `- 完成率: ${context.stats.completionRate}%\n`;
      dataContext += `- 今日新增: ${context.stats.todayResponses}\n`;
    }

    if (context.surveys.length > 0) {
      dataContext += `\n### 问卷列表\n`;
      context.surveys.forEach((survey, index) => {
        const surveyResponses = context.responses.filter(r => r.survey_id === survey.id);
        dataContext += `${index + 1}. "${survey.title}" (状态: ${survey.status}, 问题数: ${(survey.questions as unknown[]).length}, 回复数: ${surveyResponses.length})\n`;
      });
    }

    if (context.responses.length > 0) {
      // Group responses by survey and calculate distribution
      const responsesBySurvey: Record<string, typeof context.responses> = {};
      context.responses.forEach(r => {
        if (!responsesBySurvey[r.survey_id]) {
          responsesBySurvey[r.survey_id] = [];
        }
        responsesBySurvey[r.survey_id].push(r);
      });

      dataContext += `\n### 回复详情\n`;
      Object.entries(responsesBySurvey).forEach(([surveyId, responses]) => {
        const survey = context.surveys.find(s => s.id === surveyId);
        if (survey) {
          dataContext += `\n问卷 "${survey.title}":\n`;
          dataContext += `- 总回复: ${responses.length}\n`;
          dataContext += `- 完成: ${responses.filter(r => r.status === "completed").length}\n`;
          dataContext += `- 部分: ${responses.filter(r => r.status === "partial").length}\n`;

          // Analyze answer distribution for each question
          const questions = survey.questions as Array<{ id: string; text: string; type: string; options?: string[] }>;
          questions.forEach((q, qIndex) => {
            const answersForQuestion = responses
              .map(r => r.answers[q.id])
              .filter(a => a !== undefined && a !== null && a !== "");

            if (answersForQuestion.length > 0) {
              dataContext += `  Q${qIndex + 1} "${q.text}": ${answersForQuestion.length} 个回答`;

              // For multiple choice, show distribution
              if (q.type === "multiple_choice" && q.options) {
                const distribution: Record<string, number> = {};
                answersForQuestion.forEach(a => {
                  const answer = String(a);
                  distribution[answer] = (distribution[answer] || 0) + 1;
                });
                const distStr = Object.entries(distribution)
                  .map(([opt, count]) => `${opt}(${count})`)
                  .join(", ");
                dataContext += ` - ${distStr}`;
              }

              dataContext += "\n";
            }
          });
        }
      });
    }

    const { text } = await generateText({
      model: geminiFlash,
      system: ANALYTICS_SYSTEM_PROMPT + dataContext,
      prompt: message,
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
