import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { nanoid } from "nanoid";
import {
  generateUniqueShortCode,
  generateUniqueCreatorName,
} from "@/lib/identifiers";

const db = supabase as any;

// GET /api/surveys?creator_code=xxx OR ?creator_name=xxx - List surveys by creator
export async function GET(request: NextRequest) {
  const creatorCode = request.nextUrl.searchParams.get("creator_code");
  const creatorName = request.nextUrl.searchParams.get("creator_name");

  if (!creatorCode && !creatorName) {
    return NextResponse.json(
      { error: "creator_code or creator_name is required" },
      { status: 400 }
    );
  }

  let query = db.from("surveys").select("*");

  if (creatorName) {
    // Primary: lookup by creator_name
    query = query.eq("creator_name", creatorName);
  } else if (creatorCode) {
    // Backward compatibility: lookup by creator_code or creator_name
    query = query.or(`creator_code.eq.${creatorCode},creator_name.eq.${creatorCode}`);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
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
      creator_name || (await generateUniqueCreatorName(db, language));
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
