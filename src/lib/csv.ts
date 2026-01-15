import type { Question, Response } from "@/types/database";

export function generateCSV(questions: Question[], responses: Response[]): string {
  // Build header row
  const headers = [
    "response_id",
    "respondent_id",
    "completed_at",
    ...questions.map((q) => q.text),
  ];

  // Escape CSV values
  const escapeCSV = (value: unknown): string => {
    if (value === null || value === undefined) return "";
    const str = String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Build data rows
  const rows = responses
    .filter((r) => r.status === "completed")
    .map((response) => {
      const row = [
        response.id,
        response.respondent_id || "",
        response.completed_at || "",
        ...questions.map((q) => {
          const answer = response.answers[q.id];
          return answer !== undefined ? answer : "";
        }),
      ];
      return row.map(escapeCSV).join(",");
    });

  return [headers.map(escapeCSV).join(","), ...rows].join("\n");
}
