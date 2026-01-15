# Change: Add Conversational Survey Bot

## Why
Data collectors need an intuitive way to create surveys and gather responses without requiring technical expertise. A conversational AI-powered approach reduces friction for both survey creators and respondents.

## What Changes
- **NEW**: Conversational survey creation via chat interface
- **NEW**: Conversational survey response collection
- **NEW**: Survey and response storage in Supabase
- **NEW**: CSV export functionality for survey responses
- **NEW**: Simple code-based identification (no auth required initially)

## Impact
- Affected specs: `survey-management`, `chat-interface`, `data-export` (all new)
- Affected code: Greenfield Next.js application

## Scope

### In Scope
- Survey creator mode with conversational design flow
- Survey responder mode with one-question-at-a-time UX
- Support for question types: text, multiple choice, rating (1-5), yes/no, date, number
- Required/optional field configuration
- Basic validation rules (min/max values, character limits)
- Partial response saving (resume later)
- CSV export with proper column headers
- Unique survey IDs/links for distribution
- Simple creator codes for identification

### Out of Scope (Future Considerations)
- Skip logic / conditional branching
- User authentication (email/password, social login)
- Survey analytics dashboard
- Response visualization/charts
- Survey templates
- Multi-language support
- File upload question type

## Technical Overview
- **Frontend**: Next.js 14+ (App Router) deployed on Vercel
- **AI**: Google Gemini via `@ai-sdk/google` (`gemini-2.0-flash`)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS

## Risk Assessment
- **Low**: Standard Next.js + Supabase stack with well-documented patterns
- **Medium**: AI conversation quality depends on prompt engineering
- **Mitigation**: Use structured prompts and validate AI outputs before database operations
