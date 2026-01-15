# ux-polish Specification

## Purpose
TBD - created by archiving change improve-ux-polish. Update Purpose after archive.
## Requirements
### Requirement: Clean Streaming Output
The system SHALL buffer streaming content to prevent partial action tags from being displayed to users.

#### Scenario: Action tag buffering during streaming
- **WHEN** AI generates content containing `<ACTION>...</ACTION>` tags
- **THEN** backend SHALL buffer content until action tags are complete
- **AND** only send clean text (without action tags) to frontend

#### Scenario: No flickering during survey creation
- **WHEN** user creates a survey and AI streams response
- **THEN** user SHALL NOT see any `<ACTION>`, `</ACTION>`, or partial tag content

### Requirement: Survey-Level Data Analysis
The system SHALL provide data analysis access at the survey level, not user level.

#### Scenario: Analyze button on survey card
- **WHEN** user views their surveys in dashboard
- **THEN** each survey card SHALL display an "Analyze" / "分析" button

#### Scenario: Navigate to survey-specific analysis
- **WHEN** user clicks the analyze button on a survey
- **THEN** system SHALL navigate to analytics page with that survey pre-selected

### Requirement: Optimized Layout Width
The dashboard SHALL use a narrower layout for better readability.

#### Scenario: Dashboard max width
- **WHEN** user views the dashboard
- **THEN** content SHALL be constrained to max-w-4xl (896px) width

### Requirement: Blog-First Footer
The footer SHALL prioritize blog link with AI knowledge tagline.

#### Scenario: Footer content order
- **WHEN** user views any page
- **THEN** footer SHALL display in order: blog (with AI tagline), email, 小红书

#### Scenario: Footer tagline
- **WHEN** footer displays blog link
- **THEN** link SHALL include short tagline about AI insights

