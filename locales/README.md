# Centralized Locale System

## Overview

This application uses a centralised system powered by **i18next** for managing all translatable text. The system provides type-safe, globally accessible locale data across the entire application.

## Architecture

### 1. Locale Files (`/locales/`)

All translatable text is stored in JSON files in the `locales/` directory:

```bash
locales/
├── en.json
```

### 2. Locale Loader (`src/scripts/helpers/localeLoader.ts`)

A simplified, lightweight loader that:

- ✅ Loads locale data from JSON files using i18next
- ✅ Provides dot-notation access (`t.common.back`)
- ✅ Supports placeholder replacement with i18next
- ✅ Handles missing keys gracefully with fallbacks
- ✅ Caches data for optimal performance

### 3. Nunjucks Global Setup (`utils/nunjucksSetup.ts`)

Makes locale functions globally available in all Nunjucks templates:

- `t` - Direct object access (`t.common.back`)
- `getText` - Function with placeholder support
- `hasText` - Key existence checker

### 4. Express Middleware (`middleware/setupLocale.ts`)

Injects locale data into Express request/response cycle for controllers and templates.

## Usage

### In TypeScript Controllers

```typescript
import { getText, hasText, t } from '#src/scripts/helpers/index.js';

// Recommended: Use getText() for strings with or without placeholders
const errorMessage = getText('errors.general.invalidCaseReference');
const httpError = getText('errors.http.default', { status: '404' });

// Check if key exists
if (hasText('forms.clientDetails.name.label')) {
  // Key exists, safe to use
}

// Direct object access (for simple strings)
const backText = t.common.back;
const pageTitle = t.pages.home.title;

// In Express controllers via req.locale
export function myController(req: Request, res: Response): void {
  const errorMsg = req.locale.getText('errors.general.caseNotFound');
  const hasError = req.locale.hasText('errors.specific.someError');
}
```

### In Nunjucks Templates

Locale functions are **globally available** - no imports or parameters needed:

```nunjucks
{# Direct object access - clean and simple #}
<h1>{{ t.pages.home.title }}</h1>
<button>{{ t.common.save }}</button>
<a href="/">{{ t.common.back }}</a>

{# Function with placeholder replacement #}
<p>{{ getText('messages.welcome', { name: user.name }) }}</p>
<title>{{ getText('pages.yourCases.pageTitles.new', { serviceName: config.SERVICE_NAME }) }}</title>

{# GOV.UK component integration #}
{{ govukInput({
  label: { text: t.forms.clientDetails.name.label },
  hint: { text: t.forms.clientDetails.name.hint }
}) }}

{# Conditional rendering #}
{% if hasText('errors.specific.someError') %}
  <p class="govuk-error-message">{{ t.errors.specific.someError }}</p>
{% endif %}
```

## Locale File Structure

The locale files follow a nested structure for organization:

```json
{
  "common": {
    "back": "Back",
    "save": "Save",
    "cancel": "Cancel"
  },
  "pages": {
    "home": {
      "title": "Manage your civil cases"
    },
    "caseDetails": {
      "clientDetails": {
        "heading": "Client details"
      }
    }
  },
  "forms": {
    "clientDetails": {
      "name": {
        "label": "Client name",
        "title": "Client name"
      }
    }
  },
  "errors": {
    "http": {
      "400": "Invalid request. Please check your input and try again.",
      "default": "Service error ({status}). Please try again later."
    }
  }
}
```

## Key Naming Conventions

- Use descriptive, hierarchical keys: `pages.caseDetails.clientDetails.heading`
- Group related strings: `forms.clientDetails.*`, `errors.http.*`
- Use consistent naming: `label`, `title`, `hint`, `error`
- Keep accessibility strings separate: `accessibility.visuallyHiddenText.*`

## Placeholder Support

The system supports both `{key}` and `{{key}}` placeholder formats:

```json
{
  "messages": {
    "welcome": "Welcome, {name}!",
    "httpError": "Service error ({status}). Please try again."
  }
}
```

Usage:

```typescript
getText('messages.welcome', { name: 'John' });
// Result: "Welcome, John!"

getText('messages.httpError', { status: '404' });
// Result: "Service error (404). Please try again."
```

## Key Features

### 🚀 **Simplified & Lightweight**

- Clean, maintainable codebase (simplified from 400+ to ~260 lines)
- Powered by industry-standard i18next library
- Zero backend connector warnings

### 🌐 **Global Availability**

- `t` object automatically available in **all** Nunjucks templates
- `getText` and `hasText` functions globally accessible
- No need to pass locale objects as parameters to components

### ⚡ **Performance Optimized**

- Preloaded resources for fast access
- In-memory caching with i18next
- Minimal runtime overhead

### 🛡️ **Type Safety & Error Handling**

- Full TypeScript interface support
- Graceful handling of missing keys (returns key as fallback)
- Development-mode warnings for debugging

### 🔧 **Developer Experience**

- Dot notation access: `t.pages.home.title`
- Placeholder support: `getText('welcome', { name: 'John' })`
- Hot reload support during development
- Clear error messages and fallbacks

## Best Practices

1. **Always use locale keys** instead of hardcoded strings
2. **Use `getText()` for dynamic content** with placeholders
3. **Use `t.path.to.key` for static content** (cleaner syntax)
4. **Group related strings** logically in the locale structure
5. **Use descriptive key paths** that clearly indicate purpose
6. **Test locale changes** across templates and controllers
7. **Leverage global availability** - no need to pass locale objects as parameters
8. **Keep placeholder names** clear and consistent

## Troubleshooting

### Missing Key Issues

```typescript
// ❌ Wrong: Will return the key path if missing
const text = t.some.missing.key; // Returns "some.missing.key"

// ✅ Better: Check existence first
if (hasText('some.missing.key')) {
  const text = getText('some.missing.key');
}

// ✅ Best: Use try-catch for critical paths
try {
  const text = getText('some.key', { param: value });
} catch (error) {
  // Handle missing key gracefully
}
```

### Development vs Production

- **Development**: Missing keys log warnings to console
- **Production**: Missing keys return the key path silently
- Use `clearLocaleCache()` for testing dynamic reloads
