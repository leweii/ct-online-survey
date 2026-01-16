# Split-Screen Survey Editor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the create page into a split-screen layout with real-time editable survey preview.

**Architecture:** Left panel (40%) contains chat interface, right panel (60%) shows live survey preview with inline editing. Mobile uses bottom drawer. State managed in create/page.tsx, passed down to components.

**Tech Stack:** Next.js 14, React, Tailwind CSS, HTML5 Drag and Drop API

---

## Task 1: Add Translations for Survey Preview

**Files:**
- Modify: `src/lib/translations.ts`

**Step 1: Add English translations**

Add to the `en` object after the `create` section:

```typescript
// Survey preview
preview: {
  emptyTitle: "Survey Preview",
  emptyDescription: "Survey preview will appear here",
  emptyHint: "Start chatting to create your survey",
  surveyTitle: "Survey Title",
  surveyDescription: "Survey Description",
  untitled: "Untitled Survey",
  addQuestion: "Add Question",
  deleteQuestion: "Delete",
  dragToReorder: "Drag to reorder",
  questionTypes: {
    text: "Text",
    multiple_choice: "Multiple Choice",
    multi_select: "Multi Select",
    dropdown: "Dropdown",
    rating: "Rating",
    slider: "Slider",
    yes_no: "Yes/No",
    date: "Date",
    number: "Number",
    email: "Email",
    phone: "Phone",
  },
  required: "Required",
  optional: "Optional",
  addOption: "Add option",
  optionPlaceholder: "Option",
  viewSurvey: "View Survey",
  surveyFinalized: "Survey Created",
  editDisabled: "Editing disabled after survey is created",
},
```

**Step 2: Add Chinese translations**

Add to the `zh` object:

```typescript
// Survey preview
preview: {
  emptyTitle: "问卷预览",
  emptyDescription: "问卷预览将显示在这里",
  emptyHint: "开始对话来创建您的问卷",
  surveyTitle: "问卷标题",
  surveyDescription: "问卷描述",
  untitled: "未命名问卷",
  addQuestion: "添加问题",
  deleteQuestion: "删除",
  dragToReorder: "拖动排序",
  questionTypes: {
    text: "文本",
    multiple_choice: "单选",
    multi_select: "多选",
    dropdown: "下拉选择",
    rating: "评分",
    slider: "滑块",
    yes_no: "是/否",
    date: "日期",
    number: "数字",
    email: "邮箱",
    phone: "电话",
  },
  required: "必填",
  optional: "选填",
  addOption: "添加选项",
  optionPlaceholder: "选项",
  viewSurvey: "查看问卷",
  surveyFinalized: "问卷已创建",
  editDisabled: "问卷创建后无法编辑",
},
```

**Step 3: Verify build passes**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/lib/translations.ts
git commit -m "feat: add translations for survey preview component"
```

---

## Task 2: Create QuestionFormControl Component

**Files:**
- Create: `src/components/SurveyPreview/QuestionFormControl.tsx`

**Step 1: Create the component**

```tsx
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
```

**Step 2: Verify build passes**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/components/SurveyPreview/QuestionFormControl.tsx
git commit -m "feat: add QuestionFormControl component for rendering form previews"
```

---

## Task 3: Create QuestionCard Component

**Files:**
- Create: `src/components/SurveyPreview/QuestionCard.tsx`

**Step 1: Create the component**

```tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Question } from "@/types/database";
import { QuestionFormControl } from "./QuestionFormControl";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const [editedOptions, setEditedOptions] = useState(question.options || []);
  const textInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingText && textInputRef.current) {
      textInputRef.current.focus();
      textInputRef.current.select();
    }
  }, [isEditingText]);

  useEffect(() => {
    setEditedText(question.text);
    setEditedOptions(question.options || []);
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
```

**Step 2: Verify build passes**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/components/SurveyPreview/QuestionCard.tsx
git commit -m "feat: add QuestionCard component with inline editing"
```

---

## Task 4: Create SurveyHeader Component

**Files:**
- Create: `src/components/SurveyPreview/SurveyHeader.tsx`

**Step 1: Create the component**

```tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface SurveyHeaderProps {
  title?: string;
  description?: string;
  onUpdateTitle: (title: string) => void;
  onUpdateDescription: (description: string) => void;
  disabled?: boolean;
}

