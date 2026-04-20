import { describe, it, expect, beforeAll } from "vitest";

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret-that-is-long-enough-32chars";
});

import { signSessionToken, verifySessionToken } from "@/lib/auth/jwt";

describe("jwt", () => {
  it("signs and verifies a valid token", () => {
    const token = signSessionToken({ userId: "u1", email: "a@b.com" });
    const payload = verifySessionToken(token);
    expect(payload?.userId).toBe("u1");
    expect(payload?.email).toBe("a@b.com");
  });

  it("returns null for tampered token", () => {
    const token = signSessionToken({ userId: "u1", email: "a@b.com" });
    expect(verifySessionToken(token + "x")).toBeNull();
  });
});
