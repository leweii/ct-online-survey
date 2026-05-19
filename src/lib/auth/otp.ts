import bcrypt from "bcryptjs";
import { createHash, randomBytes, randomInt, timingSafeEqual } from "crypto";

const OTP_TTL_SECONDS = 10 * 60;

export function generateOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export async function hashOtp(code: string): Promise<string> {
  return bcrypt.hash(code, 10);
}

export async function verifyOtp(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash);
}

export function otpExpiresAtUnix(): number {
  return Math.floor(Date.now() / 1000) + OTP_TTL_SECONDS;
}

export function generateMagicToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashMagicToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function verifyMagicToken(token: string, hash: string): boolean {
  const computed = hashMagicToken(token);
  if (computed.length !== hash.length) return false;
  return timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
}
