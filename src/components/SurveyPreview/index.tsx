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
  isLoading?: boolean;
  isSaving?: boolean;
  onUpdateTitle: (title: string) => void;
  onUpdateDescription: (description: string) => void;
  onUpdateQuestion: (id: string, updates: Partial<Question>) => void;
  onDeleteQuestion: (id: string) => void;
  onAddQuestion: (question: Question) => void;
  onReorderQuestions: (fromIndex: number, toIndex: number) => void;
  onFinalize: () => void;
}

export function SurveyPreview({
  surveyState,
  isLoading = false,
  isSaving = false,
  onUpdateTitle,
  onUpdateDescription,
  onUpdateQuestion,
  onDeleteQuestion,
  onAddQuestion,
  onReorderQuestions,
  onFinalize,
}: SurveyPreviewProps) {
  const { t } = useLanguage();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const isDisabled = surveyState?.isFinalized ?? false;

  const handleDragStart = useCallback((index: number) => (e: React.DragEvent) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragEnd = useCallback(() => setDraggedIndex(null), []);

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

  if (!surveyState || surveyState.questions.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        {isLoading ? (
          <>
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">{t.preview?.generating}</h3>
            <p className="text-gray-500">{t.preview?.generatingHint}</p>
          </>
        ) : (
          <>
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">{t.preview?.emptyTitle}</h3>
            <p className="text-gray-500 mb-1">{t.preview?.emptyDescription}</p>
            <p className="text-sm text-gray-400">{t.preview?.emptyHint}</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {isLoading && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-blue-700 text-sm font-medium">{t.preview?.updating}</span>
        </div>
      )}
      {isDisabled && (
        <div className="bg-green-50 border-b border-green-200 px-4 py-2 text-center">
          <span className="text-green-700 text-sm font-medium">✓ {t.preview?.surveyFinalized}</span>
          <span className="text-green-600 text-sm ml-2">{t.preview?.editDisabled}</span>
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-4">
        <SurveyHeader
          title={surveyState.title}
          description={surveyState.description}
          onUpdateTitle={onUpdateTitle}
          onUpdateDescription={onUpdateDescription}
          disabled={isDisabled}
        />
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
        {!isDisabled && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full mt-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
          >
            + {t.preview?.addQuestion}
          </button>
        )}
      </div>

      {/* Finalize Button */}
      <div className="border-t bg-white px-4 py-3">
        <button
          onClick={onFinalize}
          disabled={isSaving || isLoading || !surveyState.title || surveyState.questions.length === 0}
          className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {t.preview?.finalizing}
            </>
          ) : surveyState.id ? (
            t.preview?.updateSurvey
          ) : (
            t.preview?.finalize
          )}
        </button>
      </div>

      <AddQuestionModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={onAddQuestion} />
    </div>
  );
}

export { SurveyHeader } from "./SurveyHeader";
export { QuestionCard } from "./QuestionCard";
export { QuestionFormControl } from "./QuestionFormControl";
export { AddQuestionModal } from "./AddQuestionModal";
