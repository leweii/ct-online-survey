import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { nanoid } from "nanoid";


const db = supabase as any;

// GET /api/surveys?creator_code=xxx - List surveys by creator code
export async function GET(request: NextRequest) {
  const creatorCode = request.nextUrl.searchParams.get("creator_code");

  if (!creatorCode) {
    return NextResponse.json(
      { error: "creator_code is required" },
      { status: 400 }
    );
  }

  const { data, error } = await db
    .from("surveys")
    .select("*")
    .eq("creator_code", creatorCode)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/surveys - Create a new survey
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, questions, creator_code, settings, status } = body;

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    // Generate creator code if not provided
    const finalCreatorCode = creator_code || nanoid(12);

    const { data, error } = await db
      .from("surveys")
      .insert({
        title,
        description: description || null,
        questions: questions || [],
        creator_code: finalCreatorCode,
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
