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
      setError("请输入问卷代码或链接");
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
      setError("请输入您的创建者名称");
      return;
    }
    router.push(`/dashboard?code=${encodeURIComponent(creatorCode.trim())}`);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">问卷助手</h1>
          <p className="text-gray-600">
            通过自然对话创建和填写问卷
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
                通过 AI 对话来设计您的问卷
              </p>
              <button
                onClick={handleCreateSurvey}
                className="w-full py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
              >
                开始创建
              </button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">或</span>
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
                  placeholder="输入您的创建者名称（如：胖墩墩）"
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleViewDashboard}
                  className="w-full py-3 border border-gray-300 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition-colors"
                >
                  查看仪表盘
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600 text-center">
                输入问卷代码或链接开始填写
              </p>
              <input
                type="text"
                value={surveyId}
                onChange={(e) => {
                  setSurveyId(e.target.value);
                  setError("");
                }}
                placeholder="问卷代码（如：A7B2）或链接"
                className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleTakeSurvey}
                className="w-full py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
              >
                开始填写
              </button>
            </div>
          )}

          {error && (
            <p className="mt-4 text-red-500 text-sm text-center">{error}</p>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-gray-400 text-sm mt-8">
          由 AI 驱动，提供流畅的问卷体验
        </p>
      </div>
    </main>
  );
}
