import { NextRequest, NextResponse } from "next/server";
import { getSurveyById } from "@/lib/db/surveys";
import { listResponsesBySurveyId } from "@/lib/db/responses";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

  const responses = (await listResponsesBySurveyId(id)).sort((a, b) =>
    b.startedAt.localeCompare(a.startedAt)
  );
  return NextResponse.json(responses);
}
