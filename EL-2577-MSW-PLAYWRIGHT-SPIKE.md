# MSW + Playwright Integration Spike for MCC

## Objective

Investigate Playwright and MSW (Mock Service Worker) as a solution for full end-to-end testing of the Manage Your Civil Cases (MCC) application.

## Background

This spike aims to evaluate whether MSW can effectively mock API responses during Playwright E2E tests, allowing us to test the frontend behavior independently of backend services while maintaining realistic test scenarios.

## Investigation Progress

### Phase 1: MSW Installation and Basic Verification ✅

#### 1.1 Installing MSW

MSW was already present in the project dependencies, so no additional installation was required.

**Verify MSW installation:**
```bash
yarn list msw
```

**MSW CLI commands available:**
```bash
yarn msw --help
# Shows: init command for browser-based MSW setup
```

#### 1.2 Basic MSW Operation Verification

**Objective:** Verify that MSW can intercept network requests and return mock responses.

**Approach:** Create a standalone Node.js script to test MSW in isolation, separate from Playwright complexity.

**Implementation:**

Created `test-msw-standalone.mjs` with the following key components:

```javascript
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Handlers with FULL URLs (critical for interception)
const handlers = [
  http.get('http://localhost:3000/api/health', () => {
    console.log('🎯 MSW intercepted /api/health request!');
    return HttpResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      source: 'MSW Mock Server',
      message: 'MSW is working correctly!'
    });
  })
];

// Server setup
const server = setupServer(...handlers);
server.listen({ onUnhandledRequest: 'warn' });
```

**Test Execution:**
```bash
node test-msw-standalone.mjs
```

**Results:**
- ✅ MSW server starts successfully
- ✅ Request interception works correctly  
- ✅ Mock responses returned as expected
- ✅ Console output confirms interception: `🎯 MSW intercepted /api/health request!`

**Key Findings:**

1. **Full URL Required**: MSW handlers must use complete URLs (`http://localhost:3000/api/health`) not relative paths (`/api/health`) for proper interception
2. **Same Process Interception**: MSW successfully intercepts `fetch()` calls within the same Node.js process
3. **Logging Capability**: MSW provides clear visibility into which requests are intercepted
4. **JSON Response Handling**: Mock responses are properly formatted and accessible

**Test Output:**
```
🚀 Starting MSW server...
✅ MSW server is running and ready to intercept requests!

🧪 Testing MSW from within the same process...
🎯 MSW intercepted /api/health request!
✅ Internal test successful: {
  status: 'ok',
  timestamp: '2025-08-19T09:06:01.294Z',
  source: 'MSW Mock Server', 
  message: 'MSW is working correctly!'
}
```

## Next Steps

### Phase 2: Playwright Integration (To be investigated)
- [ ] Integrate MSW with Playwright test lifecycle
- [ ] Test browser-based request interception
- [ ] Evaluate setup/teardown patterns
- [ ] Performance impact assessment

### Phase 3: MCC-Specific Implementation (To be investigated)
- [ ] Mock existing MCC API endpoints
- [ ] Test complex user journeys with mocked data
- [ ] Evaluate test data management strategies
- [ ] Compare with current testing approach

## Technical Notes

### MSW Architecture
- **Node.js Mode**: Intercepts requests at the network level within the Node.js process
- **Browser Mode**: Uses Service Workers for browser-based interception
- **Handler Pattern**: Declarative request/response mapping

### Current Limitations Identified
- URL pattern matching requires careful configuration
- Integration with Playwright test lifecycle needs investigation
- Performance impact on test execution time unknown

## Files Created

- `test-msw-standalone.mjs` - Standalone MSW verification script
- `EL-2577-MSW-PLAYWRIGHT-SPIKE.md` - This documentation

## Dependencies

- MSW: Already installed in project
- Node.js: v24.4.1 (ES modules support required)
- Fetch API: Available in Node.js for testing

---

**Status**: Phase 1 Complete ✅  
**Next Review**: After Playwright integration investigation
