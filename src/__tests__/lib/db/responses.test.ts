import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSend = vi.fn();
vi.mock("@/lib/dynamodb", () => ({
  getDocClient: () => ({ send: mockSend }),
  tableName: (s: string) => `ct-survey-${s}`,
}));

import {
  createResponse,
  getResponseById,
  listResponsesBySurveyId,
  updateResponse,
} from "@/lib/db/responses";

describe("responses repo", () => {
  beforeEach(() => mockSend.mockReset());

  it("createResponse assigns responseId and startedAt", async () => {
    mockSend.mockResolvedValueOnce({});
    const r = await createResponse({
      surveyId: "s1",
      respondentId: "rid",
      answers: {},
      status: "in_progress",
      currentQuestionIndex: 0,
    });
    expect(r.responseId).toMatch(/.+/);
    expect(r.startedAt).toBeDefined();
  });

  it("listResponsesBySurveyId uses surveyId-index GSI", async () => {
    mockSend.mockResolvedValueOnce({ Items: [{ responseId: "r1" }] });
    const rs = await listResponsesBySurveyId("s1");
    expect(rs).toHaveLength(1);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.input.IndexName).toBe("surveyId-index");
  });

  it("updateResponse builds SET expression for provided fields", async () => {
    mockSend.mockResolvedValueOnce({
      Attributes: { responseId: "r1", status: "completed" },
    });
    const r = await updateResponse("r1", { status: "completed", completedAt: "x" });
    expect(r?.status).toBe("completed");
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.input.UpdateExpression).toContain("status");
    expect(cmd.input.UpdateExpression).toContain("completedAt");
  });
});
