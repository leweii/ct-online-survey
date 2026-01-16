"use client";

import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Question } from "@/types/database";

interface QuestionInputProps {
  question: Question;
  value: unknown;
  onChange: (value: unknown) => void;
  onSubmit?: () => void;
  disabled?: boolean;
  inline?: boolean; // For chat mode styling
}

// Helper to safely get display text from option (handles both string and object formats)
function getOptionText(option: unknown): string {
  if (typeof option === "string") {
    return option;
  }
  if (option && typeof option === "object") {
    // Handle common object formats like {label: "..."}, {text: "..."}, {value: "..."}
    const obj = option as Record<string, unknown>;
    if (typeof obj.label === "string") return obj.label;
    if (typeof obj.text === "string") return obj.text;
    if (typeof obj.value === "string") return obj.value;
    if (typeof obj.name === "string") return obj.name;
  }
  return String(option);
}

// Helper to get option value for comparison
function getOptionValue(option: unknown): string {
  if (typeof option === "string") {
    return option;
  }
  if (option && typeof option === "object") {
    const obj = option as Record<string, unknown>;
    if (typeof obj.value === "string") return obj.value;
    if (typeof obj.label === "string") return obj.label;
    if (typeof obj.text === "string") return obj.text;
  }
  return String(option);
}

export function QuestionInput({
  question,
  value,
  onChange,
  onSubmit,
  disabled = false,
  inline = false,
}: QuestionInputProps) {
  const { t } = useLanguage();

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
          placeholder={t.question.typeAnswer}
          rows={inline ? 2 : 3}
          className={`${baseInputClass} resize-none`}
        />
      );

    case "multiple_choice":
      return (
        <div className={`space-y-2 ${inline ? "mt-2" : ""}`}>
          {question.options?.map((option, index) => {
            const optionText = getOptionText(option);
            const optionValue = getOptionValue(option);
            return (
              <label
                key={index}
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  value === optionValue
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={optionValue}
                  checked={value === optionValue}
                  onChange={() => {
                    onChange(optionValue);
                    if (onSubmit) setTimeout(onSubmit, 100);
                  }}
                  disabled={disabled}
                  className="w-4 h-4 text-blue-600"
                />
                <span className={inline ? "text-sm" : ""}>{optionText}</span>
              </label>
            );
          })}
        </div>
      );

    case "multi_select": {
      const selectedValues = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className={`space-y-2 ${inline ? "mt-2" : ""}`}>
          {question.options?.map((option, index) => {
            const optionText = getOptionText(option);
            const optionValue = getOptionValue(option);
            const isSelected = selectedValues.includes(optionValue);
            return (
              <label
                key={index}
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  isSelected
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <input
                  type="checkbox"
                  value={optionValue}
                  checked={isSelected}
                  onChange={() => {
                    const newValues = isSelected
                      ? selectedValues.filter((v) => v !== optionValue)
                      : [...selectedValues, optionValue];
                    onChange(newValues);
                  }}
                  disabled={disabled}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className={inline ? "text-sm" : ""}>{optionText}</span>
              </label>
            );
          })}
          {selectedValues.length > 0 && onSubmit && (
            <button
              type="button"
              onClick={onSubmit}
              disabled={disabled}
              className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {t.question.confirmSelection}
            </button>
          )}
        </div>
      );
    }

    case "dropdown":
      return (
        <select
          value={(value as string) || ""}
          onChange={(e) => {
            onChange(e.target.value);
            if (e.target.value && onSubmit) setTimeout(onSubmit, 100);
          }}
          disabled={disabled}
          className={baseInputClass}
        >
          <option value="">{t.question.selectOption}</option>
          {question.options?.map((option, index) => {
            const optionText = getOptionText(option);
            const optionValue = getOptionValue(option);
            return (
              <option key={index} value={optionValue}>
                {optionText}
              </option>
            );
          })}
        </select>
      );

    case "rating": {
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
    }

    case "slider": {
      const sliderMin = question.validation?.min ?? 0;
      const sliderMax = question.validation?.max ?? 100;
      const sliderValue = typeof value === "number" ? value : sliderMin;
      return (
        <div className={`${inline ? "mt-2" : ""}`}>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 w-8">{sliderMin}</span>
            <input
              type="range"
              min={sliderMin}
              max={sliderMax}
              value={sliderValue}
              onChange={(e) => onChange(Number(e.target.value))}
              disabled={disabled}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <span className="text-sm text-gray-500 w-8">{sliderMax}</span>
          </div>
          <div className="text-center mt-2">
            <span className="text-2xl font-bold text-blue-600">{sliderValue}</span>
          </div>
          {onSubmit && (
            <button
              type="button"
              onClick={onSubmit}
              disabled={disabled}
              className="mt-3 w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {t.question.confirmValue}
            </button>
          )}
        </div>
      );
    }

    case "yes_no":
      return (
        <div className={`flex gap-3 ${inline ? "mt-2" : ""}`}>
          {[
            { key: "yes", label: t.question.yes },
            { key: "no", label: t.question.no },
          ].map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => {
                onChange(option.key);
                if (onSubmit) setTimeout(onSubmit, 100);
              }}
              disabled={disabled}
              className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
                value === option.key
                  ? "border-blue-500 bg-blue-500 text-white"
                  : "border-gray-300 hover:border-blue-400"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {option.label}
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
          placeholder={t.question.enterNumber}
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

    case "email":
      return (
        <input
          type="email"
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={t.question.enterEmail}
          className={baseInputClass}
        />
      );

    case "phone":
      return (
        <input
          type="tel"
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={t.question.enterPhone}
          className={baseInputClass}
        />
      );

    default:
      return null;
  }
}
