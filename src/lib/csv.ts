import type { Question, Response } from "@/types/database";

export function generateCSV(questions: Question[], responses: Response[]): string {
  // Escape CSV values
  const escapeCSV = (value: unknown): string => {
    if (value === null || value === undefined) return "";
    const str = String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Filter to completed responses only
  const completedResponses = responses.filter((r) => r.status === "completed");

  // Build header row: "Question" + "Response 1", "Response 2", etc.
  const headers = [
    "Question",
    ...completedResponses.map((_, index) => `Response ${index + 1}`),
  ];

  // Build question rows: each row is one question with all its answers
  const questionRows = questions.map((question) => {
    const row = [
      question.text,
      ...completedResponses.map((response) => {
        const answer = response.answers[question.id];

        // Handle array answers (multi-select questions)
        if (Array.isArray(answer)) {
          return answer.join("; ");
        }

        return answer !== undefined ? answer : "";
      }),
    ];
    return row.map(escapeCSV).join(",");
  });

  // Add UTF-8 BOM for Excel compatibility with Chinese characters
  const BOM = "\uFEFF";
  return BOM + [headers.map(escapeCSV).join(","), ...questionRows].join("\n");
}
