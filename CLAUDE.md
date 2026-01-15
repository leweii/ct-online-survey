# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run ESLint
npm run start    # Start production server
```

## Architecture

This is a conversational survey bot built with Next.js 14 (App Router), Google Gemini AI, and Supabase.

### Two Modes
- **Creator Mode** (`/create`): AI guides users through survey design via chat
- **Responder Mode** (`/survey/[id]`): AI presents questions conversationally, one at a time

### AI Action Pattern
The AI chat endpoints use `<ACTION>{...}</ACTION>` tags embedded in responses to trigger state changes. The `parseActions()` function in `lib/ai.ts` extracts these. Actions are processed after the full response streams to the client.

### Data Flow
```
Chat UI → /api/chat/{creator|responder} → Gemini AI (streamed)
                                        ↓
                              Parse <ACTION> tags
                                        ↓
                              Update Supabase via CRUD APIs
```

### Key Types (`src/types/database.ts`)
- `Question`: Supports types `text`, `multiple_choice`, `rating`, `yes_no`, `date`, `number`
- `Survey`: Contains `questions` as JSONB array, uses `creator_code` for identification (no auth)
- `Response`: Tracks `answers` as JSONB, `current_question_index` for resume support

### Supabase Client
The client in `lib/supabase.ts` is lazily initialized to avoid build-time errors when env vars aren't set. All API routes cast it to `any` to bypass strict typing without a generated schema.

## Environment Variables

```
GOOGLE_GENERATIVE_AI_API_KEY  # Gemini API key
NEXT_PUBLIC_SUPABASE_URL      # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY # Supabase anon key
```

Database schema is in `supabase/schema.sql`.

<!-- OPENSPEC:START -->
## OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->
