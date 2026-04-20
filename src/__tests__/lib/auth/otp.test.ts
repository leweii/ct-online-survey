import { describe, it, expect } from "vitest";
import { generateOtp, hashOtp, verifyOtp } from "@/lib/auth/otp";

describe("otp", () => {
  it("generateOtp returns a 6-digit numeric string", () => {
    const code = generateOtp();
    expect(code).toMatch(/^\d{6}$/);
  });

  it("hashOtp + verifyOtp round-trip works", async () => {
    const code = "123456";
    const hash = await hashOtp(code);
    expect(hash).not.toBe(code);
    expect(await verifyOtp(code, hash)).toBe(true);
    expect(await verifyOtp("000000", hash)).toBe(false);
  });
});
