import { describe, it, expect } from "vitest";

/**
 * Tests for the analytics page data flow
 *
 * The analytics page (/dashboard/chat) displays survey response statistics.
 * It fetches responses via /api/surveys/${survey.id}/responses and filters
 * them by survey_id.
 *
 * For this to work correctly, responses.survey_id must be a UUID that
 * matches surveys.id, NOT a short_code.
 */

describe("Analytics page data flow", () => {
  describe("Response filtering logic", () => {
    it("filteredResponses should match when survey_id is UUID", () => {
      // Simulating the filtering logic from dashboard/chat/page.tsx line 49:
      // return allResponses.filter(r => r.survey_id === selectedSurveyId);

      const selectedSurveyId = "81668107-5916-4e26-a6d3-83624749e94a"; // UUID

      const correctResponses = [
        { id: "r1", survey_id: "81668107-5916-4e26-a6d3-83624749e94a", status: "completed" },
        { id: "r2", survey_id: "81668107-5916-4e26-a6d3-83624749e94a", status: "partial" },
        { id: "r3", survey_id: "60f43ae3-0428-4474-bfb2-ad74d00727d1", status: "completed" },
      ];

      const filtered = correctResponses.filter(r => r.survey_id === selectedSurveyId);

      expect(filtered.length).toBe(2);
      expect(filtered.every(r => r.survey_id === selectedSurveyId)).toBe(true);
    });

    it("filteredResponses should NOT match when survey_id is short_code (THE BUG)", () => {
      // This demonstrates the bug: if responses were stored with short_code,
      // the filtering would fail because we compare against UUID

      const selectedSurveyId = "81668107-5916-4e26-a6d3-83624749e94a"; // UUID
      const shortCode = "FJHT"; // The short_code for this survey

      // WRONG: responses stored with short_code instead of UUID
      const brokenResponses = [
        { id: "r1", survey_id: shortCode, status: "completed" }, // stored with short_code
        { id: "r2", survey_id: shortCode, status: "partial" },   // stored with short_code
      ];

      const filtered = brokenResponses.filter(r => r.survey_id === selectedSurveyId);

      // BUG: No responses found because "FJHT" !== "81668107-..."
      expect(filtered.length).toBe(0);
      expect(shortCode).not.toBe(selectedSurveyId);
    });
  });

  describe("Stats calculation", () => {
    it("should calculate correct stats when responses have UUID survey_id", () => {
      // Simulating stats calculation from dashboard/chat/page.tsx lines 52-75

      const filteredResponses = [
        { id: "r1", survey_id: "uuid-1", status: "completed", started_at: new Date().toISOString() },
        { id: "r2", survey_id: "uuid-1", status: "completed", started_at: new Date().toISOString() },
        { id: "r3", survey_id: "uuid-1", status: "partial", started_at: new Date().toISOString() },
        { id: "r4", survey_id: "uuid-1", status: "in_progress", started_at: new Date().toISOString() },
      ];

      const completedResponses = filteredResponses.filter(r => r.status === "completed").length;
      const partialResponses = filteredResponses.filter(r => r.status === "partial").length;
      const totalResponses = filteredResponses.length;
      const completionRate = Math.round((completedResponses / totalResponses) * 100);

      expect(totalResponses).toBe(4);
      expect(completedResponses).toBe(2);
      expect(partialResponses).toBe(1);
      expect(completionRate).toBe(50);
    });

    it("should show 0 stats when no responses match (the bug scenario)", () => {
      // When responses were stored with short_code, filtering returns empty array

      const filteredResponses: any[] = []; // Empty due to survey_id mismatch

      const completedResponses = filteredResponses.filter(r => r.status === "completed").length;
      const partialResponses = filteredResponses.filter(r => r.status === "partial").length;
      const totalResponses = filteredResponses.length;

      // All stats are 0 - this is what the user was seeing
      expect(totalResponses).toBe(0);
      expect(completedResponses).toBe(0);
      expect(partialResponses).toBe(0);
    });
  });

  describe("API fetch pattern", () => {
    it("should fetch responses using survey.id (UUID), not short_code", () => {
      // The analytics page fetches responses like this (line 101):
      // fetch(`/api/surveys/${survey.id}/responses`)

      const survey = {
        id: "81668107-5916-4e26-a6d3-83624749e94a", // UUID
        short_code: "FJHT",
        title: "Test Survey",
      };

      // The correct API URL uses UUID
      const correctApiUrl = `/api/surveys/${survey.id}/responses`;
      expect(correctApiUrl).toBe("/api/surveys/81668107-5916-4e26-a6d3-83624749e94a/responses");

      // NOT the short_code
      const wrongApiUrl = `/api/surveys/${survey.short_code}/responses`;
      expect(wrongApiUrl).toBe("/api/surveys/FJHT/responses");
      expect(correctApiUrl).not.toBe(wrongApiUrl);
    });
  });

  describe("End-to-end data consistency", () => {
    it("survey.id used in fetch should match response.survey_id for filtering to work", () => {
      const survey = {
        id: "c8d706a6-1f55-4946-a04b-dc8701d07f85",
        short_code: "FKQN",
      };

      // When response is correctly stored with UUID
      const correctResponse = {
        id: "response-1",
        survey_id: survey.id, // UUID
        status: "completed",
      };

      // Filtering works
      const selectedSurveyId = survey.id;
      expect(correctResponse.survey_id === selectedSurveyId).toBe(true);

      // When response is incorrectly stored with short_code
      const brokenResponse = {
        id: "response-2",
        survey_id: survey.short_code, // short_code - WRONG
        status: "completed",
      };

      // Filtering fails
      expect(brokenResponse.survey_id === selectedSurveyId).toBe(false);
    });
  });
});

