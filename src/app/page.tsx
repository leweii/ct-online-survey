"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ModeSelector } from "@/components/ModeSelector";
import { useLanguage } from "@/contexts/LanguageContext";

const CREATOR_NAME_KEY = "survey_creator_name";

export default function Home() {
  const router = useRouter();
  const { t } = useLanguage();
  const [mode, setMode] = useState<"create" | "take">("create");
  const [surveyId, setSurveyId] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [error, setError] = useState("");

  // Load creator name from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(CREATOR_NAME_KEY);
    if (saved) {
      setCreatorName(saved);
    }
  }, []);

  // Save creator name to localStorage when it changes
  const handleCreatorNameChange = (value: string) => {
    setCreatorName(value);
    setError("");
    if (value.trim()) {
      localStorage.setItem(CREATOR_NAME_KEY, value.trim());
    }
  };

  const handleCreateSurvey = () => {
    // Pass creator name to create page if set
    if (creatorName.trim()) {
      localStorage.setItem(CREATOR_NAME_KEY, creatorName.trim());
      router.push(`/create?creator=${encodeURIComponent(creatorName.trim())}`);
    } else {
      router.push("/create");
    }
  };

  const handleTakeSurvey = () => {
    if (!surveyId.trim()) {
      setError(t.home.enterCodeError);
      return;
    }
    // Extract ID from URL if full URL is pasted
    let id = surveyId.trim();
    if (id.includes("/survey/")) {
      id = id.split("/survey/").pop() || "";
    }
    if (id) {
      router.push(`/survey/${id}`);
    }
  };

  const handleViewDashboard = () => {
    if (!creatorName.trim()) {
      setError(t.home.enterNameError);
      return;
    }
    localStorage.setItem(CREATOR_NAME_KEY, creatorName.trim());
    router.push(`/dashboard?code=${encodeURIComponent(creatorName.trim())}`);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{t.home.title}</h1>
          <p className="text-gray-600">{t.home.subtitle}</p>
        </div>

        {/* Mode Selector */}
        <div className="mb-6">
          <ModeSelector mode={mode} onModeChange={setMode} />
        </div>

        {/* Content based on mode */}
        <div className="bg-white rounded-2xl shadow-lg p-6 min-h-[280px]">
          {mode === "create" ? (
            <div className="space-y-4">
              {/* Creator Name Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.home.creatorNameLabel}
                </label>
                <input
                  type="text"
                  value={creatorName}
                  onChange={(e) => handleCreatorNameChange(e.target.value)}
                  placeholder={t.home.creatorNamePlaceholder}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">{t.home.creatorNameHint}</p>
              </div>
              <button
                onClick={handleCreateSurvey}
                className="w-full py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
              >
                {t.home.startCreate}
              </button>
              {creatorName && (
                <button
                  onClick={handleViewDashboard}
                  className="w-full py-3 border border-gray-300 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition-colors"
                >
                  {t.home.viewDashboard}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600 text-center">{t.home.takeDescription}</p>
              <input
                type="text"
                value={surveyId}
                onChange={(e) => {
                  setSurveyId(e.target.value);
                  setError("");
                }}
                placeholder={t.home.surveyCodePlaceholder}
                className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleTakeSurvey}
                className="w-full py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
              >
                {t.home.startFill}
              </button>
            </div>
          )}

          {error && (
            <p className="mt-4 text-red-500 text-sm text-center">{error}</p>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-gray-400 text-sm mt-8">{t.home.footer}</p>
      </div>
    </main>
  );
}
