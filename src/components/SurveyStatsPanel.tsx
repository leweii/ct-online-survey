"use client";

import React, { useState, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Question, Response } from "@/types/database";

interface QuestionStats {
  questionId: string;
  questionText: string;
  questionType: string;
  distribution: { option: string; count: number; percentage: number }[];
  textResponses?: { answer: string; time: string }[];
}

interface SurveyStatsPanelProps {
  questions: Question[];
  responses: Response[];
  totalResponses: number;
  completedResponses: number;
  partialResponses: number;
  completionRate: number;
}

function calculateQuestionStats(
  questions: Question[],
  responses: Response[]
): QuestionStats[] {
  return questions.map((question) => {
    const answers = responses
      .map((r) => r.answers[question.id])
      .filter((a) => a !== undefined && a !== null && a !== "");

    const totalAnswers = answers.length;

    if (question.type === "text") {
      // For text questions, collect all responses
      const textResponses = responses
        .filter((r) => r.answers[question.id])
        .map((r) => ({
          answer: String(r.answers[question.id]),
          time: r.completed_at || r.started_at,
        }))
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

      return {
        questionId: question.id,
        questionText: question.text,
        questionType: question.type,
        distribution: [],
        textResponses,
      };
    }

    // For choice/rating questions, calculate distribution
    const countMap: Record<string, number> = {};

    if (question.type === "rating" || question.type === "slider") {
      // Rating: 1-5 or custom range
      const min = question.validation?.min || 1;
      const max = question.validation?.max || 5;
      for (let i = max; i >= min; i--) {
        countMap[String(i)] = 0;
      }
    } else if (question.type === "yes_no") {
      countMap["yes"] = 0;
      countMap["no"] = 0;
    } else if (question.options) {
      question.options.forEach((opt) => {
        countMap[opt] = 0;
      });
    }

    answers.forEach((answer) => {
      if (question.type === "multi_select" && Array.isArray(answer)) {
        answer.forEach((a) => {
          const key = String(a);
          countMap[key] = (countMap[key] || 0) + 1;
        });
      } else {
        const key = String(answer);
        countMap[key] = (countMap[key] || 0) + 1;
      }
    });

    const distribution = Object.entries(countMap).map(([option, count]) => ({
      option,
      count,
      percentage: totalAnswers > 0 ? Math.round((count / totalAnswers) * 100) : 0,
    }));

    return {
      questionId: question.id,
      questionText: question.text,
      questionType: question.type,
      distribution,
    };
  });
}

export function SurveyStatsPanel({
  questions,
  responses,
  totalResponses,
  completedResponses,
  partialResponses,
  completionRate,
}: SurveyStatsPanelProps) {
  const { t } = useLanguage();
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  const questionStats = useMemo(
    () => calculateQuestionStats(questions, responses),
    [questions, responses]
  );

  const toggleExpand = (questionId: string) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    return date.toLocaleString();
  };

  return (
    <div className="h-full overflow-y-auto p-4">
      {/* Top Statistics */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4">
        <h2 className="text-sm font-medium text-gray-500 mb-3">
          {t.analytics.statsOverview}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-2xl font-bold text-gray-900">{totalResponses}</div>
            <div className="text-sm text-gray-500">{t.analytics.totalResponses}</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{completedResponses}</div>
            <div className="text-sm text-gray-500">{t.analytics.completed}</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{completionRate}%</div>
            <div className="text-sm text-gray-500">{t.analytics.completionRate}</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">{partialResponses}</div>
            <div className="text-sm text-gray-500">{t.analytics.partial}</div>
          </div>
        </div>
      </div>

      {/* Question Statistics */}
      {questionStats.length === 0 ? (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center text-gray-500">
          {t.analytics.noResponses}
        </div>
      ) : (
        <div className="space-y-4">
          {questionStats.map((stat, index) => (
            <div
              key={stat.questionId}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <span className="text-sm text-gray-400 mr-2">Q{index + 1}</span>
                  <span className="font-medium text-gray-900">{stat.questionText}</span>
                </div>
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                  {t.preview.questionTypes[stat.questionType as keyof typeof t.preview.questionTypes] || stat.questionType}
                </span>
              </div>

              {stat.questionType === "text" ? (
                // Text question: show expand button
                <div>
                  <div className="text-sm text-gray-500 mb-2">
                    {stat.textResponses?.length || 0} {t.responses}
                  </div>
                  {stat.textResponses && stat.textResponses.length > 0 && (
                    <>
                      <button
                        onClick={() => toggleExpand(stat.questionId)}
                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        {expandedQuestions.has(stat.questionId)
                          ? t.analytics.collapseDetails
                          : t.analytics.expandDetails}
                        <svg
                          className={`w-4 h-4 transition-transform ${
                            expandedQuestions.has(stat.questionId) ? "rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                      {expandedQuestions.has(stat.questionId) && (
                        <div className="mt-3 border rounded-lg overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-2 text-left text-gray-600 font-medium">
                                  #
                                </th>
                                <th className="px-3 py-2 text-left text-gray-600 font-medium">
                                  {t.analytics.answer}
                                </th>
                                <th className="px-3 py-2 text-left text-gray-600 font-medium">
                                  {t.analytics.time}
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {stat.textResponses.map((resp, i) => (
                                <tr key={i} className="border-t">
                                  <td className="px-3 py-2 text-gray-500">
                                    #{stat.textResponses!.length - i}
                                  </td>
                                  <td className="px-3 py-2 text-gray-900">
                                    {resp.answer}
                                  </td>
                                  <td className="px-3 py-2 text-gray-500 whitespace-nowrap">
                                    {formatTime(resp.time)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                // Choice/rating question: show distribution
                <div className="space-y-2">
                  {stat.distribution.map((item) => (
                    <div key={item.option} className="flex items-center gap-3">
                      <div className="w-16 text-sm text-gray-600 truncate">
                        {item.option}
                      </div>
                      <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      <div className="w-12 text-sm text-gray-600 text-right">
                        {item.count}
                      </div>
                      <div className="w-12 text-sm text-gray-400 text-right">
                        {item.percentage}%
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
