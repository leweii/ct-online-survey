import { NextRequest, NextResponse } from "next/server";
import { getResponseById, updateResponse } from "@/lib/db/responses";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const r = await getResponseById(id);
  if (!r) return NextResponse.json({ error: "Response not found" }, { status: 404 });
  return NextResponse.json(r);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const patch: Record<string, unknown> = {};
    if (body.answers !== undefined) patch.answers = body.answers;
    if (body.status !== undefined) patch.status = body.status;
    if (body.current_question_index !== undefined)
      patch.currentQuestionIndex = body.current_question_index;
    if (body.completed_at !== undefined) patch.completedAt = body.completed_at;

    const updated = await updateResponse(id, patch);
    if (!updated) return NextResponse.json({ error: "Response not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
