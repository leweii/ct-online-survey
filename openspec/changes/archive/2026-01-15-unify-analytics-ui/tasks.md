## 1. Redesign MessageBubble Component

- [x] 1.1 Remove bubble styling (rounded corners, background colors for bubbles)
- [x] 1.2 Add role indicator (AI icon/label, You icon/label) at top of message
- [x] 1.3 Left-align all messages
- [x] 1.4 Add compact spacing between messages
- [x] 1.5 Keep markdown rendering support

## 2. Update ChatInterface Component

- [x] 2.1 Update message list layout for compact style
- [x] 2.2 Simplify input field styling (remove rounded-full, use cleaner design)
- [x] 2.3 Update loading indicator to match new style

## 3. Refactor Analytics Chat Page

- [x] 3.1 Import and use shared MessageBubble component
- [x] 3.2 Remove custom message rendering code
- [x] 3.3 Keep stats card and survey selector

## 4. Add Translations

- [x] 4.1 Add translation keys for "AI" and "You" labels

## 5. Verification

- [x] 5.1 Run build to verify no TypeScript errors
- [x] 5.2 Test create page with new style
- [x] 5.3 Test survey response chat mode with new style
- [x] 5.4 Test analytics chat with new style
- [x] 5.5 Verify markdown rendering still works
