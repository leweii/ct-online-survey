"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface TurnstileVerificationProps {
  onVerified: () => void;
  context: "create" | "survey";
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          language?: string;
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

const STORAGE_KEY_PREFIX = "turnstile_verified_";

export function TurnstileVerification({ onVerified, context }: TurnstileVerificationProps) {
  const { t, language } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if already verified
  useEffect(() => {
    const storageKey = STORAGE_KEY_PREFIX + context;
    const verified = sessionStorage.getItem(storageKey);
    if (verified === "true") {
      onVerified();
    }
  }, [context, onVerified]);

  const resetWidget = () => {
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  };

  // Load Turnstile script and render widget
  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey) {
      console.error("Turnstile site key not configured");
      // Allow access if not configured (development)
      onVerified();
      return;
    }

    // Load script if not already loaded
    const loadScript = () => {
      return new Promise<void>((resolve) => {
        if (window.turnstile) {
          resolve();
          return;
        }

        const script = document.createElement("script");
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
        script.async = true;
        script.onload = () => resolve();
        document.head.appendChild(script);
      });
    };

    const handleVerify = async (token: string) => {
      setIsVerifying(true);
      setError(null);

      try {
        const response = await fetch("/api/verify-turnstile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, context }),
        });

        if (!response.ok) {
          throw new Error("Verification failed");
        }

        const data = await response.json();
        if (data.success) {
          const storageKey = STORAGE_KEY_PREFIX + context;
          sessionStorage.setItem(storageKey, "true");
          onVerified();
        } else {
          setError(t.verification.failed);
          resetWidget();
        }
      } catch {
        setError(t.verification.failed);
        resetWidget();
      } finally {
        setIsVerifying(false);
      }
    };

    const handleError = () => {
      setError(t.verification.error);
      setIsVerifying(false);
    };

    const handleExpired = () => {
      setError(t.verification.expired);
      resetWidget();
    };

    const initWidget = async () => {
      await loadScript();

      // Wait for turnstile to be available
      let attempts = 0;
      while (!window.turnstile && attempts < 50) {
        await new Promise((r) => setTimeout(r, 100));
        attempts++;
      }

      if (!window.turnstile || !containerRef.current) return;

      // Remove existing widget if any
      if (widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current);
      }

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: handleVerify,
        "error-callback": handleError,
        "expired-callback": handleExpired,
        theme: "light",
        language: language === "zh" ? "zh-CN" : "en",
      });
    };

    initWidget();

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
  }, [language, onVerified, context, t.verification.failed, t.verification.error, t.verification.expired]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            {t.verification.title}
          </h1>
          <p className="text-gray-600 text-sm">
            {t.verification.description}
          </p>
        </div>

        {/* Turnstile widget container */}
        <div className="flex justify-center mb-4">
          <div ref={containerRef} />
        </div>

        {isVerifying && (
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">{t.verification.verifying}</span>
          </div>
        )}

        {error && (
          <div className="text-red-500 text-sm mt-2">{error}</div>
        )}
      </div>
    </div>
  );
}

// Helper to check if verification is needed
export function isVerified(context: "create" | "survey"): boolean {
  if (typeof window === "undefined") return false;
  const storageKey = STORAGE_KEY_PREFIX + context;
  return sessionStorage.getItem(storageKey) === "true";
}
