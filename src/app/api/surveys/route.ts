import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { nanoid } from "nanoid";
import {
  generateUniqueShortCode,
  generateUniqueCreatorName,
} from "@/lib/identifiers";

const db = supabase as any;

// GET /api/surveys?creator_code=xxx OR ?creator_name=xxx - List surveys by creator
// Optional: ?include=counts to include response counts (avoids N+1 queries)
export async function GET(request: NextRequest) {
  const creatorCode = request.nextUrl.searchParams.get("creator_code");
  const creatorName = request.nextUrl.searchParams.get("creator_name");
  const includeCounts = request.nextUrl.searchParams.get("include") === "counts";

  if (!creatorCode && !creatorName) {
    return NextResponse.json(
      { error: "creator_code or creator_name is required" },
      { status: 400 }
    );
  }

  // For listing, only fetch needed fields (exclude full questions array)
  const listFields = "id, short_code, creator_code, creator_name, title, description, status, created_at, updated_at";
  let query = db.from("surveys").select(listFields);

  if (creatorName) {
    query = query.eq("creator_name", creatorName);
  } else if (creatorCode) {
    query = query.or(`creator_code.eq.${creatorCode},creator_name.eq.${creatorCode}`);
  }

  const { data: surveys, error } = await query.order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // If counts requested, fetch response counts in a single query
  if (includeCounts && surveys && surveys.length > 0) {
    const surveyIds = surveys.map((s: any) => s.id);

    // Fetch all responses for these surveys (only status field)
    const { data: responses } = await db
      .from("responses")
      .select("survey_id, status")
      .in("survey_id", surveyIds);

    // Aggregate counts by survey
    const countsBySurvey: Record<string, { total: number; completed: number; partial: number; inProgress: number }> = {};
    (responses || []).forEach((r: any) => {
      if (!countsBySurvey[r.survey_id]) {
        countsBySurvey[r.survey_id] = { total: 0, completed: 0, partial: 0, inProgress: 0 };
      }
      countsBySurvey[r.survey_id].total++;
      if (r.status === "completed") countsBySurvey[r.survey_id].completed++;
      else if (r.status === "partial") countsBySurvey[r.survey_id].partial++;
      else if (r.status === "in_progress") countsBySurvey[r.survey_id].inProgress++;
    });

    // Attach counts to surveys
    const surveysWithCounts = surveys.map((s: any) => ({
      ...s,
      responseCounts: countsBySurvey[s.id] || { total: 0, completed: 0, partial: 0, inProgress: 0 },
    }));

    return NextResponse.json(surveysWithCounts);
  }

  return NextResponse.json(surveys);
}

// POST /api/surveys - Create a new survey
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      questions,
      creator_code,
      creator_name,
      customCreatorName,
      short_code,
      settings,
      status,
    } = body;

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    // Get language from settings for creator name generation
    const language = settings?.language || "zh";

    // Generate identifiers if not provided
    const finalShortCode = short_code || (await generateUniqueShortCode(db));
    const finalCreatorName =
      customCreatorName?.trim() || creator_name || (await generateUniqueCreatorName(db, language));
    const finalCreatorCode = creator_code || nanoid(12); // Legacy, kept for compatibility

    const { data, error } = await db
      .from("surveys")
      .insert({
        title,
        description: description || null,
        questions: questions || [],
        short_code: finalShortCode,
        creator_code: finalCreatorCode,
        creator_name: finalCreatorName,
        settings: settings || {},
        status: status || "draft",
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

// PUT /api/surveys - Update an existing survey
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, description, questions } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    // Get existing survey to preserve creator_name if not changing
    const { data: existing } = await db
      .from("surveys")
      .select("creator_name, short_code")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 });
    }

    const { data, error } = await db
      .from("surveys")
      .update({
        title,
        description: description || null,
        questions: questions || [],
        status: "active",
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
