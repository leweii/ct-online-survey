# Split-Screen Survey Editor Design

## Overview

Transform the survey creation page from a full-screen chat interface to a split-screen layout with real-time survey preview and inline editing capabilities.

## Requirements

- Split-screen layout: chat (40%) on left, survey preview (60%) on right
- Real-time rendering of survey as AI generates it
- Inline editing of questions (WYSIWYG form preview)
- Full editing capabilities: edit text, delete, modify options, reorder, add new questions
- Edited data automatically included in next LLM request
- Mobile: bottom drawer for survey preview

## Layout Architecture

### Desktop (≥768px)

```
┌─────────────────────────────────────────────────────┐
│  Header: Back | Title | Question Count              │
├───────────────────────┬─────────────────────────────┤
│                       │                             │
│    Chat Area (40%)    │   Survey Preview (60%)      │
│                       │                             │
│  - Message list       │  - Form-style rendering     │
│  - Streaming response │  - Inline editing           │
│  - Input field        │  - Drag-to-reorder          │
│                       │  - Add question button      │
│                       │                             │
└───────────────────────┴─────────────────────────────┘
```

### Mobile (<768px)

- Chat area fills screen
- "View Survey" button at bottom shows question count
- Tap to open bottom drawer (80% screen height)
- Swipe down or tap overlay to close

## Component Structure

### New Files

```
src/components/
├── SurveyPreview/
│   ├── index.tsx              # Main component
│   ├── SurveyHeader.tsx       # Title and description editing
│   ├── QuestionCard.tsx       # Single question card (preview + edit)
│   ├── QuestionFormControl.tsx # Render form controls by type
│   ├── AddQuestionModal.tsx   # Modal for adding questions
│   └── DraggableList.tsx      # Drag-and-drop container
└── MobileDrawer.tsx           # Mobile bottom drawer
```

### Modified Files

```
src/app/create/page.tsx        # Split layout, pass edit callbacks
```

## Component Props

### SurveyPreview

```typescript
interface SurveyPreviewProps {
  surveyState: SurveyState | null;
  onUpdateTitle: (title: string) => void;
  onUpdateDescription: (desc: string) => void;
  onUpdateQuestion: (id: string, updates: Partial<Question>) => void;
  onDeleteQuestion: (id: string) => void;
  onAddQuestion: (question: Question) => void;
  onReorderQuestions: (fromIndex: number, toIndex: number) => void;
}
```

### QuestionCard

```typescript
interface QuestionCardProps {
  question: Question;
  index: number;
  onUpdate: (updates: Partial<Question>) => void;
  onDelete: () => void;
}
```

### MobileDrawer

```typescript
interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}
```

## Form Control Rendering

| Question Type | Preview Rendering |
|---------------|-------------------|
| text | Text input (disabled) |
| multiple_choice | Radio buttons + editable option text |
| multi_select | Checkboxes + editable option text |
| dropdown | Select dropdown |
| rating | Star/number rating |
| slider | Slider control |
| yes_no | Yes/No buttons |
| date | Date picker |
| number | Number input |
| email | Email input |
| phone | Phone input |

## Inline Editing Interaction

1. Click question text → transforms to input, auto-focus
2. Blur or press Enter → save changes, update `surveyState`
3. Press Escape → cancel edit, restore original value

## State Management

### Data Flow

```
User edits survey ──→ setSurveyState() ──→ surveyState updates
                                              │
User sends message ──→ API request includes latest surveyState
                                              │
AI returns new survey ──→ Parse ACTION tags ──→ setSurveyState() ──→ Preview updates
```

### State Update Functions

```typescript
// Edit question text
const updateQuestionText = (questionId: string, newText: string) => {
  setSurveyState(prev => ({
    ...prev,
    questions: prev.questions.map(q =>
      q.id === questionId ? { ...q, text: newText } : q
    )
  }));
};

// Delete question
const deleteQuestion = (questionId: string) => { ... };

// Add question
const addQuestion = (question: Question) => { ... };

// Reorder questions
const reorderQuestions = (fromIndex: number, toIndex: number) => { ... };

// Edit options (multiple choice)
const updateQuestionOptions = (questionId: string, options: string[]) => { ... };
```

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Empty survey | Show empty state: "Start chatting to create your survey" |
| AI generating | Show skeleton loader, render when complete |
| User edit conflicts with AI update | AI update overwrites (AI returns complete state) |
| Survey finalized (isFinalized) | Disable all editing, show "Survey Created" |
| Drag near edge | Auto-scroll list during drag |

## Empty State UI

```
┌─────────────────────────┐
│                         │
│      📝                 │
│                         │
│  Survey preview will    │
│  appear here            │
│  Start chatting to      │
│  create your survey     │
│                         │
└─────────────────────────┘
```

## Technical Decisions

- **Drag-and-drop**: Use native HTML5 Drag and Drop API (zero dependencies)
- **Responsive breakpoint**: 768px (md in Tailwind)
- **No external dependencies** for this feature

## Out of Scope

- Undo/redo functionality
- Collaborative editing
- Version history
- Keyboard shortcuts for reordering