export function SurveyHeader({
  title,
  description,
  onUpdateTitle,
  onUpdateDescription,
  disabled = false,
}: SurveyHeaderProps) {
  const { t } = useLanguage();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title || "");
  const [editedDesc, setEditedDesc] = useState(description || "");
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditedTitle(title || "");
    setEditedDesc(description || "");
  }, [title, description]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    if (isEditingDesc && descInputRef.current) {
      descInputRef.current.focus();
      descInputRef.current.select();
    }
  }, [isEditingDesc]);

  const handleTitleSave = () => {
    if (editedTitle.trim() !== title) {
      onUpdateTitle(editedTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleDescSave = () => {
    if (editedDesc.trim() !== description) {
      onUpdateDescription(editedDesc.trim());
    }
    setIsEditingDesc(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTitleSave();
    } else if (e.key === "Escape") {
      setEditedTitle(title || "");
      setIsEditingTitle(false);
    }
  };

  const handleDescKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setEditedDesc(description || "");
      setIsEditingDesc(false);
    }
  };

  return (
    <div className="mb-6 pb-4 border-b border-gray-200">
      {/* Title */}
      {isEditingTitle && !disabled ? (
        <input
          ref={titleInputRef}
          type="text"
          value={editedTitle}
          onChange={(e) => setEditedTitle(e.target.value)}
          onBlur={handleTitleSave}
          onKeyDown={handleTitleKeyDown}
          placeholder={t.preview?.surveyTitle}
          className="w-full text-xl font-semibold px-2 py-1 border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      ) : (
        <h2
          onClick={() => !disabled && setIsEditingTitle(true)}
          className={`text-xl font-semibold text-gray-900 ${
            disabled ? "" : "cursor-text hover:bg-gray-50 px-2 py-1 rounded -mx-2"
          }`}
        >
          {title || t.preview?.untitled}
        </h2>
      )}

      {/* Description */}
      {isEditingDesc && !disabled ? (
        <textarea
          ref={descInputRef}
          value={editedDesc}
          onChange={(e) => setEditedDesc(e.target.value)}
          onBlur={handleDescSave}
          onKeyDown={handleDescKeyDown}
          placeholder={t.preview?.surveyDescription}
          rows={2}
          className="w-full mt-2 text-sm text-gray-600 px-2 py-1 border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      ) : (
        <p
          onClick={() => !disabled && setIsEditingDesc(true)}
          className={`mt-2 text-sm text-gray-600 ${
            disabled ? "" : "cursor-text hover:bg-gray-50 px-2 py-1 rounded -mx-2"
          } ${!description ? "italic text-gray-400" : ""}`}
        >
          {description || (disabled ? "" : t.preview?.surveyDescription)}
        </p>
      )}
    </div>
  );
}
```

**Step 2: Verify build passes**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/components/SurveyPreview/SurveyHeader.tsx
git commit -m "feat: add SurveyHeader component with editable title and description"
```

---

## Task 5: Create AddQuestionModal Component

**Files:**
- Create: `src/components/SurveyPreview/AddQuestionModal.tsx`

**Step 1: Create the component**

```tsx
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
  "text",
  "multiple_choice",
  "multi_select",
  "dropdown",
  "rating",
  "slider",
  "yes_no",
  "date",
  "number",
  "email",
  "phone",
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

  const handleAddOption = () => {
    setOptions([...options, ""]);
  };

  const handleRemoveOption = (idx: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== idx));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <h3 className="text-lg font-semibold mb-4">{t.preview?.addQuestion}</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Question text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Question Text
            </label>
            <input
              type="text"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Enter your question..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          {/* Question type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Question Type
            </label>
            <select
              value={questionType}
              onChange={(e) => setQuestionType(e.target.value as QuestionType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {QUESTION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t.preview?.questionTypes?.[type] || type}
                </option>
              ))}
            </select>
          </div>

          {/* Options for choice questions */}
          {hasOptions && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Options
              </label>
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
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        className="p-2 text-gray-400 hover:text-red-500"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  + {t.preview?.addOption}
                </button>
              </div>
            </div>
          )}

          {/* Required toggle */}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isRequired}
              onChange={(e) => setIsRequired(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">{t.preview?.required}</span>
          </label>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!questionText.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {t.preview?.addQuestion}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

**Step 2: Verify build passes**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/components/SurveyPreview/AddQuestionModal.tsx
git commit -m "feat: add AddQuestionModal component for creating new questions"
```

---

## Task 6: Create Main SurveyPreview Component

**Files:**
- Create: `src/components/SurveyPreview/index.tsx`

**Step 1: Create the component**

