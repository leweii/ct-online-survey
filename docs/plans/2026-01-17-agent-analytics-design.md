# Agent-Based Survey Analytics Design

## Problem

Current analytics implementation sends all survey responses to the LLM as context, causing:
- Hallucinations when LLM misinterprets or fabricates data
- Token limits restricting analysis of large datasets
- No ability to filter or drill down into specific segments

## Solution

Replace the data-dump approach with an **agentic loop** using Vercel AI SDK tool calling. The LLM decides what data it needs and fetches it through typed tools that query Supabase directly.

## Architecture

```
User Question
    ↓
Analytics Agent (Gemini + Vercel AI SDK)
    ↓
┌─────────────────────────────────────┐
│  Agent Loop (max 5 iterations)      │
│  ┌─────────────────────────────┐    │
│  │ LLM decides: answer or tool │    │
│  └──────────────┬──────────────┘    │
│                 ↓                   │
│  ┌─────────────────────────────┐    │
│  │ Execute tool → Supabase     │    │
│  └──────────────┬──────────────┘    │
│                 ↓                   │
│  ┌─────────────────────────────┐    │
│  │ Return result to LLM        │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
    ↓
Final Analysis (text only, tool calls hidden)
```

## Tools

### 1. `getSurveyOverview`

Returns survey metadata and high-level stats without loading responses.

**Parameters:**
- `surveyId: string`

**Returns:**
```typescript
{
  title: string;
  questions: Array<{ id: string; text: string; type: string; options?: string[] }>;
  totalResponses: number;
  completedResponses: number;
  completionRate: number;
}
```

### 2. `getQuestionStats`

Aggregated statistics for a single question, computed in Supabase.

**Parameters:**
- `surveyId: string`
- `questionId: string`
- `filters?: ResponseFilter[]` (optional)

**Returns (by question type):**
- Multiple choice/yes_no: `{ distribution: { "Option A": 12, "Option B": 8 } }`
- Rating/number: `{ average: 4.2, min: 1, max: 5, distribution: { "1": 2, "2": 5, ... } }`
- Text: `{ sampleResponses: string[], totalCount: number }`

### 3. `getFilteredResponses`

Fetch responses matching filters with pagination.

**Parameters:**
- `surveyId: string`
- `filters?: Array<{ questionId: string; operator: "eq"|"gt"|"lt"|"contains"; value: unknown }>`
- `limit?: number` (default 50)

**Returns:**
```typescript
{
  responses: Array<{ answers: Record<string, unknown>; status: string; created_at: string }>;
  total: number;
}
```

### 4. `crossTabulate`

Analyze relationship between two questions.

**Parameters:**
- `surveyId: string`
- `questionId1: string`
- `questionId2: string`

**Returns:**
```typescript
{
  matrix: Record<string, Record<string, number>>;
  total: number;
}
```

## File Changes

### New Files

**`src/lib/analytics-tools.ts`**
- Tool definitions using `tool()` from Vercel AI SDK
- Zod schemas for parameter validation
- Supabase query implementations for each tool

### Modified Files

**`src/app/api/chat/analytics/route.ts`**
- Replace `streamText` with `generateText` + tools
- Add `maxSteps: 5` for agent loop
- Remove `buildDataContext()` - no more data dump
- Simplify system prompt (remove response data, add tool usage instructions)

## Edge Cases

| Scenario | Handling |
|----------|----------|
| No responses | Tool returns zero stats, LLM explains "no data yet" |
| Invalid question ID | Tool returns error, LLM asks for clarification |
| Too many tool calls | `maxSteps: 5` prevents infinite loops |
| Partial responses | Filter by `status = 'completed'` by default |
| Text questions | Return sample + count to avoid token explosion |

## What Stays the Same

- Chat UI at `/dashboard/chat`
- Survey selector dropdown
- Bilingual support (en/zh)
- Streaming response display

## What's Removed

- `buildDataContext()` function
- All responses in system prompt
- Client-side stats computation

## Analysis Capabilities

With this architecture, users can:

1. **Statistical queries**: "What's the average rating for Q3?"
2. **Filtering/segmentation**: "Show responses where Q1 was 'Yes'"
3. **Cross-tabulation**: "How do people who rated Q2 highly answer Q5?"
4. **Comparisons**: "Compare completion rates between questions"
