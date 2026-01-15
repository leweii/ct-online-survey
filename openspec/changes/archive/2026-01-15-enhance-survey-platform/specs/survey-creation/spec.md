# Capability: Survey Creation

## MODIFIED Requirements

### Requirement: Professional Survey Generation
The system SHALL use Extended Thinking model to generate more professional survey questions.

#### Scenario: Use thinking model for survey generation
- **WHEN** user describes a survey topic
- **THEN** system uses Extended Thinking model for deep reasoning
- **AND** generates professional survey title, description and questions
- **AND** question design follows survey best practices

#### Scenario: Professional question design
- **WHEN** AI generates survey questions
- **THEN** considers logical question ordering
- **AND** options are comprehensive and mutually exclusive
- **AND** avoids leading questions
- **AND** includes appropriate mix of question types

### Requirement: Chinese Interface
The system SHALL use Chinese as default interface language.

#### Scenario: Create page displays in Chinese
- **WHEN** user enters the survey creation page
- **THEN** all UI elements display in Chinese
- **AND** AI assistant responds in Chinese by default
