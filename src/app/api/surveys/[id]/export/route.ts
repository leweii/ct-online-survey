import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateCSV } from "@/lib/csv";
import type { Question, Response } from "@/types/database";

// Disable caching for this route
export const dynamic = "force-dynamic";

const db = supabase as any;

// GET /api/surveys/[id]/export - Export survey responses as CSV
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Get survey with questions
  const { data: survey, error: surveyError } = await db
    .from("surveys")
    .select("*")
    .eq("id", id)
    .single();

  if (surveyError || !survey) {
    return NextResponse.json({ error: "Survey not found" }, { status: 404 });
  }

  // Get all completed responses
  const { data: responses, error: responsesError } = await db
    .from("responses")
    .select("*")
    .eq("survey_id", id)
    .eq("status", "completed");

  if (responsesError) {
    return NextResponse.json({ error: responsesError.message }, { status: 500 });
  }

  // Debug: Log to help diagnose issues
  console.log(`[Export] Survey ID: ${id}, Found ${responses?.length || 0} completed responses`);

  const csv = generateCSV(
    survey.questions as Question[],
    (responses || []) as Response[]
  );

  // Return CSV file (no caching to ensure fresh data)
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${survey.title.replace(/[^a-z0-9]/gi, "_")}_responses.csv"`,
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
