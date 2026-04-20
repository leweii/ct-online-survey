import { NextRequest, NextResponse } from "next/server";
import { getSurveyById, getSurveyByShortCode, updateSurvey } from "@/lib/db/surveys";
import { isUUID, isShortCode } from "@/lib/identifiers";

async function resolveSurvey(idOrCode: string) {
  if (isUUID(idOrCode)) return getSurveyById(idOrCode);
  if (isShortCode(idOrCode)) return getSurveyByShortCode(idOrCode.toUpperCase());
  const byId = await getSurveyById(idOrCode);
  return byId ?? (await getSurveyByShortCode(idOrCode.toUpperCase()));
}

// GET is public — survey takers load surveys
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const survey = await resolveSurvey(id);
  if (!survey) return NextResponse.json({ error: "Survey not found" }, { status: 404 });
  return NextResponse.json(survey);
}

// PATCH requires ownership
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = request.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { title, description, questions, settings, status } = body;

    const existing = await getSurveyById(id);
    if (!existing) return NextResponse.json({ error: "Survey not found" }, { status: 404 });
    if (existing.userId !== userId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const patch: Record<string, unknown> = {};
    if (title !== undefined) patch.title = title;
    if (description !== undefined) patch.description = description;
    if (questions !== undefined) patch.questions = questions;
    if (settings !== undefined) patch.settings = settings;
    if (status !== undefined) patch.status = status;

    const updated = await updateSurvey(id, patch);
    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH survey error:", err);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
