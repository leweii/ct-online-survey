"use client";

import React from "react";
import type { Question } from "@/types/database";

interface QuestionInputProps {
  question: Question;
  value: unknown;
  onChange: (value: unknown) => void;
  onSubmit?: () => void;
  disabled?: boolean;
  inline?: boolean; // For chat mode styling
}

export function QuestionInput({
  question,
  value,
  onChange,
  onSubmit,
  disabled = false,
  inline = false,
}: QuestionInputProps) {
  const baseInputClass = inline
    ? "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    : "w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500";

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && onSubmit) {
      e.preventDefault();
      onSubmit();
    }
  };

  switch (question.type) {
    case "text":
      return (
        <textarea
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Type your answer..."
          rows={inline ? 2 : 3}
          className={`${baseInputClass} resize-none`}
        />
      );

    case "multiple_choice":
      return (
        <div className={`space-y-2 ${inline ? "mt-2" : ""}`}>
          {question.options?.map((option, index) => (
            <label
              key={index}
              className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                value === option
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <input
                type="radio"
                name={`question-${question.id}`}
                value={option}
                checked={value === option}
                onChange={() => {
                  onChange(option);
                  if (onSubmit) setTimeout(onSubmit, 100);
                }}
                disabled={disabled}
                className="w-4 h-4 text-blue-600"
              />
              <span className={inline ? "text-sm" : ""}>{option}</span>
            </label>
          ))}
        </div>
      );

    case "rating":
      const min = question.validation?.min ?? 1;
      const max = question.validation?.max ?? 5;
      const ratings = Array.from({ length: max - min + 1 }, (_, i) => min + i);
      return (
        <div className={`flex gap-2 ${inline ? "mt-2" : "justify-center"}`}>
          {ratings.map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => {
                onChange(rating);
                if (onSubmit) setTimeout(onSubmit, 100);
              }}
              disabled={disabled}
              className={`w-10 h-10 rounded-full border-2 font-medium transition-colors ${
                value === rating
                  ? "border-blue-500 bg-blue-500 text-white"
                  : "border-gray-300 hover:border-blue-400"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {rating}
            </button>
          ))}
        </div>
      );

    case "yes_no":
      return (
        <div className={`flex gap-3 ${inline ? "mt-2" : ""}`}>
          {["Yes", "No"].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onChange(option.toLowerCase());
                if (onSubmit) setTimeout(onSubmit, 100);
              }}
              disabled={disabled}
              className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
                value === option.toLowerCase()
                  ? "border-blue-500 bg-blue-500 text-white"
                  : "border-gray-300 hover:border-blue-400"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {option}
            </button>
          ))}
        </div>
      );

    case "number":
      return (
        <input
          type="number"
          value={value !== undefined && value !== null ? String(value) : ""}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          min={question.validation?.min}
          max={question.validation?.max}
          placeholder="Enter a number..."
          className={baseInputClass}
        />
      );

    case "date":
      return (
        <input
          type="date"
          value={(value as string) || ""}
          onChange={(e) => {
            onChange(e.target.value);
            if (e.target.value && onSubmit) setTimeout(onSubmit, 100);
          }}
          disabled={disabled}
          className={baseInputClass}
        />
      );

    default:
      return null;
  }
}
