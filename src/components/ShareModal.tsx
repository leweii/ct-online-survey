"use client";

import React, { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
}

export function ShareModal({ isOpen, onClose, url }: ShareModalProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{t.analytics.shareTitle}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4">
          {t.analytics.shareDescription}
        </p>

        {/* URL Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={url}
            readOnly
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-600"
          />
          <button
            onClick={handleCopy}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              copied
                ? "bg-green-600 text-white"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {copied ? t.analytics.linkCopied : t.analytics.copyLink}
          </button>
        </div>
      </div>
    </div>
  );
}
