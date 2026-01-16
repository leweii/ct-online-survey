"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SurveyCard } from "@/components/SurveyCard";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Survey } from "@/types/database";

const CREATOR_NAME_KEY = "survey_creator_name";

interface SurveyWithCount extends Survey {
  responseCount: number;
  completedCount: number;
  partialCount: number;
  inProgressCount: number;
}

export function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useLanguage();
  const creatorCode = searchParams.get("code") || "";

  const [surveys, setSurveys] = useState<SurveyWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [codeInput, setCodeInput] = useState(creatorCode);

  // Load creator name from localStorage if no code in URL
  useEffect(() => {
    if (!creatorCode) {
      const saved = localStorage.getItem(CREATOR_NAME_KEY);
      if (saved) {
        setCodeInput(saved);
      }
    }
  }, [creatorCode]);

  const fetchSurveys = useCallback(async (code: string) => {
    if (!code) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/surveys?creator_code=${encodeURIComponent(code)}`);
      if (!res.ok) throw new Error("Failed to fetch surveys");

      const data: Survey[] = await res.json();

      // Fetch response counts for each survey
      const surveysWithCounts = await Promise.all(
        data.map(async (survey) => {
          try {
            const resRes = await fetch(`/api/surveys/${survey.id}/responses`);
            const responses: Array<{ status: string }> = resRes.ok ? await resRes.json() : [];

            // Debug
            console.log(`Survey "${survey.title}" (${survey.id}): ${responses.length} responses`, responses.map(r => r.status));

            // 按状态分组计数
            const completedCount = responses.filter((r) => r.status === 'completed').length;
            const partialCount = responses.filter((r) => r.status === 'partial').length;
            const inProgressCount = responses.filter((r) => r.status === 'in_progress').length;

            return {
              ...survey,
              responseCount: responses.length,
              completedCount,
              partialCount,
              inProgressCount,
            };
          } catch {
            return { ...survey, responseCount: 0, completedCount: 0, partialCount: 0, inProgressCount: 0 };
          }
        })
      );

      setSurveys(surveysWithCounts);
    } catch {
      setError(t.survey.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [t.survey.loadFailed]);

  useEffect(() => {
    if (creatorCode) {
      fetchSurveys(creatorCode);
    } else {
      setLoading(false);
    }
  }, [creatorCode, fetchSurveys]);

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (codeInput.trim()) {
      router.push(`/dashboard?code=${encodeURIComponent(codeInput.trim())}`);
    }
  };

  const handleExport = async (surveyId: string) => {
    window.open(`/api/surveys/${surveyId}/export`, "_blank");
  };

  const handleStatusChange = async (
    surveyId: string,
    newStatus: "draft" | "active" | "closed"
  ) => {
    try {
      const res = await fetch(`/api/surveys/${surveyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setSurveys((prev) =>
          prev.map((s) => (s.id === surveyId ? { ...s, status: newStatus } : s))
        );
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  if (!creatorCode) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold text-center mb-6">{t.dashboard.title}</h1>
          <form onSubmit={handleCodeSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.dashboard.enterNameLabel}
              </label>
              <input
                type="text"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                placeholder={t.dashboard.namePlaceholder}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              {t.dashboard.viewSurveys}
            </button>
          </form>
          <button
            onClick={() => router.push("/")}
            className="w-full mt-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            {t.returnHome}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="text-gray-600 hover:text-gray-800"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-semibold">{t.dashboard.title}</h1>
              <p className="text-sm text-gray-500">{t.dashboard.name}{creatorCode}</p>
            </div>
          </div>
          <button
            onClick={() => router.push(`/create?creator=${encodeURIComponent(creatorCode)}`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t.dashboard.createSurvey}
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto p-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">{t.dashboard.loadingSurveys}</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
            <button
              onClick={() => fetchSurveys(creatorCode)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {t.retry}
            </button>
          </div>
        ) : surveys.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">{t.dashboard.noSurveysFound}</p>
            <button
              onClick={() => router.push(`/create?creator=${encodeURIComponent(creatorCode)}`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {t.dashboard.createFirst}
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {surveys.map((survey) => (
              <SurveyCard
                key={survey.id}
                survey={survey}
                responseCount={survey.responseCount}
                completedCount={survey.completedCount}
                partialCount={survey.partialCount}
                inProgressCount={survey.inProgressCount}
                onExport={() => handleExport(survey.id)}
                onStatusChange={(status) => handleStatusChange(survey.id, status)}
                onAnalyze={() => router.push(`/dashboard/chat?code=${encodeURIComponent(creatorCode)}&survey=${survey.id}`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
