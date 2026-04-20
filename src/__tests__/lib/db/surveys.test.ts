import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSend = vi.fn();
vi.mock("@/lib/dynamodb", () => ({
  getDocClient: () => ({ send: mockSend }),
  tableName: (s: string) => `ct-survey-${s}`,
}));

import {
  createSurvey,
  getSurveyById,
  getSurveyByShortCode,
  updateSurvey,
  listSurveysByUserId,
} from "@/lib/db/surveys";

describe("surveys repo", () => {
  beforeEach(() => mockSend.mockReset());

  it("createSurvey assigns surveyId, timestamps, and stores on the surveys table", async () => {
    mockSend.mockResolvedValueOnce({});
    const s = await createSurvey({
      userId: "u1",
      shortCode: "AB12",
      title: "T",
      description: null,
      questions: [],
      settings: {},
      status: "draft",
    });
    expect(s.surveyId).toMatch(/.+/);
    expect(s.createdAt).toBeDefined();
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.input.TableName).toBe("ct-survey-surveys");
    expect(cmd.input.Item.userId).toBe("u1");
  });

  it("getSurveyById returns null when missing", async () => {
    mockSend.mockResolvedValueOnce({ Item: undefined });
    expect(await getSurveyById("x")).toBeNull();
  });

  it("getSurveyByShortCode uses shortCode-index GSI", async () => {
    mockSend.mockResolvedValueOnce({
      Items: [{ surveyId: "s1", shortCode: "AB12", userId: "u1" }],
    });
    const s = await getSurveyByShortCode("AB12");
    expect(s?.surveyId).toBe("s1");
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.input.IndexName).toBe("shortCode-index");
  });

  it("listSurveysByUserId uses userId-index GSI", async () => {
    mockSend.mockResolvedValueOnce({
      Items: [{ surveyId: "s1", userId: "u1" }, { surveyId: "s2", userId: "u1" }],
    });
    const list = await listSurveysByUserId("u1");
    expect(list).toHaveLength(2);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.input.IndexName).toBe("userId-index");
  });

  it("updateSurvey builds a partial UpdateCommand and bumps updatedAt", async () => {
    mockSend.mockResolvedValueOnce({
      Attributes: { surveyId: "s1", title: "new", updatedAt: "2026-04-20T00:00:00Z" },
    });
    const res = await updateSurvey("s1", { title: "new" });
    expect(res?.title).toBe("new");
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.input.UpdateExpression).toContain("title");
    expect(cmd.input.UpdateExpression).toContain("updatedAt");
  });
});
