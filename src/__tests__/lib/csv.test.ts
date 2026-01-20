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

  it("should handle zero responses gracefully", () => {
    const questions: Question[] = [
      {
        id: "q1",
        type: "text",
        text: "What is your name?",
        required: true,
      },
    ];

    const responses: Response[] = [];

    const csv = generateCSV(questions, responses);
    const csvWithoutBOM = csv.replace(/^\uFEFF/, "");
    const lines = csvWithoutBOM.split("\n");

    expect(lines[0]).toBe("Question");
    expect(lines[1]).toBe("What is your name?");
  });

  it("should handle multi-select answers with semicolon separator", () => {
    const questions: Question[] = [
      {
        id: "q1",
        type: "multi_select",
        text: "What are your hobbies?",
        required: false,
        options: ["Reading", "Gaming", "Sports"],
      },
    ];

    const responses: Response[] = [
      {
        id: "r1",
        survey_id: "s1",
        respondent_id: "user1",
        answers: {
          q1: ["Reading", "Gaming"],
        },
        status: "completed",
        started_at: "2026-01-20T10:00:00Z",
        completed_at: "2026-01-20T10:05:00Z",
        current_question_index: 1,
      },
    ];

    const csv = generateCSV(questions, responses);
    const csvWithoutBOM = csv.replace(/^\uFEFF/, "");
    const lines = csvWithoutBOM.split("\n");

    expect(lines[1]).toBe("What are your hobbies?,Reading; Gaming");
  });

  it("should handle missing answers as empty strings", () => {
    const questions: Question[] = [
      {
        id: "q1",
        type: "text",
        text: "Name?",
        required: true,
      },
      {
        id: "q2",
        type: "text",
        text: "Email?",
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
          // q2 is missing (optional question skipped)
        },
        status: "completed",
        started_at: "2026-01-20T10:00:00Z",
        completed_at: "2026-01-20T10:05:00Z",
        current_question_index: 2,
      },
    ];

    const csv = generateCSV(questions, responses);
    const csvWithoutBOM = csv.replace(/^\uFEFF/, "");
    const lines = csvWithoutBOM.split("\n");

    expect(lines[1]).toBe("Name?,Alice");
    expect(lines[2]).toBe("Email?,");
  });

  it("should escape special characters (commas, quotes, newlines)", () => {
    const questions: Question[] = [
      {
        id: "q1",
        type: "text",
        text: "Question with, comma",
        required: true,
      },
      {
        id: "q2",
        type: "text",
        text: 'Question with "quotes"',
        required: true,
      },
    ];

    const responses: Response[] = [
      {
        id: "r1",
        survey_id: "s1",
        respondent_id: "user1",
        answers: {
          q1: "Answer with, comma",
          q2: 'Answer with "quotes"',
        },
        status: "completed",
        started_at: "2026-01-20T10:00:00Z",
        completed_at: "2026-01-20T10:05:00Z",
        current_question_index: 2,
      },
    ];

    const csv = generateCSV(questions, responses);
    const csvWithoutBOM = csv.replace(/^\uFEFF/, "");
    const lines = csvWithoutBOM.split("\n");

    expect(lines[1]).toBe('"Question with, comma","Answer with, comma"');
    expect(lines[2]).toBe('"Question with ""quotes""","Answer with ""quotes"""');
  });
});
