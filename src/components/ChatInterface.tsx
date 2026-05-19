"use client";

import { useState, useRef, useEffect, FormEvent, KeyboardEvent } from "react";
import { MessageBubble } from "./MessageBubble";
import { useLanguage } from "@/contexts/LanguageContext";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  streamingContent?: string;
  hideInput?: boolean;
  aiLabel?: string;
  suggestedPrompts?: string[];
}

export function ChatInterface({
  messages,
  onSendMessage,
  isLoading = false,
  placeholder,
  streamingContent,
  hideInput = false,
  aiLabel,
  suggestedPrompts,
}: ChatInterfaceProps) {
  const { t } = useLanguage();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 150) + "px";
    }
  }, [input]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        onSendMessage(input.trim());
        setInput("");
      }
    }
  };

  const handleChipClick = (prompt: string) => {
    if (isLoading) return;
    onSendMessage(prompt);
  };

  // Show chips only after first welcome message, before user sends anything
  const showChips =
    suggestedPrompts &&
    suggestedPrompts.length > 0 &&
    messages.length === 1 &&
    messages[0].role === "assistant" &&
    !isLoading &&
    !streamingContent;

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            role={message.role}
            content={message.content}
            aiLabel={aiLabel}
          />
        ))}

        {/* Prompt chips — shown only on welcome screen */}
        {showChips && (
          <div className="flex flex-wrap gap-2 pt-2 pl-1">
            {suggestedPrompts!.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleChipClick(prompt)}
                className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs rounded-full hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors shadow-sm"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Streaming content */}
        {streamingContent && (
          <MessageBubble
            role="assistant"
            content={streamingContent}
            isStreaming={true}
            aiLabel={aiLabel}
          />
        )}

        {/* Loading indicator */}
        {isLoading && !streamingContent && (
          <div className="py-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">🤖</span>
              <span className="text-sm font-medium text-gray-700">{aiLabel || t.chat.aiLabel}</span>
            </div>
            <div className="pl-7 flex items-center gap-2 text-gray-500">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span className="text-sm">{t.chat.aiThinking}</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      {!hideInput && (
        <form onSubmit={handleSubmit} className="border-t p-4 bg-white">
          <div className="flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder || t.question.typeAnswer}
              rows={1}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none overflow-hidden"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm shrink-0"
            >
              {isLoading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                t.send
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
