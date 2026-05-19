import { NextRequest, NextResponse } from "next/server";
import { putOtp } from "@/lib/db/otp";
import {
  generateOtp,
  hashOtp,
  otpExpiresAtUnix,
  generateMagicToken,
  hashMagicToken,
} from "@/lib/auth/otp";
import { sendOtpEmail } from "@/lib/auth/ses";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function baseUrlFrom(request: NextRequest): string {
  const envUrl = process.env.APP_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const host = request.headers.get("host") || "localhost:3000";
  return `${proto}://${host}`;
}

export async function POST(request: NextRequest) {
  try {
    const { email: rawEmail } = await request.json();
    if (typeof rawEmail !== "string" || !EMAIL_RE.test(rawEmail)) {
      return NextResponse.json({ error: "INVALID_EMAIL" }, { status: 400 });
    }
    const email = rawEmail.trim().toLowerCase();

    const code = generateOtp();
    const otpHash = await hashOtp(code);
    const magicToken = generateMagicToken();
    const magicTokenHash = hashMagicToken(magicToken);

    await putOtp({
      email,
      otpHash,
      magicTokenHash,
      expiresAt: otpExpiresAtUnix(),
    });

    const magicUrl =
      `${baseUrlFrom(request)}/api/auth/magic` +
      `?email=${encodeURIComponent(email)}&token=${magicToken}`;

    await sendOtpEmail(email, code, magicUrl);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("request-otp error:", err);
    return NextResponse.json({ error: "EMAIL_SEND_FAILED" }, { status: 500 });
  }
}
