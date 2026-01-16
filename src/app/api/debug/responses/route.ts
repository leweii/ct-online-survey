import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const db = supabase as any;

// Debug API to check responses table access
export async function GET() {
  try {
    // Test 1: Get all responses (no filter)
    const { data: allResponses, error: allError } = await db
      .from("responses")
      .select("id, survey_id, status")
      .limit(10);

    // Test 2: Get responses count
    const { count, error: countError } = await db
      .from("responses")
      .select("*", { count: "exact", head: true });

    // Test 3: Get specific survey's responses
    const targetSurveyId = "c8d706a6-1f55-4946-a04b-dc8701d07f85";
    const { data: filteredResponses, error: filterError } = await db
      .from("responses")
      .select("id, survey_id, status")
      .eq("survey_id", targetSurveyId);

    // Test 4: With order (same as original API)
    const { data: orderedResponses, error: orderError } = await db
      .from("responses")
      .select("*")
      .eq("survey_id", targetSurveyId)
      .order("started_at", { ascending: false });

    return NextResponse.json({
      test1_all_responses: {
        count: allResponses?.length ?? 0,
        data: allResponses,
        error: allError?.message ?? null,
      },
      test2_total_count: {
        count: count,
        error: countError?.message ?? null,
      },
      test3_filtered: {
        survey_id: targetSurveyId,
        count: filteredResponses?.length ?? 0,
        data: filteredResponses,
        error: filterError?.message ?? null,
      },
      test4_with_order: {
        survey_id: targetSurveyId,
        count: orderedResponses?.length ?? 0,
        error: orderError?.message ?? null,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
