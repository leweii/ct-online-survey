import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { nanoid } from "nanoid";
import { isUUID, isShortCode } from "@/lib/identifiers";

const db = supabase as any;

// POST /api/responses - Start a new response session or submit completed/partial response
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { survey_id, respondent_id, answers, status: responseStatus } = body;

    if (!survey_id) {
      return NextResponse.json(
        { error: "survey_id is required" },
        { status: 400 }
      );
    }

    // Build query - support both UUID and short_code
    let query = db.from("surveys").select("id, status");

    if (isUUID(survey_id)) {
      query = query.eq("id", survey_id);
    } else if (isShortCode(survey_id)) {
      query = query.ilike("short_code", survey_id);
    } else {
      // Try both as fallback
      query = query.or(`id.eq.${survey_id},short_code.ilike.${survey_id}`);
    }

    // Verify survey exists and is active
    const { data: survey, error: surveyError } = await query.single();

    if (surveyError || !survey) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 });
    }

    if (survey.status !== "active") {
      return NextResponse.json(
        { error: "Survey is not accepting responses" },
        { status: 400 }
      );
    }

    // Use the actual UUID from survey lookup
    const actualSurveyId = survey.id;

    // If answers and status are provided, this is a direct submission (from form mode)
    if (answers && (responseStatus === "completed" || responseStatus === "partial")) {
      const { data, error } = await db
        .from("responses")
        .insert({
          survey_id: actualSurveyId,
          respondent_id: respondent_id || nanoid(12),
          answers,
          status: responseStatus,
          current_question_index: 0,
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(data, { status: 201 });
    }

    // Otherwise, start a new response session (for chat mode)
    const { data, error } = await db
      .from("responses")
      .insert({
        survey_id: actualSurveyId,
        respondent_id: respondent_id || nanoid(12),
        answers: {},
        status: "in_progress",
        current_question_index: 0,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
