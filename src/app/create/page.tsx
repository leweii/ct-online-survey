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
        "您好！我是您的问卷设计助手。请描述您的问卷主题（例如：\"餐厅顾客满意度调查\"），我会为您生成一套包含 21-28 个问题的完整专业问卷供您审阅，您可以根据需要删减问题。",
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
                    accumulatedText += `\n\n问卷已创建成功！以下是详细信息：\n\n**问卷链接：** ${surveyUrl}\n\n**创建者代码：** ${data.surveyState.creator_code}\n\n请妥善保存创建者代码，以便后续查看仪表盘和回复数据。`;
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
              "抱歉，遇到了一些问题。请重试。",
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
          <h1 className="text-lg font-semibold">创建问卷</h1>
        </div>
        {surveyState?.title && (
          <span className="text-sm text-gray-500">
            {surveyState.questions.length} 个问题
          </span>
        )}
      </header>

      {/* Chat */}
      <div className="flex-1 overflow-hidden">
        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          placeholder="输入您的回复..."
          streamingContent={streamingContent}
        />
      </div>
    </div>
  );
}
