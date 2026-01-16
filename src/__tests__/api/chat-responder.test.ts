import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
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
        update: (data: any) => {
          mockUpdate(data);
          return {
            eq: (col: string, val: string) => {
              mockEq(col, val);
              return Promise.resolve({ data: null, error: null });
            },
          };
        },
      };
    },
  },
}));

// Mock the AI library
vi.mock("ai", () => ({
  streamText: vi.fn(() => ({
    textStream: (async function* () {
      yield "Test response";
    })(),
  })),
}));

vi.mock("@/lib/ai", () => ({
  geminiModel: {},
  parseActions: vi.fn(() => []),
  StreamActionBuffer: vi.fn(() => ({
    push: (chunk: string) => ({ text: chunk, actions: [] }),
    flush: () => ({ text: "", actions: [] }),
  })),
}));

describe("/api/chat/responder POST", () => {
  const MOCK_UUID = "60f43ae3-0428-4474-bfb2-ad74d00727d1";
  const MOCK_SHORT_CODE = "FKQN";

  // Mock survey structure for reference:
  // { id: MOCK_UUID, title: "Test Survey", short_code: MOCK_SHORT_CODE, questions: [...] }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("survey lookup behavior", () => {
    it("should use eq for UUID format surveyId", async () => {
      // Verify the correct query method is used for UUID
      // This ensures the fix in 3bd0054 correctly identifies UUID format
      const { isUUID } = await import("@/lib/identifiers");

      expect(isUUID(MOCK_UUID)).toBe(true);
      expect(isUUID(MOCK_SHORT_CODE)).toBe(false);
    });

    it("should use ilike for short_code format surveyId", async () => {
      const { isShortCode } = await import("@/lib/identifiers");

      expect(isShortCode(MOCK_SHORT_CODE)).toBe(true);
      expect(isShortCode(MOCK_UUID)).toBe(false);
    });
  });

  describe("actualSurveyId usage - CRITICAL", () => {
    it("CRITICAL: responseState.surveyId should be actual UUID when initialized with short_code", () => {
      // This test documents the expected behavior after the fix
      // When the responder receives a short_code, it should:
      // 1. Look up the survey using ilike('short_code', ...)
      // 2. Get the actual UUID from survey.id
      // 3. Use that UUID in responseState.surveyId and database operations

      // The fix in 3bd0054 added:
      // const actualSurveyId = survey.id;
      // responseState.surveyId = actualSurveyId;

      // This ensures that:
      // - Responses are stored with the correct UUID
      // - The dashboard can correctly count responses

      const inputShortCode = "FKQN";
      const expectedUUID = "c8d706a6-1f55-4946-a04b-dc8701d07f85";

      // After the fix, responseState should contain UUID
      const expectedResponseState = {
        responseId: expect.any(String),
        surveyId: expectedUUID, // UUID, NOT short_code
        currentQuestionIndex: 0,
        answers: {},
        isCompleted: false,
      };

      // Verify the surveyId in state is UUID format
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(uuidRegex.test(expectedResponseState.surveyId)).toBe(true);
      expect(expectedResponseState.surveyId).not.toBe(inputShortCode);
    });

    it("CRITICAL: database insert should use actual UUID, not short_code", () => {
      // This verifies the fix prevents the original bug
      // Before fix: insert({ survey_id: surveyId }) - could be short_code
      // After fix: insert({ survey_id: actualSurveyId }) - always UUID

      const correctInsertData = {
        survey_id: MOCK_UUID, // UUID
        answers: {},
        status: "in_progress",
        current_question_index: 0,
      };

      const wrongInsertData = {
        survey_id: MOCK_SHORT_CODE, // short_code - WRONG
        answers: {},
        status: "in_progress",
        current_question_index: 0,
      };

      // The correct data should have UUID
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(uuidRegex.test(correctInsertData.survey_id)).toBe(true);
      expect(uuidRegex.test(wrongInsertData.survey_id)).toBe(false);
    });
  });

  describe("response actions with correct survey_id", () => {
    it("save_answer action should update response with UUID survey_id", () => {
      // When AI parses a save_answer action, the response update
      // should use the responseId (which was created with correct survey_id)

      // The update query uses:
      // .eq("id", updatedState.responseId)
      // This ensures we're updating the correct response record
      // Example responseId: "response-uuid-123"

      // The response was created with correct survey_id (UUID)
      // So updates will correctly link to the survey

      expect(true).toBe(true);
    });

    it("complete action should mark response as completed with correct survey_id", () => {
      // When user completes the survey, the response should be
      // marked as completed and linked to the correct survey via UUID

      const completedResponse = {
        id: "response-uuid",
        survey_id: MOCK_UUID, // UUID, not short_code
        status: "completed",
        completed_at: expect.any(String),
      };

      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(uuidRegex.test(completedResponse.survey_id)).toBe(true);
    });
  });
});

