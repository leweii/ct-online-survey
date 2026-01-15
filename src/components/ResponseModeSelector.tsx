"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import type { Survey, Question } from "@/types/database";

interface ResponseModeSelectorProps {
  survey: Survey;
  onSelectMode: (mode: "form" | "chat") => void;
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

        <div className="space-y-4">
          <button
            onClick={() => onSelectMode("form")}
            className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
          >
            <div className="font-semibold text-lg mb-1">{t.modes.formMode}</div>
            <div className="text-sm text-gray-600">{t.modes.formModeDesc}</div>
          </button>

          <button
            onClick={() => onSelectMode("chat")}
            className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
          >
            <div className="font-semibold text-lg mb-1">{t.modes.chatMode}</div>
            <div className="text-sm text-gray-600">{t.modes.chatModeDesc}</div>
          </button>
        </div>
      </div>
    </div>
  );
}
