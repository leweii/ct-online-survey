import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const db = supabase as any;

// GET /api/surveys/[id]/debug - Debug endpoint to check responses
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Get survey
  const { data: survey, error: surveyError } = await db
    .from("surveys")
    .select("id, short_code, title")
    .eq("id", id)
    .single();

  // Get ALL responses for this survey (not just completed)
  const { data: allResponses, error: responsesError } = await db
    .from("responses")
    .select("id, survey_id, status, completed_at, created_at")
    .eq("survey_id", id);

  // Also try to find responses that might have short_code as survey_id
  const { data: shortCodeResponses } = await db
    .from("responses")
    .select("id, survey_id, status, completed_at, created_at")
    .eq("survey_id", survey?.short_code || "none");

  return NextResponse.json({
    surveyId: id,
    survey: survey || null,
    surveyError: surveyError?.message || null,
    responsesError: responsesError?.message || null,
    allResponses: allResponses || [],
    allResponsesCount: allResponses?.length || 0,
    completedCount: allResponses?.filter((r: any) => r.status === "completed").length || 0,
    shortCodeResponses: shortCodeResponses || [],
    shortCodeResponsesCount: shortCodeResponses?.length || 0,
  });
}
