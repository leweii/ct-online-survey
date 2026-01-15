"use client";

import type { Survey, Question } from "@/types/database";

interface ResponseModeSelectorProps {
  survey: Survey;
  onSelectMode: (mode: "form" | "chat") => void;
}

export function ResponseModeSelector({
  survey,
  onSelectMode,
}: ResponseModeSelectorProps) {
  const questions = survey.questions as Question[];

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-2">{survey.title}</h1>
        {survey.description && (
          <p className="text-gray-600 mb-6">{survey.description}</p>
        )}
        <p className="text-sm text-gray-500 mb-8">
          {questions.length} question{questions.length !== 1 ? "s" : ""}
        </p>

        <div className="space-y-4">
          <button
            onClick={() => onSelectMode("form")}
            className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
          >
            <div className="font-semibold text-lg mb-1">Form Mode</div>
            <div className="text-sm text-gray-600">
              Answer all questions at once in a traditional form
            </div>
          </button>

          <button
            onClick={() => onSelectMode("chat")}
            className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
          >
            <div className="font-semibold text-lg mb-1">Chat Mode</div>
            <div className="text-sm text-gray-600">
              Answer questions one at a time with AI guidance
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
