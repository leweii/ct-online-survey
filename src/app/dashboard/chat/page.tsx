"use client";

import React, { useState, useEffect, useCallback, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { MessageBubble } from "@/components/MessageBubble";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface SurveyWithCounts {
  id: string;
  title: string;
  status: string;
  responseCounts?: {
    total: number;
    completed: number;
    partial: number;
    inProgress: number;
  };
}

function AnalyticsChatContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, language } = useLanguage();
  const creatorCode = searchParams.get("code") || "";
  const initialSurveyId = searchParams.get("survey") || "";

  const [surveys, setSurveys] = useState<SurveyWithCounts[]>([]);
  const [selectedSurveyId, setSelectedSurveyId] = useState<string>(initialSurveyId);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  // Track which surveys have been initialized to avoid re-fetching
  const initializedSurveys = useRef<Set<string>>(new Set());

  // Get selected survey
  const selectedSurvey = surveys.find(s => s.id === selectedSurveyId) || null;

  // Get stats from survey counts (no separate response fetching needed)
  const stats = selectedSurvey?.responseCounts ? {
    totalResponses: selectedSurvey.responseCounts.total,
    completedResponses: selectedSurvey.responseCounts.completed,
    partialResponses: selectedSurvey.responseCounts.partial,
    completionRate: selectedSurvey.responseCounts.total > 0
      ? Math.round((selectedSurvey.responseCounts.completed / selectedSurvey.responseCounts.total) * 100)
      : 0,
  } : null;

  // Fetch surveys with counts on mount (single optimized request)
  useEffect(() => {
    async function fetchData() {
      if (!creatorCode) {
        setLoading(false);
        return;
      }

      try {
        // Use optimized endpoint with counts - no N+1 queries
        const res = await fetch(`/api/surveys?creator_code=${encodeURIComponent(creatorCode)}&include=counts`);
        if (!res.ok) throw new Error("Failed to fetch surveys");
        const data = await res.json();
        setSurveys(data);

        // Auto-select first survey if none selected
        if (!initialSurveyId && data.length > 0) {
          setSelectedSurveyId(data[0].id);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [creatorCode, initialSurveyId]);

  // Fetch initial AI analysis when survey changes
  useEffect(() => {
    async function fetchInitialAnalysis() {
      if (!selectedSurvey) return;

      // Skip if already initialized for this survey
      if (initializedSurveys.current.has(selectedSurvey.id)) {
        return;
      }

      setIsInitializing(true);
      setMessages([]); // Clear previous messages

      try {
        const response = await fetch("/api/chat/analytics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: "",
            surveyId: selectedSurvey.id,
            language,
            isInit: true,
          }),
        });

        if (!response.ok) throw new Error("Failed to get initial analysis");

        const data = await response.json();

        setMessages([{
          id: "initial-analysis",
          role: "assistant",
          content: data.text,
        }]);

        // Mark this survey as initialized
        initializedSurveys.current.add(selectedSurvey.id);
      } catch (error) {
        console.error("Error fetching initial analysis:", error);
        // Fallback to static message on error
        setMessages([{
          id: "welcome",
          role: "assistant",
          content: t.analytics.welcomeMessage.replace("{title}", selectedSurvey.title),
        }]);
      } finally {
        setIsInitializing(false);
      }
    }

    // Only fetch if not currently loading data
    if (!loading && selectedSurvey) {
      fetchInitialAnalysis();
    }
  }, [selectedSurvey, loading, language, t.analytics.welcomeMessage]);

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading || !selectedSurvey) return;

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
          surveyId: selectedSurvey.id,
          language,
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
          content: t.analytics.analysisError,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, selectedSurvey, language, t.analytics.analysisError]);

  // Reset initialized surveys when language changes to get new analysis
  useEffect(() => {
    initializedSurveys.current.clear();
  }, [language]);

  if (!creatorCode) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-4">{t.analytics.needCreatorName}</h1>
          <p className="text-gray-600 mb-4">{t.analytics.accessFromDashboard}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {t.analytics.returnToDashboard}
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
          <p className="text-gray-600">{t.analytics.loadingData}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b px-4 py-3">
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
            <h1 className="text-lg font-semibold">{t.analytics.title}</h1>
          </div>
          {/* Survey Selector */}
          <select
            value={selectedSurveyId}
            onChange={(e) => setSelectedSurveyId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[200px]"
            disabled={isInitializing}
          >
            {surveys.length === 0 ? (
              <option value="">{t.analytics.noSurveys}</option>
            ) : (
              surveys.map(survey => (
                <option key={survey.id} value={survey.id}>
                  {survey.title}
                </option>
              ))
            )}
          </select>
        </div>
      </header>

      {/* Stats Card */}
      {stats && selectedSurvey && (
        <div className="max-w-4xl mx-auto w-full px-4 py-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h2 className="text-sm font-medium text-gray-500 mb-3">
              {selectedSurvey.title} - {t.analytics.statsOverview}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalResponses}</div>
                <div className="text-sm text-gray-500">{t.analytics.totalResponses}</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.completedResponses}</div>
                <div className="text-sm text-gray-500">{t.analytics.completed}</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.completionRate}%</div>
                <div className="text-sm text-gray-500">{t.analytics.completionRate}</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.partialResponses}</div>
                <div className="text-sm text-gray-500">{t.analytics.todayNew}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No survey selected or no responses */}
      {!selectedSurvey && surveys.length > 0 && (
        <div className="max-w-4xl mx-auto w-full px-4 py-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
            <p className="text-yellow-800">{t.analytics.selectSurvey}</p>
          </div>
        </div>
      )}

      {surveys.length === 0 && (
        <div className="max-w-4xl mx-auto w-full px-4 py-4">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
            <p className="text-gray-600">{t.analytics.noSurveyData}</p>
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4">
        <div className="max-w-4xl mx-auto py-4">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              role={message.role}
              content={message.content}
              aiLabel={t.chat.analystLabel}
            />
          ))}
          {(isLoading || isInitializing) && (
            <div className="py-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">🤖</span>
                <span className="text-sm font-medium text-gray-700">{t.chat.analystLabel}</span>
              </div>
              <div className="pl-7 flex items-center gap-2 text-gray-500">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span className="text-sm">
                  {isInitializing ? t.analytics.analyzing : t.chat.aiThinking}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t bg-white p-4">
        <div className="max-w-4xl mx-auto flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isLoading && !isInitializing && selectedSurvey) {
                handleSendMessage();
              }
            }}
            placeholder={selectedSurvey ? t.analytics.inputPlaceholder : t.analytics.selectFirst}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 text-sm"
            disabled={!selectedSurvey}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || isInitializing || !inputValue.trim() || !selectedSurvey}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {t.send}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsChatPage() {
  const { t } = useLanguage();

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">{t.loading}</p>
        </div>
      </div>
    }>
      <AnalyticsChatContent />
    </Suspense>
  );
}
