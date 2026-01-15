# Capability: Survey Identifiers

## Overview
User-friendly identifiers for surveys and creators to improve shareability and memorability.

## ADDED Requirements

### Requirement: Short Survey Code
Surveys SHALL have a 4-character alphanumeric code for user-facing identification.

#### Scenario: Generate short code on survey creation
Given a new survey is being created
When the survey is saved to the database
Then a unique 4-character short_code is generated
And the code uses only characters from `23456789ABCDEFGHJKMNPQRSTUVWXYZ`
And the code is case-insensitive for lookups

#### Scenario: Access survey by short code
Given a survey exists with short_code "A7B2"
When a user visits `/survey/A7B2`
Then the survey is loaded and displayed
And the URL accepts case-insensitive input (e.g., "a7b2" also works)

#### Scenario: Handle short code collision
Given a generated short code already exists
When attempting to save a new survey
Then a new code is generated and retry is attempted (up to 10 times)
And the process continues until a unique code is found

#### Scenario: Upgrade to longer code when exhausted
Given 10 consecutive collision retries have failed at current length
When generating a new short code
Then the system SHALL increase the code length by 1 character
And retry generation with the longer length
And continue this process up to a maximum of 8 characters

---

### Requirement: Creator Pet Name
The system SHALL identify creators by fun, memorable pet-style names instead of random strings.

#### Scenario: Generate pet name on survey creation
Given a new survey is being created
When the survey is saved
Then a unique creator_name is assigned
And the name is selected from a predefined pool of whimsical pet names
And Chinese names are used for Chinese language surveys

#### Scenario: Access dashboard by creator name
Given surveys exist with creator_name "胖墩墩"
When a user enters "胖墩墩" on the dashboard login
Then all surveys created with that name are displayed

#### Scenario: Display creator name after creation
Given a survey has been successfully created
When the completion message is shown
Then the creator_name is prominently displayed
And the user is instructed to save it for dashboard access

---

### Requirement: Survey URL Routing
Survey pages SHALL accept both short codes and UUIDs for backward compatibility.

#### Scenario: Route by short code
Given a survey with short_code "A7B2"
When accessing `/survey/A7B2`
Then the survey is found and displayed

#### Scenario: Route by UUID (backward compatibility)
Given a survey with id "550e8400-e29b-41d4-a716-446655440000"
When accessing `/survey/550e8400-e29b-41d4-a716-446655440000`
Then the survey is found and displayed

#### Scenario: Invalid identifier handling
Given no survey exists with the provided identifier
When accessing `/survey/XXXX`
Then a 404 error page is shown

---

### Requirement: Pet Name Pool
The system SHALL maintain pools of pet names in multiple languages.

#### Scenario: Chinese pet names
Given a survey is created with language "zh"
When a creator_name is assigned
Then the name is selected from Chinese pet name pool
And the name sounds playful/cute, not like a real person name
Examples: `胖墩墩`, `小土豆`, `咕噜噜`, `皮蛋`, `毛球球`

#### Scenario: English pet names
Given a survey is created with language "en" or other
When a creator_name is assigned
Then the name is selected from English pet name pool
Examples: `Fluffkins`, `Mr.Wobbles`, `Nugget`, `Biscuit`

## MODIFIED Requirements

### Requirement: Survey Display
Survey URLs and creator identifiers SHALL use the new format in all UI surfaces.

#### Scenario: Homepage survey input
Given a user wants to take a survey
When they enter the survey identifier
Then the input accepts 4-character short codes
And the placeholder text indicates "问卷代码" format

#### Scenario: Dashboard creator input
Given a user wants to view their dashboard
When they enter their creator identifier
Then the input accepts pet names
And the placeholder indicates creator name format (e.g., "您的创建者名称")

#### Scenario: Survey creation completion
Given a survey has been created
When the success message is displayed
Then it shows the short_code (not UUID) as the survey identifier
And it shows the creator_name (not random string) as the creator identifier