```tsx
"use client";

import { useState, useCallback } from "react";
import { Question } from "@/types/database";
import { useLanguage } from "@/contexts/LanguageContext";
import { SurveyHeader } from "./SurveyHeader";
import { QuestionCard } from "./QuestionCard";
import { AddQuestionModal } from "./AddQuestionModal";

interface SurveyState {
  id?: string;
  short_code?: string;
  title?: string;
  description?: string;
  questions: Question[];
  creator_code: string;
  creator_name?: string;
  isFinalized: boolean;
}

interface SurveyPreviewProps {
  surveyState: SurveyState | null;
  onUpdateTitle: (title: string) => void;
  onUpdateDescription: (description: string) => void;
  onUpdateQuestion: (id: string, updates: Partial<Question>) => void;
  onDeleteQuestion: (id: string) => void;
  onAddQuestion: (question: Question) => void;
  onReorderQuestions: (fromIndex: number, toIndex: number) => void;
}

export function SurveyPreview({
  surveyState,
  onUpdateTitle,
  onUpdateDescription,
  onUpdateQuestion,
  onDeleteQuestion,
  onAddQuestion,
  onReorderQuestions,
}: SurveyPreviewProps) {
  const { t } = useLanguage();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const isDisabled = surveyState?.isFinalized ?? false;

  const handleDragStart = useCallback((index: number) => (e: React.DragEvent) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback((targetIndex: number) => (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== targetIndex) {
      onReorderQuestions(draggedIndex, targetIndex);
    }
    setDraggedIndex(null);
  }, [draggedIndex, onReorderQuestions]);

  // Empty state
  if (!surveyState || surveyState.questions.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <div className="text-6xl mb-4">📝</div>
        <h3 className="text-lg font-medium text-gray-700 mb-2">
          {t.preview?.emptyTitle}
        </h3>
        <p className="text-gray-500 mb-1">{t.preview?.emptyDescription}</p>
        <p className="text-sm text-gray-400">{t.preview?.emptyHint}</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Finalized banner */}
      {isDisabled && (
        <div className="bg-green-50 border-b border-green-200 px-4 py-2 text-center">
          <span className="text-green-700 text-sm font-medium">
            ✓ {t.preview?.surveyFinalized}
          </span>
          <span className="text-green-600 text-sm ml-2">
            {t.preview?.editDisabled}
          </span>
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4">
        <SurveyHeader
          title={surveyState.title}
          description={surveyState.description}
          onUpdateTitle={onUpdateTitle}
          onUpdateDescription={onUpdateDescription}
          disabled={isDisabled}
        />

        {/* Questions list */}
        <div className="space-y-3">
          {surveyState.questions.map((question, index) => (
            <QuestionCard
              key={question.id}
              question={question}
              index={index}
              onUpdate={(updates) => onUpdateQuestion(question.id, updates)}
              onDelete={() => onDeleteQuestion(question.id)}
              disabled={isDisabled}
              isDragging={draggedIndex === index}
              onDragStart={handleDragStart(index)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={handleDrop(index)}
            />
          ))}
        </div>

        {/* Add question button */}
        {!isDisabled && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full mt-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
          >
            + {t.preview?.addQuestion}
          </button>
        )}
      </div>

      {/* Add question modal */}
      <AddQuestionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={onAddQuestion}
      />
    </div>
  );
}

export { SurveyHeader } from "./SurveyHeader";
export { QuestionCard } from "./QuestionCard";
export { QuestionFormControl } from "./QuestionFormControl";
export { AddQuestionModal } from "./AddQuestionModal";
```

**Step 2: Verify build passes**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/components/SurveyPreview/index.tsx
git commit -m "feat: add main SurveyPreview component with drag-and-drop reordering"
```

---

## Task 7: Create MobileDrawer Component

**Files:**
- Create: `src/components/MobileDrawer.tsx`

**Step 1: Create the component**

```tsx
"use client";

