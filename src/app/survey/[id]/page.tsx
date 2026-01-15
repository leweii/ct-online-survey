"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChatInterface, Message } from "@/components/ChatInterface";
import { ResponseModeSelector } from "@/components/ResponseModeSelector";
import { FormResponse } from "@/components/FormResponse";
import { QuestionInput } from "@/components/QuestionInput";
import { TurnstileVerification, isVerified } from "@/components/TurnstileVerification";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Survey, Question } from "@/types/database";

type ResponseMode = "selecting" | "form" | "chat";

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
  const { t } = useLanguage();
  const surveyId = params.id as string;

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<ResponseMode>("selecting");

  // Chat mode state
  const [messages, setMessages] = useState<Message[]>([]);
  const [responseState, setResponseState] = useState<ResponseState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [inlineValue, setInlineValue] = useState<unknown>(undefined);

  // Form mode state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formCompleted, setFormCompleted] = useState(false);

  // Verification state
  const [verified, setVerified] = useState(() => isVerified("survey"));

  // Fetch survey on mount
  useEffect(() => {
    async function fetchSurvey() {
      try {
        const res = await fetch(`/api/surveys/${surveyId}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError(t.survey.notFound);
          } else {
            setError(t.survey.loadFailed);
          }
          return;
        }
        const data = await res.json();
        if (data.status !== "active") {
          setError(t.survey.notAccepting);
          return;
        }
        setSurvey(data);
      } catch {
        setError(t.survey.loadFailed);
      } finally {
        setLoading(false);
      }
    }
    fetchSurvey();
  }, [surveyId, t.survey.notFound, t.survey.loadFailed, t.survey.notAccepting]);

  const handleSelectMode = (selectedMode: "form" | "chat") => {
    setMode(selectedMode);

    if (selectedMode === "chat" && survey) {
      const questions = survey.questions as Question[];
      setCurrentQuestion(questions[0] || null);
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: t.survey.welcomeMessage
            .replace("{total}", String(questions.length))
            .replace("{question}", questions[0]?.text || ""),
        },
      ]);
    }
  };

  const handleFormSubmit = async (answers: Record<string, unknown>) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          survey_id: surveyId,
          answers,
          status: "completed",
        }),
      });

      if (!res.ok) throw new Error(t.survey.submitFailed);
      setFormCompleted(true);
    } catch (error) {
      console.error("Submit error:", error);
      alert(t.survey.submitFailedMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePartialSubmit = async (answers: Record<string, unknown>) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          survey_id: surveyId,
          answers,
          status: "partial",
        }),
      });

      if (!res.ok) throw new Error(t.survey.submitFailed);
      setFormCompleted(true);
    } catch (error) {
      console.error("Submit error:", error);
      alert(t.survey.submitFailedMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

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
      setInlineValue(undefined);

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

                  // Update current question
                  const questions = survey.questions as Question[];
                  if (data.responseState.isCompleted) {
                    setCurrentQuestion(null);
                    accumulatedText += "\n\n" + t.survey.thankYou;
                  } else {
                    setCurrentQuestion(questions[data.responseState.currentQuestionIndex] || null);
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
    [messages, responseState, survey, surveyId, t.survey.thankYou, t.create.errorMessage]
  );

  const handleInlineSubmit = () => {
    if (inlineValue !== undefined && inlineValue !== null && inlineValue !== "") {
      handleSendMessage(String(inlineValue));
    }
  };

  // Show verification gate if not verified
  if (!verified) {
    return (
      <TurnstileVerification
        context="survey"
        onVerified={() => setVerified(true)}
      />
    );
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">{t.survey.loadingSurvey}</p>
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
            {t.returnHome}
          </button>
        </div>
      </div>
    );
  }

  if (!survey) return null;

  // Mode selector
  if (mode === "selecting") {
    return <ResponseModeSelector survey={survey} onSelectMode={handleSelectMode} />;
  }

  // Form mode
  if (mode === "form") {
    if (formCompleted) {
      return (
        <div className="h-screen flex items-center justify-center">
          <div className="text-center max-w-md p-6">
            <div className="text-green-500 text-6xl mb-4">&#10003;</div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">{t.survey.completed}</h2>
            <p className="text-gray-600 mb-6">{t.survey.thankYou}</p>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {t.returnHome}
            </button>
          </div>
        </div>
      );
    }
    return (
      <FormResponse
        survey={survey}
        onSubmit={handleFormSubmit}
        onPartialSubmit={handlePartialSubmit}
        isSubmitting={isSubmitting}
      />
    );
  }

  // Chat mode
  const questions = survey.questions as Question[];
  const progress = responseState
    ? Math.round(
        ((responseState.currentQuestionIndex + (responseState.isCompleted ? 1 : 0)) /
          questions.length) *
          100
      )
    : 0;

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-white px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg font-semibold truncate">{survey.title}</h1>
          {responseState && !responseState.isCompleted && (
            <span className="text-sm text-gray-500">
              {responseState.currentQuestionIndex + 1} / {questions.length}
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

      {/* Chat with inline input */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            placeholder={
              responseState?.isCompleted
                ? t.survey.completed
                : t.survey.inputPlaceholder
            }
            streamingContent={streamingContent}
            hideInput
            aiLabel={t.chat.assistantLabel}
          />
        </div>

        {/* Inline question input */}
        {currentQuestion && !responseState?.isCompleted && !isLoading && (
          <div className="border-t bg-gray-50 p-4">
            <QuestionInput
              question={currentQuestion}
              value={inlineValue}
              onChange={setInlineValue}
              onSubmit={handleInlineSubmit}
              inline
            />
            {(currentQuestion.type === "text" || currentQuestion.type === "number") && (
              <button
                onClick={handleInlineSubmit}
                disabled={inlineValue === undefined || inlineValue === null || inlineValue === ""}
                className="mt-3 w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.survey.submitAnswer}
              </button>
            )}
          </div>
        )}

        {/* Text input for chat mode */}
        {!responseState?.isCompleted && (
          <div className="border-t bg-white p-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={t.survey.orEnterAnswer}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isLoading) {
                    const input = e.target as HTMLInputElement;
                    if (input.value.trim()) {
                      handleSendMessage(input.value.trim());
                      input.value = "";
                    }
                  }
                }}
                disabled={isLoading}
              />
              <button
                onClick={(e) => {
                  const input = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                  if (input?.value?.trim()) {
                    handleSendMessage(input.value.trim());
                    input.value = "";
                  }
                }}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {t.send}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
