# Capability: Survey Response

## ADDED Requirements

### Requirement: Response Mode Selection
The system SHALL allow respondents to choose between Form Mode and Chat Mode before starting a survey.

#### Scenario: Display mode selector
- **WHEN** user opens a survey link
- **THEN** system displays survey title and description
- **AND** presents two options: "Form Mode" and "Chat Mode"
- **AND** shows brief explanation of each mode

#### Scenario: Select form mode
- **WHEN** user selects "Form Mode"
- **THEN** system displays all questions as a scrollable form
- **AND** renders appropriate input elements for each question type

#### Scenario: Select chat mode
- **WHEN** user selects "Chat Mode"
- **THEN** system starts conversational survey experience
- **AND** presents questions one at a time with inline input elements

### Requirement: Form Mode Response
The system SHALL allow respondents to answer all questions at once using a traditional form interface.

#### Scenario: Render question inputs
- **WHEN** form mode is active
- **THEN** text questions render as text input or textarea
- **AND** multiple_choice questions render as radio buttons
- **AND** rating questions render as 1-5 radio button scale
- **AND** yes_no questions render as Yes/No radio buttons
- **AND** number questions render as number input with validation
- **AND** date questions render as date picker

#### Scenario: Submit form
- **WHEN** user fills required fields and clicks submit
- **THEN** system validates all answers
- **AND** saves all answers to database in single operation
- **AND** marks response as completed
- **AND** shows thank you message

#### Scenario: Validation error
- **WHEN** user submits with missing required fields
- **THEN** system highlights invalid fields
- **AND** does not submit until corrected

## MODIFIED Requirements

### Requirement: Chat Mode Response
The system SHALL present survey questions conversationally with interactive input elements and auto-advance.

#### Scenario: Display question with inline input
- **WHEN** bot presents a question in chat mode
- **THEN** message includes question text
- **AND** renders appropriate QuestionInput element below message
- **AND** user can either use input element or type answer

#### Scenario: Auto-advance to next question
- **WHEN** user provides a valid answer (via input or typing)
- **THEN** system saves the answer
- **AND** immediately presents the next question in same response
- **AND** does not require user to say "next" or similar

#### Scenario: Use inline input element
- **WHEN** user selects/enters value in inline QuestionInput
- **THEN** value is automatically submitted as their answer
- **AND** chat proceeds to next question

#### Scenario: Type answer in chat
- **WHEN** user types answer in chat input instead of using inline element
- **THEN** AI validates and processes the typed answer
- **AND** chat proceeds to next question if valid
