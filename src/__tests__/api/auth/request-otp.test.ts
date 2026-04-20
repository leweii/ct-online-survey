import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockPutOtp, mockSendOtp } = vi.hoisted(() => ({
  mockPutOtp: vi.fn(),
  mockSendOtp: vi.fn(),
}));

vi.mock("@/lib/db/otp", () => ({ putOtp: mockPutOtp }));
vi.mock("@/lib/auth/ses", () => ({ sendOtpEmail: mockSendOtp }));

import { POST } from "@/app/api/auth/request-otp/route";
import { NextRequest } from "next/server";

function req(body: unknown) {
  return new NextRequest("http://localhost/api/auth/request-otp", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/request-otp", () => {
  beforeEach(() => {
    mockPutOtp.mockReset();
    mockSendOtp.mockReset();
    mockPutOtp.mockResolvedValue(undefined);
    mockSendOtp.mockResolvedValue(undefined);
  });

  it("stores bcrypt hash and sends email for a valid email", async () => {
    const res = await POST(req({ email: "user@example.com" }));
    expect(res.status).toBe(200);
    expect(mockPutOtp).toHaveBeenCalledOnce();
    expect(mockSendOtp).toHaveBeenCalledWith(
      "user@example.com",
      expect.stringMatching(/^\d{6}$/)
    );
  });

  it("returns 400 for invalid email format", async () => {
    const res = await POST(req({ email: "not-an-email" }));
    expect(res.status).toBe(400);
    expect(mockSendOtp).not.toHaveBeenCalled();
  });

  it("normalizes email to lowercase before storage", async () => {
    await POST(req({ email: "User@Example.COM" }));
    expect(mockPutOtp.mock.calls[0][0].email).toBe("user@example.com");
  });
});