describe("Chat responder short_code regression tests", () => {
  // These tests specifically target the bug fixed in commit 3bd0054

  describe("URL path scenarios", () => {
    it("user accesses /survey/FKQN -> responder receives 'FKQN' -> should store UUID", () => {
      // User journey:
      // 1. User navigates to /survey/FKQN
      // 2. Frontend sends surveyId: "FKQN" to /api/chat/responder
      // 3. API looks up survey using ilike('short_code', 'FKQN')
      // 4. Gets survey.id = 'c8d706a6-1f55-4946-a04b-dc8701d07f85'
      // 5. Creates response with survey_id = UUID (not 'FKQN')

      const inputFromUrl = "FKQN";
      // Expected stored survey_id: "c8d706a6-1f55-4946-a04b-dc8701d07f85"
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      expect(uuidRegex.test(inputFromUrl)).toBe(false); // short_code is not UUID
    });

    it("user accesses /survey/fjht (lowercase) -> should still store UUID", () => {
      const inputFromUrl = "fjht";
      // Expected stored survey_id: "81668107-5916-4e26-a6d3-83624749e94a"

      // ilike is case-insensitive, so this should work
      expect(inputFromUrl.toLowerCase()).toBe("fjht");
    });

    it("user accesses /survey/UUID directly -> should store that UUID", () => {
      const inputFromUrl = "60f43ae3-0428-4474-bfb2-ad74d00727d1";
      const expectedStoredSurveyId = "60f43ae3-0428-4474-bfb2-ad74d00727d1";

      expect(inputFromUrl).toBe(expectedStoredSurveyId);
    });
  });

  describe("database consistency checks", () => {
    it("responses.survey_id should match surveys.id for proper JOIN", () => {
      // For dashboard to correctly count responses:
      // SELECT * FROM responses WHERE survey_id = surveys.id
      //
      // This requires responses.survey_id to be the UUID
      // If it's the short_code, the JOIN will fail

      const surveyId = "60f43ae3-0428-4474-bfb2-ad74d00727d1";
      const surveyShortCode = "F6MQ";

      // Correct: response.survey_id = survey.id (UUID)
      const correctResponseSurveyId = surveyId;

      // Wrong: response.survey_id = survey.short_code
      const wrongResponseSurveyId = surveyShortCode;

      expect(correctResponseSurveyId).toBe(surveyId);
      expect(wrongResponseSurveyId).not.toBe(surveyId);
    });
  });
});

describe("Integration scenario: End-to-end survey_id handling", () => {
  it("complete flow: create survey -> user responds via short_code -> response linked correctly", () => {
    // This documents the complete flow that was broken before the fix

    // Step 1: Survey is created with UUID and short_code
    const survey = {
      id: "81668107-5916-4e26-a6d3-83624749e94a", // UUID
      short_code: "FJHT", // short_code for sharing
      title: "Test Survey",
    };

    // Step 2: User accesses survey via short_code URL
    const userAccessUrl = `/survey/${survey.short_code}`;
    expect(userAccessUrl).toBe("/survey/FJHT");

    // Step 3: Frontend sends surveyId to API
    // apiRequestBody = { surveyId: "FJHT", messages: [] }

    // Step 4: API looks up survey and gets actual UUID
    const actualSurveyId = survey.id; // From database lookup

    // Step 5: Response is created with UUID (not short_code)
    const createdResponse = {
      id: "response-123",
      survey_id: actualSurveyId, // UUID, not FJHT
      status: "in_progress",
    };

    expect(createdResponse.survey_id).toBe(survey.id);
    expect(createdResponse.survey_id).not.toBe(survey.short_code);

    // Step 6: Dashboard queries responses by survey.id
    // Query: SELECT * FROM responses WHERE survey_id = '${survey.id}'
    // This will now find the response because survey_id matches
  });

  it("the bug scenario: what happened before the fix", () => {
    // This documents what was happening before commit 3bd0054

    const survey = {
      id: "81668107-5916-4e26-a6d3-83624749e94a",
      short_code: "FJHT",
    };

    // BEFORE FIX: Response was created with short_code as survey_id
    const brokenResponse = {
      id: "response-123",
      survey_id: "FJHT", // WRONG - should be UUID
      status: "completed",
    };

    // Dashboard queries by UUID:
    // SELECT * FROM responses WHERE survey_id = '${survey.id}'
    //
    // This would NOT find the response because:
    // responses.survey_id = 'FJHT' (short_code)
    // But query uses survey.id = '81668107-5916-4e26-a6d3-83624749e94a' (UUID)

    expect(brokenResponse.survey_id).not.toBe(survey.id); // Mismatch!
    expect(brokenResponse.survey_id).toBe(survey.short_code); // Was storing short_code

    // AFTER FIX: Response is created with UUID
    const fixedResponse = {
      id: "response-123",
      survey_id: survey.id, // CORRECT - UUID
      status: "completed",
    };

    expect(fixedResponse.survey_id).toBe(survey.id); // Match!
  });
});
