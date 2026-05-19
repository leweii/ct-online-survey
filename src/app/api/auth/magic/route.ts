import { NextRequest, NextResponse } from "next/server";
import { getOtp, deleteOtp } from "@/lib/db/otp";
import { findUserByEmail, createUser } from "@/lib/db/users";
import { verifyMagicToken } from "@/lib/auth/otp";
import { setSessionCookie } from "@/lib/auth/session";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function redirectToLogin(request: NextRequest, reason: string): NextResponse {
  const url = new URL("/login", request.url);
  url.searchParams.set("error", reason);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawEmail = searchParams.get("email");
  const token = searchParams.get("token");

  if (!rawEmail || !EMAIL_RE.test(rawEmail) || !token) {
    return redirectToLogin(request, "invalid_link");
  }
  const email = rawEmail.trim().toLowerCase();

  const record = await getOtp(email);
  if (!record || !record.magicTokenHash) {
    return redirectToLogin(request, "expired");
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (record.expiresAt < nowSec) {
    await deleteOtp(email);
    return redirectToLogin(request, "expired");
  }

  if (!verifyMagicToken(token, record.magicTokenHash)) {
    return redirectToLogin(request, "invalid_link");
  }

  await deleteOtp(email);

  let user = await findUserByEmail(email);
  if (!user) user = await createUser(email);

  await setSessionCookie({ userId: user.userId, email: user.email });

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
