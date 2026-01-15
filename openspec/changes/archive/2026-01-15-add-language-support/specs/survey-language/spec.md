# Capability: Survey Language Support

## ADDED Requirements

### Requirement: Language Detection in Creator Mode
The system SHALL detect the language used by the survey creator and respond in that language.

#### Scenario: Detect language from topic description
- **WHEN** creator describes a survey topic in a specific language
- **THEN** AI detects the language from the input
- **AND** generates survey title, description, and questions in the same language
- **AND** stores the detected language in survey settings

#### Scenario: Respond in creator's language
- **WHEN** AI responds to creator during survey creation
- **THEN** AI uses the detected language for all responses
- **AND** action confirmations are in the same language

### Requirement: Survey Language Storage
The system SHALL store the survey's language for use in responder mode.

#### Scenario: Store language in survey
- **WHEN** survey is finalized
- **THEN** survey settings include the detected language code
- **AND** language is persisted to database

## MODIFIED Requirements

### Requirement: Responder Language Adaptation
The system SHALL present survey questions in the original language while adapting AI responses to the responder's preferred language.

#### Scenario: Default to survey language
- **WHEN** responder starts a survey
- **THEN** AI presents questions in the survey's original language
- **AND** AI guidance is in the survey's language by default

#### Scenario: Adapt to responder's language
- **WHEN** responder types in a different language than the survey
- **THEN** AI responds in the responder's language
- **BUT** question text remains in original survey language
- **AND** answer validation messages adapt to responder's language

#### Scenario: Mixed language interaction
- **WHEN** survey is in Chinese and responder types in English
- **THEN** AI guidance is in English
- **AND** question text is still shown in Chinese
- **AND** answer is saved regardless of language used
