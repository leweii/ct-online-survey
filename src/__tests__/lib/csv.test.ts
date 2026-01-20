import { describe, it, expect } from "vitest";
import { generateCSV } from "@/lib/csv";
import type { Question, Response } from "@/types/database";

describe("generateCSV", () => {
  it("should generate transposed CSV with questions as rows", () => {
    const questions: Question[] = [
      {
        id: "q1",
        type: "text",
        text: "What is your name?",
        required: true,
      },
      {
        id: "q2",
        type: "yes_no",
        text: "Do you like pizza?",
        required: false,
      },
    ];

    const responses: Response[] = [
      {
        id: "r1",
        survey_id: "s1",
        respondent_id: "user1",
        answers: {
          q1: "Alice",
          q2: "Yes",
        },
        status: "completed",
        started_at: "2026-01-20T10:00:00Z",
        completed_at: "2026-01-20T10:05:00Z",
        current_question_index: 2,
      },
      {
        id: "r2",
        survey_id: "s1",
        respondent_id: "user2",
        answers: {
          q1: "Bob",
          q2: "No",
        },
        status: "completed",
        started_at: "2026-01-20T11:00:00Z",
        completed_at: "2026-01-20T11:05:00Z",
        current_question_index: 2,
      },
    ];

    const csv = generateCSV(questions, responses);

    // Remove BOM for easier testing
    const csvWithoutBOM = csv.replace(/^\uFEFF/, "");
    const lines = csvWithoutBOM.split("\n");

    expect(lines[0]).toBe("Question,Response 1,Response 2");
    expect(lines[1]).toBe("What is your name?,Alice,Bob");
    expect(lines[2]).toBe("Do you like pizza?,Yes,No");
  });
});
