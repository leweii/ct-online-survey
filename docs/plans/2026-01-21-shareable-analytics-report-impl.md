# Shareable Analytics Report Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add split-screen layout to analytics page with chat on left and data summary on right, enabling public sharing.

**Architecture:** Modify existing `/dashboard/chat` page to use 40/60 split layout. Create new `SurveyStatsPanel` component for data display. Remove creator code validation to allow public access.

**Tech Stack:** Next.js 14, React, Tailwind CSS, TypeScript

---

## Task 1: Add Translation Keys

**Files:**
- Modify: `src/lib/translations.ts`

**Step 1: Add new translation keys for stats panel and share feature**

Add to both `en` and `zh` sections inside the `analytics` object:

```typescript
// In en.analytics (after line 135):
share: "Share",
shareTitle: "Share Analytics Report",
shareDescription: "Anyone with the link can view this report and chat with the AI analyst",
copyLink: "Copy Link",
linkCopied: "Link copied!",
statsPanel: "Data Summary",
question: "Question",
option: "Option",
count: "Count",
percentage: "Percentage",
expandDetails: "View Details",
collapseDetails: "Hide Details",
answer: "Answer",
time: "Time",
noResponses: "No responses yet",
partial: "Partial",

// In zh.analytics (after line 348):
share: "分享",
shareTitle: "分享分析报告",
shareDescription: "任何有链接的人都可以查看此报告并与 AI 分析师对话",
copyLink: "复制链接",
linkCopied: "链接已复制！",
statsPanel: "数据汇总",
question: "题目",
option: "选项",
count: "数量",
percentage: "占比",
expandDetails: "查看详情",
collapseDetails: "收起详情",
answer: "回答",
time: "时间",
noResponses: "暂无回复",
partial: "部分完成",
```

**Step 2: Run build to verify no type errors**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/lib/translations.ts
git commit -m "feat: add translation keys for stats panel and share feature"
```

---

## Task 2: Create SurveyStatsPanel Component

**Files:**
- Create: `src/components/SurveyStatsPanel.tsx`

**Step 1: Create the component file**

```typescript
"use client";

import React, { useState, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Question, Response } from "@/types/database";

interface QuestionStats {
  questionId: string;
  questionText: string;
  questionType: string;
  distribution: { option: string; count: number; percentage: number }[];
  textResponses?: { answer: string; time: string }[];
}

interface SurveyStatsPanelProps {
  questions: Question[];
  responses: Response[];
  totalResponses: number;
  completedResponses: number;
  partialResponses: number;
  completionRate: number;
}

function calculateQuestionStats(
  questions: Question[],
  responses: Response[]
): QuestionStats[] {
  return questions.map((question) => {
    const answers = responses
      .map((r) => r.answers[question.id])
      .filter((a) => a !== undefined && a !== null && a !== "");

    const totalAnswers = answers.length;

    if (question.type === "text") {
      // For text questions, collect all responses
      const textResponses = responses
        .filter((r) => r.answers[question.id])
        .map((r) => ({
          answer: String(r.answers[question.id]),
          time: r.completed_at || r.started_at,
        }))
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

      return {
        questionId: question.id,
        questionText: question.text,
        questionType: question.type,
        distribution: [],
        textResponses,
      };
    }

    // For choice/rating questions, calculate distribution
    const countMap: Record<string, number> = {};

    if (question.type === "rating" || question.type === "slider") {
      // Rating: 1-5 or custom range
      const min = question.validation?.min || 1;
      const max = question.validation?.max || 5;
      for (let i = max; i >= min; i--) {
        countMap[String(i)] = 0;
      }
    } else if (question.type === "yes_no") {
      countMap["yes"] = 0;
      countMap["no"] = 0;
    } else if (question.options) {
      question.options.forEach((opt) => {
        countMap[opt] = 0;
      });
    }

    answers.forEach((answer) => {
      if (question.type === "multi_select" && Array.isArray(answer)) {
        answer.forEach((a) => {
          const key = String(a);
          countMap[key] = (countMap[key] || 0) + 1;
        });
      } else {
        const key = String(answer);
        countMap[key] = (countMap[key] || 0) + 1;
      }
    });

    const distribution = Object.entries(countMap).map(([option, count]) => ({
      option,
      count,
      percentage: totalAnswers > 0 ? Math.round((count / totalAnswers) * 100) : 0,
    }));

    return {
      questionId: question.id,
      questionText: question.text,
      questionType: question.type,
      distribution,
    };
  });
}

