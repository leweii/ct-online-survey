# Change: Unify Chat UI with Slack-like Compact Style

## Why
The current chat UI uses rounded bubbles which look dated. A Slack-like compact style is cleaner and more professional. All chat pages should share the same modern design.

## What Changes

### Redesign Chat UI to Slack-like Compact Style
- **Left-aligned messages**: All messages align left, no bubbles
- **Role indicator**: Show "AI" or "You" icon/label before each message
- **Compact spacing**: Minimal padding between messages
- **Clean typography**: Message text without bubble backgrounds
- **Subtle separators**: Light dividers or spacing between message groups
- **Modern input**: Clean input field at bottom

### Apply to All Chat Pages
- Create survey page (`/create`)
- Survey response page (`/survey/[id]`) - chat mode
- Analytics chat page (`/dashboard/chat`)

## Impact
- Affected code:
  - `src/components/MessageBubble.tsx` - Redesign to Slack-style
  - `src/components/ChatInterface.tsx` - Update layout and input styling
  - `src/app/dashboard/chat/page.tsx` - Use shared ChatInterface

## Design Reference (Slack Compact Mode)
```
┌─────────────────────────────────────┐
│ 🤖 AI                    10:30 AM   │
│ Hello! How can I help you today?    │
│                                     │
│ 👤 You                   10:31 AM   │
│ I want to create a survey           │
│                                     │
│ 🤖 AI                    10:31 AM   │
│ Great! What topic would you like    │
│ your survey to cover?               │
├─────────────────────────────────────┤
│ [Type a message...          ] [Send]│
└─────────────────────────────────────┘
```
