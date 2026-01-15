"use client";

import React, { useState } from "react";
import type { Survey, Question } from "@/types/database";
import { QuestionInput } from "./QuestionInput";

interface FormResponseProps {
  survey: Survey;
  onSubmit: (answers: Record<string, unknown>) => void;
  isSubmitting?: boolean;
}

export function FormResponse({
  survey,
  onSubmit,
  isSubmitting = false,
}: FormResponseProps) {
  const questions = survey.questions as Question[];
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

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
          newErrors[q.id] = "This field is required";
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

  const answeredCount = questions.filter(
    (q) => answers[q.id] !== undefined && answers[q.id] !== null && answers[q.id] !== ""
  ).length;
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

        <div className="mt-8 pb-8">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "Submit Survey"}
          </button>
        </div>
      </form>
    </div>
  );
}
