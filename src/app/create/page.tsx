"use client";

import { useState, useCallback, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChatInterface, Message } from "@/components/ChatInterface";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Question } from "@/types/database";

interface SurveyState {
  id?: string;
  short_code?: string;  // User-facing survey code
  title?: string;
  description?: string;
  questions: Question[];
  creator_code: string;  // Legacy
  creator_name?: string;  // Fun pet name for creator
  custom_creator_name?: string;  // User-provided custom name
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

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-white px-4 py-3 flex items-center justify-between">
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
            {surveyState.questions.length} {t.create.questionsCount}
          </span>
        )}
      </header>

      {/* Chat */}
      <div className="flex-1 overflow-hidden">
        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          placeholder={t.create.inputPlaceholder}
          streamingContent={streamingContent}
        />
      </div>
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
