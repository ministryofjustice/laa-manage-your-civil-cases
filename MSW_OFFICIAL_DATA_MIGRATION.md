# MSW Mock Data - Official Structure Implementation

## Overview
Updated the MSW implementation to use the official mock data structure and values from the **laa-civil-case-api** repository, as requested.

## Source Data
- **Original Source**: https://github.com/ministryofjustice/laa-civil-case-api/blob/7aad1d47c95ad12cfa37b0660bf341f0426e2f4e/app/data/mock_cases.json
- **Data Date**: Based on commit `7aad1d47` from laa-civil-case-api

## Key Changes Made

### 1. Data Structure Updates
**Before (Custom Structure):**
```json
{
  "caseReference": "PC-1922-1879",
  "fullName": "Jack Young",
  "phoneNumber": "07700900123",
  "caseStatus": "New",
  "dateReceived": "2024-01-15",
  "refCode": "REF001"
}
```

**After (Official Structure):**
```json
{
  "fullName": "Ember Hamilton",
  "caseReference": "PC-3184-5962",
  "refCode": "",
  "dateReceived": "2025-01-08T19:00:00-05:00",
  "lastModified": "2025-01-09T14:30:00-05:00",
  "caseStatus": "Accepted",
  "dateOfBirth": "1987-02-19T00:00:00-05:00",
  "clientIsVulnerable": true,
  "language": "German",
  "phoneNumber": "0784104271",
  "laaReference": "3080639"
}
```

### 2. New Fields Added
- `lastModified`: ISO timestamp for case updates
- `dateClosed`: For closed cases
- `clientIsVulnerable`: Boolean flag
- `language`: Client's preferred language
- `laaReference`: LAA reference number
- `thirdParty`: Complete third party contact structure
- `clientSupportNeeds`: Accessibility and support requirements

### 3. Third Party Structure
**Official Structure:**
```json
{
  "thirdParty": {
    "fullName": "Chris Green",
    "emailAddress": "chris@green.com", 
    "contactNumber": "0786304271",
    "safeToCall": false,
    "address": "22 Baker Street, London",
    "postcode": "NW1 6XE",
    "relationshipToClient": {
      "selected": ["Other"]
    },
    "passphraseSetUp": {
      "selected": ["Yes"],
      "passphrase": "LetMeIn"
    }
  }
}
```

### 4. Date Format Changes
- **Before**: Simple dates like `"2024-01-15"`
- **After**: Full ISO timestamps like `"2025-01-08T19:00:00-05:00"`

## Additional Test Data Created

**Note**: Some additional test data was created to ensure comprehensive test coverage while maintaining the official structure:

### Cases Added for Testing
1. **PC-1922-1879** (Jack Youngs) - New status, no third party (for testing null thirdParty)
2. **PC-9159-2337** (George Allen) - New status with third party
3. **PC-1869-9154** (Grace Baker) - Opened status with clientSupportNeeds

### Reasoning for Additional Data
- **PC-1922-1879**: Tests referenced this specific case ID in multiple test files. Created with official structure but `thirdParty: null` to test remove functionality.
- **Status Distribution**: Added cases with different statuses (New, Accepted, Opened, Closed) to ensure status filtering tests work correctly.
- **Support Needs Testing**: Added `clientSupportNeeds` data to test accessibility requirements functionality.

## Test Impact Assessment

### Tests That Should Continue Working
- ✅ Case listing by status
- ✅ Individual case details
- ✅ Search functionality  
- ✅ Third party management
- ✅ Case updates

### Tests That May Need Review
- 🔍 **Date parsing**: Tests expecting simple date format may need updates
- 🔍 **Field validation**: Tests checking specific field names or structures
- 🔍 **Mock assertions**: Tests asserting specific mock values

## Files Updated
1. `tests/playwright/fixtures/mock-data-official.json` - New official mock data
2. `tests/playwright/factories/handlers/api.ts` - Updated types and handlers
3. This documentation explaining changes

## Validation
The official structure has been validated against the source repository and includes all required fields for:
- Case management workflows
- Third party contact management
- Client support needs
- Status transitions
- Search and filtering

This ensures the MSW mocks accurately represent the real API structure while maintaining comprehensive test coverage.