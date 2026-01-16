# ChatSurvey

A conversational survey platform that lets you create, take, and analyze surveys through AI-powered chat interfaces.

## Features

- **AI Survey Designer** - Describe your survey topic and the AI generates a complete questionnaire with 21-28 professional questions
- **Conversational Response Collection** - Respondents answer questions one at a time through a friendly chat interface
- **Form Mode Option** - Traditional form view for respondents who prefer filling everything at once
- **Analytics Dashboard** - AI-powered analysis of survey responses with natural language queries
- **CSV Export** - Export response data for external analysis
- **Bilingual Support** - Full English and Chinese (中文) localization
- **No Account Required** - Creator name-based identification system

## Question Types

- Text (free-form)
- Multiple Choice (single select)
- Multi-Select (multiple answers)
- Dropdown
- Rating Scale
- Slider
- Yes/No
- Date
- Number
- Email
- Phone

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **AI**: Google Gemini via Vercel AI SDK
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project
- Google AI API key (Gemini)

### Environment Variables

Create a `.env.local` file:

```bash
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Setup

Run the schema in your Supabase SQL editor:

```bash
# Located at supabase/schema.sql
```

### Installation

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Usage

### Creating a Survey

1. Go to the home page and enter a creator name
2. Click "Start Creating"
3. Describe your survey topic to the AI (e.g., "Customer satisfaction survey for a coffee shop")
4. Review the generated questions
5. The AI will provide a survey code and link when ready

### Taking a Survey

1. Enter the survey code or paste the survey link
2. Choose between Chat Mode (conversational) or Form Mode (traditional)
3. Answer the questions
4. Submit when complete

### Viewing Results

1. Go to the home page with your creator name
2. Click "View Dashboard"
3. See all your surveys with response counts
4. Export data as CSV or use the AI analytics assistant

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── chat/          # AI chat endpoints (creator, responder, analytics)
│   │   ├── surveys/       # Survey CRUD + export
│   │   └── responses/     # Response CRUD
│   ├── create/            # Survey creation page
│   ├── survey/[id]/       # Survey response page
│   └── dashboard/         # Creator dashboard + analytics
├── components/            # React components
├── contexts/              # React contexts (language)
├── lib/                   # Utilities (AI, Supabase, CSV)
└── types/                 # TypeScript definitions
```

## Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Architecture Notes

- AI responses use `<ACTION>{...}</ACTION>` tags to trigger state changes (e.g., creating surveys, saving answers)
- The `parseActions()` function in `lib/ai.ts` extracts these action tags after streaming completes
- Survey ownership uses `creator_name` - no authentication system
- Responses track `current_question_index` to support resuming incomplete surveys

## License

MIT
