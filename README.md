# ChatSurvey

**Intelligent Survey Design & Analytics Platform**

Create professional surveys through AI conversation, collect responses via shareable links, and get AI-driven insights from your data.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://ct-online-survey.vercel.app/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)

[**Try Live Demo**](https://ct-online-survey.vercel.app/) | [Report Bug](https://github.com/leweii/ct-online-survey/issues)

---

## Features

### AI-Powered Survey Creation
Describe your survey requirements in natural language. The AI assistant generates a complete professional questionnaire with 21-28 questions, appropriate question types, and logical flow.

**11 Question Types Supported:**
| Type | Description |
|------|-------------|
| Text | Open-ended free-form responses |
| Single Choice | Radio button selection |
| Multiple Choice | Checkbox multi-select |
| Dropdown | Select menu options |
| Rating Scale | 1-5 or 1-10 ratings |
| Slider | Numeric range selection |
| Yes/No | Binary choice |
| Date | Date picker |
| Number | Numeric input |
| Email | Email validation |
| Phone | Phone number input |

### Easy Survey Distribution
- **Short codes** (e.g., `A7B2`) - Easy to share verbally or in print
- **Direct links** - One-click access to surveys
- **Mobile-friendly** - Responsive design for all devices

### Management Dashboard
- View all surveys with response statistics
- Survey lifecycle management (Draft → Active → Closed)
- One-click link copying
- CSV data export

### AI Analytics Assistant
Chat with an AI analyst to understand your data:
- "What's the completion rate?"
- "Show me the rating distribution for question 3"
- "How do answers to Q1 relate to Q2?"
- "What patterns do you see in the responses?"

### Bilingual Interface
Full English and Chinese (中文) support with automatic browser language detection.

---

## Quick Start

### Create a Survey

1. Visit [ct-online-survey.vercel.app](https://ct-online-survey.vercel.app/)
2. Enter your **Administrator Name** (used to manage your surveys)
3. Click **Create Survey**
4. Describe your needs:
   - *"Employee satisfaction survey for a tech company"*
   - *"Customer feedback form for restaurant"*
   - *"360-degree performance review"*
5. Review and edit the generated questions
6. Click **Save & Publish** to get your survey code

### Take a Survey

1. Visit the homepage and select **Take Survey**
2. Enter the survey code (e.g., `A7B2`) or paste the link
3. Complete the survey in form mode
4. Submit your responses

### Analyze Results

1. Visit the homepage with your Administrator Name
2. Click **Management Center**
3. Click **Analyze** on any survey
4. Ask questions about your data in natural language

---

## Self-Hosting

### Prerequisites

- Node.js 18+
- Supabase account (free tier works)
- Google AI API key (Gemini)

### Environment Variables

Create `.env.local`:

```bash
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Setup

Import `supabase/schema.sql` to your Supabase project.

### Installation

```bash
git clone https://github.com/leweii/ct-online-survey.git
cd ct-online-survey
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Commands

```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Production server
npm run lint     # ESLint
npm run test     # Run tests
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| AI | Google Gemini + Vercel AI SDK |
| Database | Supabase (PostgreSQL) |
| Styling | Tailwind CSS |
| Security | Cloudflare Turnstile |
| Deployment | Vercel |

---

## Architecture

```
src/
├── app/
│   ├── api/
│   │   ├── chat/           # AI endpoints (creator, responder, analytics)
│   │   ├── surveys/        # Survey CRUD + export
│   │   └── responses/      # Response handling
│   ├── create/             # Survey creation page
│   ├── dashboard/          # Management + analytics
│   └── survey/[id]/        # Survey response page
├── components/             # React components
├── contexts/               # Language context
├── lib/
│   ├── ai.ts              # AI configuration
│   ├── analytics-tools.ts # AI analytics tools
│   ├── supabase.ts        # Database client
│   └── translations.ts    # i18n
└── types/                  # TypeScript definitions
```

### AI Patterns

**Survey Creation:** Uses `<ACTION>` tags in AI responses to trigger state changes.

**Analytics:** Tool-calling pattern where the AI agent queries the database directly via typed tools (`getSurveyOverview`, `getQuestionStats`, `getFilteredResponses`, `crossTabulate`).

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Contact

- **Email:** lewei.me@gmail.com
- **GitHub:** [@leweii](https://github.com/leweii)
