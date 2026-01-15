"use client";

import { useLanguage } from "@/contexts/LanguageContext";

export function Footer() {
  const { language } = useLanguage();

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-gray-100 py-2 px-4 z-40">
      <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-gray-500">
        <a
          href="https://www.jakobhe.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-blue-600 transition-colors font-medium text-gray-600"
        >
          {language === "en" ? "Blog - Jakob | AI Insights" : "博客 - 雅Kob | AI洞察"}
        </a>
        <span className="text-gray-300">|</span>
        <a
          href="mailto:lewei.me@gmail.com"
          className="hover:text-blue-600 transition-colors"
        >
          lewei.me@gmail.com
        </a>
        <span className="text-gray-300">|</span>
        <span>
          {language === "en" ? "Xiaohongshu" : "小红书"}: @何乐为
        </span>
      </div>
    </footer>
  );
}
