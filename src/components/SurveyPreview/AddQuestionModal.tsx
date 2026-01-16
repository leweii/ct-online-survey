"use client";

import { useState } from "react";
import { Question, QuestionType } from "@/types/database";
import { useLanguage } from "@/contexts/LanguageContext";
import { nanoid } from "nanoid";

interface AddQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (question: Question) => void;
}

const QUESTION_TYPES: QuestionType[] = [
  "text", "multiple_choice", "multi_select", "dropdown", "rating",
  "slider", "yes_no", "date", "number", "email", "phone",
];

export function AddQuestionModal({ isOpen, onClose, onAdd }: AddQuestionModalProps) {
  const { t } = useLanguage();
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState<QuestionType>("text");
  const [isRequired, setIsRequired] = useState(false);
  const [options, setOptions] = useState<string[]>(["", ""]);

  const hasOptions = ["multiple_choice", "multi_select", "dropdown"].includes(questionType);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    const question: Question = {
      id: nanoid(),
      type: questionType,
      text: questionText.trim(),
      required: isRequired,
    };

    if (hasOptions) {
      question.options = options.filter((o) => o.trim());
    }

    onAdd(question);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setQuestionText("");
    setQuestionType("text");
    setIsRequired(false);
    setOptions(["", ""]);
  };

  const handleOptionChange = (idx: number, value: string) => {
    const newOptions = [...options];
    newOptions[idx] = value;
    setOptions(newOptions);
  };

  const handleAddOption = () => setOptions([...options, ""]);

  const handleRemoveOption = (idx: number) => {
    if (options.length > 2) setOptions(options.filter((_, i) => i !== idx));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <h3 className="text-lg font-semibold mb-4">{t.preview?.addQuestion}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
            <input
              type="text"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Enter your question..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Question Type</label>
            <select
              value={questionType}
              onChange={(e) => setQuestionType(e.target.value as QuestionType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {QUESTION_TYPES.map((type) => (
                <option key={type} value={type}>{t.preview?.questionTypes?.[type] || type}</option>
              ))}
            </select>
          </div>
          {hasOptions && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Options</label>
              <div className="space-y-2">
                {options.map((option, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      placeholder={`${t.preview?.optionPlaceholder} ${idx + 1}`}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {options.length > 2 && (
                      <button type="button" onClick={() => handleRemoveOption(idx)} className="p-2 text-gray-400 hover:text-red-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={handleAddOption} className="text-sm text-blue-600 hover:text-blue-700">
                  + {t.preview?.addOption}
                </button>
              </div>
            </div>
          )}
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isRequired} onChange={(e) => setIsRequired(e.target.checked)} className="w-4 h-4 rounded border-gray-300" />
            <span className="text-sm text-gray-700">{t.preview?.required}</span>
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
            <button type="submit" disabled={!questionText.trim()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed">
              {t.preview?.addQuestion}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
