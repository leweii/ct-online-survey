"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ModeSelector } from "@/components/ModeSelector";

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<"create" | "take">("create");
  const [surveyId, setSurveyId] = useState("");
  const [creatorCode, setCreatorCode] = useState("");
  const [error, setError] = useState("");

  const handleCreateSurvey = () => {
    router.push("/create");
  };

  const handleTakeSurvey = () => {
    if (!surveyId.trim()) {
      setError("Please enter a survey ID or link");
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
    if (!creatorCode.trim()) {
      setError("Please enter your creator code");
      return;
    }
    router.push(`/dashboard?code=${encodeURIComponent(creatorCode.trim())}`);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Survey Bot</h1>
          <p className="text-gray-600">
            Create and take surveys through natural conversation
          </p>
        </div>

        {/* Mode Selector */}
        <div className="mb-8">
          <ModeSelector mode={mode} onModeChange={setMode} />
        </div>

        {/* Content based on mode */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {mode === "create" ? (
            <div className="space-y-4">
              <p className="text-gray-600 text-center">
                Start a conversation to design your survey with AI assistance
              </p>
              <button
                onClick={handleCreateSurvey}
                className="w-full py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
              >
                Start Creating
              </button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>
              <div className="space-y-2">
                <input
                  type="text"
                  value={creatorCode}
                  onChange={(e) => {
                    setCreatorCode(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter your creator code"
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleViewDashboard}
                  className="w-full py-3 border border-gray-300 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition-colors"
                >
                  View Dashboard
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600 text-center">
                Enter a survey link or ID to start responding
              </p>
              <input
                type="text"
                value={surveyId}
                onChange={(e) => {
                  setSurveyId(e.target.value);
                  setError("");
                }}
                placeholder="Survey ID or link"
                className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleTakeSurvey}
                className="w-full py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
              >
                Start Survey
              </button>
            </div>
          )}

          {error && (
            <p className="mt-4 text-red-500 text-sm text-center">{error}</p>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-gray-400 text-sm mt-8">
          Powered by AI for seamless survey experiences
        </p>
      </div>
    </main>
  );
}
