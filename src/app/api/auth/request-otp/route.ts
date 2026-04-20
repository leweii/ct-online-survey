import { NextRequest, NextResponse } from "next/server";
import { putOtp } from "@/lib/db/otp";
import { generateOtp, hashOtp, otpExpiresAtUnix } from "@/lib/auth/otp";
import { sendOtpEmail } from "@/lib/auth/ses";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const { email: rawEmail } = await request.json();
    if (typeof rawEmail !== "string" || !EMAIL_RE.test(rawEmail)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    const email = rawEmail.trim().toLowerCase();

    const code = generateOtp();
    const otpHash = await hashOtp(code);
    await putOtp({ email, otpHash, expiresAt: otpExpiresAtUnix() });
    await sendOtpEmail(email, code);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("request-otp error:", err);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
