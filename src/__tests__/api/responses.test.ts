import { describe, it, expect, vi, beforeEach } from "vitest";

// Use vi.hoisted() to avoid "cannot access before initialization" errors
const { mockGetSurveyById, mockGetSurveyByShortCode } = vi.hoisted(() => ({
  mockGetSurveyById: vi.fn(),
  mockGetSurveyByShortCode: vi.fn(),
}));

const { mockCreateResponse, mockGetResponseById, mockUpdateResponse } = vi.hoisted(() => ({
  mockCreateResponse: vi.fn(),
  mockGetResponseById: vi.fn(),
  mockUpdateResponse: vi.fn(),
}));

vi.mock("@/lib/db/surveys", () => ({
  getSurveyById: mockGetSurveyById,
  getSurveyByShortCode: mockGetSurveyByShortCode,
}));

vi.mock("@/lib/db/responses", () => ({
  createResponse: mockCreateResponse,
  getResponseById: mockGetResponseById,
  updateResponse: mockUpdateResponse,
}));

import { POST } from "@/app/api/responses/route";
import { GET, PATCH } from "@/app/api/responses/[id]/route";
import { NextRequest } from "next/server";
import type { SurveyRecord } from "@/lib/db/surveys";
import type { ResponseRecord } from "@/lib/db/responses";

const MOCK_UUID = "60f43ae3-0428-4474-bfb2-ad74d00727d1";
const MOCK_SHORT_CODE = "FKQN";
const MOCK_RESPONSE_ID = "resp-id-123";

