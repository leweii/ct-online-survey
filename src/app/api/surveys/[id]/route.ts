import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { isUUID, isShortCode } from "@/lib/identifiers";

const db = supabase as any;

// GET /api/surveys/[id] - Get survey by ID or short_code
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let query = db.from("surveys").select("*");

  // Determine lookup method based on format
  if (isUUID(id)) {
    // UUID format - lookup by id
    query = query.eq("id", id);
  } else if (isShortCode(id)) {
    // Short code format - lookup by short_code (case-insensitive)
    query = query.ilike("short_code", id);
  } else {
    // Try both as fallback
    query = query.or(`id.eq.${id},short_code.ilike.${id}`);
  }

  const { data, error } = await query.single();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// PATCH /api/surveys/[id] - Update survey
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { title, description, questions, settings, status } = body;


    const updateData: Record<string, any> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (questions !== undefined) updateData.questions = questions;
    if (settings !== undefined) updateData.settings = settings;
    if (status !== undefined) updateData.status = status;

    const { data, error } = await db
      .from("surveys")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Survey not found" }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
