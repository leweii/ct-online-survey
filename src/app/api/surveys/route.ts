import { NextRequest, NextResponse } from "next/server";
import {
  createSurvey,
  listSurveysByUserId,
  getSurveyById,
  updateSurvey,
  type SurveyRecord,
} from "@/lib/db/surveys";
import { listResponsesBySurveyId } from "@/lib/db/responses";
import { generateUniqueShortCode } from "@/lib/identifiers";

function getUserId(req: NextRequest): string | null {
  return req.headers.get("x-user-id");
}

// GET /api/surveys[?include=counts]
export async function GET(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const includeCounts = request.nextUrl.searchParams.get("include") === "counts";
  const surveys = (await listSurveysByUserId(userId)).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );

  if (!includeCounts) return NextResponse.json(surveys);

  const withCounts = await Promise.all(
    surveys.map(async (s: SurveyRecord) => {
      const rs = await listResponsesBySurveyId(s.surveyId);
      const counts = {
        total: rs.length,
        completed: rs.filter((r) => r.status === "completed").length,
        partial: rs.filter((r) => r.status === "partial").length,
        inProgress: rs.filter((r) => r.status === "in_progress").length,
      };
      return { ...s, responseCounts: counts };
    })
  );
  return NextResponse.json(withCounts);
}

// POST /api/surveys
export async function POST(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { title, description, questions, settings, status, shortCode } = body;
    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const finalShortCode = shortCode || (await generateUniqueShortCode());
    const survey = await createSurvey({
      userId,
      shortCode: finalShortCode,
      title,
      description: description ?? null,
      questions: questions ?? [],
      settings: settings ?? {},
      status: status ?? "draft",
    });
    return NextResponse.json(survey, { status: 201 });
  } catch (err) {
    console.error("POST /api/surveys error:", err);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

// PUT /api/surveys — used by create flow to update existing survey
export async function PUT(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { id, title, description, questions } = body;
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
    if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });

    const existing = await getSurveyById(id);
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 });
    }
    const updated = await updateSurvey(id, {
      title,
      description: description ?? null,
      questions: questions ?? [],
      status: "active",
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("PUT /api/surveys error:", err);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
