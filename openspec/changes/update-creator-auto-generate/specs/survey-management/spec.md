# Capability: Survey Management

## MODIFIED Requirements

### Requirement: Survey Creation
The system SHALL allow users to create surveys by describing a topic, after which the AI automatically generates a title, description, and relevant questions for review.

#### Scenario: Auto-generate survey from topic
- **WHEN** user describes a survey topic (e.g., "customer satisfaction for a coffee shop")
- **THEN** AI generates an appropriate survey title
- **AND** AI generates a brief description
- **AND** AI generates 5-8 relevant questions with appropriate types
- **AND** presents all generated content to user for review

#### Scenario: Review generated questions
- **WHEN** AI presents generated questions
- **THEN** user can see the full list with question types and options
- **AND** user can request to remove specific questions
- **AND** user can request to add additional questions
- **AND** user can finalize when satisfied

#### Scenario: Remove question from survey
- **WHEN** user requests to remove a question (by number or description)
- **THEN** system removes that question from the list
- **AND** displays updated question list

#### Scenario: Add question to existing list
- **WHEN** user requests to add a question after initial generation
- **THEN** system adds the new question to the list
- **AND** displays updated question list

#### Scenario: Generate shareable survey link
- **WHEN** user finalizes the survey
- **THEN** system generates a unique URL for the survey
- **AND** displays the link to the user
