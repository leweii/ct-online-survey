"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import type { Survey, Question } from "@/types/database";

interface ResponseModeSelectorProps {
  survey: Survey;
  onSelectMode: (mode: "form") => void;
}

export function ResponseModeSelector({
  survey,
  onSelectMode,
}: ResponseModeSelectorProps) {
  const { t } = useLanguage();
  const questions = survey.questions as Question[];

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-2">{survey.title}</h1>
        {survey.description && (
          <p className="text-gray-600 mb-6">{survey.description}</p>
        )}
        <p className="text-sm text-gray-500 mb-8">
          {t.modes.totalQuestions.replace("{count}", String(questions.length))}
        </p>

        <button
          onClick={() => onSelectMode("form")}
          className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
        >
          {t.modes.startSurvey}
        </button>
      </div>
    </div>
  );
}
