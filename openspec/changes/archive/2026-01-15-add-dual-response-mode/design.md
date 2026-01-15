# Design: Dual Response Mode

## Architecture Overview

```
Survey Response Page
├── Mode Selector (initial screen)
│   ├── "Form Mode" button
│   └── "Chat Mode" button
│
├── Form Mode View
│   ├── FormResponse component
│   │   ├── QuestionInput (per question)
│   │   └── Submit button
│   └── Progress indicator
│
└── Chat Mode View (enhanced)
    ├── ChatInterface (existing)
    │   └── MessageBubble with QuestionInput
    └── Progress indicator
```

## New Components

### 1. QuestionInput
Renders appropriate form element based on question type.

```typescript
interface QuestionInputProps {
  question: Question;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}
```

| Question Type | Rendered Element |
|--------------|------------------|
| text | `<textarea>` or `<input type="text">` |
| multiple_choice | `<select>` dropdown or radio group |
| rating | Radio buttons (1-5 stars or numbers) |
| yes_no | Two radio buttons (Yes/No) |
| number | `<input type="number">` with min/max |
| date | `<input type="date">` |

### 2. FormResponse
Full-page form view for Form Mode.

```typescript
interface FormResponseProps {
  survey: Survey;
  onSubmit: (answers: Record<string, unknown>) => void;
}
```

### 3. ResponseModeSelector
Initial screen to choose response mode.

```typescript
interface ResponseModeSelectorProps {
  survey: Survey;
  onSelectMode: (mode: "form" | "chat") => void;
}
```

## Chat Mode Enhancements

### Interactive Elements in Messages
When bot asks a question, render a `QuestionInput` below the message text. User can either:
1. Click/select in the form element → auto-submits answer
2. Type in chat input → processed by AI as before

### Auto-Advance Flow
```
User answers → AI validates → save_answer action →
  → Immediately show next question (no user prompt needed)
  → Include next question text + QuestionInput in same response
```

### Modified Responder Prompt
Add instruction:
```
After saving a valid answer, ALWAYS immediately present the next question
in the same response. Do not wait for user to ask for it.
```

## State Management

### Survey Page State
```typescript
interface PageState {
  mode: "selecting" | "form" | "chat";
  survey: Survey | null;
  // Form mode state
  formAnswers: Record<string, unknown>;
  // Chat mode state
  responseState: ResponseState | null;
  messages: Message[];
}
```

## API Changes

### Form Mode Submit Endpoint
Reuse existing `/api/responses` with bulk answers:
```typescript
POST /api/responses
{
  survey_id: string;
  answers: Record<string, unknown>;
  status: "completed";
}
```

### Chat Mode
No API changes needed - prompt modification only.

## UI Wireframes

### Mode Selector Screen
```
┌────────────────────────────────┐
│        Survey Title            │
│       Survey Description       │
│                                │
│   ┌──────────┐ ┌──────────┐   │
│   │   Form   │ │   Chat   │   │
│   │   Mode   │ │   Mode   │   │
│   └──────────┘ └──────────┘   │
│                                │
│   Form: Answer all at once     │
│   Chat: Conversational Q&A     │
└────────────────────────────────┘
```

### Form Mode
```
┌────────────────────────────────┐
│ Survey Title          [1/5]    │
│ ████████░░░░░░░░░░░░  20%     │
├────────────────────────────────┤
│ Q1: How satisfied are you?     │
│ ○ Very satisfied               │
│ ○ Satisfied                    │
│ ○ Neutral                      │
│ ○ Dissatisfied                 │
│                                │
│ Q2: Rate our service (1-5)     │
│ ○ 1  ○ 2  ○ 3  ○ 4  ○ 5       │
│                                │
│ Q3: Any comments?              │
│ ┌────────────────────────────┐ │
│ │                            │ │
│ └────────────────────────────┘ │
│                                │
│         [Submit Survey]        │
└────────────────────────────────┘
```

### Chat Mode with Inline Input
```
┌────────────────────────────────┐
│ Survey Title          [2/5]    │
│ ████████░░░░░░░░░░░░  40%     │
├────────────────────────────────┤
│ 🤖 How satisfied are you with │
│    our service?                │
│    ┌─────────────────────────┐ │
│    │ ▼ Select an option      │ │
│    └─────────────────────────┘ │
│                                │
│                 Very satisfied │
│                                │
│ 🤖 Great! Rate our service    │
│    from 1 to 5:                │
│    ○ 1  ○ 2  ○ 3  ○ 4  ○ 5    │
│                                │
├────────────────────────────────┤
│ Type or select above...   [➤] │
└────────────────────────────────┘
```
