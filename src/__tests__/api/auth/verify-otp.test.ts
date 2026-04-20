import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetOtp, mockDeleteOtp, mockFindUser, mockCreateUser, mockSetSession, mockVerifyOtpFn } = vi.hoisted(() => ({
  mockGetOtp: vi.fn(),
  mockDeleteOtp: vi.fn(),
  mockFindUser: vi.fn(),
  mockCreateUser: vi.fn(),
  mockSetSession: vi.fn(),
  mockVerifyOtpFn: vi.fn(),
}));

vi.mock("@/lib/db/otp", () => ({ getOtp: mockGetOtp, deleteOtp: mockDeleteOtp }));
vi.mock("@/lib/db/users", () => ({
  findUserByEmail: mockFindUser,
  createUser: mockCreateUser,
}));
vi.mock("@/lib/auth/session", () => ({ setSessionCookie: mockSetSession }));
vi.mock("@/lib/auth/otp", () => ({
  generateOtp: vi.fn(),
  hashOtp: vi.fn(),
  otpExpiresAtUnix: vi.fn(),
  verifyOtp: mockVerifyOtpFn,
}));

import { POST } from "@/app/api/auth/verify-otp/route";
import { NextRequest } from "next/server";

function req(body: unknown) {
  return new NextRequest("http://localhost/api/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/verify-otp", () => {
  const NOW = Math.floor(Date.now() / 1000);

  beforeEach(() => {
    [mockGetOtp, mockDeleteOtp, mockFindUser, mockCreateUser, mockSetSession, mockVerifyOtpFn].forEach((m) => m.mockReset());
  });

  it("returns 400 when no OTP record", async () => {
    mockGetOtp.mockResolvedValue(null);
    const res = await POST(req({ email: "a@b.com", code: "123456" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when OTP expired", async () => {
    mockGetOtp.mockResolvedValue({ email: "a@b.com", otpHash: "x", expiresAt: NOW - 10 });
    const res = await POST(req({ email: "a@b.com", code: "123456" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when hash mismatch", async () => {
    mockGetOtp.mockResolvedValue({ email: "a@b.com", otpHash: "x", expiresAt: NOW + 500 });
    mockVerifyOtpFn.mockResolvedValue(false);
    const res = await POST(req({ email: "a@b.com", code: "000000" }));
    expect(res.status).toBe(400);
  });

  it("creates a user on first login, deletes OTP, sets cookie", async () => {
    mockGetOtp.mockResolvedValue({ email: "a@b.com", otpHash: "x", expiresAt: NOW + 500 });
    mockVerifyOtpFn.mockResolvedValue(true);
    mockFindUser.mockResolvedValue(null);
    mockCreateUser.mockResolvedValue({ userId: "u1", email: "a@b.com", createdAt: "t" });

    const res = await POST(req({ email: "a@b.com", code: "123456" }));
    expect(res.status).toBe(200);
    expect(mockCreateUser).toHaveBeenCalledWith("a@b.com");
    expect(mockDeleteOtp).toHaveBeenCalledWith("a@b.com");
    expect(mockSetSession).toHaveBeenCalledWith({ userId: "u1", email: "a@b.com" });
  });

  it("re-uses existing user on subsequent login", async () => {
    mockGetOtp.mockResolvedValue({ email: "a@b.com", otpHash: "x", expiresAt: NOW + 500 });
    mockVerifyOtpFn.mockResolvedValue(true);
    mockFindUser.mockResolvedValue({ userId: "u1", email: "a@b.com", createdAt: "t" });

    const res = await POST(req({ email: "a@b.com", code: "123456" }));
    expect(res.status).toBe(200);
    expect(mockCreateUser).not.toHaveBeenCalled();
  });
});
