"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ResponseModeSelector } from "@/components/ResponseModeSelector";
import { FormResponse } from "@/components/FormResponse";
import { TurnstileVerification, isVerified } from "@/components/TurnstileVerification";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Survey } from "@/types/database";

type ResponseMode = "selecting" | "form";

export default function SurveyResponsePage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useLanguage();
  const surveyId = params.id as string;

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<ResponseMode>("selecting");

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

  const handleSelectMode = () => {
    setMode("form");
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

  // Welcome page
  if (mode === "selecting") {
    return <ResponseModeSelector survey={survey} onSelectMode={handleSelectMode} />;
  }

  // Form mode - completed
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

  // Form mode
  return (
    <FormResponse
      survey={survey}
      onSubmit={handleFormSubmit}
      onPartialSubmit={handlePartialSubmit}
      isSubmitting={isSubmitting}
    />
  );
}
