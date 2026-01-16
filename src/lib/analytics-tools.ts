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
