"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChatInterface, Message } from "@/components/ChatInterface";
import type { Question } from "@/types/database";

interface SurveyState {
  id?: string;
  title?: string;
  description?: string;
  questions: Question[];
  creator_code: string;
  isFinalized: boolean;
}

export default function CreateSurveyPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I'm here to help you create a survey. Just describe your survey topic (e.g., \"customer satisfaction for a restaurant\") and I'll generate a complete survey with relevant questions for you to review.",
    },
  ]);
  const [surveyState, setSurveyState] = useState<SurveyState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");

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

                  // If survey is finalized, show completion message
                  if (data.surveyState.isFinalized && data.surveyState.id) {
                    const surveyUrl = `${window.location.origin}/survey/${data.surveyState.id}`;
                    accumulatedText += `\n\nYour survey is ready! Here are the details:\n\n**Survey Link:** ${surveyUrl}\n\n**Creator Code:** ${data.surveyState.creator_code}\n\nSave your creator code to access your dashboard and view responses later.`;
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
            content:
              "Sorry, I encountered an error. Please try again.",
          },
        ]);
      } finally {
        setIsLoading(false);
        setStreamingContent("");
      }
    },
    [messages, surveyState]
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
          <h1 className="text-lg font-semibold">Create Survey</h1>
        </div>
        {surveyState?.title && (
          <span className="text-sm text-gray-500">
            {surveyState.questions.length} question
            {surveyState.questions.length !== 1 ? "s" : ""}
          </span>
        )}
      </header>

      {/* Chat */}
      <div className="flex-1 overflow-hidden">
        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          placeholder="Type your response..."
          streamingContent={streamingContent}
        />
      </div>
    </div>
  );
}
