# Scripts Helpers

This directory contains reusable utility functions and helpers for the application. All helpers are designed to be type-safe, well-tested, and f2. **Use TypeScript path aliases**
   ```typescript
   // ✅ Use alias with index
   import { safeString } from '#src/scripts/helpers/index.js';
   
   // ❌ Avoid relative paths
   import { safeString } from '../../helpers/dataTransformers.js';
   ```

3. **Prefer specific imports**
   ```typescript
   // ✅ Import only what you need
   import { devLog, devError } from '#src/scripts/helpers/index.js';
   
   // ❌ Avoid namespace imports
   import * as helpers from '#src/scripts/helpers/index.js';
   ```patterns.

## Centralized Imports

All helpers are available through a central index file, allowing for clean imports:

```typescript
// Import multiple helpers from the index
import { devLog, safeString, formatDate } from '#src/scripts/helpers/index.js';

// Instead of importing from individual files
import { devLog } from '#src/scripts/helpers/devLogger.js';
import { safeString } from '#src/scripts/helpers/dataTransformers.js';
import { formatDate } from '#src/scripts/helpers/dateFormatter.js';
```

## Table of Contents

- [Scripts Helpers](#scripts-helpers)
  - [Table of Contents](#table-of-contents)
  - [Available Helpers](#available-helpers)
    - [📝 Development Logging (`devLogger.ts`)](#-development-logging-devloggerts)
      - [Functions](#functions)
      - [Usage](#usage)
      - [Environment Detection](#environment-detection)
    - [🔧 Data Transformers (`dataTransformers.ts`)](#-data-transformers-datatransformersts)
      - [Functions](#functions-1)
      - [Usage](#usage-1)
      - [Type Safety](#type-safety)
    - [📅 Date Formatter (`dateFormatter.ts`)](#-date-formatter-dateformatterts)
      - [Functions](#functions-2)
      - [Usage](#usage-2)
      - [Format](#format)
    - [⚠️ Error Handler (`errorHandler.ts`)](#️-error-handler-errorhandlerts)
      - [Functions](#functions-3)
      - [Usage](#usage-3)
      - [Error Types](#error-types)
  - [Implementation Guidelines](#implementation-guidelines)
    - [🎯 Best Practices](#-best-practices)
    - [🔄 Usage Patterns](#-usage-patterns)
      - [Replacing Console Calls](#replacing-console-calls)
      - [Data Validation](#data-validation)
      - [Error Handling](#error-handling)
    - [🧪 Testing](#-testing)
    - [📁 File Organization](#-file-organization)
    - [🚀 Adding New Helpers](#-adding-new-helpers)
      - [Template for New Helper](#template-for-new-helper)
    - [🔗 Related Documentation](#-related-documentation)
  - [Quick Reference](#quick-reference)

## Available Helpers

### 📝 Development Logging (`devLogger.ts`)

Environment-aware logging utilities that only output to console in development mode, keeping production logs clean.

#### Functions

- `devLog(message: string)` - Development-only console.log
- `devWarn(message: string)` - Development-only console.warn
- `devError(message: string)` - Development-only console.error
- `devDebug(message: string)` - Development-only console.debug
- `isDevelopment(): boolean` - Check if running in development mode

#### Usage

```typescript
import { devLog, devWarn, devError, isDevelopment } from '#src/scripts/helpers/index.js';

// These will only appear in development mode
devLog('Initializing component...');
devWarn('Deprecated feature used');
devError('Failed to load data');

// Conditional logic based on environment
if (isDevelopment()) {
  // Development-only code
}
```

#### Environment Detection

Logs appear when:
- `NODE_ENV === 'development'`
- `NODE_ENV` is undefined (default development behavior)

Logs are suppressed when:
- `NODE_ENV === 'production'`
- `NODE_ENV === 'test'`

---

### 🔧 Data Transformers (`dataTransformers.ts`)

Type-safe utilities for transforming and validating data from JSON fixtures and API responses.

#### Functions

- `safeString(value: unknown): string` - Safely convert unknown value to string
- `safeOptionalString(value: unknown): string | undefined` - Safely convert to optional string
- `isRecord(value: unknown): value is Record<string, unknown>` - Type guard for object records
- `safeStringFromRecord(obj: unknown, key: string): string | null` - Safely extract string from record
- `hasProperty(obj: unknown, key: string): obj is Record<string, unknown>` - Check if object has property

#### Usage

```typescript
import { 
  safeString, 
  safeOptionalString, 
  isRecord,
  safeStringFromRecord,
  hasProperty
} from '#src/scripts/helpers/index.js';

// Transform API data safely
function transformCaseData(rawData: unknown) {
  if (!isRecord(rawData)) {
    throw new Error('Invalid data format');
  }

  return {
    name: safeString(rawData.name),
    description: safeOptionalString(rawData.description),
    dateOfBirth: safeString(rawData.dateOfBirth)
  };
}
```

#### Type Safety

All functions handle `null`, `undefined`, and unexpected types gracefully, returning sensible defaults or typed guards.

---

### 📅 Date Formatter (`dateFormatter.ts`)

Consistent date formatting utilities for UI components and tables.

#### Functions

- `formatDate(dateString: string): string` - Format ISO date string to "DD MMM YYYY" format

#### Usage

```typescript
import { formatDate } from '#src/scripts/helpers/index.js';

// Format dates for display
const displayDate = formatDate('2023-01-06T00:00:00.000Z');
// Returns: "06 Jan 2023"

// Use in Nunjucks templates via filter
// {{ dateReceived | formatDate }}
```

#### Format

- Input: ISO date string (`"2023-01-06T00:00:00.000Z"`)
- Output: Human-readable format (`"06 Jan 2023"`)
- Locale: British English (`en-GB`)
- Fallback: Returns original string if parsing fails

---

### ⚠️ Error Handler (`errorHandler.ts`)

Comprehensive error handling utilities for API requests and network operations, providing user-friendly error messages and structured logging.

#### Functions

- `extractErrorMessage(error: unknown): string` - Extract user-friendly error message from various error types
- `createProcessedError(error: unknown, context: string): Error` - Create processed error with user-friendly message for global handler
- `extractAndLogError(error: unknown, context: string): string` - Extract error message and log it with context (for API services)
- `isHttpError(error: unknown, status: number): boolean` - Check if error is a specific HTTP status code
- `isAuthError(error: unknown): boolean` - Check if error is authentication failure (401)
- `isForbiddenError(error: unknown): boolean` - Check if error is forbidden access (403)
- `isNotFoundError(error: unknown): boolean` - Check if error is not found (404)
- `isServerError(error: unknown): boolean` - Check if error is server error (5xx)

#### Usage

```typescript
import { 
  extractErrorMessage, 
  createProcessedError,
  extractAndLogError,
  isAuthError, 
  isServerError 
} from '#src/scripts/helpers/index.js';

// For route handlers - create processed errors for global handler
try {
  await loadUserData();
} catch (error) {
  const processedError = createProcessedError(error, 'loading user data');
  next(processedError); // Pass to global error handler
}

// For API services - extract and log errors for service responses
try {
  const response = await externalApiCall();
  return { data: response, status: 'success' };
} catch (error) {
  const errorMessage = extractAndLogError(error, 'External API error');
  return { data: null, status: 'error', message: errorMessage };
}

// Basic error message extraction
try {
  await apiCall();
} catch (error) {
  const userMessage = extractErrorMessage(error);
  // Returns: "Authentication failed. Please log in again." for 401 errors
  
  // Handle specific error types
  if (isAuthError(error)) {
    // Redirect to login
  } else if (isServerError(error)) {
    // Show retry option
  }
}
```

#### Error Types

**HTTP Status Codes:**
- `400` → "Invalid request. Please check your input and try again."
- `401` → "Authentication failed. Please log in again."
- `403` → "You do not have permission to access this resource."
- `404` → "The requested information could not be found."
- `500` → "Internal server error. Please try again later."
- `502/503` → "Service temporarily unavailable. Please try again later."

**Network Errors:**
- `ECONNREFUSED` → "Unable to connect to the service. Please try again later."
- `ETIMEDOUT` → "Request timed out. Please try again."
- `ENOTFOUND` → "Service not found. Please check your connection and try again."

**Features:**
- Extracts custom error messages from API responses
- Provides fallback messages for unknown errors
- Includes structured logging for debugging
- Type-safe error detection with proper type guards

### 🔧 Error Handling Function Selection Guide

Choose the appropriate error handling function based on your use case:

#### Use `extractAndLogError()`

- **When:** In service layer methods that make API calls
- **Purpose:** Process errors and return detailed information for further handling
- **Example Use Cases:**
  - `apiService.getCases()` - needs to process and return error details
  - `authService.validateToken()` - requires structured error information
  - Any service method that needs to handle errors and pass details to caller

#### Use `createProcessedError()`

- **When:** In route handlers or middleware that need to return errors to client
- **Purpose:** Create user-friendly error objects ready for HTTP responses
- **Example Use Cases:**
  - Express route handlers returning errors to frontend
  - Middleware that processes errors for API responses
  - Any endpoint that needs to send formatted errors to client

#### Use `extractErrorMessage()`

- **When:** You only need the error message string without additional processing
- **Purpose:** Extract clean, user-friendly error messages from various error types
- **Example Use Cases:**
  - Simple error logging without structured information
  - Template rendering where only message text is needed
  - Basic error display in UI components

### 📋 Error Handling Pattern Examples

```typescript
// Service Layer Pattern
export async function getCases(params: CaseApiParams) {
  try {
    const response = await axiosWrapper.get<ApiResponse<CaseData>>(endpoint, { params });
    return response.data;
  } catch (error) {
    const { message, statusCode } = extractAndLogError(error, 'getCases');
    throw new Error(message); // Re-throw with processed message
  }
}
```

```typescript
// Route Handler Pattern
router.get('/cases', async (req, res, next) => {
  try {
    const cases = await apiService.getCases(req.query);
    res.json(cases);
  } catch (error) {
    const processedError = createProcessedError(error, 'GET /cases');
    next(processedError); // Pass to error middleware
  }
});
```

```typescript
// Simple Message Extraction
function displayError(error: unknown) {
  const message = extractErrorMessage(error);
  console.log(`Error: ${message}`);
}
```

---

## Implementation Guidelines

### 🎯 Best Practices

1. **Use the centralized index import**
   ```typescript
   // ✅ Correct - Import from index
   import { devLog, safeString, formatDate } from '#src/scripts/helpers/index.js';
   
   // ❌ Avoid individual file imports
   import { devLog } from '#src/scripts/helpers/devLogger.js';
   import { safeString } from '#src/scripts/helpers/dataTransformers.js';
   ```

2. **Use TypeScript path aliases**
   ```typescript
   // ✅ Use alias
   import { safeString } from '#src/scripts/helpers/index.js';
   
   // ❌ Avoid relative paths
   import { safeString } from '../../helpers/dataTransformers.js';
   ```

3. **Prefer specific imports**
   ```typescript
   // ✅ Import only what you need
   import { devLog, devError } from '#src/scripts/helpers/index.js';
   
   // ❌ Avoid namespace imports
   import * as helpers from '#src/scripts/helpers/index.js';
   ```

### 🔄 Usage Patterns

#### Replacing Console Calls

When refactoring existing code:

```typescript
// Before
console.log('Debug message');
console.warn('Warning message');
console.error('Error message');

// After
import { devLog, devWarn, devError } from '#src/scripts/helpers/index.js';

devLog('Debug message');
devWarn('Warning message');
devError('Error message');
```

#### Data Validation

When working with API responses or JSON data:

```typescript
import { isRecord, safeString } from '#src/scripts/helpers/index.js';

function processApiResponse(data: unknown) {
  if (!isRecord(data)) {
    throw new Error('Invalid response format');
  }

  return {
    id: safeString(data.id),
    name: safeString(data.name),
    // ... other fields
  };
}
```

#### Error Handling

When making API calls or handling errors:

```typescript
import { extractErrorMessage, isAuthError, isServerError } from '#src/scripts/helpers/index.js';

async function fetchUserData() {
  try {
    const response = await apiCall();
    return response;
  } catch (error) {
    const userMessage = extractErrorMessage(error);
    
    // Handle specific error types
    if (isAuthError(error)) {
      // Redirect to login page
      window.location.href = '/login';
    } else if (isServerError(error)) {
      // Show retry option
      showRetryDialog(userMessage);
    } else {
      // Show general error message
      showErrorMessage(userMessage);
    }
    
    throw error; // Re-throw for caller to handle
  }
}
```

### 🧪 Testing

All helpers should be thoroughly tested:

- Unit tests in `tests/unit/src/scripts/helpers/`
- Test files follow pattern `{helperName}.spec.ts`
- Use Chai assertions and Sinon for mocking
- Include edge cases and error conditions

### 📁 File Organization

```text
src/scripts/helpers/
├── README.md                 # This file
├── index.ts                  # Central export file
├── dataTransformers.ts       # Data validation and transformation
├── dateFormatter.ts          # Date formatting utilities
├── devLogger.ts             # Development logging
├── errorHandler.ts          # Error handling and user-friendly messages
└── [future-helper].ts       # Additional helpers as needed
```

### 🚀 Adding New Helpers

When creating new helpers:

1. **Create the helper file** with clear JSDoc comments
2. **Add comprehensive unit tests** in the test directory
3. **Update this README** with documentation
4. **Follow existing patterns** for imports and exports
5. **Consider environment awareness** (development vs production)

#### Template for New Helper

```typescript
/**
 * [Helper Name]
 *
 * Brief description of what this helper does.
 */

/**
 * Function description
 * @param {Type} param Parameter description
 * @returns {ReturnType} Return value description
 */
export function helperFunction(param: Type): ReturnType {
  // Implementation
}
```

### 🔗 Related Documentation

- [Project Type Definitions](../../../types/README.md)
- [Testing Guidelines](../../../tests/README.md)
- [Code Style Guide](../../../docs/code-style.md)

---

## Quick Reference

| Helper | Purpose | Key Functions |
|--------|---------|---------------|
| `devLogger` | Development logging | `devLog`, `devWarn`, `devError` |
| `dataTransformers` | Data validation/transformation | `safeString`, `isRecord`, `safeStringFromRecord` |
| `dateFormatter` | Date formatting | `formatDate` |
| `errorHandler` | Error handling/user-friendly messages | `extractErrorMessage`, `createProcessedError`, `extractAndLogError`, `isAuthError`, `isServerError` |

Import any helper with:

```typescript
import { functionName } from '#src/scripts/helpers/index.js';
```
