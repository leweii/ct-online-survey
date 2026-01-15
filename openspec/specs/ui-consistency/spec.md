# ui-consistency Specification

## Purpose
TBD - created by archiving change unify-analytics-ui. Update Purpose after archive.
## Requirements
### Requirement: Slack-like Compact Chat UI
All chat-based pages SHALL use a Slack-like compact style for consistent, modern user experience.

#### Scenario: Message layout
- **WHEN** user views any chat page
- **THEN** all messages SHALL be left-aligned (no bubbles)
- **AND** each message SHALL display a role indicator ("AI" or "You") at top
- **AND** messages SHALL have compact spacing between them

#### Scenario: Role indicators
- **WHEN** a message is displayed
- **THEN** AI messages SHALL show "🤖 AI" label
- **AND** user messages SHALL show "👤 You" / "👤 你" label
- **AND** role indicator SHALL appear above message content

#### Scenario: Visual styling
- **WHEN** user views chat messages
- **THEN** messages SHALL NOT have bubble backgrounds or rounded corners
- **AND** typography SHALL be clean and readable
- **AND** subtle separators or spacing SHALL distinguish message groups

#### Scenario: Analytics-specific elements preserved
- **WHEN** user views analytics chat page
- **THEN** stats card SHALL display above the chat area
- **AND** survey selector dropdown SHALL remain in header
- **AND** all analytics functionality SHALL work as before

