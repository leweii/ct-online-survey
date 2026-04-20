import { NextRequest, NextResponse } from "next/server";
import { getSurveyById } from "@/lib/db/surveys";
import { listResponsesBySurveyId, type ResponseRecord } from "@/lib/db/responses";
import { generateCSV } from "@/lib/csv";
import type { Question } from "@/types/database";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = request.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const survey = await getSurveyById(id);
  if (!survey) return NextResponse.json({ error: "Survey not found" }, { status: 404 });
  if (survey.userId !== userId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const all = await listResponsesBySurveyId(id);
  const completed = all.filter((r) => r.status === "completed");

  // Adapt ResponseRecord to the shape generateCSV expects
  const csv = generateCSV(
    survey.questions as Question[],
    completed.map((r: ResponseRecord) => ({
      id: r.responseId,
      survey_id: r.surveyId,
      respondent_id: r.respondentId,
      answers: r.answers,
      status: r.status,
      started_at: r.startedAt,
      completed_at: r.completedAt ?? null,
      current_question_index: r.currentQuestionIndex,
    })) as any
  );

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${survey.title.replace(/[^a-z0-9]/gi, "_")}_responses.csv"`,
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
