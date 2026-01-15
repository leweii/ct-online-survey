"use client";

import type { Survey } from "@/types/database";

interface SurveyCardProps {
  survey: Survey;
  responseCount?: number;
  onExport?: () => void;
  onStatusChange?: (status: "draft" | "active" | "closed") => void;
}

export function SurveyCard({
  survey,
  responseCount = 0,
  onExport,
  onStatusChange,
}: SurveyCardProps) {
  const statusColors = {
    draft: "bg-yellow-100 text-yellow-800",
    active: "bg-green-100 text-green-800",
    closed: "bg-gray-100 text-gray-800",
  };

  const statusLabels = {
    draft: "草稿",
    active: "进行中",
    closed: "已关闭",
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
          {survey.title}
        </h3>
        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
            statusColors[survey.status]
          }`}
        >
          {statusLabels[survey.status]}
        </span>
      </div>

      {survey.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {survey.description}
        </p>
      )}

      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <span>{survey.questions.length} 个问题</span>
        <span>{responseCount} 条回复</span>
      </div>

      <div className="flex gap-2 flex-wrap">
        {onStatusChange && survey.status === "draft" && (
          <button
            onClick={() => onStatusChange("active")}
            className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
          >
            激活
          </button>
        )}
        {onStatusChange && survey.status === "active" && (
          <button
            onClick={() => onStatusChange("closed")}
            className="px-3 py-1.5 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors"
          >
            关闭
          </button>
        )}
        {onExport && responseCount > 0 && (
          <button
            onClick={onExport}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
          >
            导出 CSV
          </button>
        )}
        <button
          onClick={() => {
            const url = `${window.location.origin}/survey/${survey.id}`;
            navigator.clipboard.writeText(url);
          }}
          className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 transition-colors"
        >
          复制链接
        </button>
      </div>
    </div>
  );
}
