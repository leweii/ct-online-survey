"use client";

import ReactMarkdown from "react-markdown";
import { useLanguage } from "@/contexts/LanguageContext";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  aiLabel?: string;
}

// Clean ACTION tags from content
function cleanContent(text: string): string {
  return text.replace(/<ACTION>[\s\S]*?<\/ACTION>/g, "").trim();
}

export function MessageBubble({ role, content, isStreaming, aiLabel }: MessageBubbleProps) {
  const { t } = useLanguage();
  const isUser = role === "user";
  const cleanedContent = cleanContent(content);

  return (
    <div className="py-2">
      {/* Role indicator */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base">{isUser ? "👤" : "🤖"}</span>
        <span className="text-sm font-medium text-gray-700">
          {isUser ? t.chat.youLabel : (aiLabel || t.chat.aiLabel)}
        </span>
      </div>

      {/* Message content */}
      <div className="pl-7">
        {isUser ? (
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
            {cleanedContent}
          </p>
        ) : (
          <div className="text-sm text-gray-800 leading-relaxed prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 prose-strong:text-gray-900">
            <ReactMarkdown>{cleanedContent}</ReactMarkdown>
            {isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-gray-600 animate-pulse" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
