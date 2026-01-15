"use client";

import { useLanguage } from "@/contexts/LanguageContext";

interface ModeSelectorProps {
  mode: "create" | "take";
  onModeChange: (mode: "create" | "take") => void;
}

export function ModeSelector({ mode, onModeChange }: ModeSelectorProps) {
  const { t } = useLanguage();

  return (
    <div className="flex bg-gray-100 p-1 rounded-full">
      <button
        onClick={() => onModeChange("create")}
        className={`flex-1 px-6 py-2 rounded-full text-sm font-medium transition-all ${
          mode === "create"
            ? "bg-white text-blue-600 shadow-sm"
            : "text-gray-600 hover:text-gray-800"
        }`}
      >
        {t.modes.createSurvey}
      </button>
      <button
        onClick={() => onModeChange("take")}
        className={`flex-1 px-6 py-2 rounded-full text-sm font-medium transition-all ${
          mode === "take"
            ? "bg-white text-blue-600 shadow-sm"
            : "text-gray-600 hover:text-gray-800"
        }`}
      >
        {t.modes.takeSurvey}
      </button>
    </div>
  );
}
