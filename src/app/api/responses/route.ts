import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getSurveyById, getSurveyByShortCode } from "@/lib/db/surveys";
import { createResponse } from "@/lib/db/responses";
import { isUUID, isShortCode } from "@/lib/identifiers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { survey_id, respondent_id, answers, status: responseStatus } = body;

    if (!survey_id) {
      return NextResponse.json({ error: "survey_id is required" }, { status: 400 });
    }

    const survey = isUUID(survey_id)
      ? await getSurveyById(survey_id)
      : isShortCode(survey_id)
      ? await getSurveyByShortCode(survey_id.toUpperCase())
      : (await getSurveyById(survey_id)) ?? (await getSurveyByShortCode(survey_id.toUpperCase()));

    if (!survey) return NextResponse.json({ error: "Survey not found" }, { status: 404 });
    if (survey.status !== "active") {
      return NextResponse.json(
        { error: "Survey is not accepting responses" },
        { status: 400 }
      );
    }

    if (answers && (responseStatus === "completed" || responseStatus === "partial")) {
      const saved = await createResponse({
        surveyId: survey.surveyId,
        respondentId: respondent_id || nanoid(12),
        answers,
        status: responseStatus,
        currentQuestionIndex: 0,
        completedAt: new Date().toISOString(),
      });
      return NextResponse.json(saved, { status: 201 });
    }

    const saved = await createResponse({
      surveyId: survey.surveyId,
      respondentId: respondent_id || nanoid(12),
      answers: {},
      status: "in_progress",
      currentQuestionIndex: 0,
    });
    return NextResponse.json(saved, { status: 201 });
  } catch (err) {
    console.error("POST /api/responses error:", err);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
