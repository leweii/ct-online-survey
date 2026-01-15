# Capability: Survey Management

## ADDED Requirements

### Requirement: Survey Creation
The system SHALL allow users to create surveys with a title, description, and questions through a conversational interface.

#### Scenario: Create survey with title and description
- **WHEN** user provides survey title and description through chat
- **THEN** system creates a new survey record with the provided information
- **AND** assigns a unique survey ID

#### Scenario: Add question to survey
- **WHEN** user specifies a question through conversation
- **THEN** system prompts for question type (text, multiple_choice, rating, yes_no, date, number)
- **AND** prompts for whether the question is required
- **AND** adds the question to the survey's questions array

#### Scenario: Generate shareable survey link
- **WHEN** user finalizes the survey
- **THEN** system generates a unique URL for the survey
- **AND** displays the link to the user

### Requirement: Survey Question Types
The system SHALL support the following question types: text, multiple_choice, rating (1-5), yes_no, date, and number.

#### Scenario: Text question with validation
- **WHEN** user creates a text question
- **THEN** system allows optional minLength and maxLength validation rules

#### Scenario: Multiple choice question
- **WHEN** user creates a multiple choice question
- **THEN** system collects the list of answer options
- **AND** stores them with the question

#### Scenario: Rating question
- **WHEN** user creates a rating question
- **THEN** system configures it as a 1-5 scale by default

#### Scenario: Number question with range
- **WHEN** user creates a number question
- **THEN** system allows optional min and max value validation

### Requirement: Survey Identification
The system SHALL identify survey creators using unique creator codes instead of authentication.

#### Scenario: Creator code assignment
- **WHEN** user starts creating a survey
- **THEN** system generates or accepts a 12-character creator code
- **AND** associates all surveys with that code

#### Scenario: Access surveys by creator code
- **WHEN** user provides their creator code
- **THEN** system displays all surveys associated with that code

### Requirement: Survey Lifecycle Management
The system SHALL support survey status management with draft, active, and closed states.

#### Scenario: Survey starts as draft
- **WHEN** user creates a new survey
- **THEN** survey status is set to draft

#### Scenario: Activate survey
- **WHEN** user activates a survey
- **THEN** survey status changes to active
- **AND** survey becomes available for responses

#### Scenario: Close survey
- **WHEN** user closes a survey
- **THEN** survey status changes to closed
- **AND** no new responses are accepted

### Requirement: Survey Editing
The system SHALL allow users to edit existing surveys through conversation.

#### Scenario: Edit survey through chat
- **WHEN** user requests to edit a survey
- **THEN** system loads the existing survey state
- **AND** allows modifications through conversation

#### Scenario: Modify question
- **WHEN** user wants to change an existing question
- **THEN** system identifies the question by index or text
- **AND** applies the requested changes
