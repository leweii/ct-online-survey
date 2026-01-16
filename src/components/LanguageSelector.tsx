"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Language } from "@/lib/translations";

const languages: { code: Language; label: string; short: string }[] = [
  { code: "en", label: "English", short: "EN" },
  { code: "zh", label: "中文", short: "中" },
];

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const currentLang = languages.find((l) => l.code === language) || languages[0];

  return (
    <div className="fixed bottom-16 right-4 z-50">
      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden min-w-[120px]">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors flex items-center gap-2 ${
                language === lang.code ? "bg-blue-50 text-blue-600" : "text-gray-700"
              }`}
            >
              {language === lang.code && (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              <span className={language === lang.code ? "" : "ml-6"}>{lang.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        aria-label="Select language"
      >
        {currentLang.short}
      </button>
    </div>
  );
}
