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
