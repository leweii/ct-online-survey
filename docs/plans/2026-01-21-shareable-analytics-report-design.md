# Shareable Analytics Report Design

## Overview

Enable sharing analytics report links where visitors can view survey data and interact with the AI analyst.

## Requirements

- **URL**: Use existing `/dashboard/chat?code=XXX&survey=YYY` format
- **Access**: Public link, keep code parameter but skip validation
- **Layout**: Split-screen 40%/60% (chat left, data right)
- **Chat**: Visitors can interact with AI analyst
- **Data Display**: Pure numeric tables showing option/score distribution per question

## Page Layout

```
┌─────────────────────────────────────────────────────────┐
│  [Survey Selector ▼]              [Share] [Export CSV]  │
├───────────────────────┬─────────────────────────────────┤
│                       │  ┌─────────────────────────┐    │
│   Chat (40%)          │  │ Total: 45  Complete: 82%│    │
│                       │  └─────────────────────────┘    │
│   - Message list      │                                 │
│   - Input box         │  Q1: How satisfied are you?     │
│   - AI analyst        │  ┌─────────────────────┐        │
│                       │  │ 5: ████████ 15      │        │
│                       │  │ 4: ██████   12      │        │
│                       │  │ 3: ████     8       │        │
│                       │  └─────────────────────┘        │
│                       │                                 │
│   [Type message...]   │  Q2: ...                        │
└───────────────────────┴─────────────────────────────────┘
```

## Data Summary Panel

### Top Statistics

```
┌─────────────────────────────────────────┐
│  Total: 45    Complete: 37    Partial: 8│
│  Completion Rate: 82%                   │
└─────────────────────────────────────────┘
```

### Question Statistics

Each question displayed as a card:
- Question title and type label
- Option/score distribution table with counts and percentages

```
Q1: How satisfied are you? [rating]
┌──────────┬──────────┬─────────────────┐
│ Option   │ Count    │ Percentage      │
├──────────┼──────────┼─────────────────┤
│ 5        │ 15       │ ████████ 33%    │
│ 4        │ 12       │ ██████   27%    │
│ 3        │ 8        │ ████     18%    │
│ 2        │ 6        │ ███      13%    │
│ 1        │ 4        │ ██        9%    │
└──────────┴──────────┴─────────────────┘
```

### Expandable Details (text type only)

Only text/string type questions show "Expand details" button:

```
[Expand Details ▲]
┌────────┬──────────────────────┬─────────────────────┐
│ #      │ Answer               │ Time                │
├────────┼──────────────────────┼─────────────────────┤
│ #45    │ Great service...     │ 2024-01-15 14:32    │
│ #44    │ Could improve...     │ 2024-01-15 13:21    │
└────────┴──────────────────────┴─────────────────────┘
```

## Share Feature

Share button in toolbar opens modal:

```
┌─────────────────────────────────────────┐
│  Share Analytics Report            [×]  │
├─────────────────────────────────────────┤
│                                         │
│  Anyone with the link can view this     │
│  report and chat with the AI analyst    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ https://ct-online-survey...     │    │
│  └─────────────────────────────────┘    │
│                                         │
│           [Copy Link]                   │
│                                         │
└─────────────────────────────────────────┘
```

## Technical Implementation

### File Changes

1. **`src/app/dashboard/chat/page.tsx`**
   - Change to split-screen layout (40% chat, 60% data panel)
   - Remove creator code validation logic
   - Add share button and modal

2. **New: `src/components/SurveyStatsPanel.tsx`**
   - Top statistics summary (total, complete, completion rate)
   - Question list with option distribution tables
   - Expandable detail view for text-type questions only

3. **API**
   - Reuse `/api/surveys/[id]/responses` for response data
   - Reuse `getQuestionStats` logic from `lib/analytics-tools.ts`

### Data Fetching

```typescript
// Get survey structure
const survey = await fetch(`/api/surveys/${surveyId}`)

// Get all responses
const responses = await fetch(`/api/surveys/${surveyId}/responses`)

// Calculate stats client-side
const stats = calculateQuestionStats(survey.questions, responses)
```

### Mobile Adaptation

- Small screens: Tab switching between "Chat" | "Data"
- Breakpoint: Below `md` (768px) switches to tab mode

## Non-Goals

- Password protection
- Time-limited links
- Separate share tokens
- Chart visualizations (tables only)
