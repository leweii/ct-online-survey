import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSend = vi.fn();
vi.mock("@/lib/dynamodb", () => ({
  getDocClient: () => ({ send: mockSend }),
  tableName: (s: string) => `ct-survey-${s}`,
}));

import { putOtp, getOtp, deleteOtp } from "@/lib/db/otp";

describe("otp repo", () => {
  beforeEach(() => {
    mockSend.mockReset();
  });

  it("putOtp stores email, otpHash, expiresAt", async () => {
    mockSend.mockResolvedValueOnce({});
    await putOtp({ email: "a@b.com", otpHash: "$2b$...", expiresAt: 1234567890 });
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.input.TableName).toBe("ct-survey-otp");
    expect(cmd.input.Item.email).toBe("a@b.com");
    expect(cmd.input.Item.expiresAt).toBe(1234567890);
  });

  it("getOtp returns null when not present", async () => {
    mockSend.mockResolvedValueOnce({ Item: undefined });
    expect(await getOtp("nobody@x.com")).toBeNull();
  });

  it("deleteOtp issues a DeleteCommand", async () => {
    mockSend.mockResolvedValueOnce({});
    await deleteOtp("a@b.com");
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.input.Key.email).toBe("a@b.com");
  });
});
