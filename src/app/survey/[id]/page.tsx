"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChatInterface, Message } from "@/components/ChatInterface";
import type { Survey, Question } from "@/types/database";

interface ResponseState {
  responseId: string;
  surveyId: string;
  currentQuestionIndex: number;
  answers: Record<string, unknown>;
  isCompleted: boolean;
}

export default function SurveyResponsePage() {
  const params = useParams();
  const router = useRouter();
  const surveyId = params.id as string;

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [responseState, setResponseState] = useState<ResponseState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");

  // Fetch survey on mount
  useEffect(() => {
    async function fetchSurvey() {
      try {
        const res = await fetch(`/api/surveys/${surveyId}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError("Survey not found");
          } else {
            setError("Failed to load survey");
          }
          return;
        }
        const data = await res.json();
        if (data.status !== "active") {
          setError("This survey is not currently accepting responses");
          return;
        }
        setSurvey(data);

        // Set welcome message
        const questions = data.questions as Question[];
        setMessages([
          {
            id: "welcome",
            role: "assistant",
            content: `Welcome to "${data.title}"!\n\n${data.description || ""}\n\nThis survey has ${questions.length} question${questions.length !== 1 ? "s" : ""}. Ready to begin? Just type "yes" or "start" when you're ready!`,
          },
        ]);
      } catch {
        setError("Failed to load survey");
      } finally {
        setLoading(false);
      }
    }
    fetchSurvey();
  }, [surveyId]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!survey) return;

      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content,
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setStreamingContent("");

      try {
        const response = await fetch("/api/chat/responder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, userMessage].map((m) => ({
              role: m.role,
              content: m.content,
            })),
            responseState,
            surveyId,
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
                if (data.done && data.responseState) {
                  setResponseState(data.responseState);

                  // If survey is completed, show thank you message
                  if (data.responseState.isCompleted) {
                    accumulatedText += "\n\nThank you for completing the survey! Your responses have been saved.";
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
            content: "Sorry, I encountered an error. Please try again.",
          },
        ]);
      } finally {
        setIsLoading(false);
        setStreamingContent("");
      }
    },
    [messages, responseState, survey, surveyId]
  );

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading survey...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">!</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">{error}</h2>
          <button
            onClick={() => router.push("/")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const questions = survey?.questions as Question[] | undefined;
  const progress = responseState
    ? Math.round(
        ((responseState.currentQuestionIndex + (responseState.isCompleted ? 1 : 0)) /
          (questions?.length || 1)) *
          100
      )
    : 0;

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-white px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg font-semibold truncate">{survey?.title}</h1>
          {responseState && !responseState.isCompleted && (
            <span className="text-sm text-gray-500">
              {responseState.currentQuestionIndex + 1} / {questions?.length}
            </span>
          )}
        </div>
        {responseState && (
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </header>

      {/* Chat */}
      <div className="flex-1 overflow-hidden">
        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          placeholder={
            responseState?.isCompleted
              ? "Survey completed!"
              : "Type your answer..."
          }
          streamingContent={streamingContent}
        />
      </div>
    </div>
  );
}
