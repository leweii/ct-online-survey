"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SurveyCard } from "@/components/SurveyCard";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Survey } from "@/types/database";

interface SurveyWithCount extends Survey {
  responseCount: number;
  completedCount: number;
  partialCount: number;
  inProgressCount: number;
}

type StatusFilter = "all" | "active" | "draft" | "closed";

export function DashboardContent() {
  const router = useRouter();
  const { t } = useLanguage();

  const [email, setEmail] = useState<string | null>(null);
  const [surveys, setSurveys] = useState<SurveyWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [signingOut, setSigningOut] = useState(false);

  const fetchSurveys = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/surveys?include=counts");
      if (res.status === 401) {
        router.push("/login?next=/dashboard");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch surveys");
      const data = await res.json();
      const mapped = data.map((survey: any) => ({
        ...survey,
        id: survey.id ?? survey.surveyId,
        responseCount: survey.responseCounts?.total ?? 0,
        completedCount: survey.responseCounts?.completed ?? 0,
        partialCount: survey.responseCounts?.partial ?? 0,
        inProgressCount: survey.responseCounts?.inProgress ?? 0,
      }));
      setSurveys(mapped);
    } catch {
      setError(t.survey.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [router, t.survey.loadFailed]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => setEmail(data?.user?.email ?? null))
      .catch(() => setEmail(null));
    fetchSurveys();
  }, [fetchSurveys]);

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
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } finally {
      setSigningOut(false);
    }
  };

  const filteredSurveys = surveys.filter(
    (s) => statusFilter === "all" || s.status === statusFilter
  );

  const counts = {
    all: surveys.length,
    active: surveys.filter((s) => s.status === "active").length,
    draft: surveys.filter((s) => s.status === "draft").length,
    closed: surveys.filter((s) => s.status === "closed").length,
  };

  const totalResponses = surveys.reduce((sum, s) => sum + s.responseCount, 0);

  const filterTabs: { key: StatusFilter; label: string }[] = [
    { key: "all", label: t.dashboard.filterAll },
    { key: "active", label: t.card.active },
    { key: "draft", label: t.card.draft },
    { key: "closed", label: t.card.closed },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">畅谈问卷</h1>
            {email && <p className="text-xs text-gray-400 mt-0.5">{email}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/create")}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t.dashboard.createSurvey}
            </button>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
            >
              {signingOut ? "…" : t.home.signOut}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500 text-sm">{t.dashboard.loadingSurveys}</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={fetchSurveys}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              {t.retry}
            </button>
          </div>
        ) : surveys.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-600 mb-2 font-medium">{t.dashboard.noSurveysFound}</p>
            <p className="text-gray-400 text-sm mb-6">用AI来设计你的第一份问卷吧</p>
            <button
              onClick={() => router.push("/create")}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              {t.dashboard.createFirst}
            </button>
          </div>
        ) : (
          <>
            {/* Stats summary */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
                <div className="text-2xl font-bold text-gray-900">{surveys.length}</div>
                <div className="text-xs text-gray-500 mt-0.5">问卷总数</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
                <div className="text-2xl font-bold text-green-600">{counts.active}</div>
                <div className="text-xs text-gray-500 mt-0.5">进行中</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
                <div className="text-2xl font-bold text-blue-600">{totalResponses}</div>
                <div className="text-xs text-gray-500 mt-0.5">累计回复</div>
              </div>
            </div>

            {/* Filter tabs */}
            <div className="flex items-center gap-1 mb-5 bg-gray-100 rounded-lg p-1 w-fit">
              {filterTabs.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                    statusFilter === key
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {label}
                  {counts[key] > 0 && (
                    <span className={`ml-1.5 text-xs ${statusFilter === key ? "text-blue-600" : "text-gray-400"}`}>
                      {counts[key]}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {filteredSurveys.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                该分类下暂无问卷
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {filteredSurveys.map((survey) => (
                  <SurveyCard
                    key={survey.id}
                    survey={survey}
                    responseCount={survey.responseCount}
                    completedCount={survey.completedCount}
                    partialCount={survey.partialCount}
                    inProgressCount={survey.inProgressCount}
                    onExport={() => handleExport(survey.id)}
                    onStatusChange={(status) => handleStatusChange(survey.id, status)}
                    onAnalyze={() => router.push(`/dashboard/chat?survey=${survey.id}`)}
                    onEdit={() => router.push(`/create?edit=${survey.id}`)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