import { useEffect, useRef } from "react";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export function MobileDrawer({ isOpen, onClose, children, title }: MobileDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;
    if (diff > 0 && drawerRef.current) {
      drawerRef.current.style.transform = `translateY(${diff}px)`;
    }
  };

  const handleTouchEnd = () => {
    const diff = currentY.current - startY.current;
    if (diff > 100) {
      onClose();
    }
    if (drawerRef.current) {
      drawerRef.current.style.transform = "";
    }
    startY.current = 0;
    currentY.current = 0;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl transition-transform duration-300 ease-out"
        style={{ height: "85vh" }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        {title && (
          <div className="px-4 pb-3 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-center">{title}</h3>
          </div>
        )}

        {/* Content */}
        <div className="h-full overflow-y-auto pb-safe">
          {children}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Verify build passes**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/components/MobileDrawer.tsx
git commit -m "feat: add MobileDrawer component for mobile survey preview"
```

---

## Task 8: Update Create Page with Split Layout

**Files:**
- Modify: `src/app/create/page.tsx`

**Step 1: Update imports and add state handlers**

Replace the entire file content:

```tsx
"use client";

import { useState, useCallback, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChatInterface, Message } from "@/components/ChatInterface";
import { SurveyPreview } from "@/components/SurveyPreview";
import { MobileDrawer } from "@/components/MobileDrawer";
import { TurnstileVerification, isVerified } from "@/components/TurnstileVerification";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Question } from "@/types/database";

interface SurveyState {
  id?: string;
  short_code?: string;
  title?: string;
  description?: string;
  questions: Question[];
  creator_code: string;
  creator_name?: string;
  custom_creator_name?: string;
  isFinalized: boolean;
}

function CreateSurveyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const customCreatorName = searchParams.get("creator") || "";
  const [messages, setMessages] = useState<Message[]>([]);
  const [surveyState, setSurveyState] = useState<SurveyState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [verified, setVerified] = useState(() => isVerified("create"));
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Set initial welcome message when t changes
  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: t.create.welcomeMessage,
      },
    ]);
  }, [t.create.welcomeMessage]);

  // Survey state update handlers
  const handleUpdateTitle = useCallback((title: string) => {
    setSurveyState((prev) => prev ? { ...prev, title } : null);
  }, []);

  const handleUpdateDescription = useCallback((description: string) => {
    setSurveyState((prev) => prev ? { ...prev, description } : null);
  }, []);

  const handleUpdateQuestion = useCallback((id: string, updates: Partial<Question>) => {
    setSurveyState((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        questions: prev.questions.map((q) =>
          q.id === id ? { ...q, ...updates } : q
        ),
      };
    });
  }, []);

  const handleDeleteQuestion = useCallback((id: string) => {
    setSurveyState((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        questions: prev.questions.filter((q) => q.id !== id),
      };
    });
  }, []);

  const handleAddQuestion = useCallback((question: Question) => {
    setSurveyState((prev) => {
      if (!prev) {
        return {
          questions: [question],
          creator_code: "",
          isFinalized: false,
        };
      }
      return {
        ...prev,
        questions: [...prev.questions, question],
      };
    });
  }, []);

  const handleReorderQuestions = useCallback((fromIndex: number, toIndex: number) => {
    setSurveyState((prev) => {
      if (!prev) return null;
      const questions = [...prev.questions];
      const [moved] = questions.splice(fromIndex, 1);
      questions.splice(toIndex, 0, moved);
      return { ...prev, questions };
    });
  }, []);

  const handleSendMessage = useCallback(
    async (content: string) => {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content,
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setStreamingContent("");

      try {
        const response = await fetch("/api/chat/creator", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, userMessage].map((m) => ({
              role: m.role,
              content: m.content,
            })),
            surveyState,
            customCreatorName: customCreatorName || undefined,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to get response");
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No reader");

        const decoder = new TextDecoder();
        let accumulatedText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.text) {
                  accumulatedText += data.text;
                  setStreamingContent(accumulatedText);
                }
                if (data.done && data.surveyState) {
                  setSurveyState(data.surveyState);

                  // If survey is finalized, show completion message with new identifiers
                  if (data.surveyState.isFinalized && data.surveyState.short_code) {
                    const shortCode = data.surveyState.short_code;
                    const creatorName = data.surveyState.creator_name;
                    const surveyUrl = `${window.location.origin}/survey/${shortCode}`;
                    accumulatedText += "\n\n" + t.create.surveyCreated
                      .replace("{shortCode}", shortCode)
                      .replace("{surveyUrl}", surveyUrl)
                      .replace("{creatorName}", creatorName);
                  }
                }
              } catch {
                // Ignore parse errors
              }
            }
          }
        }

        // Add assistant message
        if (accumulatedText) {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString() + "-assistant",
              role: "assistant",
              content: accumulatedText,
            },
          ]);
        }
      } catch (error) {
        console.error("Error:", error);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString() + "-error",
            role: "assistant",
            content: t.create.errorMessage,
          },
        ]);
      } finally {
        setIsLoading(false);
        setStreamingContent("");
      }
    },
    [messages, surveyState, customCreatorName, t.create.surveyCreated, t.create.errorMessage]
  );

  // Show verification gate if not verified
  if (!verified) {
    return (
      <TurnstileVerification
        context="create"
        onVerified={() => setVerified(true)}
      />
    );
  }

  const questionCount = surveyState?.questions.length || 0;

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-white px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="text-gray-600 hover:text-gray-800"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1 className="text-lg font-semibold">{t.create.title}</h1>
        </div>
        {surveyState?.title && (
          <span className="text-sm text-gray-500">
            {questionCount} {t.create.questionsCount}
          </span>
        )}
      </header>

      {/* Main content - Split layout on desktop */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat panel */}
        <div className="w-full md:w-[40%] flex flex-col overflow-hidden border-r border-gray-200">
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            placeholder={t.create.inputPlaceholder}
            streamingContent={streamingContent}
            aiLabel={t.chat.designerLabel}
          />
        </div>

        {/* Survey preview panel - Desktop only */}
        <div className="hidden md:flex md:w-[60%] flex-col bg-gray-50 overflow-hidden">
          <SurveyPreview
            surveyState={surveyState}
            onUpdateTitle={handleUpdateTitle}
            onUpdateDescription={handleUpdateDescription}
            onUpdateQuestion={handleUpdateQuestion}
            onDeleteQuestion={handleDeleteQuestion}
            onAddQuestion={handleAddQuestion}
            onReorderQuestions={handleReorderQuestions}
          />
        </div>
      </div>

      {/* Mobile: View Survey button */}
      <div className="md:hidden border-t bg-white p-3">
        <button
          onClick={() => setIsMobileDrawerOpen(true)}
          className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {t.preview?.viewSurvey} ({questionCount} {t.create.questionsCount})
        </button>
      </div>

      {/* Mobile drawer */}
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        title={t.preview?.emptyTitle}
      >
        <SurveyPreview
          surveyState={surveyState}
          onUpdateTitle={handleUpdateTitle}
          onUpdateDescription={handleUpdateDescription}
          onUpdateQuestion={handleUpdateQuestion}
          onDeleteQuestion={handleDeleteQuestion}
          onAddQuestion={handleAddQuestion}
          onReorderQuestions={handleReorderQuestions}
        />
      </MobileDrawer>
    </div>
  );
}

