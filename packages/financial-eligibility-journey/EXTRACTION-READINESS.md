# Financial Eligibility Journey Package - Extraction Readiness Guide

This document outlines the remaining steps needed to extract this package into a standalone npm repository.

## Current Status

- ✅ Package code is self-contained in `packages/financial-eligibility-journey/src/`
- ✅ No internal package imports depend on `src/` layout
- ✅ Single public entry point defined (index.ts)
- ✅ Package builds and integrates successfully within main repo

## Steps for External Extraction

### 1. Package Metadata & Configuration
- [ ] Update `packages/financial-eligibility-journey/package.json`:
  - Set `"private": false` when ready to publish
  - Set `"version"` to initial release (e.g., "0.1.0" or "1.0.0") following semver
  - Add `"license"` field (recommend "MIT" to match parent repo)
  - Add `"repository"` field pointing to the separate repo
  - Add `"homepage"` and `"bugs"` fields
  - Add `"author"` and `"maintainers"` fields

### 2. Build & Distribution
- [ ] Create a separate build pipeline for the package:
  - Root `tsconfig.json` should compile only `packages/financial-eligibility-journey/src/**/*.ts`
  - Set `"outDir"` to `"dist"` (not shared public folder)
  - Generate ESM and optionally CommonJS builds
  - Generate TypeScript declarations (`.d.ts`)
- [ ] Update `"exports"` field in package.json to point to dist folder instead of public
- [ ] Configure `.npmignore` or `"files"` field to ship only necessary files (src/, dist/, package.json, README, LICENSE)

### 3. Dependencies & Peer Dependencies
- [ ] Review and finalize `peerDependencies`:
  - Currently: `@ministryofjustice/hmpps-forge` and `express-session`
  - Ensure version ranges are appropriate for consumers
- [ ] Populate `"dependencies"` if any are needed (currently empty)
- [ ] Document minimum Node.js version (currently 25.0.0)

### 4. Documentation
- [ ] Create a comprehensive `packages/financial-eligibility-journey/README.md`:
  - Usage example showing how to import and register with Forge
  - List of exported types and interfaces
  - Configuration options (e.g., template name, path prefix)
  - API reference for effects (LoadDraftAnswers, SaveDraftAnswers, ClearDraftAnswers)
  - Session type expectations (FinancialEligibilitySession)
- [ ] Add `CHANGELOG.md` documenting releases
- [ ] Add `LICENSE` file (copy from parent repo)

### 5. Code Quality & Testing
- [ ] Set up unit tests for journey package in separate test suite
- [ ] Add integration tests showing Forge registration and package behavior
- [ ] Ensure linting passes with strict rules
- [ ] Document test setup for consumers

### 6. Type Safety & Contracts
- [ ] Export all public types and interfaces in index.ts:
  - `FinancialEligibilityEffectShape`
  - `FinancialEligibilityEffects`
  - `FinancialEligibilitySession`
  - `FinancialEligibilityEffectContext`
- [ ] Create a `types/index.d.ts` for consumers who import from dist
- [ ] Document any breaking changes or version compatibility notes

### 7. Release & Publishing
- [ ] Add GitHub Actions or CI/CD workflow for:
  - Running tests on pull requests
  - Automated versioning and changelog generation
  - Publishing to npm registry on tag/release
- [ ] Set up npm publish credentials for GitHub Actions
- [ ] Create release checklist in separate repo (update version, changelog, tag)

### 8. Integration Pattern
- [ ] Document in separate repo how host applications import and use the package:
  ```typescript
  import feedbackPackage from '@ministryofjustice/financial-eligibility-journey'
  forge.registerPackage(feedbackPackage)
  ```
- [ ] Note any configuration assumptions (e.g., session structure, template locations in host app)

### 9. Versioning Strategy
- [ ] Decide on semver approach:
  - Major: Breaking changes to Forge API integration or effects shape
  - Minor: New effects or journey steps
  - Patch: Bug fixes and documentation
- [ ] Plan deprecation strategy if journey steps or effects need to change

### 10. Backward Compatibility
- [ ] If this package will be used by multiple teams/repos:
  - Maintain compatibility across versions for at least one minor/major release
  - Document breaking changes clearly in CHANGELOG
  - Consider providing migration guides for breaking updates

## Pre-Extraction Checklist
- [ ] All steps above reviewed and understood
- [ ] Team alignment on ownership and maintenance
- [ ] Decision made on npm organization (@ministryofjustice)
- [ ] Initial version number decided (e.g., 0.1.0-alpha.0 → 0.1.0)
- [ ] Target release date or milestone identified
