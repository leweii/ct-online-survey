"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { Survey, Response as SurveyResponse } from "@/types/database";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface Stats {
  totalSurveys: number;
  totalResponses: number;
  completedResponses: number;
  partialResponses: number;
  completionRate: number;
  todayResponses: number;
}

function AnalyticsChatContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const creatorCode = searchParams.get("code") || "";

  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    async function fetchData() {
      if (!creatorCode) {
        setLoading(false);
        return;
      }

      try {
        // Fetch surveys
        const surveysRes = await fetch(`/api/surveys?creator_code=${encodeURIComponent(creatorCode)}`);
        if (!surveysRes.ok) throw new Error("Failed to fetch surveys");
        const surveysData: Survey[] = await surveysRes.json();
        setSurveys(surveysData);

        // Fetch responses for each survey
        const allResponses: SurveyResponse[] = [];
        for (const survey of surveysData) {
          try {
            const resRes = await fetch(`/api/surveys/${survey.id}/responses`);
            if (resRes.ok) {
              const responsesData = await resRes.json();
              allResponses.push(...responsesData);
            }
          } catch {
            // Continue with other surveys
          }
        }
        setResponses(allResponses);

        // Calculate stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayResponses = allResponses.filter(r => {
          const responseDate = new Date(r.started_at);
          return responseDate >= today;
        }).length;

        const completedResponses = allResponses.filter(r => r.status === "completed").length;
        const partialResponses = allResponses.filter(r => r.status === "partial").length;

        setStats({
          totalSurveys: surveysData.length,
          totalResponses: allResponses.length,
          completedResponses,
          partialResponses,
          completionRate: allResponses.length > 0
            ? Math.round((completedResponses / allResponses.length) * 100)
            : 0,
          todayResponses,
        });

        // Add welcome message
        setMessages([
          {
            id: "welcome",
            role: "assistant",
            content: `您好！我是数据分析助手。根据您的问卷数据，我可以帮您分析：\n\n- 问卷回复统计\n- 各问题的回答分布\n- 数据趋势分析\n\n您可以尝试问我：\n- "哪个问卷回复最多？"\n- "今天收到了多少回复？"\n- "回复完成率如何？"`,
          },
        ]);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [creatorCode]);

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          creatorCode,
          context: {
            surveys: surveys.map(s => ({
              id: s.id,
              title: s.title,
              questions: s.questions,
              status: s.status,
            })),
            responses: responses.map(r => ({
              survey_id: r.survey_id,
              answers: r.answers,
              status: r.status,
              started_at: r.started_at,
            })),
            stats,
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();

      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString() + "-assistant",
          role: "assistant",
          content: data.text,
        },
      ]);
    } catch (error) {
      console.error("Error:", error);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString() + "-error",
          role: "assistant",
          content: "抱歉，分析数据时遇到了问题。请重试。",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, creatorCode, surveys, responses, stats]);

  if (!creatorCode) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-4">需要创建者代码</h1>
          <p className="text-gray-600 mb-4">请从仪表盘进入数据分析页面</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            返回仪表盘
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">加载数据中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/dashboard?code=${encodeURIComponent(creatorCode)}`)}
              className="text-gray-600 hover:text-gray-800"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold">数据分析助手</h1>
          </div>
        </div>
      </header>

      {/* Stats Card */}
      {stats && (
        <div className="max-w-4xl mx-auto w-full px-4 py-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h2 className="text-sm font-medium text-gray-500 mb-3">统计概览</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalSurveys}</div>
                <div className="text-sm text-gray-500">问卷总数</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalResponses}</div>
                <div className="text-sm text-gray-500">回复总数</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.completionRate}%</div>
                <div className="text-sm text-gray-500">完成率</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.todayResponses}</div>
                <div className="text-sm text-gray-500">今日新增</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4">
        <div className="max-w-4xl mx-auto space-y-4 py-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-gray-200"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t bg-white p-4">
        <div className="max-w-4xl mx-auto flex gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isLoading) {
                handleSendMessage();
              }
            }}
            placeholder="输入您的问题..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    }>
      <AnalyticsChatContent />
    </Suspense>
  );
}
