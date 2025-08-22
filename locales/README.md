# Centralized Locale System

## Overview

This application uses a centralized internationalization system powered by **i18next** for managing all translatable text. The system provides type-safe, globally accessible locale data across the entire application with support for namespaces, interpolation, and graceful fallbacks.

## Architecture

### 1. Locale Files (`/locales/`)

All translatable text is stored in JSON files in the `locales/` directory:

```bash
locales/
├── en.json
└── README.md
```

### 2. i18n Loader (`src/scripts/helpers/i18nLoader.ts`)

A robust i18next-based loader that:

- ✅ Synchronously initializes i18next for immediate availability
- ✅ Supports namespace-based organization
- ✅ Provides interpolation with `{variable}` syntax
- ✅ Handles missing keys gracefully with fallbacks
- ✅ Includes comprehensive error handling and logging
- ✅ Exports type-safe wrapper functions

### 3. Express Middleware (`middleware/setupLocale.ts`)

Injects locale functions into the Express request/response cycle:

- Makes locale functions available in `res.locals` for templates
- Adds `req.locale` object for controller access
- Provides `ExpressLocaleLoader` interface for type safety

### 4. Nunjucks Integration (`utils/nunjucksSetup.ts`)

Makes locale functions globally available in all Nunjucks templates via the `nunjucksT` function.

## Usage

### In TypeScript Controllers

```typescript
import { t } from '#src/scripts/helpers/index.js';

// Use t() for all translations with namespace support
const backButton = t('common.back');
const pageTitle = t('pages.caseDetails.title');

// Interpolation support
const welcomeMessage = t('messages.welcome', { name: 'John' });
const errorMessage = t('errors.http.default', { status: '404' });

// In Express controllers via req.locale
export function myController(req: Request, res: Response): void {
  const errorMsg = req.locale.t('errors.general.caseNotFound');
  const welcomeMsg = req.locale.t('messages.welcome', { name: user.name });
}
```

### In Nunjucks Templates

Locale functions are **globally available** through the `t` function:

```nunjucks
{# Standard translation calls #}
<h1>{{ t('pages.home.title') }}</h1>
<button>{{ t('common.save') }}</button>
<a href="/">{{ t('common.back') }}</a>

{# Interpolation with variables #}
<p>{{ t('messages.welcome', { name: user.name }) }}</p>
<title>{{ t('pages.yourCases.title', { serviceName: config.SERVICE_NAME }) }}</title>

{# GOV.UK component integration #}
{{ govukInput({
  label: { text: t('forms.clientDetails.name.label') },
  hint: { text: t('forms.clientDetails.name.hint') }
}) }}

{# Conditional rendering #}
<p class="govuk-error-message">{{ t('errors.validation.required') }}</p>
```

## Locale File Structure

The locale files follow a nested namespace structure organized by functional areas:

```json
{
  "common": {
    "back": "Back",
    "save": "Save",
    "cancel": "Cancel",
    "yes": "Yes",
    "no": "No"
  },
  "pages": {
    "home": {
      "title": "Manage your civil cases"
    },
    "caseDetails": {
      "title": "Case details – {serviceName} – GOV.UK",
      "tabs": {
        "clientDetails": "Client details"
      }
    }
  },
  "forms": {
    "clientDetails": {
      "name": {
        "label": "Client name",
        "hint": "Enter the full legal name"
      },
      "address": {
        "validationError": {
          "notChanged": "You must change the address before saving"
        }
      }
    }
  },
  "errors": {
    "http": {
      "400": "Invalid request. Please check your input and try again.",
      "404": "Page not found",
      "default": "Service error ({status}). Please try again later."
    },
    "validation": {
      "required": "This field is required",
      "invalidFormat": "Please enter a valid {fieldType}"
    }
  }
}
```

## Key Naming Conventions

- **Namespace organization**: Top-level keys represent functional areas (`common`, `pages`, `forms`, `errors`)
- **Hierarchical structure**: Use dot notation for nested access (`pages.caseDetails.title`)
- **Descriptive naming**: Keys should clearly indicate their purpose and context
- **Consistent patterns**: Use standard suffixes like `label`, `hint`, `error`, `title`
- **Validation grouping**: Group validation messages under `validationError` objects

## Interpolation Support

