# Design: Conversational Survey Bot

## Context
Building a greenfield conversational survey application. The system needs to handle two distinct modes (creator and responder) through natural language chat interfaces powered by Google Gemini.

## Goals / Non-Goals

### Goals
- Simple, intuitive survey creation through conversation
- Conversational survey response collection
- Reliable data persistence with Supabase
- Easy CSV export for data analysis
- Clean, responsive chat UI

### Non-Goals
- Complex survey logic (skip logic, branching)
- Full authentication system
- Real-time collaboration
- Survey analytics/visualization

## Architecture

### High-Level Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Next.js UI    │────▶│   API Routes    │────▶│    Supabase     │
│  (Chat Client)  │◀────│  (Chat + CRUD)  │◀────│   (PostgreSQL)  │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │  Google Gemini  │
                        │  (via AI SDK)   │
                        └─────────────────┘
```

### Database Schema

```sql
-- Surveys table
CREATE TABLE surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_code VARCHAR(12) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  questions JSONB NOT NULL DEFAULT '[]',
  settings JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'draft', -- draft, active, closed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Survey responses table
CREATE TABLE responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
  respondent_id VARCHAR(36), -- Optional identifier
  answers JSONB NOT NULL DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'in_progress', -- in_progress, completed
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  current_question_index INT DEFAULT 0
);

-- Indexes
CREATE INDEX idx_surveys_creator_code ON surveys(creator_code);
CREATE INDEX idx_responses_survey_id ON responses(survey_id);
CREATE INDEX idx_responses_respondent_id ON responses(respondent_id);
```

### Question Schema (JSONB)

```typescript
interface Question {
  id: string;           // UUID
  type: 'text' | 'multiple_choice' | 'rating' | 'yes_no' | 'date' | 'number';
  text: string;         // Question text
  required: boolean;
  options?: string[];   // For multiple_choice
  validation?: {
    minLength?: number; // For text
    maxLength?: number;
    min?: number;       // For number/rating
    max?: number;
  };
}
```

### API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/chat/creator` | POST | Handle survey creation conversation |
| `/api/chat/responder` | POST | Handle survey response conversation |
| `/api/surveys` | GET | List surveys by creator_code |
| `/api/surveys` | POST | Create survey directly (from chat) |
| `/api/surveys/[id]` | GET | Get survey by ID |
| `/api/surveys/[id]` | PATCH | Update survey |
| `/api/surveys/[id]/responses` | GET | Get all responses for survey |
| `/api/surveys/[id]/export` | GET | Download responses as CSV |
| `/api/responses` | POST | Start new response session |
| `/api/responses/[id]` | PATCH | Update response (save progress) |

### AI Integration Strategy

#### Creator Mode Prompt Structure
```typescript
const creatorSystemPrompt = `You are a survey creation assistant. Guide the user through creating a survey step by step.

Current survey state: ${JSON.stringify(surveyState)}

Your responsibilities:
1. Collect survey title and description
2. Add questions one at a time
3. For each question, determine the type and validation rules
4. Confirm when the survey is complete

When the user has finished adding questions, output a JSON block with the final survey structure.

Response format for actions:
- To update survey: <ACTION>{"type": "update_survey", "data": {...}}</ACTION>
- To add question: <ACTION>{"type": "add_question", "data": {...}}</ACTION>
- To finish: <ACTION>{"type": "finalize_survey"}</ACTION>
`;
```

#### Responder Mode Prompt Structure
```typescript
const responderSystemPrompt = `You are a friendly survey assistant helping someone complete a survey.

Survey: ${survey.title}
Current question: ${currentQuestion}
Progress: Question ${currentIndex + 1} of ${totalQuestions}

Your responsibilities:
1. Present the current question conversationally
2. Validate the response
3. Handle clarification requests
4. Allow going back to previous questions

Response format:
- Valid answer: <ACTION>{"type": "save_answer", "questionId": "...", "value": ...}</ACTION>
- Go back: <ACTION>{"type": "go_back"}</ACTION>
- Complete: <ACTION>{"type": "complete_survey"}</ACTION>
`;
```

### Frontend Structure

```
app/
├── page.tsx                    # Landing page with mode selector
├── create/
│   └── page.tsx               # Survey creator chat interface
├── survey/
│   └── [id]/
│       └── page.tsx           # Survey responder interface
├── dashboard/
│   └── page.tsx               # Creator dashboard (list surveys, export)
├── api/
│   ├── chat/
│   │   ├── creator/route.ts
│   │   └── responder/route.ts
│   ├── surveys/
│   │   ├── route.ts
│   │   └── [id]/
│   │       ├── route.ts
│   │       ├── responses/route.ts
│   │       └── export/route.ts
│   └── responses/
│       └── [id]/route.ts
components/
├── ChatInterface.tsx          # Reusable chat UI
├── MessageBubble.tsx          # Chat message component
├── SurveyCard.tsx            # Survey preview card
└── ModeSelector.tsx          # Create/Take survey toggle
lib/
├── supabase.ts               # Supabase client
├── ai.ts                     # AI configuration
└── csv.ts                    # CSV export utilities
```

## Decisions

### Decision: Use Supabase over alternatives
- **Why**: Built-in PostgreSQL, generous free tier, easy setup, good DX with TypeScript
- **Alternatives**: Neon (good but less features), PlanetScale (MySQL, overkill for this scale)

### Decision: Simple creator codes over full auth
- **Why**: Faster to implement, lower friction for MVP, auth can be added later
- **Trade-off**: Less security, but acceptable for survey use case

### Decision: Stream AI responses
- **Why**: Better UX with real-time feedback, Vercel AI SDK supports streaming natively
- **Implementation**: Use `streamText` from `ai` package

### Decision: Store questions as JSONB
- **Why**: Flexible schema for different question types, easy to extend
- **Trade-off**: No referential integrity, but questions are tightly coupled to surveys anyway

### Decision: Parse AI actions from response text
- **Why**: Simpler than function calling, allows conversational response + action in one
- **Format**: `<ACTION>{...}</ACTION>` tags parsed from response

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| AI generates invalid survey structure | Validate JSON before database insert |
| Long conversations exceed context | Summarize older messages, keep recent context |
| Concurrent edits to survey | Last-write-wins for MVP, add locking later |
| Creator code collision | Use nanoid with sufficient length (12 chars) |

## Open Questions
- Should partial responses expire after a certain time?
- Maximum number of questions per survey?
- Rate limiting for AI endpoints?

These can be addressed in future iterations.
