import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";


const db = supabase as any;

// GET /api/responses/[id] - Get response by ID
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data, error } = await db
    .from("responses")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "Response not found" }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// PATCH /api/responses/[id] - Update response (save progress)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { answers, status, current_question_index, completed_at } = body;


    const updateData: Record<string, any> = {};
    if (answers !== undefined) updateData.answers = answers;
    if (status !== undefined) updateData.status = status;
    if (current_question_index !== undefined)
      updateData.current_question_index = current_question_index;
    if (completed_at !== undefined) updateData.completed_at = completed_at;

    const { data, error } = await db
      .from("responses")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Response not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
