import { NextRequest, NextResponse } from "next/server";

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function POST(request: NextRequest) {
  try {
    const { token, context } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token required" },
        { status: 400 }
      );
    }

    const secretKey = process.env.TURNSTILE_SECRET_KEY;
    if (!secretKey) {
      // Allow access if not configured (development)
      console.warn("Turnstile secret key not configured, allowing access");
      return NextResponse.json({ success: true });
    }

    // Verify token with Cloudflare
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token);

    const verifyResponse = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const result = await verifyResponse.json();

    if (result.success) {
      console.log(`Turnstile verification successful for context: ${context}`);
      return NextResponse.json({ success: true });
    } else {
      console.warn("Turnstile verification failed:", result["error-codes"]);
      return NextResponse.json(
        { success: false, error: "Verification failed" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Turnstile verification error:", error);
    return NextResponse.json(
      { success: false, error: "Internal error" },
      { status: 500 }
    );
  }
}
