# MSW + Playwright Integration Spike for MCC

## Objective

Investigate MSW (Mock Service Worker) and Playwright integration for full end-to-end testing of the Manage Your Civil Cases (MCC) application, enabling testing of frontend behavior with mocked API responses.

## Summary

**Result: ✅ SUCCESSFUL** - MSW + Playwright integration fully functional for intercepting outbound API calls from Express server-side rendered application.

## Key Architectural Challenge

Unlike typical MSW examples that mock **inbound requests** to web servers, our use case required intercepting **outbound requests** from our Express server to external APIs. Standard Playwright + MSW patterns use browser Service Workers, but we needed Node.js process-level HTTP interception.

## Implementation Phases

### Phase 1: Initial Working Implementation ✅

**Commit Reference:** [working-version-0.1](https://github.com/ministryofjustice/laa-manage-your-civil-cases/releases/tag/working-version-0.1) 

Initial integration where MSW was embedded directly in the Express application startup. This proved the concept worked but mixed test concerns with application code.

**Key learnings:**
- MSW `setupServer()` successfully intercepts Node.js HTTP calls  
- Express server-side API calls can be transparently mocked
- Real API URLs (`https://laa-civil-case-api-uat.cloud-platform.service.justice.gov.uk`) get intercepted without Express knowing

### Phase 2: Clean Architecture Implementation ✅

**Current Implementation**

Separated MSW patching from Express application to achieve clean architecture:

```javascript
// scripts/test-server-with-msw.js
// STEP 1: Patch Node.js HTTP modules with MSW (test-only)
const mswServer = setupServer(...apiHandlers);
mswServer.listen({ onUnhandledRequest: 'warn' });

// STEP 2: Start unchanged Express application  
const { default: createApp } = await import('../src/app.js');
const app = createApp();
app.listen(port);
```


**Architectural Decision:** We chose Node.js process patching over typical MSW browser patterns because our Express server-side rendered application requires intercepting **outbound** API calls, not **inbound** requests. This approach provides transparent API mocking without modifying the Express application.

**Architecture Benefits:**
- ✅ **Express stays clean** - No test code in production application
- ✅ **MSW only during tests** - Playwright webServer invokes MSW script
- ✅ **Transparent interception** - Express makes normal API calls, MSW intercepts at Node.js level
- ✅ **Zero configuration changes** - No environment detection in Express

## Technical Architecture

### Request Flow
```
Playwright Test → Express Server → apiService.getClientDetails()
     ↓                 ↓                        ↓
Browser Request → MSW Intercepts → Real API URL
     ↓                 ↓                        ↓  
Test Assertion ← JSON Response ← Mock Data
```

### Key Components

**Test Server Script** (`scripts/test-server-with-msw.js`):
- Patches Node.js HTTP stack before Express starts
- Only runs during Playwright test execution
- Express application remains completely unaware of MSW

**Playwright Configuration**:
```typescript
webServer: {
  command: 'yarn tsx scripts/test-server-with-msw.js',
  url: 'http://127.0.0.1:3001',
  env: { NODE_ENV: 'test', PORT: '3001' }
}
```

**MSW Handlers** (`tests/e2e/mocks/handlers/api.ts`):
```javascript
http.get('https://laa-civil-case-api-uat.cloud-platform.service.justice.gov.uk/latest/mock/cases/:caseReference', 
  () => HttpResponse.json({ 
    fullName: 'MSW Test Client',
    phoneNumber: '+44 7700 900123' 
  })
)
```

## Validation Test Results

**End-to-end test successfully proves MSW interception:**

```bash
yarn test:e2e tests/e2e/msw-test.spec.ts
```

**Test verifies:**
- ✅ Navigation to real application route (`/cases/PC-1922-1879/client-details`)
- ✅ Express server makes API calls to real external URLs  
- ✅ MSW intercepts and returns mock client data
- ✅ Mock data ("MSW Test Client") displays in rendered HTML
- ✅ No external API dependencies in test execution

## Production Benefits

**Clean Separation:**
- Development: `yarn start` → Clean Express, real API calls
- Testing: Playwright → MSW-patched Express → Intercepted API calls
- Production: Unchanged Express deployment

**Performance & Reliability:**
- **Speed**: Instant mock responses vs network latency
- **Isolation**: Tests independent of external API availability
- **Flexibility**: Full control over API response scenarios
- **Deterministic**: Consistent test data across runs

## Implementation Files

**Required for MSW Integration:**
- `scripts/test-server-with-msw.js` - Test server with MSW patching
- `tests/e2e/mocks/handlers/api.js` - MSW request handlers
- `tests/e2e/msw-test.spec.ts` - Validation test
- `playwright.config.ts` - Updated webServer configuration

**Status:** Ready for MCC E2E testing implementation.

## Approach Comparison

### vs. Non-Playwright E2E Tests with Test Doubles

**Current Test Architecture:**
- Controller tests use Jest with test doubles for API service mocking
- Validation tests mock `apiService.getClientDetails()` at the service layer
- Fast unit-level testing with isolated components

**MSW + Playwright Advantages:**
- ✅ **Full browser rendering** - Tests actual HTML output, CSS interactions, JavaScript behavior
- ✅ **Complete request flow** - HTTP requests go through full Express middleware stack
- ✅ **Real API URLs** - Tests actual network calls rather than service layer abstractions
- ✅ **User interaction testing** - Click events, form submissions, navigation flows
- ✅ **Visual regression potential** - Could extend to screenshot comparisons

**MSW + Playwright Trade-offs:**
- ❌ **Slower execution** - Browser startup overhead vs in-memory test doubles
- ❌ **More complex setup** - Multiple processes (Playwright + Express + MSW) vs single Jest process
- ❌ **Higher resource usage** - Full browser instances vs lightweight mocks

**Recommendation:** Complementary approaches
- **Controller tests** - Continue with Jest + test doubles for validation logic, edge cases, error handling
- **E2E tests** - Use MSW + Playwright for critical user journeys, integration flows

### vs. Network Layer Interception

**Alternative: HTTP Proxy/Middleware Approach**
```javascript
// Hypothetical network proxy
app.use('/api/*', (req, res, next) => {
  if (process.env.NODE_ENV === 'test') {
    return mockApiResponse(req, res);
  }
  next(); // Forward to real API
});
```

**Network Proxy Advantages:**
- ✅ **Simpler mental model** - Traditional middleware pattern
- ✅ **Express-native** - Uses familiar Express routing concepts
- ✅ **Explicit configuration** - Clear test/production branching

**MSW Advantages:**
- ✅ **Zero Express modification** - No test code in production application
- ✅ **External API URLs** - Intercepts real URLs without routing changes
- ✅ **Industry standard** - MSW widely adopted for API mocking
- ✅ **Request/response transparency** - Handlers mirror actual API contracts
- ✅ **Development isolation** - MSW doesn't affect normal `yarn start`

### CI Pipeline Implications

**Current CI Architecture:**
- Jest controller tests run in parallel
- Fast feedback loop for validation logic
- No external dependencies

**MSW + Playwright Integration:**
- ✅ **Deterministic** - No external API calls, consistent test data
- ✅ **Parallel execution** - Multiple Playwright workers supported
- ✅ **Artifact generation** - HTML reports, screenshots, traces for debugging
- ❌ **Increased build time** - Browser setup overhead
- ❌ **Resource requirements** - Higher memory/CPU usage for browser instances

**CI Strategy Recommendation:**
```yaml
# Proposed CI pipeline structure
test-unit:
  - Jest controller tests (validation, error handling, business logic)
  - Fast feedback, high coverage
  
test-integration:  
  - MSW + Playwright E2E tests (critical user journeys)
  - Run on feature branches and main
  - Generate visual artifacts for debugging
```

### Validation Test Case Analysis

**Current Validation Tests:**
- Client details validation (required fields, format checking)
- Phone number validation (format, length, special cases)
- Date of birth validation (age restrictions, format validation)

**MSW + Playwright Benefits for Validation:**
- ✅ **Full form interaction** - Tests actual form submission, error display, user experience
- ✅ **Server-side validation** - Tests Express middleware validation stack
- ✅ **Error message rendering** - Verifies error messages appear correctly in UI
- ✅ **Browser validation** - Tests HTML5 validation, JavaScript form enhancement

**Example E2E Validation Test:**
```javascript
test('phone number validation displays appropriate error messages', async ({ page }) => {
  await page.goto('/cases/PC-1922-1879/edit-phone-number');
  
  // Test invalid phone number
  await page.fill('[name="phoneNumber"]', 'invalid');
  await page.click('button[type="submit"]');
  
  // Verify error message appears
  await expect(page.locator('.error-message')).toContainText('Enter a valid UK phone number');
  
  // Verify API not called with invalid data
  // MSW would log any unexpected API calls
});
```

**Complementary Testing Strategy:**
1. **Unit tests** - Validation logic, edge cases, error conditions
2. **Controller tests** - Middleware integration, request/response handling  
3. **E2E tests** - Critical user journeys, form interactions, error display

This layered approach provides comprehensive coverage while maintaining fast feedback loops and manageable CI execution times.

---

