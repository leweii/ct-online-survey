"use client";

import { QuestionType } from "@/types/database";

interface QuestionFormControlProps {
  type: QuestionType;
  options?: string[];
  disabled?: boolean;
}

export function QuestionFormControl({
  type,
  options = [],
  disabled = true,
}: QuestionFormControlProps) {
  switch (type) {
    case "text":
      return (
        <input
          type="text"
          disabled={disabled}
          placeholder="Text answer..."
          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-400 text-sm"
        />
      );

    case "multiple_choice":
      return (
        <div className="space-y-2">
          {options.map((option, i) => (
            <label key={i} className="flex items-center gap-2 text-sm text-gray-600">
              <input type="radio" disabled={disabled} className="w-4 h-4" />
              <span>{option}</span>
            </label>
          ))}
        </div>
      );

    case "multi_select":
      return (
        <div className="space-y-2">
          {options.map((option, i) => (
            <label key={i} className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" disabled={disabled} className="w-4 h-4" />
              <span>{option}</span>
            </label>
          ))}
        </div>
      );

    case "dropdown":
      return (
        <select
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-400 text-sm"
        >
          <option>Select an option...</option>
          {options.map((option, i) => (
            <option key={i}>{option}</option>
          ))}
        </select>
      );

    case "rating":
      return (
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              disabled={disabled}
              className="w-8 h-8 text-gray-300 hover:text-yellow-400 disabled:hover:text-gray-300"
            >
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          ))}
        </div>
      );

    case "slider":
      return (
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">0</span>
          <input
            type="range"
            min="0"
            max="100"
            disabled={disabled}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none"
          />
          <span className="text-sm text-gray-400">100</span>
        </div>
      );

    case "yes_no":
      return (
        <div className="flex gap-3">
          <button
            disabled={disabled}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:hover:bg-white"
          >
            Yes
          </button>
          <button
            disabled={disabled}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:hover:bg-white"
          >
            No
          </button>
        </div>
      );

    case "date":
      return (
        <input
          type="date"
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-400 text-sm"
        />
      );

    case "number":
      return (
        <input
          type="number"
          disabled={disabled}
          placeholder="0"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-400 text-sm"
        />
      );

    case "email":
      return (
        <input
          type="email"
          disabled={disabled}
          placeholder="email@example.com"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-400 text-sm"
        />
      );

    case "phone":
      return (
        <input
          type="tel"
          disabled={disabled}
          placeholder="+1 (555) 000-0000"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-400 text-sm"
        />
      );

    default:
      return null;
  }
}