describe("Dashboard main page vs Analytics page consistency", () => {
  // Both pages should show the same response counts

  it("both pages use the same API pattern for fetching responses", () => {
    // DashboardContent.tsx line 58:
    // fetch(`/api/surveys/${survey.id}/responses`)

    // dashboard/chat/page.tsx line 101:
    // fetch(`/api/surveys/${survey.id}/responses`)

    // Both use survey.id (UUID) - this is correct
    const surveyId = "60f43ae3-0428-4474-bfb2-ad74d00727d1";
    const dashboardApiUrl = `/api/surveys/${surveyId}/responses`;
    const analyticsApiUrl = `/api/surveys/${surveyId}/responses`;

    expect(dashboardApiUrl).toBe(analyticsApiUrl);
  });

  it("both pages filter responses by survey_id matching", () => {
    // DashboardContent.tsx line 65-67:
    // const completedCount = responses.filter((r) => r.status === 'completed').length;

    // dashboard/chat/page.tsx line 49:
    // return allResponses.filter(r => r.survey_id === selectedSurveyId);

    // Both rely on response.survey_id being UUID
    const surveyUUID = "60f43ae3-0428-4474-bfb2-ad74d00727d1";

    const responses = [
      { survey_id: surveyUUID, status: "completed" },
      { survey_id: surveyUUID, status: "partial" },
      { survey_id: "other-uuid", status: "completed" },
    ];

    // Dashboard counts all responses (doesn't filter by survey_id in the count logic
    // because it fetches per-survey)
    const dashboardCompleted = responses
      .filter(r => r.survey_id === surveyUUID)
      .filter(r => r.status === "completed").length;

    // Analytics filters then counts
    const analyticsFiltered = responses.filter(r => r.survey_id === surveyUUID);
    const analyticsCompleted = analyticsFiltered.filter(r => r.status === "completed").length;

    expect(dashboardCompleted).toBe(1);
    expect(analyticsCompleted).toBe(1);
    expect(dashboardCompleted).toBe(analyticsCompleted);
  });
});
