"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Stage = "idle" | "sent" | "success";

const ERROR_COPY: Record<string, string> = {
  INVALID_EMAIL: "邮箱格式不太对，再检查一下",
  EMAIL_SEND_FAILED: "邮件发送失败，过会儿再试，或换个邮箱",
  NO_OTP: "请先获取验证码",
  EXPIRED: "验证码已过期（10 分钟），重新发一次？",
  INCORRECT: "验证码不对，再看看邮件",
  INVALID_CODE_FORMAT: "验证码应该是 6 位数字",
  VERIFICATION_FAILED: "登录失败，刷新页面重试",
  invalid_link: "链接无效，请重新获取验证码",
  expired: "链接已过期，请重新获取验证码",
};

function humanize(code: string | null | undefined, fallback = "操作失败，请重试"): string {
  if (!code) return fallback;
  return ERROR_COPY[code] ?? fallback;
}

const RESEND_COOLDOWN = 60;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";

  const [stage, setStage] = useState<Stage>("idle");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const otpInputRef = useRef<HTMLInputElement | null>(null);
  const verifyingRef = useRef(false);

  useEffect(() => {
    const fromUrl = searchParams.get("error");
    if (fromUrl) setError(humanize(fromUrl));
  }, [searchParams]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (stage === "sent") {
      const t = setTimeout(() => otpInputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [stage]);

  async function requestOtp(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "EMAIL_SEND_FAILED");
      setCode("");
      setStage("sent");
      setCooldown(RESEND_COOLDOWN);
    } catch (err: any) {
      setError(humanize(err?.message, "发送失败，请重试"));
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(codeToVerify: string) {
    if (verifyingRef.current) return;
    verifyingRef.current = true;
    setVerifying(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: codeToVerify }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "VERIFICATION_FAILED");
      setStage("success");
      setTimeout(() => router.push(next), 700);
    } catch (err: any) {
      setError(humanize(err?.message, "验证失败"));
      setShake(true);
      setTimeout(() => setShake(false), 400);
      setCode("");
      otpInputRef.current?.focus();
    } finally {
      verifyingRef.current = false;
      setVerifying(false);
    }
  }

  function onCodeChange(v: string) {
    const cleaned = v.replace(/\D/g, "").slice(0, 6);
    setCode(cleaned);
    if (cleaned.length === 6) verifyOtp(cleaned);
  }

  function changeEmail() {
    setStage("idle");
    setCode("");
    setError(null);
  }

  async function resend() {
    if (cooldown > 0 || loading) return;
    await requestOtp();
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">畅谈问卷</h1>
          <p className="text-gray-600">与AI共创</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 transition-all">
          {stage === "idle" && (
            <form onSubmit={requestOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  邮箱地址
                </label>
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading || email.length === 0}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? "发送中…" : "继续"}
              </button>
              <p className="text-xs text-gray-500 text-center pt-2">
                第一次使用？输入邮箱直接创建账户
              </p>
            </form>
          )}

          {stage === "sent" && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                <p className="text-green-900 font-medium">
                  ✓ 验证码已发到 <span className="font-mono">{email}</span>
                </p>
                <p className="text-green-700 mt-1">10 分钟内有效。没收到？检查垃圾邮件。</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  6 位验证码
                </label>
                <input
                  ref={otpInputRef}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="\d{6}"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(e) => onCodeChange(e.target.value)}
                  disabled={verifying}
                  placeholder="000000"
                  className={
                    "w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-3xl font-mono tracking-[0.5em] transition-all " +
                    (error
                      ? "border-red-400 bg-red-50"
                      : "border-gray-300 bg-white") +
                    (shake ? " animate-shake" : "")
                  }
                />
              </div>

              <a
                href={`mailto:`}
                className="block w-full py-3 text-center bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                打开邮箱 APP →
              </a>

              <div className="flex items-center justify-between text-sm pt-1">
                <button
                  type="button"
                  onClick={changeEmail}
                  className="text-gray-600 hover:text-gray-900"
                >
                  ← 换个邮箱
                </button>
                <button
                  type="button"
                  onClick={resend}
                  disabled={cooldown > 0 || loading}
                  className="text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  {cooldown > 0 ? `重新发送 (${cooldown}s)` : "重新发送"}
                </button>
              </div>
            </div>
          )}

          {stage === "success" && (
            <div className="py-10 text-center space-y-3 animate-fade-in">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                <svg
                  className="w-9 h-9 text-green-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-900">登录成功</p>
              <p className="text-sm text-gray-500">正在跳转…</p>
            </div>
          )}

          {error && stage !== "success" && (
            <p className="mt-4 text-red-600 text-sm text-center">{error}</p>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        :global(.animate-shake) {
          animation: shake 0.4s ease-in-out;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        :global(.animate-fade-in) {
          animation: fade-in 0.4s ease-out;
        }
      `}</style>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
