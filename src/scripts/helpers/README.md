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
  - [Implementation Guidelines](#implementation-guidelines)
    - [🎯 Best Practices](#-best-practices)
    - [🔄 Usage Patterns](#-usage-patterns)
      - [Replacing Console Calls](#replacing-console-calls)
      - [Data Validation](#data-validation)
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

- `isValidDateOfBirth(value: unknown): value is DateOfBirth` - Type guard for DateOfBirth objects
- `safeString(value: unknown): string` - Safely convert unknown value to string
- `safeOptionalString(value: unknown): string | undefined` - Safely convert to optional string
- `isRecord(value: unknown): value is Record<string, unknown>` - Type guard for object records

#### Usage

```typescript
import { 
  isValidDateOfBirth, 
  safeString, 
  safeOptionalString, 
  isRecord 
} from '#src/scripts/helpers/index.js';

// Transform API data safely
function transformCaseData(rawData: unknown) {
  if (!isRecord(rawData)) {
    throw new Error('Invalid data format');
  }

  return {
    name: safeString(rawData.name),
    description: safeOptionalString(rawData.description),
    dateOfBirth: isValidDateOfBirth(rawData.dateOfBirth) 
      ? formatDateOfBirth(rawData.dateOfBirth)
      : ''
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

### 🧪 Testing

All helpers should be thoroughly tested:

- Unit tests in `tests/unit/src/scripts/helpers/`
- Test files follow pattern `{helperName}.spec.ts`
- Use Chai assertions and Sinon for mocking
- Include edge cases and error conditions

### 📁 File Organization

```
src/scripts/helpers/
├── README.md                 # This file
├── index.ts                  # Central export file
├── dataTransformers.ts       # Data validation and transformation
├── dateFormatter.ts          # Date formatting utilities
├── devLogger.ts             # Development logging
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
| `dataTransformers` | Data validation/transformation | `safeString`, `isRecord`, `isValidDateOfBirth` |
| `dateFormatter` | Date formatting | `formatDate` |

Import any helper with:

```typescript
import { functionName } from '#src/scripts/helpers/index.js';
```
