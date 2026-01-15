"use client";

import React, { useState } from "react";
import type { Survey, Question } from "@/types/database";
import { QuestionInput } from "./QuestionInput";

interface FormResponseProps {
  survey: Survey;
  onSubmit: (answers: Record<string, unknown>) => void;
  onPartialSubmit?: (answers: Record<string, unknown>) => void;
  isSubmitting?: boolean;
}

export function FormResponse({
  survey,
  onSubmit,
  onPartialSubmit,
  isSubmitting = false,
}: FormResponseProps) {
  const questions = survey.questions as Question[];
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleChange = (questionId: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    // Clear error when user provides input
    if (errors[questionId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    questions.forEach((q) => {
      if (q.required) {
        const answer = answers[q.id];
        if (answer === undefined || answer === null || answer === "") {
          newErrors[q.id] = "此字段为必填项";
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(answers);
    }
  };

  const handleEarlySubmit = () => {
    setShowConfirmDialog(true);
  };

  const confirmEarlySubmit = () => {
    setShowConfirmDialog(false);
    if (onPartialSubmit) {
      onPartialSubmit(answers);
    }
  };

  const answeredCount = questions.filter(
    (q) => answers[q.id] !== undefined && answers[q.id] !== null && answers[q.id] !== ""
  ).length;
  const unansweredCount = questions.length - answeredCount;
  const progress = Math.round((answeredCount / questions.length) * 100);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-lg font-semibold truncate">{survey.title}</h1>
            <span className="text-sm text-gray-500">
              {answeredCount} / {questions.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-4">
        <div className="space-y-6">
          {questions.map((question, index) => (
            <div
              key={question.id}
              className={`bg-white rounded-xl p-5 shadow-sm border ${
                errors[question.id] ? "border-red-300" : "border-gray-100"
              }`}
            >
              <div className="flex items-start gap-3 mb-4">
                <span className="flex-shrink-0 w-7 h-7 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <h3 className="font-medium">
                    {question.text}
                    {question.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </h3>
                </div>
              </div>

              <div className="ml-10">
                <QuestionInput
                  question={question}
                  value={answers[question.id]}
                  onChange={(value) => handleChange(question.id, value)}
                  disabled={isSubmitting}
                />
                {errors[question.id] && (
                  <p className="mt-2 text-sm text-red-600">{errors[question.id]}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 pb-8 space-y-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "提交中..." : "提交问卷"}
          </button>

          {/* Early submit button - shown when at least one question answered but not all */}
          {onPartialSubmit && answeredCount > 0 && answeredCount < questions.length && (
            <button
              type="button"
              onClick={handleEarlySubmit}
              disabled={isSubmitting}
              className="w-full py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              提前提交 ({answeredCount}/{questions.length} 已回答)
            </button>
          )}
        </div>
      </form>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-4">确认提前提交</h2>
            <div className="space-y-3 mb-6">
              <p className="text-gray-600">
                您即将提交部分填写的问卷：
              </p>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">已回答问题</span>
                  <span className="font-medium text-green-600">{answeredCount} 个</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">未回答问题</span>
                  <span className="font-medium text-orange-600">{unansweredCount} 个</span>
                </div>
              </div>
              <p className="text-sm text-red-600 font-medium">
                提交后将无法修改，确定要继续吗？
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                继续填写
              </button>
              <button
                onClick={confirmEarlySubmit}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                确认提交
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
