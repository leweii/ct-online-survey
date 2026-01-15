# Change: Add Dual Response Mode (Form & Chat)

## Why
Currently, users can only respond to surveys via conversational chat, which requires typing answers and waiting for AI responses. Some users prefer a faster, traditional form experience. Additionally, the chat mode should auto-advance to the next question after a valid answer instead of requiring users to say "next".

## What Changes
- **NEW**: Form mode for survey responses - renders questions as interactive form elements
- **NEW**: Mode selection at survey start - users choose between "Form" and "Chat" modes
- **MODIFIED**: Chat mode UI - renders interactive form elements (dropdowns, radio buttons) inline with chat messages
- **MODIFIED**: Responder prompt - automatically proceeds to next question after valid answer

## Impact
- Affected code: `src/app/survey/[id]/page.tsx`, `src/app/api/chat/responder/route.ts`
- New components: `FormResponse`, `QuestionInput` (renders appropriate input for question type)

## User Experience

### Form Mode
1. User opens survey link
2. User selects "Form Mode"
3. All questions displayed as a scrollable form with appropriate inputs:
   - text → text input/textarea
   - multiple_choice → dropdown or radio buttons
   - rating → radio buttons (1-5)
   - yes_no → Yes/No radio buttons
   - number → number input
   - date → date picker
4. User fills out form and submits

### Chat Mode (Enhanced)
1. User opens survey link
2. User selects "Chat Mode"
3. Bot presents question with interactive input element rendered below the message
4. User can either:
   - Use the rendered form element (click/select)
   - Type their answer in chat
5. After valid answer, bot automatically shows next question (no "next" needed)

## Scope

### In Scope
- Mode selector component at survey start
- Form mode with all question types
- Interactive form elements in chat messages
- Auto-advance to next question in chat mode
- Progress indicator in both modes

### Out of Scope
- Changing question types or validation rules
- Modifying the creator mode
- Adding new question types