export function SurveyStatsPanel({
  questions,
  responses,
  totalResponses,
  completedResponses,
  partialResponses,
  completionRate,
}: SurveyStatsPanelProps) {
  const { t } = useLanguage();
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  const questionStats = useMemo(
    () => calculateQuestionStats(questions, responses),
    [questions, responses]
  );

  const toggleExpand = (questionId: string) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    return date.toLocaleString();
  };

  return (
    <div className="h-full overflow-y-auto p-4">
      {/* Top Statistics */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4">
        <h2 className="text-sm font-medium text-gray-500 mb-3">
          {t.analytics.statsOverview}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-2xl font-bold text-gray-900">{totalResponses}</div>
            <div className="text-sm text-gray-500">{t.analytics.totalResponses}</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{completedResponses}</div>
            <div className="text-sm text-gray-500">{t.analytics.completed}</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{completionRate}%</div>
            <div className="text-sm text-gray-500">{t.analytics.completionRate}</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">{partialResponses}</div>
            <div className="text-sm text-gray-500">{t.analytics.partial}</div>
          </div>
        </div>
      </div>

      {/* Question Statistics */}
      {questionStats.length === 0 ? (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center text-gray-500">
          {t.analytics.noResponses}
        </div>
      ) : (
        <div className="space-y-4">
          {questionStats.map((stat, index) => (
            <div
              key={stat.questionId}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <span className="text-sm text-gray-400 mr-2">Q{index + 1}</span>
                  <span className="font-medium text-gray-900">{stat.questionText}</span>
                </div>
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                  {t.preview.questionTypes[stat.questionType as keyof typeof t.preview.questionTypes] || stat.questionType}
                </span>
              </div>

              {stat.questionType === "text" ? (
                // Text question: show expand button
                <div>
                  <div className="text-sm text-gray-500 mb-2">
                    {stat.textResponses?.length || 0} {t.responses}
                  </div>
                  {stat.textResponses && stat.textResponses.length > 0 && (
                    <>
                      <button
                        onClick={() => toggleExpand(stat.questionId)}
                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        {expandedQuestions.has(stat.questionId)
                          ? t.analytics.collapseDetails
                          : t.analytics.expandDetails}
                        <svg
                          className={`w-4 h-4 transition-transform ${
                            expandedQuestions.has(stat.questionId) ? "rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                      {expandedQuestions.has(stat.questionId) && (
                        <div className="mt-3 border rounded-lg overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-2 text-left text-gray-600 font-medium">
                                  #
                                </th>
                                <th className="px-3 py-2 text-left text-gray-600 font-medium">
                                  {t.analytics.answer}
                                </th>
                                <th className="px-3 py-2 text-left text-gray-600 font-medium">
                                  {t.analytics.time}
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {stat.textResponses.map((resp, i) => (
                                <tr key={i} className="border-t">
                                  <td className="px-3 py-2 text-gray-500">
                                    #{stat.textResponses!.length - i}
                                  </td>
                                  <td className="px-3 py-2 text-gray-900">
                                    {resp.answer}
                                  </td>
                                  <td className="px-3 py-2 text-gray-500 whitespace-nowrap">
                                    {formatTime(resp.time)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                // Choice/rating question: show distribution
                <div className="space-y-2">
                  {stat.distribution.map((item) => (
                    <div key={item.option} className="flex items-center gap-3">
                      <div className="w-16 text-sm text-gray-600 truncate">
                        {item.option}
                      </div>
                      <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      <div className="w-12 text-sm text-gray-600 text-right">
                        {item.count}
                      </div>
                      <div className="w-12 text-sm text-gray-400 text-right">
                        {item.percentage}%
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Run build to verify no type errors**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/components/SurveyStatsPanel.tsx
git commit -m "feat: create SurveyStatsPanel component for data visualization"
```

---

## Task 3: Create ShareModal Component

**Files:**
- Create: `src/components/ShareModal.tsx`

**Step 1: Create the share modal component**

```typescript
"use client";

import React, { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
}

export function ShareModal({ isOpen, onClose, url }: ShareModalProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{t.analytics.shareTitle}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4">
          {t.analytics.shareDescription}
        </p>

        {/* URL Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={url}
            readOnly
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-600"
          />
          <button
            onClick={handleCopy}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              copied
                ? "bg-green-600 text-white"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {copied ? t.analytics.linkCopied : t.analytics.copyLink}
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Run build to verify no type errors**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/components/ShareModal.tsx
git commit -m "feat: create ShareModal component for sharing analytics links"
```

---

## Task 4: Update Analytics Chat Page with Split Layout

**Files:**
- Modify: `src/app/dashboard/chat/page.tsx`

**Step 1: Add imports and state for new features**

At the top of the file, add new imports after line 6:

```typescript
import { SurveyStatsPanel } from "@/components/SurveyStatsPanel";
import { ShareModal } from "@/components/ShareModal";
import type { Question, Response as SurveyResponse } from "@/types/database";
```

**Step 2: Add new state variables in AnalyticsChatContent**

After line 39 (`const [isInitializing, setIsInitializing] = useState(false);`), add:

```typescript
const [surveyQuestions, setSurveyQuestions] = useState<Question[]>([]);
const [surveyResponses, setSurveyResponses] = useState<SurveyResponse[]>([]);
const [isShareModalOpen, setIsShareModalOpen] = useState(false);
const [activeTab, setActiveTab] = useState<"chat" | "data">("chat");
```

**Step 3: Add effect to fetch survey details and responses**

After the existing `useEffect` for initial analysis (around line 140), add:

```typescript
// Fetch survey questions and responses when survey changes
useEffect(() => {
  async function fetchSurveyData() {
    if (!selectedSurveyId) {
      setSurveyQuestions([]);
      setSurveyResponses([]);
      return;
    }

    try {
      const [surveyRes, responsesRes] = await Promise.all([
        fetch(`/api/surveys/${selectedSurveyId}`),
        fetch(`/api/surveys/${selectedSurveyId}/responses`),
      ]);

      if (surveyRes.ok) {
        const surveyData = await surveyRes.json();
        setSurveyQuestions(surveyData.questions || []);
      }

      if (responsesRes.ok) {
        const responsesData = await responsesRes.json();
        setSurveyResponses(responsesData || []);
      }
    } catch (error) {
      console.error("Error fetching survey data:", error);
    }
  }

  fetchSurveyData();
}, [selectedSurveyId]);
```

**Step 4: Remove creator code validation**

Replace lines 198-213 (the `if (!creatorCode)` block) with just allowing access:

```typescript
// Allow public access - no creator code validation needed
```

**Step 5: Update the return JSX for split layout**

Replace the entire return statement (from line 226 onwards) with:

```typescript
return (
  <div className="h-screen flex flex-col bg-gray-50">
    {/* Header */}
    <header className="sticky top-0 z-10 bg-white border-b px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          {creatorCode && (
            <button
              onClick={() => router.push(`/dashboard?code=${encodeURIComponent(creatorCode)}`)}
              className="text-gray-600 hover:text-gray-800"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <h1 className="text-lg font-semibold">{t.analytics.title}</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Survey Selector */}
          <select
            value={selectedSurveyId}
            onChange={(e) => setSelectedSurveyId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[200px]"
            disabled={isInitializing}
          >
            {surveys.length === 0 ? (
              <option value="">{t.analytics.noSurveys}</option>
            ) : (
              surveys.map(survey => (
                <option key={survey.id} value={survey.id}>
                  {survey.title}
                </option>
              ))
            )}
          </select>

          {/* Share Button */}
          {selectedSurveyId && (
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              {t.analytics.share}
            </button>
          )}
        </div>
      </div>
    </header>

    {/* Mobile Tab Selector */}
    <div className="md:hidden border-b bg-white">
      <div className="flex">
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "chat"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500"
          }`}
        >
          {t.chat.analystLabel}
        </button>
        <button
          onClick={() => setActiveTab("data")}
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "data"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500"
          }`}
        >
          {t.analytics.statsPanel}
        </button>
      </div>
    </div>

    {/* Main Content */}
    <div className="flex-1 flex overflow-hidden">
      {/* Chat Panel - 40% on desktop, full on mobile when active */}
      <div className={`${
        activeTab === "chat" ? "flex" : "hidden"
      } md:flex md:w-[40%] flex-col border-r border-gray-200 bg-white`}>
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-4">
          <div className="max-w-2xl mx-auto py-4">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                role={message.role}
                content={message.content}
                aiLabel={t.chat.analystLabel}
              />
            ))}
            {(isLoading || isInitializing) && (
              <div className="py-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">🤖</span>
                  <span className="text-sm font-medium text-gray-700">{t.chat.analystLabel}</span>
                </div>
                <div className="pl-7 flex items-center gap-2 text-gray-500">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="text-sm">
                    {isInitializing ? t.analytics.analyzing : t.chat.aiThinking}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input */}
        <div className="border-t bg-white p-4">
          <div className="max-w-2xl mx-auto flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isLoading && !isInitializing && selectedSurvey) {
                  handleSendMessage();
                }
              }}
              placeholder={selectedSurvey ? t.analytics.inputPlaceholder : t.analytics.selectFirst}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 text-sm"
              disabled={!selectedSurvey}
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || isInitializing || !inputValue.trim() || !selectedSurvey}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {t.send}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Panel - 60% on desktop, full on mobile when active */}
      <div className={`${
        activeTab === "data" ? "flex" : "hidden"
      } md:flex md:w-[60%] flex-col bg-gray-50`}>
        {selectedSurvey && stats ? (
          <SurveyStatsPanel
            questions={surveyQuestions}
            responses={surveyResponses}
            totalResponses={stats.totalResponses}
            completedResponses={stats.completedResponses}
            partialResponses={stats.partialResponses}
            completionRate={stats.completionRate}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">{t.analytics.selectSurvey}</p>
          </div>
        )}
      </div>
    </div>

    {/* Share Modal */}
    <ShareModal
      isOpen={isShareModalOpen}
      onClose={() => setIsShareModalOpen(false)}
      url={typeof window !== "undefined" ? window.location.href : ""}
    />
  </div>
);
```

**Step 6: Run build to verify no errors**

Run: `npm run build`
Expected: Build succeeds

**Step 7: Commit**

```bash
git add src/app/dashboard/chat/page.tsx
git commit -m "feat: update analytics page with split layout and share feature"
```

---

## Task 5: Test the Implementation

**Files:**
- No files to modify

**Step 1: Start the development server**

Run: `npm run dev`
Expected: Server starts on localhost:3000

**Step 2: Test the analytics page**

1. Navigate to `/dashboard/chat?code=test&survey=<valid-survey-id>`
2. Verify split layout displays correctly on desktop
3. Verify mobile tab switching works on narrow viewport
4. Verify share button opens modal with correct URL
5. Verify copy link button works

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete shareable analytics report with split layout

- Add SurveyStatsPanel component for question statistics
- Add ShareModal component for sharing links
- Update translations for new features
- Implement 40/60 split layout on desktop
- Add mobile tab switching between chat and data views
- Remove creator code validation for public access"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Add translation keys | `src/lib/translations.ts` |
| 2 | Create SurveyStatsPanel | `src/components/SurveyStatsPanel.tsx` |
| 3 | Create ShareModal | `src/components/ShareModal.tsx` |
| 4 | Update analytics page | `src/app/dashboard/chat/page.tsx` |
| 5 | Test implementation | - |
