"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import type { Survey } from "@/types/database";

interface SurveyCardProps {
  survey: Survey;
  responseCount?: number;
  completedCount?: number;
  partialCount?: number;
  inProgressCount?: number;
  onExport?: () => void;
  onStatusChange?: (status: "draft" | "active" | "closed") => void;
  onAnalyze?: () => void;
  onEdit?: () => void;
}

export function SurveyCard({
  survey,
  responseCount = 0,
  completedCount = 0,
  partialCount = 0,
  inProgressCount = 0,
  onExport,
  onStatusChange,
  onAnalyze,
  onEdit,
}: SurveyCardProps) {
  const { t } = useLanguage();

  const statusColors = {
    draft: "bg-yellow-100 text-yellow-800",
    active: "bg-green-100 text-green-800",
    closed: "bg-gray-100 text-gray-800",
  };

  const statusLabels = {
    draft: t.card.draft,
    active: t.card.active,
    closed: t.card.closed,
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      {/* Header: Title + Status */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 min-w-0 pr-3">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
            {survey.title}
          </h3>
          <p className="text-sm text-gray-500 mt-1 font-mono">
            ID: {survey.short_code}
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 ${
            statusColors[survey.status]
          }`}
        >
          {statusLabels[survey.status]}
        </span>
      </div>

      {/* Description */}
      {survey.description && (
        <p className="text-gray-600 text-sm mb-5 line-clamp-2">
          {survey.description}
        </p>
      )}

      {/* Stats Row */}
      <div className="flex items-center justify-between py-4 px-4 bg-gray-50 rounded-lg mb-5">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{survey.questions.length}</div>
          <div className="text-xs text-gray-500">{t.questions}</div>
        </div>
        <div className="h-8 w-px bg-gray-200" />
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{completedCount}</div>
          <div className="text-xs text-gray-500">{t.card.completedResponses}</div>
        </div>
        <div className="h-8 w-px bg-gray-200" />
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">{partialCount}</div>
          <div className="text-xs text-gray-500">{t.card.partialResponses}</div>
        </div>
        <div className="h-8 w-px bg-gray-200" />
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-400">{inProgressCount}</div>
          <div className="text-xs text-gray-500">{t.card.inProgressResponses}</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 flex-wrap">
        {onEdit && survey.status === "draft" && (
          <button
            onClick={onEdit}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t.card.edit}
          </button>
        )}
        {onStatusChange && survey.status === "draft" && (
          <button
            onClick={() => onStatusChange("active")}
            className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
          >
            {t.card.activate}
          </button>
        )}
        {onStatusChange && survey.status === "active" && (
          <button
            onClick={() => onStatusChange("closed")}
            className="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
          >
            {t.card.close}
          </button>
        )}
        {onAnalyze && responseCount > 0 && (
          <button
            onClick={onAnalyze}
            className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
          >
            {t.card.analyze}
          </button>
        )}
        {onExport && responseCount > 0 && (
          <button
            onClick={onExport}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t.card.exportCSV}
          </button>
        )}
        <button
          onClick={() => {
            const url = `${window.location.origin}/survey/${survey.short_code}`;
            navigator.clipboard.writeText(url);
          }}
          className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
        >
          {t.card.copyLink}
        </button>
      </div>
    </div>
  );
}
