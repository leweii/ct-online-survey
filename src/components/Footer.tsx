"use client";

import { useLanguage } from "@/contexts/LanguageContext";

export function Footer() {
  const { language } = useLanguage();

  const labels = {
    en: {
      blog: "Blog: 雅Kob | AI Insights",
      email: "Email",
      social: "RED (Xiaohongshu)",
    },
    zh: {
      blog: "博客：雅Kob | AI洞察",
      email: "邮箱",
      social: "小红书",
    },
  };

  const t = labels[language];

  return (
    <footer className="w-full py-4 text-center text-gray-500 text-sm">
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        <a
          href="https://www.jakobhe.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-gray-700 transition-colors"
        >
          {t.blog}
        </a>
        <span className="hidden sm:inline">|</span>
        <a
          href="mailto:lewei.me@gmail.com"
          className="hover:text-gray-700 transition-colors"
        >
          {t.email}: lewei.me@gmail.com
        </a>
        <span className="hidden sm:inline">|</span>
        <a
          href="https://www.xiaohongshu.com/user/profile/5af2e25be8ac2b6d7de52352"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-gray-700 transition-colors"
        >
          {t.social}
        </a>
      </div>
    </footer>
  );
}