export default function CreateSurveyPage() {
  const { t } = useLanguage();

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">{t.loading}</p>
        </div>
      </div>
    }>
      <CreateSurveyContent />
    </Suspense>
  );
}
```

**Step 2: Verify build passes**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Test the application**

Run: `npm run dev`
- Open http://localhost:3000/create
- Verify split layout appears on desktop (resize browser to test)
- Verify mobile drawer works on narrow viewport
- Test chat functionality still works
- Test editing questions in preview

**Step 4: Commit**

```bash
git add src/app/create/page.tsx
git commit -m "feat: implement split-screen layout with survey preview

- 40/60 split layout on desktop
- Mobile bottom drawer for survey preview
- All edit callbacks wired up to state
- Automatic sync of edits to next LLM request"
```

---

## Task 9: Final Integration Test and Cleanup

**Step 1: Run full build**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 2: Run linter**

Run: `npm run lint`
Expected: No lint errors

**Step 3: Manual testing checklist**

- [ ] Desktop: Split layout displays correctly (40/60)
- [ ] Desktop: Chat messages work and stream properly
- [ ] Desktop: Survey preview updates when AI generates questions
- [ ] Desktop: Can edit question text inline (click, edit, blur/enter to save)
- [ ] Desktop: Can delete questions
- [ ] Desktop: Can reorder questions via drag-and-drop
- [ ] Desktop: Can add new questions via modal
- [ ] Desktop: Can edit title and description
- [ ] Desktop: Finalized surveys disable editing
- [ ] Mobile: Chat fills screen
- [ ] Mobile: "View Survey" button shows question count
- [ ] Mobile: Drawer opens and shows preview
- [ ] Mobile: Can swipe down to close drawer
- [ ] Edits persist to next API call (check network tab)

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete split-screen survey editor implementation

Implements real-time survey preview with:
- Split-screen layout (40% chat, 60% preview) on desktop
- Mobile bottom drawer for survey preview
- Inline editing for questions, title, and description
- Drag-and-drop question reordering
- Add question modal
- Automatic sync of user edits to LLM context
- Bilingual support (EN/ZH)"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Add translations | `translations.ts` |
| 2 | QuestionFormControl | `SurveyPreview/QuestionFormControl.tsx` |
| 3 | QuestionCard | `SurveyPreview/QuestionCard.tsx` |
| 4 | SurveyHeader | `SurveyPreview/SurveyHeader.tsx` |
| 5 | AddQuestionModal | `SurveyPreview/AddQuestionModal.tsx` |
| 6 | SurveyPreview (main) | `SurveyPreview/index.tsx` |
| 7 | MobileDrawer | `MobileDrawer.tsx` |
| 8 | Update create page | `create/page.tsx` |
| 9 | Integration test | - |

**Total: 7 new files, 2 modified files, 9 commits**
