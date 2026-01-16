import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the supabase client before importing the route
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockFrom = vi.fn();
const mockEq = vi.fn();
const mockIlike = vi.fn();
const mockOr = vi.fn();
const mockSingle = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: (table: string) => {
      mockFrom(table);
      return {
        select: (columns: string) => {
          mockSelect(columns);
          return {
            eq: (col: string, val: string) => {
              mockEq(col, val);
              return {
                single: mockSingle,
              };
            },
            ilike: (col: string, val: string) => {
              mockIlike(col, val);
              return {
                single: mockSingle,
              };
            },
            or: (condition: string) => {
              mockOr(condition);
              return {
                single: mockSingle,
              };
            },
          };
        },
        insert: (data: any) => {
          mockInsert(data);
          return {
            select: () => ({
              single: mockSingle,
            }),
          };
        },
      };
    },
  },
}));

// Import after mocking
import { POST } from "@/app/api/responses/route";
import { NextRequest } from "next/server";

describe("/api/responses POST", () => {
  const MOCK_UUID = "60f43ae3-0428-4474-bfb2-ad74d00727d1";
  const MOCK_SHORT_CODE = "FKQN";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  function createRequest(body: object): NextRequest {
    return new NextRequest("http://localhost:3000/api/responses", {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  describe("survey_id lookup behavior", () => {
    it("should use eq('id', survey_id) when survey_id is a UUID", async () => {
      mockSingle.mockResolvedValueOnce({
        data: { id: MOCK_UUID, status: "active" },
        error: null,
      });
      mockSingle.mockResolvedValueOnce({
        data: { id: "response-id", survey_id: MOCK_UUID },
        error: null,
      });

      const request = createRequest({
        survey_id: MOCK_UUID,
        answers: { q1: "answer" },
        status: "completed",
      });

      await POST(request);

      // Verify that eq was called with 'id' for UUID lookup
      expect(mockEq).toHaveBeenCalledWith("id", MOCK_UUID);
      expect(mockIlike).not.toHaveBeenCalled();
    });

    it("should use ilike('short_code', survey_id) when survey_id is a short code", async () => {
      mockSingle.mockResolvedValueOnce({
        data: { id: MOCK_UUID, status: "active" },
        error: null,
      });
      mockSingle.mockResolvedValueOnce({
        data: { id: "response-id", survey_id: MOCK_UUID },
        error: null,
      });

      const request = createRequest({
        survey_id: MOCK_SHORT_CODE,
        answers: { q1: "answer" },
        status: "completed",
      });

      await POST(request);

      // Verify that ilike was called for short code lookup
      expect(mockIlike).toHaveBeenCalledWith("short_code", MOCK_SHORT_CODE);
    });

    it("should use or() fallback when survey_id format is ambiguous", async () => {
      // Use an ID that matches neither UUID nor short_code pattern
      // "ab" is too short for short_code (4-8 chars) and not a UUID
      const ambiguousId = "ab";

      mockSingle.mockResolvedValueOnce({
        data: { id: MOCK_UUID, status: "active" },
        error: null,
      });
      mockSingle.mockResolvedValueOnce({
        data: { id: "response-id", survey_id: MOCK_UUID },
        error: null,
      });

      const request = createRequest({
        survey_id: ambiguousId,
        answers: { q1: "answer" },
        status: "completed",
      });

      await POST(request);

      // Verify that or was called for ambiguous lookup
      expect(mockOr).toHaveBeenCalledWith(
        `id.eq.${ambiguousId},short_code.ilike.${ambiguousId}`
      );
    });
  });

  describe("actualSurveyId usage - THE CRITICAL BUG FIX", () => {
    it("CRITICAL: should store actual UUID when submitting with short_code", async () => {
      // This is the critical test for the bug that was fixed in commit 3bd0054
      // When user submits with short_code, the response should be stored with actual UUID

      mockSingle.mockResolvedValueOnce({
        data: { id: MOCK_UUID, status: "active" }, // Survey lookup returns actual UUID
        error: null,
      });
      mockSingle.mockResolvedValueOnce({
        data: { id: "response-id", survey_id: MOCK_UUID },
        error: null,
      });

      const request = createRequest({
        survey_id: MOCK_SHORT_CODE, // User submits with short_code
        answers: { q1: "answer" },
        status: "completed",
      });

      await POST(request);

      // CRITICAL ASSERTION: The insert should use the actual UUID, NOT the short_code
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          survey_id: MOCK_UUID, // NOT MOCK_SHORT_CODE
        })
      );

      // Also verify it was NOT called with short_code
      expect(mockInsert).not.toHaveBeenCalledWith(
        expect.objectContaining({
          survey_id: MOCK_SHORT_CODE,
        })
      );
    });

    it("CRITICAL: should store actual UUID when submitting with UUID", async () => {
      mockSingle.mockResolvedValueOnce({
        data: { id: MOCK_UUID, status: "active" },
        error: null,
      });
      mockSingle.mockResolvedValueOnce({
        data: { id: "response-id", survey_id: MOCK_UUID },
        error: null,
      });

      const request = createRequest({
        survey_id: MOCK_UUID,
        answers: { q1: "answer" },
        status: "completed",
      });

      await POST(request);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          survey_id: MOCK_UUID,
        })
      );
    });

    it("CRITICAL: should use survey.id from database, not the input survey_id", async () => {
      // Even if there's a mismatch (edge case), we should use the database value
      const inputShortCode = "FJHT";
      const actualUUID = "81668107-5916-4e26-a6d3-83624749e94a";

      mockSingle.mockResolvedValueOnce({
        data: { id: actualUUID, status: "active" },
        error: null,
      });
      mockSingle.mockResolvedValueOnce({
        data: { id: "response-id", survey_id: actualUUID },
        error: null,
      });

      const request = createRequest({
        survey_id: inputShortCode,
        answers: { q1: "answer" },
        status: "completed",
      });

      await POST(request);

      // Should use the UUID from database, not the input
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          survey_id: actualUUID,
        })
      );
    });
  });

  describe("response status handling", () => {
    it("should handle 'completed' status submission", async () => {
      mockSingle.mockResolvedValueOnce({
        data: { id: MOCK_UUID, status: "active" },
        error: null,
      });
      mockSingle.mockResolvedValueOnce({
        data: { id: "response-id" },
        error: null,
      });

      const request = createRequest({
        survey_id: MOCK_UUID,
        answers: { q1: "answer" },
        status: "completed",
      });

      const response = await POST(request);
      expect(response.status).toBe(201);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "completed",
          completed_at: expect.any(String),
        })
      );
    });

    it("should handle 'partial' status submission", async () => {
      mockSingle.mockResolvedValueOnce({
        data: { id: MOCK_UUID, status: "active" },
        error: null,
      });
      mockSingle.mockResolvedValueOnce({
        data: { id: "response-id" },
        error: null,
      });

      const request = createRequest({
        survey_id: MOCK_UUID,
        answers: { q1: "answer" },
        status: "partial",
      });

      const response = await POST(request);
      expect(response.status).toBe(201);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "partial",
        })
      );
    });

    it("should start 'in_progress' session when no answers provided", async () => {
      mockSingle.mockResolvedValueOnce({
        data: { id: MOCK_UUID, status: "active" },
        error: null,
      });
      mockSingle.mockResolvedValueOnce({
        data: { id: "response-id" },
        error: null,
      });

      const request = createRequest({
        survey_id: MOCK_UUID,
      });

      const response = await POST(request);
      expect(response.status).toBe(201);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "in_progress",
          answers: {},
        })
      );
    });
  });

  describe("error handling", () => {
    it("should return 400 if survey_id is not provided", async () => {
      const request = createRequest({
        answers: { q1: "answer" },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe("survey_id is required");
    });

    it("should return 404 if survey is not found", async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116" },
      });

      const request = createRequest({
        survey_id: MOCK_UUID,
        answers: { q1: "answer" },
        status: "completed",
      });

      const response = await POST(request);
      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.error).toBe("Survey not found");
    });

    it("should return 400 if survey is not active", async () => {
      mockSingle.mockResolvedValueOnce({
        data: { id: MOCK_UUID, status: "closed" },
        error: null,
      });

      const request = createRequest({
        survey_id: MOCK_UUID,
        answers: { q1: "answer" },
        status: "completed",
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe("Survey is not accepting responses");
    });

    it("should return 400 if survey is in draft status", async () => {
      mockSingle.mockResolvedValueOnce({
        data: { id: MOCK_UUID, status: "draft" },
        error: null,
      });

      const request = createRequest({
        survey_id: MOCK_UUID,
        answers: { q1: "answer" },
        status: "completed",
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe("Survey is not accepting responses");
    });
  });

  describe("regression tests for short_code bug", () => {
    // These tests specifically target the bug that was fixed in commit 3bd0054
    // Before the fix, responses were being saved with short_code as survey_id
    // instead of the actual UUID

    it("REGRESSION: short_code 'FKQN' should map to correct UUID in insert", async () => {
      const shortCode = "FKQN";
      const expectedUUID = "c8d706a6-1f55-4946-a04b-dc8701d07f85";

      mockSingle.mockResolvedValueOnce({
        data: { id: expectedUUID, status: "active" },
        error: null,
      });
      mockSingle.mockResolvedValueOnce({
        data: { id: "response-id", survey_id: expectedUUID },
        error: null,
      });

      const request = createRequest({
        survey_id: shortCode,
        answers: { q1: "test" },
        status: "completed",
      });

      await POST(request);

      // The insert should use UUID, not short_code
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          survey_id: expectedUUID,
        })
      );
    });

    it("REGRESSION: short_code 'FJHT' should map to correct UUID in insert", async () => {
      const shortCode = "FJHT";
      const expectedUUID = "81668107-5916-4e26-a6d3-83624749e94a";

      mockSingle.mockResolvedValueOnce({
        data: { id: expectedUUID, status: "active" },
        error: null,
      });
      mockSingle.mockResolvedValueOnce({
        data: { id: "response-id", survey_id: expectedUUID },
        error: null,
      });

      const request = createRequest({
        survey_id: shortCode,
        answers: { q1: "test" },
        status: "completed",
      });

      await POST(request);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          survey_id: expectedUUID,
        })
      );
    });

    it("REGRESSION: short_code 'F6MQ' should map to correct UUID in insert", async () => {
      const shortCode = "F6MQ";
      const expectedUUID = "60f43ae3-0428-4474-bfb2-ad74d00727d1";

      mockSingle.mockResolvedValueOnce({
        data: { id: expectedUUID, status: "active" },
        error: null,
      });
      mockSingle.mockResolvedValueOnce({
        data: { id: "response-id", survey_id: expectedUUID },
        error: null,
      });

      const request = createRequest({
        survey_id: shortCode,
        answers: { q1: "test" },
        status: "completed",
      });

      await POST(request);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          survey_id: expectedUUID,
        })
      );
    });

    it("REGRESSION: lowercase short_code should also map to correct UUID", async () => {
      const shortCode = "fkqn"; // lowercase
      const expectedUUID = "c8d706a6-1f55-4946-a04b-dc8701d07f85";

      mockSingle.mockResolvedValueOnce({
        data: { id: expectedUUID, status: "active" },
        error: null,
      });
      mockSingle.mockResolvedValueOnce({
        data: { id: "response-id", survey_id: expectedUUID },
        error: null,
      });

      const request = createRequest({
        survey_id: shortCode,
        answers: { q1: "test" },
        status: "completed",
      });

      await POST(request);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          survey_id: expectedUUID,
        })
      );
    });
  });
});
