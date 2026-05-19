"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { SurveyStatus } from "@/types/database";

interface SurveyLike {
  id: string;
  shortCode?: string;
  short_code?: string;
  title: string;
  description?: string | null;
  status: SurveyStatus;
  questions: unknown[];
  createdAt?: string;
  updatedAt?: string;
}

interface SurveyCardProps {
  survey: SurveyLike;
  responseCount?: number;
  completedCount?: number;
  partialCount?: number;
  inProgressCount?: number;
  onExport?: () => void;
  onStatusChange?: (status: "draft" | "active" | "closed") => void;
  onAnalyze?: () => void;
  onEdit?: () => void;
}

function relativeTime(iso?: string): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 2) return "刚刚";
  if (mins < 60) return `${mins} 分钟前`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} 小时前`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} 天前`;
  return `${Math.floor(days / 30)} 个月前`;
}

export function SurveyCard({
  survey,
  responseCount = 0,
  completedCount = 0,
  inProgressCount = 0,
  onExport,
  onStatusChange,
  onAnalyze,
  onEdit,
}: SurveyCardProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const shortCode = survey.shortCode ?? survey.short_code;
  const surveyUrl = shortCode
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/survey/${shortCode}`
    : null;

  const handleCopyLink = () => {
    if (!surveyUrl) return;
    navigator.clipboard.writeText(surveyUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const statusColors: Record<SurveyStatus, string> = {
    draft: "bg-yellow-100 text-yellow-800",
    active: "bg-green-100 text-green-800",
    closed: "bg-gray-100 text-gray-600",
  };

  const statusLabels: Record<SurveyStatus, string> = {
    draft: t.card.draft,
    active: t.card.active,
    closed: t.card.closed,
  };

  const timeAgo = relativeTime(survey.updatedAt ?? survey.createdAt);
  const canEdit =
    survey.status === "draft" ||
    (survey.status === "active" && responseCount === 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      {/* Header: title + share icon + status badge */}
      <div className="flex items-start justify-between gap-3 mb-1">
        <h3 className="text-base font-semibold text-gray-900 line-clamp-2 flex-1">
          {survey.title}
        </h3>
        <div className="flex items-center gap-2 shrink-0">
          {survey.status === "active" && surveyUrl && (
            <button
              onClick={handleCopyLink}
              title={copied ? "已复制" : "复制分享链接"}
              className={`p-1.5 rounded-lg transition-colors ${
                copied
                  ? "bg-green-100 text-green-600"
                  : "text-gray-400 hover:text-blue-600 hover:bg-blue-50"
              }`}
            >
              {copied ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              )}
            </button>
          )}
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[survey.status]}`}
          >
            {statusLabels[survey.status]}
          </span>
        </div>
      </div>

      {/* Meta: question count + relative time */}
      <p className="text-xs text-gray-400 mb-3">
        {survey.questions.length} 道题
        {timeAgo && <> · 更新于 {timeAgo}</>}
      </p>

      {/* Description */}
      {survey.description && (
        <p className="text-gray-500 text-sm mb-4 line-clamp-2">{survey.description}</p>
      )}

      {/* Stats: 2-col (completed + in-progress) */}
      <div className="flex items-center py-3 px-4 bg-gray-50 rounded-lg mb-4 gap-4">
        <div className="text-center flex-1">
          <div className="text-xl font-bold text-green-600">{completedCount}</div>
          <div className="text-xs text-gray-500 mt-0.5">{t.card.completedResponses}</div>
        </div>
        <div className="h-8 w-px bg-gray-200" />
        <div className="text-center flex-1">
          <div className="text-xl font-bold text-yellow-500">{inProgressCount}</div>
          <div className="text-xs text-gray-500 mt-0.5">进行中</div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Primary: copy share link */}
        {surveyUrl && (
          <button
            onClick={handleCopyLink}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
              copied
                ? "bg-green-100 text-green-700"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                已复制
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {t.card.copyLink}
              </>
            )}
          </button>
        )}

        {/* Secondary: edit */}
        {onEdit && canEdit && (
          <button
            onClick={onEdit}
            className="px-3 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors"
          >
            {t.card.edit}
          </button>
        )}

        {/* Status change */}
        {onStatusChange && survey.status === "draft" && (
          <button
            onClick={() => onStatusChange("active")}
            className="px-3 py-2 border border-green-200 text-green-700 text-sm rounded-lg hover:bg-green-50 transition-colors"
          >
            {t.card.activate}
          </button>
        )}
        {onStatusChange && survey.status === "active" && (
          <button
            onClick={() => onStatusChange("closed")}
            className="px-3 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors"
          >
            {t.card.close}
          </button>
        )}
        {onStatusChange && survey.status === "closed" && (
          <button
            onClick={() => onStatusChange("active")}
            className="px-3 py-2 border border-green-200 text-green-700 text-sm rounded-lg hover:bg-green-50 transition-colors"
          >
            {t.card.reopen}
          </button>
        )}

        {/* Analyze */}
        {onAnalyze && responseCount > 0 && (
          <button
            onClick={onAnalyze}
            className="px-3 py-2 border border-purple-200 text-purple-700 text-sm rounded-lg hover:bg-purple-50 transition-colors"
          >
            {t.card.analyze}
          </button>
        )}

        {/* Export */}
        {onExport && responseCount > 0 && (
          <button
            onClick={onExport}
            className="px-3 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors"
          >
            {t.card.exportCSV}
          </button>
        )}
      </div>
    </div>
  );
}