const activeSurvey: SurveyRecord = {
  surveyId: MOCK_UUID,
  userId: "user-1",
  shortCode: MOCK_SHORT_CODE,
  title: "Test Survey",
  description: null,
  questions: [],
  settings: {} as any,
  status: "active",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

const mockResponseRecord: ResponseRecord = {
  responseId: MOCK_RESPONSE_ID,
  surveyId: MOCK_UUID,
  respondentId: "respondent-abc",
  answers: {},
  status: "in_progress",
  currentQuestionIndex: 0,
  startedAt: "2024-01-01T00:00:00.000Z",
};

function makePostRequest(body: object): NextRequest {
  return new NextRequest("http://localhost:3000/api/responses", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function makePatchRequest(body: object): NextRequest {
  return new NextRequest(`http://localhost:3000/api/responses/${MOCK_RESPONSE_ID}`, {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// POST /api/responses
// ---------------------------------------------------------------------------
describe("POST /api/responses", () => {
  describe("validation", () => {
    it("returns 400 when survey_id is missing", async () => {
      const res = await POST(makePostRequest({ answers: { q1: "a" } }));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("survey_id is required");
    });

    it("returns 404 when survey is not found (UUID lookup)", async () => {
      mockGetSurveyById.mockResolvedValueOnce(null);

      const res = await POST(makePostRequest({ survey_id: MOCK_UUID }));
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toBe("Survey not found");
    });

    it("returns 404 when survey is not found (short code lookup)", async () => {
      mockGetSurveyByShortCode.mockResolvedValueOnce(null);

      const res = await POST(makePostRequest({ survey_id: MOCK_SHORT_CODE }));
      expect(res.status).toBe(404);
    });

    it("returns 400 when survey status is 'closed'", async () => {
      mockGetSurveyById.mockResolvedValueOnce({ ...activeSurvey, status: "closed" });

      const res = await POST(
        makePostRequest({ survey_id: MOCK_UUID, answers: { q1: "a" }, status: "completed" })
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("Survey is not accepting responses");
    });

    it("returns 400 when survey status is 'draft'", async () => {
      mockGetSurveyById.mockResolvedValueOnce({ ...activeSurvey, status: "draft" });

      const res = await POST(
        makePostRequest({ survey_id: MOCK_UUID, answers: { q1: "a" }, status: "completed" })
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("Survey is not accepting responses");
    });
  });

  describe("survey_id lookup routing", () => {
    it("uses getSurveyById when survey_id is a UUID", async () => {
      mockGetSurveyById.mockResolvedValueOnce(activeSurvey);
      mockCreateResponse.mockResolvedValueOnce(mockResponseRecord);

      await POST(makePostRequest({ survey_id: MOCK_UUID }));

      expect(mockGetSurveyById).toHaveBeenCalledWith(MOCK_UUID);
      expect(mockGetSurveyByShortCode).not.toHaveBeenCalled();
    });

    it("uses getSurveyByShortCode when survey_id is a short code", async () => {
      mockGetSurveyByShortCode.mockResolvedValueOnce(activeSurvey);
      mockCreateResponse.mockResolvedValueOnce(mockResponseRecord);

      await POST(makePostRequest({ survey_id: MOCK_SHORT_CODE }));

      expect(mockGetSurveyByShortCode).toHaveBeenCalledWith(MOCK_SHORT_CODE);
      expect(mockGetSurveyById).not.toHaveBeenCalled();
    });

    it("tries UUID fallback then short code for ambiguous id", async () => {
      const ambiguousId = "ab";
      mockGetSurveyById.mockResolvedValueOnce(null);
      mockGetSurveyByShortCode.mockResolvedValueOnce(null);

      const res = await POST(makePostRequest({ survey_id: ambiguousId }));
      expect(res.status).toBe(404);
      expect(mockGetSurveyById).toHaveBeenCalledWith(ambiguousId);
      expect(mockGetSurveyByShortCode).toHaveBeenCalledWith(ambiguousId.toUpperCase());
    });
  });

  describe("in_progress session creation", () => {
    it("creates an in_progress response when no answers provided", async () => {
      mockGetSurveyById.mockResolvedValueOnce(activeSurvey);
      mockCreateResponse.mockResolvedValueOnce({ ...mockResponseRecord, status: "in_progress" });

      const res = await POST(makePostRequest({ survey_id: MOCK_UUID }));
      expect(res.status).toBe(201);

      expect(mockCreateResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          surveyId: MOCK_UUID,
          answers: {},
          status: "in_progress",
          currentQuestionIndex: 0,
        })
      );
    });

    it("uses provided respondent_id when given", async () => {
      mockGetSurveyById.mockResolvedValueOnce(activeSurvey);
      mockCreateResponse.mockResolvedValueOnce(mockResponseRecord);

      await POST(makePostRequest({ survey_id: MOCK_UUID, respondent_id: "my-respondent" }));

      expect(mockCreateResponse).toHaveBeenCalledWith(
        expect.objectContaining({ respondentId: "my-respondent" })
      );
    });

    it("generates a respondent_id when not provided", async () => {
      mockGetSurveyById.mockResolvedValueOnce(activeSurvey);
      mockCreateResponse.mockResolvedValueOnce(mockResponseRecord);

      await POST(makePostRequest({ survey_id: MOCK_UUID }));

      expect(mockCreateResponse).toHaveBeenCalledWith(
        expect.objectContaining({ respondentId: expect.any(String) })
      );
    });
  });

  describe("completed/partial submission", () => {
    it("creates a completed response with answers", async () => {
      const completedRecord = { ...mockResponseRecord, status: "completed" as const, answers: { q1: "yes" } };
      mockGetSurveyById.mockResolvedValueOnce(activeSurvey);
      mockCreateResponse.mockResolvedValueOnce(completedRecord);

      const res = await POST(
        makePostRequest({ survey_id: MOCK_UUID, answers: { q1: "yes" }, status: "completed" })
      );
      expect(res.status).toBe(201);

      expect(mockCreateResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          surveyId: MOCK_UUID,
          answers: { q1: "yes" },
          status: "completed",
          completedAt: expect.any(String),
        })
      );
    });

    it("creates a partial response with answers", async () => {
      mockGetSurveyById.mockResolvedValueOnce(activeSurvey);
      mockCreateResponse.mockResolvedValueOnce({ ...mockResponseRecord, status: "partial" as const });

      const res = await POST(
        makePostRequest({ survey_id: MOCK_UUID, answers: { q1: "yes" }, status: "partial" })
      );
      expect(res.status).toBe(201);

      expect(mockCreateResponse).toHaveBeenCalledWith(
        expect.objectContaining({ status: "partial" })
      );
    });

    it("stores the surveyId from the database record, not the input short code", async () => {
      mockGetSurveyByShortCode.mockResolvedValueOnce(activeSurvey); // returns surveyId = MOCK_UUID
      mockCreateResponse.mockResolvedValueOnce(mockResponseRecord);

      await POST(
        makePostRequest({ survey_id: MOCK_SHORT_CODE, answers: { q1: "a" }, status: "completed" })
      );

      expect(mockCreateResponse).toHaveBeenCalledWith(
        expect.objectContaining({ surveyId: MOCK_UUID }) // NOT MOCK_SHORT_CODE
      );
    });
  });
});

// ---------------------------------------------------------------------------
// GET /api/responses/[id]
// ---------------------------------------------------------------------------
describe("GET /api/responses/[id]", () => {
  it("returns the response record when found", async () => {
    mockGetResponseById.mockResolvedValueOnce(mockResponseRecord);

    const req = new NextRequest(`http://localhost:3000/api/responses/${MOCK_RESPONSE_ID}`);
    const res = await GET(req, { params: Promise.resolve({ id: MOCK_RESPONSE_ID }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.responseId).toBe(MOCK_RESPONSE_ID);
    expect(mockGetResponseById).toHaveBeenCalledWith(MOCK_RESPONSE_ID);
  });

  it("returns 404 when response is not found", async () => {
    mockGetResponseById.mockResolvedValueOnce(null);

    const req = new NextRequest(`http://localhost:3000/api/responses/missing-id`);
    const res = await GET(req, { params: Promise.resolve({ id: "missing-id" }) });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Response not found");
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/responses/[id]
// ---------------------------------------------------------------------------
describe("PATCH /api/responses/[id]", () => {
  it("updates answers", async () => {
    const updated = { ...mockResponseRecord, answers: { q1: "updated" } };
    mockUpdateResponse.mockResolvedValueOnce(updated);

    const res = await PATCH(
      makePatchRequest({ answers: { q1: "updated" } }),
      { params: Promise.resolve({ id: MOCK_RESPONSE_ID }) }
    );

    expect(res.status).toBe(200);
    expect(mockUpdateResponse).toHaveBeenCalledWith(
      MOCK_RESPONSE_ID,
      expect.objectContaining({ answers: { q1: "updated" } })
    );
  });

  it("updates status", async () => {
    const updated = { ...mockResponseRecord, status: "completed" as const };
    mockUpdateResponse.mockResolvedValueOnce(updated);

    const res = await PATCH(
      makePatchRequest({ status: "completed" }),
      { params: Promise.resolve({ id: MOCK_RESPONSE_ID }) }
    );

    expect(res.status).toBe(200);
    expect(mockUpdateResponse).toHaveBeenCalledWith(
      MOCK_RESPONSE_ID,
      expect.objectContaining({ status: "completed" })
    );
  });

  it("maps current_question_index to currentQuestionIndex", async () => {
    const updated = { ...mockResponseRecord, currentQuestionIndex: 3 };
    mockUpdateResponse.mockResolvedValueOnce(updated);

    await PATCH(
      makePatchRequest({ current_question_index: 3 }),
      { params: Promise.resolve({ id: MOCK_RESPONSE_ID }) }
    );

    expect(mockUpdateResponse).toHaveBeenCalledWith(
      MOCK_RESPONSE_ID,
      expect.objectContaining({ currentQuestionIndex: 3 })
    );
  });

  it("maps completed_at to completedAt", async () => {
    const ts = "2024-06-01T12:00:00.000Z";
    const updated = { ...mockResponseRecord, completedAt: ts };
    mockUpdateResponse.mockResolvedValueOnce(updated);

    await PATCH(
      makePatchRequest({ completed_at: ts }),
      { params: Promise.resolve({ id: MOCK_RESPONSE_ID }) }
    );

    expect(mockUpdateResponse).toHaveBeenCalledWith(
      MOCK_RESPONSE_ID,
      expect.objectContaining({ completedAt: ts })
    );
  });

  it("returns 404 when response not found", async () => {
    mockUpdateResponse.mockResolvedValueOnce(null);

    const res = await PATCH(
      makePatchRequest({ status: "completed" }),
      { params: Promise.resolve({ id: "non-existent" }) }
    );

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Response not found");
  });

  it("returns 400 for invalid JSON body", async () => {
    const req = new NextRequest(`http://localhost:3000/api/responses/${MOCK_RESPONSE_ID}`, {
      method: "PATCH",
      body: "not-json",
      headers: { "Content-Type": "application/json" },
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: MOCK_RESPONSE_ID }) });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid request body");
  });
});
