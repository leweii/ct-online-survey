# Tasks: Add Dual Response Mode

## 1. Create QuestionInput Component
- [x] 1.1 Create `src/components/QuestionInput.tsx` with props interface
- [x] 1.2 Implement text input (textarea for long, input for short)
- [x] 1.3 Implement multiple_choice (radio buttons with options)
- [x] 1.4 Implement rating (1-5 radio buttons with visual styling)
- [x] 1.5 Implement yes_no (Yes/No radio buttons)
- [x] 1.6 Implement number input with min/max validation
- [x] 1.7 Implement date input

## 2. Create Form Mode Components
- [x] 2.1 Create `src/components/ResponseModeSelector.tsx`
- [x] 2.2 Create `src/components/FormResponse.tsx` with all questions
- [x] 2.3 Add form validation before submit
- [x] 2.4 Add progress indicator to form view

## 3. Update Survey Response Page
- [x] 3.1 Add mode state (`selecting` | `form` | `chat`)
- [x] 3.2 Render ResponseModeSelector when mode is `selecting`
- [x] 3.3 Render FormResponse when mode is `form`
- [x] 3.4 Keep existing chat flow when mode is `chat`
- [x] 3.5 Handle form submission → POST to /api/responses

## 4. Enhance Chat Mode with Inline Inputs
- [x] 4.1 Add `currentQuestion` prop to chat messages
- [x] 4.2 Render QuestionInput below bot messages that ask questions
- [x] 4.3 Handle QuestionInput onChange → auto-submit as chat message
- [x] 4.4 Style inline inputs to match chat UI

## 5. Update Responder Prompt for Auto-Advance
- [x] 5.1 Modify `buildResponderPrompt` to instruct auto-advance
- [x] 5.2 Add "immediately present next question" instruction
- [x] 5.3 Test that bot shows next question without user prompt

## 6. Testing
- [ ] 6.1 Test mode selector displays correctly
- [ ] 6.2 Test form mode with all question types
- [ ] 6.3 Test form submission saves all answers
- [ ] 6.4 Test chat mode inline inputs render correctly
- [ ] 6.5 Test chat mode auto-advance to next question
- [ ] 6.6 Test progress indicator in both modes
