"use client";

import { useState, useCallback, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChatInterface, Message } from "@/components/ChatInterface";
import { SurveyPreview } from "@/components/SurveyPreview";
import { MobileDrawer } from "@/components/MobileDrawer";
import { TurnstileVerification, isVerified } from "@/components/TurnstileVerification";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Question } from "@/types/database";

interface SurveyState {
  id?: string;
  short_code?: string;
  title?: string;
  description?: string;
  questions: Question[];
  creator_code: string;
  creator_name?: string;
  custom_creator_name?: string;
  isFinalized: boolean;
}

function CreateSurveyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const customCreatorName = searchParams.get("creator") || "";
  const editSurveyId = searchParams.get("edit") || "";
  const [messages, setMessages] = useState<Message[]>([]);
  const [surveyState, setSurveyState] = useState<SurveyState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [verified, setVerified] = useState(() => isVerified("create"));
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isLoadingEdit, setIsLoadingEdit] = useState(!!editSurveyId);

  // Load existing survey for editing
  useEffect(() => {
    async function loadSurvey() {
      if (!editSurveyId) return;

      setIsLoadingEdit(true);
      try {
        const res = await fetch(`/api/surveys/${editSurveyId}`);
        if (!res.ok) throw new Error("Failed to load survey");

        const survey = await res.json();
        setSurveyState({
          id: survey.id,
          short_code: survey.short_code,
          title: survey.title,
          description: survey.description,
          questions: survey.questions || [],
          creator_code: survey.creator_code,
          creator_name: survey.creator_name,
          isFinalized: false, // Allow editing
        });

        setMessages([
          { id: "edit-welcome", role: "assistant", content: t.create.welcomeMessage },
        ]);
      } catch (error) {
        console.error("Error loading survey:", error);
        setMessages([
          { id: "error", role: "assistant", content: t.create.errorMessage },
        ]);
      } finally {
        setIsLoadingEdit(false);
      }
    }

    loadSurvey();
  }, [editSurveyId, t.create.welcomeMessage, t.create.errorMessage]);

  useEffect(() => {
    if (!editSurveyId) {
      setMessages([
        { id: "welcome", role: "assistant", content: t.create.welcomeMessage },
      ]);
    }
  }, [t.create.welcomeMessage, editSurveyId]);

  const handleUpdateTitle = useCallback((title: string) => {
    setSurveyState((prev) => prev ? { ...prev, title } : null);
  }, []);

  const handleUpdateDescription = useCallback((description: string) => {
    setSurveyState((prev) => prev ? { ...prev, description } : null);
  }, []);

  const handleUpdateQuestion = useCallback((id: string, updates: Partial<Question>) => {
    setSurveyState((prev) => {
      if (!prev) return null;
      return { ...prev, questions: prev.questions.map((q) => q.id === id ? { ...q, ...updates } : q) };
    });
  }, []);

  const handleDeleteQuestion = useCallback((id: string) => {
    setSurveyState((prev) => {
      if (!prev) return null;
      return { ...prev, questions: prev.questions.filter((q) => q.id !== id) };
    });
  }, []);

  const handleAddQuestion = useCallback((question: Question) => {
    setSurveyState((prev) => {
      if (!prev) return { questions: [question], creator_code: "", isFinalized: false };
      return { ...prev, questions: [...prev.questions, question] };
    });
  }, []);

  const handleReorderQuestions = useCallback((fromIndex: number, toIndex: number) => {
    setSurveyState((prev) => {
      if (!prev) return null;
      const questions = [...prev.questions];
      const [moved] = questions.splice(fromIndex, 1);
      questions.splice(toIndex, 0, moved);
      return { ...prev, questions };
    });
  }, []);

  const handleFinalize = useCallback(async () => {
    if (!surveyState || !surveyState.title || surveyState.questions.length === 0) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/surveys", {
        method: surveyState.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: surveyState.id,
          title: surveyState.title,
          description: surveyState.description,
          questions: surveyState.questions,
          creator_code: surveyState.creator_code,
          customCreatorName: customCreatorName || undefined,
        }),
      });

      if (!response.ok) throw new Error("Failed to save survey");

      const data = await response.json();
      setSurveyState((prev) => prev ? {
        ...prev,
        id: data.id,
        short_code: data.short_code,
        creator_name: data.creator_name,
        isFinalized: false, // Keep editing enabled after saving draft
      } : null);

      // Add success message to chat
      const surveyUrl = `${window.location.origin}/survey/${data.short_code}`;
      const successMessage = surveyState.id
        ? t.preview?.surveyUpdated
        : t.create.surveyCreated
            .replace("{shortCode}", data.short_code)
            .replace("{surveyUrl}", surveyUrl)
            .replace("{creatorName}", data.creator_name);

      setMessages((prev) => [...prev, {
        id: Date.now().toString() + "-system",
        role: "assistant",
        content: successMessage || "Survey saved successfully!",
      }]);
    } catch (error) {
      console.error("Error saving survey:", error);
      setMessages((prev) => [...prev, {
        id: Date.now().toString() + "-error",
        role: "assistant",
        content: t.create.errorMessage,
      }]);
    } finally {
      setIsSaving(false);
    }
  }, [surveyState, customCreatorName, t.create.surveyCreated, t.create.errorMessage, t.preview?.surveyUpdated]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      const userMessage: Message = { id: Date.now().toString(), role: "user", content };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setStreamingContent("");

      try {
        const response = await fetch("/api/chat/creator", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, userMessage].map((m) => ({ role: m.role, content: m.content })),
            surveyState,
            customCreatorName: customCreatorName || undefined,
          }),
        });

        if (!response.ok) throw new Error("Failed to get response");

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
                // Handle intermediate state updates (real-time preview)
                if (data.surveyState) {
                  setSurveyState(data.surveyState);
                }
                // Handle finalization message
                if (data.done && data.surveyState?.isFinalized && data.surveyState?.short_code) {
                  const shortCode = data.surveyState.short_code;
                  const creatorName = data.surveyState.creator_name;
                  const surveyUrl = `${window.location.origin}/survey/${shortCode}`;
                  accumulatedText += "\n\n" + t.create.surveyCreated
                    .replace("{shortCode}", shortCode)
                    .replace("{surveyUrl}", surveyUrl)
                    .replace("{creatorName}", creatorName);
                }
              } catch { /* Ignore parse errors */ }
            }
          }
        }

        if (accumulatedText) {
          setMessages((prev) => [...prev, { id: Date.now().toString() + "-assistant", role: "assistant", content: accumulatedText }]);
        }
      } catch (error) {
        console.error("Error:", error);
        setMessages((prev) => [...prev, { id: Date.now().toString() + "-error", role: "assistant", content: t.create.errorMessage }]);
      } finally {
        setIsLoading(false);
        setStreamingContent("");
      }
    },
    [messages, surveyState, customCreatorName, t.create.surveyCreated, t.create.errorMessage]
  );

  if (!verified) {
    return <TurnstileVerification context="create" onVerified={() => setVerified(true)} />;
  }

  if (isLoadingEdit) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">{t.loading}</p>
        </div>
      </div>
    );
  }

  const questionCount = surveyState?.questions.length || 0;

  return (
    <div className="h-screen flex flex-col">
      <header className="sticky top-0 z-10 border-b bg-white px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/")} className="text-gray-600 hover:text-gray-800">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold">{t.create.title}</h1>
        </div>
        {surveyState?.title && (
          <span className="text-sm text-gray-500">{questionCount} {t.create.questionsCount}</span>
        )}
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-full md:w-[40%] flex flex-col overflow-hidden border-r border-gray-200">
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            placeholder={t.create.inputPlaceholder}
            streamingContent={streamingContent}
            aiLabel={t.chat.designerLabel}
          />
        </div>

        <div className="hidden md:flex md:w-[60%] flex-col bg-gray-50 overflow-hidden">
          <SurveyPreview
            surveyState={surveyState}
            isLoading={isLoading}
            isSaving={isSaving}
            onUpdateTitle={handleUpdateTitle}
            onUpdateDescription={handleUpdateDescription}
            onUpdateQuestion={handleUpdateQuestion}
            onDeleteQuestion={handleDeleteQuestion}
            onAddQuestion={handleAddQuestion}
            onReorderQuestions={handleReorderQuestions}
            onFinalize={handleFinalize}
          />
        </div>
      </div>

      <div className="md:hidden border-t bg-white p-3">
        <button
          onClick={() => setIsMobileDrawerOpen(true)}
          className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {t.preview?.viewSurvey} ({questionCount} {t.create.questionsCount})
        </button>
      </div>

      <MobileDrawer isOpen={isMobileDrawerOpen} onClose={() => setIsMobileDrawerOpen(false)} title={t.preview?.emptyTitle}>
        <SurveyPreview
          surveyState={surveyState}
          isLoading={isLoading}
          isSaving={isSaving}
          onUpdateTitle={handleUpdateTitle}
          onUpdateDescription={handleUpdateDescription}
          onUpdateQuestion={handleUpdateQuestion}
          onDeleteQuestion={handleDeleteQuestion}
          onAddQuestion={handleAddQuestion}
          onReorderQuestions={handleReorderQuestions}
          onFinalize={handleFinalize}
        />
      </MobileDrawer>
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
