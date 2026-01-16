"use client";

import { useState, useRef, useEffect } from "react";
import { Question } from "@/types/database";
import { QuestionFormControl } from "./QuestionFormControl";
import { useLanguage } from "@/contexts/LanguageContext";

// Helper to safely get display text from option (handles both string and object formats)
function getOptionText(option: unknown): string {
  if (typeof option === "string") {
    return option;
  }
  if (option && typeof option === "object") {
    const obj = option as Record<string, unknown>;
    if (typeof obj.label === "string") return obj.label;
    if (typeof obj.text === "string") return obj.text;
    if (typeof obj.value === "string") return obj.value;
    if (typeof obj.name === "string") return obj.name;
  }
  return String(option);
}

// Convert options array to string array (normalizing object options)
function normalizeOptions(options: unknown[] | undefined): string[] {
  if (!options) return [];
  return options.map(getOptionText);
}

interface QuestionCardProps {
  question: Question;
  index: number;
  onUpdate: (updates: Partial<Question>) => void;
  onDelete: () => void;
  disabled?: boolean;
  isDragging?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}

export function QuestionCard({
  question,
  index,
  onUpdate,
  onDelete,
  disabled = false,
  isDragging = false,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: QuestionCardProps) {
  const { t } = useLanguage();
  const [isEditingText, setIsEditingText] = useState(false);
  const [editedText, setEditedText] = useState(question.text);
  const [isEditingOptions, setIsEditingOptions] = useState(false);
  const [editedOptions, setEditedOptions] = useState(() => normalizeOptions(question.options));
  const textInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingText && textInputRef.current) {
      textInputRef.current.focus();
      textInputRef.current.select();
    }
  }, [isEditingText]);

  useEffect(() => {
    setEditedText(question.text);
    setEditedOptions(normalizeOptions(question.options));
  }, [question.text, question.options]);

  const handleTextSave = () => {
    if (editedText.trim() && editedText !== question.text) {
      onUpdate({ text: editedText.trim() });
    } else {
      setEditedText(question.text);
    }
    setIsEditingText(false);
  };

  const handleTextKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTextSave();
    } else if (e.key === "Escape") {
      setEditedText(question.text);
      setIsEditingText(false);
    }
  };

  const handleOptionChange = (idx: number, value: string) => {
    const newOptions = [...editedOptions];
    newOptions[idx] = value;
    setEditedOptions(newOptions);
  };

  const handleOptionSave = () => {
    const filteredOptions = editedOptions.filter((o) => o.trim());
    if (JSON.stringify(filteredOptions) !== JSON.stringify(question.options)) {
      onUpdate({ options: filteredOptions });
    }
    setIsEditingOptions(false);
  };

  const handleAddOption = () => {
    setEditedOptions([...editedOptions, ""]);
  };

  const handleRemoveOption = (idx: number) => {
    setEditedOptions(editedOptions.filter((_, i) => i !== idx));
  };

  const hasOptions = ["multiple_choice", "multi_select", "dropdown"].includes(question.type);
  const typeLabel = t.preview?.questionTypes?.[question.type] || question.type;

  return (
    <div
      draggable={!disabled}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`bg-white border rounded-lg p-4 transition-all ${
        isDragging ? "opacity-50 border-blue-400 shadow-lg" : "border-gray-200"
      } ${disabled ? "opacity-60" : ""}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-1">
          {/* Drag handle */}
          {!disabled && (
            <div className="cursor-grab text-gray-400 hover:text-gray-600" title={t.preview?.dragToReorder}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
              </svg>
            </div>
          )}

          {/* Question number */}
          <span className="text-sm font-medium text-gray-500 shrink-0">
            {index + 1}.
          </span>

          {/* Question text (editable) */}
          {isEditingText && !disabled ? (
            <input
              ref={textInputRef}
              type="text"
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              onBlur={handleTextSave}
              onKeyDown={handleTextKeyDown}
              className="flex-1 px-2 py-1 border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          ) : (
            <span
              onClick={() => !disabled && setIsEditingText(true)}
              className={`flex-1 text-sm ${disabled ? "" : "cursor-text hover:bg-gray-50 px-2 py-1 rounded"}`}
            >
              {question.text}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
            {typeLabel}
          </span>
          {question.required && (
            <span className="text-xs px-2 py-0.5 bg-red-50 text-red-600 rounded">
              {t.preview?.required}
            </span>
          )}
          {!disabled && (
            <button
              onClick={onDelete}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              title={t.preview?.deleteQuestion}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Form control preview */}
      <div className="pl-7">
        {hasOptions && isEditingOptions && !disabled ? (
          <div className="space-y-2">
            {editedOptions.map((option, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  placeholder={`${t.preview?.optionPlaceholder} ${idx + 1}`}
                  className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => handleRemoveOption(idx)}
                  className="p-1 text-gray-400 hover:text-red-500"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <button
                onClick={handleAddOption}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                + {t.preview?.addOption}
              </button>
              <button
                onClick={handleOptionSave}
                className="text-sm text-green-600 hover:text-green-700 ml-auto"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => hasOptions && !disabled && setIsEditingOptions(true)}
            className={hasOptions && !disabled ? "cursor-pointer" : ""}
          >
            <QuestionFormControl
              type={question.type}
              options={question.options}
              disabled={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}
