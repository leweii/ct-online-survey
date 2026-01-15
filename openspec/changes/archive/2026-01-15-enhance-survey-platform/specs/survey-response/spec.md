# Capability: Survey Response

## ADDED Requirements

### Requirement: Partial Submission
The system SHALL allow users to submit surveys before completing all questions.

#### Scenario: Display early submit option
- **WHEN** user has answered at least one question
- **THEN** display "Submit Early" button
- **AND** show current completion progress

#### Scenario: Confirm partial submission
- **WHEN** user clicks "Submit Early" button
- **THEN** display confirmation dialog
- **AND** show count of answered and unanswered questions
- **AND** warn that submission cannot be modified

#### Scenario: Save partial response
- **WHEN** user confirms partial submission
- **THEN** save answered question responses
- **AND** mark response status as `partial`
- **AND** display thank you page

#### Scenario: Distinguish partial from complete responses
- **WHEN** viewing responses in dashboard
- **THEN** display completion status (complete/partial)
- **AND** partial responses are marked in export

## MODIFIED Requirements

### Requirement: Chinese Interface for Response
The system SHALL use Chinese on survey response pages.

#### Scenario: Mode selection displays in Chinese
- **WHEN** user selects response mode
- **THEN** "Form Mode" and "Chat Mode" display in Chinese
- **AND** description text is in Chinese

#### Scenario: Form mode displays in Chinese
- **WHEN** user uses form mode to respond
- **THEN** all buttons and prompts are in Chinese
- **AND** validation error messages are in Chinese
