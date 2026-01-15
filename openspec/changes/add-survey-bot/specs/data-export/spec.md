# Capability: Data Export

## ADDED Requirements

### Requirement: CSV Export
The system SHALL export survey responses to CSV format.

#### Scenario: Export all responses
- **WHEN** creator requests CSV export for a survey
- **THEN** system generates a CSV file containing all completed responses
- **AND** file downloads to user's device

#### Scenario: CSV column headers
- **WHEN** CSV is generated
- **THEN** first row contains column headers
- **AND** headers include: response_id, respondent_id, completed_at, plus each question text

#### Scenario: Handle multiple choice answers
- **WHEN** response contains multiple choice answer
- **THEN** CSV cell contains the selected option text

#### Scenario: Handle empty/skipped answers
- **WHEN** optional question was not answered
- **THEN** CSV cell is empty for that column

### Requirement: Response Listing
The system SHALL allow creators to view all responses for their surveys.

#### Scenario: List responses in dashboard
- **WHEN** creator views survey in dashboard
- **THEN** system displays count of total responses
- **AND** count of completed vs in-progress responses

#### Scenario: View individual response
- **WHEN** creator requests response details via API
- **THEN** system returns the complete response with all answers

### Requirement: Creator Dashboard
The system SHALL provide a dashboard for creators to manage surveys and responses.

#### Scenario: View survey list
- **WHEN** creator accesses dashboard with their creator code
- **THEN** system displays all surveys for that code
- **AND** shows response count for each survey

#### Scenario: Export from dashboard
- **WHEN** creator clicks export button for a survey
- **THEN** system triggers CSV download for that survey

#### Scenario: Manage survey status
- **WHEN** creator views a survey in dashboard
- **THEN** system shows current status (draft/active/closed)
- **AND** provides controls to change status
