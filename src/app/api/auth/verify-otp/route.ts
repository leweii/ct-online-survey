import { NextRequest, NextResponse } from "next/server";
import { getOtp, deleteOtp } from "@/lib/db/otp";
import { findUserByEmail, createUser } from "@/lib/db/users";
import { verifyOtp } from "@/lib/auth/otp";
import { setSessionCookie } from "@/lib/auth/session";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_RE = /^\d{6}$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawEmail = body?.email;
    const code = body?.code;

    if (typeof rawEmail !== "string" || !EMAIL_RE.test(rawEmail)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    if (typeof code !== "string" || !CODE_RE.test(code)) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }
    const email = rawEmail.trim().toLowerCase();

    const record = await getOtp(email);
    if (!record) {
      return NextResponse.json({ error: "No OTP requested" }, { status: 400 });
    }

    const nowSec = Math.floor(Date.now() / 1000);
    if (record.expiresAt < nowSec) {
      await deleteOtp(email);
      return NextResponse.json({ error: "OTP expired" }, { status: 400 });
    }

    const ok = await verifyOtp(code, record.otpHash);
    if (!ok) {
      return NextResponse.json({ error: "Incorrect code" }, { status: 400 });
    }

    await deleteOtp(email);

    let user = await findUserByEmail(email);
    if (!user) user = await createUser(email);

    await setSessionCookie({ userId: user.userId, email: user.email });

    return NextResponse.json({ success: true, userId: user.userId, email: user.email });
  } catch (err) {
    console.error("verify-otp error:", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
