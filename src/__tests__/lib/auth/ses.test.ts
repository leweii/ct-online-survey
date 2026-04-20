import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSend = vi.fn();

vi.mock("@aws-sdk/client-ses", () => {
  class SESClient {
    send = mockSend;
  }
  class SendEmailCommand {
    input: unknown;
    constructor(input: unknown) {
      this.input = input;
    }
  }
  return { SESClient, SendEmailCommand };
});

beforeEach(() => {
  process.env.AWS_SES_FROM_EMAIL = "noreply@mysurvey.jakobhe.com";
  mockSend.mockReset();
  mockSend.mockResolvedValue({ MessageId: "abc" });
});

import { sendOtpEmail } from "@/lib/auth/ses";

describe("ses", () => {
  it("sends an OTP email to the given address", async () => {
    await sendOtpEmail("user@example.com", "123456");
    expect(mockSend).toHaveBeenCalledOnce();
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.input.Destination.ToAddresses).toEqual(["user@example.com"]);
    expect(cmd.input.Source).toBe("noreply@mysurvey.jakobhe.com");
    expect(cmd.input.Message.Body.Html.Data).toContain("123456");
    expect(cmd.input.Message.Subject.Data).toContain("畅谈问卷");
  });
});
