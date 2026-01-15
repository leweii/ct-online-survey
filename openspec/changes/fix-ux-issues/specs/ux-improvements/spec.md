# Capability: UX Improvements

## Overview
Improvements to CSV export, analytics, creator identification, and navigation consistency.

## ADDED Requirements

### Requirement: CSV UTF-8 BOM
CSV exports SHALL include UTF-8 BOM for proper Chinese character display in Excel.

#### Scenario: Export CSV with Chinese content
Given a survey has responses with Chinese text
When the user exports the survey as CSV
Then the CSV file SHALL start with UTF-8 BOM character (`\uFEFF`)
And Chinese characters SHALL display correctly in Microsoft Excel

---

### Requirement: Survey-Level Analytics
Analytics page SHALL allow users to select and analyze a specific survey.

#### Scenario: Select survey for analysis
Given a creator has multiple surveys
When they visit the analytics page
Then they SHALL see a dropdown to select a specific survey
And the stats SHALL update to show only the selected survey's data

#### Scenario: Default survey selection
Given a creator visits analytics from a survey card
When the page loads
Then that survey SHALL be pre-selected in the dropdown

---

### Requirement: Custom Creator Name
Users SHALL be able to input their own creator name for memorability.

#### Scenario: Enter custom creator name on homepage
Given a user is on the homepage
When they enter a creator name in the input field
Then the name SHALL be saved to localStorage
And the name SHALL persist across page refreshes

#### Scenario: Use custom name when creating survey
Given a user has entered a custom creator name
When they create a new survey
Then the survey SHALL be associated with their custom name
And the random name generation SHALL be skipped

#### Scenario: Pre-fill dashboard access
Given a user has a saved creator name
When they visit the homepage or dashboard
Then the creator name input SHALL be pre-filled with their saved name

---

### Requirement: Consistent Navigation
Navigation elements SHALL use consistent styling across all pages.

#### Scenario: Dashboard navigation
Given a user is on the dashboard page
When they view the header
Then they SHALL see a back arrow icon for returning home
And the style SHALL match other pages (create, analytics)

## MODIFIED Requirements

### Requirement: Analytics Data Scope
Analytics SHALL be scoped to individual surveys rather than aggregated across all surveys.

#### Scenario: View single survey analytics
Given a creator selects a specific survey
When viewing analytics
Then stats SHALL show only that survey's response data
And the AI assistant SHALL analyze only that survey's responses
