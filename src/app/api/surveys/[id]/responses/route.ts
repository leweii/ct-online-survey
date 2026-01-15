import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";


const db = supabase as any;

// GET /api/surveys/[id]/responses - Get all responses for a survey
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // First verify the survey exists
  const { data: survey, error: surveyError } = await db
    .from("surveys")
    .select("id")
    .eq("id", id)
    .single();

  if (surveyError || !survey) {
    return NextResponse.json({ error: "Survey not found" }, { status: 404 });
  }

  const { data, error } = await db
    .from("responses")
    .select("*")
    .eq("survey_id", id)
    .order("started_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
