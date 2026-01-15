"use client";

import ReactMarkdown from "react-markdown";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

// Clean ACTION tags from content
function cleanContent(text: string): string {
  return text.replace(/<ACTION>[\s\S]*?<\/ACTION>/g, "").trim();
}

export function MessageBubble({ role, content, isStreaming }: MessageBubbleProps) {
  const isUser = role === "user";
  const cleanedContent = cleanContent(content);

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-blue-600 text-white rounded-br-md"
            : "bg-gray-100 text-gray-800 rounded-bl-md"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {cleanedContent}
          </p>
        ) : (
          <div className="text-sm leading-relaxed prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 prose-strong:text-gray-900">
            <ReactMarkdown>{cleanedContent}</ReactMarkdown>
            {isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-gray-800 animate-pulse" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