The system uses i18next's interpolation with `{variable}` syntax:

```json
{
  "messages": {
    "welcome": "Welcome, {name}!",
    "itemCount": "You have {count} items"
  },
  "pages": {
    "title": "{pageTitle} – {serviceName} – GOV.UK"
  }
}
```

Usage:

```typescript
// Simple interpolation
t('messages.welcome', { name: 'John' });
// Result: "Welcome, John!"

// Multiple variables
t('pages.title', { pageTitle: 'Case Details', serviceName: 'LAA Portal' });
// Result: "Case Details – LAA Portal – GOV.UK"

// In templates
{{ t('messages.itemCount', { count: cases.length }) }}
```

## System Architecture Details

### Initialization Process

1. **Synchronous Loading**: `initializeI18nextSync()` runs during app startup
2. **Resource Loading**: Reads `locales/en.json` using Node.js `fs.readFileSync`
3. **i18next Configuration**: Sets up namespaces, interpolation, and fallbacks
4. **Global Availability**: Functions become immediately available across the app

### Error Handling

- **Missing Files**: Falls back to empty resources with console warning
- **Invalid JSON**: Gracefully handles parse errors
- **Missing Keys**: Returns the key path as fallback text
- **Development Mode**: Provides detailed logging for debugging

### Performance Considerations

- **Synchronous initialization** ensures translations are available immediately
- **In-memory caching** via i18next for fast runtime access
- **Single file loading** keeps startup time minimal
- **No network requests** - all resources are local

## Key Features

### 🚀 **i18next Integration**

- Built on the industry-standard i18next library
- Full support for namespaces and interpolation
- Comprehensive error handling and fallbacks
- Development-friendly logging and debugging

### 🌐 **Global Availability**

- Functions available in all Nunjucks templates via global `t()`
- Express middleware injects locale into `req.locale` and `res.locals`
- TypeScript modules can import and use directly
- Consistent API across all application layers

### ⚡ **Performance Optimized**

- Synchronous initialization prevents race conditions
- File-based loading with caching for optimal performance
- Minimal runtime overhead with direct function calls
- No external network dependencies

### 🛡️ **Type Safety & Reliability**

- Full TypeScript interface definitions
- `ExpressLocaleLoader` interface for consistent typing
- Graceful degradation when keys are missing
- Comprehensive error boundaries and fallbacks

### 🔧 **Developer Experience**

- Simple `t('namespace.key')` syntax
- Intuitive interpolation: `t('key', { variable: 'value' })`
- Clear error messages in development mode
- Hot reload support during development
- Comprehensive test coverage

## Best Practices

1. **Use descriptive namespace paths**: `forms.clientDetails.name.label`
2. **Leverage interpolation** for dynamic content: `t('welcome', { name })`
3. **Group related translations** in logical namespace hierarchies
4. **Test interpolation variables** to ensure proper substitution
5. **Keep translation keys** focused and context-specific
6. **Validate locale changes** across all usage points
7. **Follow consistent naming patterns** throughout the locale file

## Troubleshooting

### Common Issues

```typescript
// ❌ Wrong: Missing namespace or incorrect key
const text = t('back'); // Should be t('common.back')

// ✅ Correct: Full namespace path
const text = t('common.back');

// ❌ Wrong: Incorrect interpolation syntax
const msg = t('welcome', { user: 'John' }); // Variable name doesn't match

// ✅ Correct: Match the variable names in locale file
const msg = t('messages.welcome', { name: 'John' });
```

### Validation and Testing

```typescript
// Check if translations work as expected
console.log(t('common.back')); // Should output: "Back"

// Test interpolation
console.log(t('messages.welcome', { name: 'Test' })); // Should output: "Welcome, Test!"
```

### Development vs Production

- **Development**: Missing keys and errors logged to console with warnings
- **Production**: Missing keys return the key path silently for graceful degradation
- **Testing**: Use `initializeI18nextSync()` in test setup for consistent state

## Migration Guide

If migrating from a previous locale system:

1. **Update import statements** to use the new i18nLoader functions
2. **Replace object notation** `t.common.back` with function calls `t('common.back')`
3. **Update interpolation syntax** to use the standard `{variable}` format
4. **Add namespace prefixes** to all translation keys
5. **Test all templates and controllers** to ensure proper function calls
