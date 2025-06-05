# Legal Aid Agency - Manage Your Civil Cases (MCC)
## This repository is built on the MoJ Express Frontend Skeleton
[![Standards Icon]][Standards Link]

![govuk-frontend 5.10.2](https://img.shields.io/badge/govuk--frontend%20version-5.10.2-005EA5?logo=gov.uk&style=flat)

Express.js is a fast, unopinionated, minimalist web framework for Node.js.

## Contents
- [Legal Aid Agency - Manage Your Civil Cases (MCC)](#legal-aid-agency---manage-your-civil-cases-mcc)
  - [This repository is built on the MoJ Express Frontend Skeleton](#this-repository-is-built-on-the-moj-express-frontend-skeleton)
  - [Contents](#contents)
  - [Prerequisites](#prerequisites)
  - [Getting started](#getting-started)
    - [Set local environment variables](#set-local-environment-variables)
    - [Align to the Node Version specified for this project](#align-to-the-node-version-specified-for-this-project)
    - [Install dependencies and run application for development](#install-dependencies-and-run-application-for-development)
    - [Install dependencies and run application for production](#install-dependencies-and-run-application-for-production)
      - [Node Version Manager](#node-version-manager)
  - [Routing](#routing)
  - [Testing](#testing)
    - [Unit/Integration Testing frameworks](#unitintegration-testing-frameworks)
    - [E2E Testing with Playwright](#e2e-testing-with-playwright)
      - [Running Tests Locally](#running-tests-locally)
      - [Configuration](#configuration)
      - [CI/CD Integration](#cicd-integration)
      - [Debugging Failed Tests](#debugging-failed-tests)
  - [Features](#features)
    - [Asset management](#asset-management)
    - [Cache busting](#cache-busting)
    - [Form validation](#form-validation)
    - [CSRF protection](#csrf-protection)
    - [Content Security Policy (CSP)](#content-security-policy-csp)
    - [Response compression](#response-compression)
    - [Rate limiting](#rate-limiting)
    - [Linter](#linter)
    - [Linter for staged commits](#linter-for-staged-commits)
    - [TypeScript](#typescript)
    - [Axios](#axios)
    - [Nunjucks templating](#nunjucks-templating)
    - [Project structure and source directory](#project-structure-and-source-directory)
    - [Import paths and path aliases](#import-paths-and-path-aliases)
    - [Running and debugging](#running-and-debugging)
    - [Type definitions](#type-definitions)
  - [Licence](#licence)

## Prerequisites

- node stable version [24.1.0](https://nodejs.org/en/blog/release/v24.1.0/)
- TypeScript 5.8.3

## Getting started

### Set local environment variables

Create your local config file `.env` from the template file:

```shell
cp .env.example .env
```

### Align to the Node Version specified for this project

If using Node Version Manager (nvm), use the following command to switch to the correct version:
```shell
nvm use
nvm install
```

### Install dependencies and run application for development
```shell
npm install
npm run build
npm run dev
```
Then, load http://localhost:3000/ in your browser to access the app.

### Install dependencies and run application for production
```shell
npm install
npm run build
npm run start
```

#### Node Version Manager

You may have to tell your local machine to use the latest version of node already installed on your device, before installing and running the application. Use the following command.

```shell
nvm install node
```

## Routing
This template uses the built-in Express JS routing. 

A route is a section of Express code that associates an HTTP verb (`GET`, `POST`, `PUT`, `DELETE`, etc.), with a URL path/pattern, and a function that is called to handle that pattern.

[You can find further documentation here](https://expressjs.com/en/guide/routing.html).

## Testing
There are many frameworks to test your Express.js application (a few of these frameworks will be signposted below), but you will want to split out your test suite to cover:

- Unit Tests - test individual code components to ensure each function operates as intended.
- Integration Tests - assess the coherence of the entire application, ensuring smooth interactions between various parts.
- End-to-end (E2E) Tests - assess the entire software system, from the user interface to the database.

### Unit/Integration Testing frameworks
- We use [Mocha](https://mochajs.org/) as our unit testing framework. It is a widely-used JavaScript testing framework that works well with TypeScript projects and integrates with CI pipelines.
- We also use [chai](https://www.chaijs.com/) to help with our test assertions, in mocha.
- Tests run from the `tests/` directory

**To set-up locally**
- Install all the dependencies:
```shell
npm install
```

- run unit test's:
```shell
npm run test:unit
```

### E2E Testing with Playwright
This project uses [Playwright](https://playwright.dev/) for end-to-end testing. Playwright provides reliable end-to-end testing for modern web apps.

#### Running Tests Locally

To run the E2E tests locally:

```shell
# Run all tests
npm run e2e

# Run specific test file
npx playwright test tests/e2e/specific-test.spec.ts

# Run in UI mode with Playwright Test Explorer
npx playwright test --ui
```

#### Configuration

The project uses Chromium for testing to ensure consistency with our production environment. The configuration can be found in `playwright.config.ts`.

Key configuration points:
- Tests are located in `tests/e2e/` directory
- Only Chromium browser is used for testing
- Test retries are enabled in CI environments (2 retries)
- Traces are automatically captured on test failures for debugging

#### CI/CD Integration

The tests are automatically run in our GitHub Actions workflow (`.github/workflows/playwright.yml`) during pull requests and deployments to UAT.

- The workflow installs only the Chromium browser to optimize CI runtime
- Traces are captured for all test runs in CI for easier debugging
- Test artifacts (traces, videos) are preserved for 14 days in GitHub Actions

#### Debugging Failed Tests

When tests fail in CI:
1. Check the error message in the GitHub Actions log
2. Download the trace artifacts (named `playwright-traces.zip`) from GitHub Actions
3. Extract the downloaded ZIP file - inside you'll find folders organized by test name
4. Locate the `trace.zip` file within the specific test folder you want to debug
5. Open traces using one of the following methods:

   **With local Trace Viewer:**
   ```shell
   npx playwright show-trace path/to/extracted/test-folder/trace.zip
   ```

   **With online Trace Viewer:**
   Upload the trace.zip file to https://trace.playwright.dev/ - this allows sharing traces with team members without requiring local Playwright installation

This provides a timeline view of the test execution with screenshots, DOM snapshots, and network requests to help diagnose issues.

## Features
  - [Asset management](#asset-management)
  - [Cache busting](#cache-busting)
  - [Form validation](#form-validation)
  - [CSRF protection](#csrf-protection)
  - [Content Security Policy (CSP)](#content-security-policy-csp)
  - [Response compression](#response-compression)
  - [Rate limiting](#rate-limiting)
  - [TypeScript](#typescript)
  - [Linter](#linter)
  - [Linter for staged commits](#linter-for-staged-commits)
  - [Axios](#axios)
  - [Nunjucks templating](#nunjucks-templating)

### Asset management
This project uses [ESBuild](https://esbuild.github.io/) for asset bundling and management, providing fast builds and efficient handling of JavaScript, TypeScript, and SCSS files.

### Cache busting
Caching allows Express.js applications to store and serve frequently requested data efficiently, reducing the strain on servers and minimizing latency. This template improves caching through:
- intelligent browser caching, when using the template for development of an application
- employing a package management tool, to improve the caching process of installing, upgrading, configuring, and removing software from your application

### Form validation
This template app contains a basic demo for form validation, when running this app locally. You can find further information on the validation used, by searching in the [Express documentation](https://www.npmjs.com/package/express-validator)


### CSRF protection
The template uses the [csrf-sync](https://www.npmjs.com/package/csrf-sync/v/1.0.2) middleware, to help keep your app secure.

### Content Security Policy (CSP)
This app uses [helmet.js](https://helmetjs.github.io/) to help secure this Express.js template app by setting HTTP response headers, which includes your CSP. 

### Response compression
The app uses a Node.js compression middleware called [compression](https://www.npmjs.com/package/compression). The middleware will attempt to compress response bodies for all request that traverse through the middleware, based on the given options.


### Rate limiting
This template uses a basic rate-limiting middleware for Express.js, called `express-rate-limit`. It is used to limit repeated requests to public APIs and/or endpoints such as password reset. 

For further information please [visit the documentation here](https://www.npmjs.com/package/express-rate-limit?activeTab=readme).

### Linter
ESLint is a static code analysis tool for identifying and fixing problems in JavaScript and TypeScript code. It helps maintain code quality and consistency across a project by enforcing a set of coding standards and best practices. ESLint can catch syntax errors, stylistic issues, and potential bugs before they become actual problems.

The project has TypeScript support through the `@typescript-eslint/eslint-plugin` and `@typescript-eslint/parser` packages installed as dev dependencies.

To run ESLint:

```shell
npm run lint
```

This will run ESLint on all TypeScript files in your project, ignoring the node_modules and public directories.

### Linter for staged commits
We use [husky](https://github.com/typicode/husky) & [lint-staged](https://github.com/lint-staged/lint-staged) to run ESLint on all our staged git commits. This ensures that TypeScript files are linted before they're committed to the repository.

- `husky` - helps us with our Git hooks
- `lint-staged` - helps us run a linter on our staged commits (configured in package.json to target both .js and .ts files)


**To set-up locally**
- Install all the dependencies:
```shell
npm install
```

- Initialise `husky`:
```shell
npx husky install
```

- To help debug, run the command when you have a staged commit:
```shell
npx lint-staged --debug
```

### TypeScript
This project uses TypeScript to provide static type checking, improving code quality and developer experience. TypeScript helps catch errors during development rather than at runtime and provides better IDE support through enhanced autocompletion and navigation.

The TypeScript configuration is defined in `tsconfig.json` with the following key settings:
- Target: ES2022
- Module System: NodeNext
- Strict Type Checking: Enabled
- Source Maps: Generated for debugging

To compile TypeScript files:
```shell
npm run build:ts
```

To run type checking without emitting files:
```shell
npm run tsc
```

### Axios
Within this template [axios](https://github.com/axios/axios) with [middleware-axios](https://github.com/krutoo/middleware-axios) (used as a utility `../utils/axiosSetup.ts`, and can be extended with further middleware) is set up and ready to use out of the box.

Below is an example of implementation of how to use the Axios middleware in your TypeScript routes to make server/API calls:

```typescript
// routes/index.ts
import express, { Request, Response, NextFunction } from 'express';
const router = express.Router();

/* GET home page. */
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  res.render('main/index', { title: 'Express' });
});

// Make an API call with `Axios` and `middleware-axios`
// GET users from external API
router.get('/users', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Use the wrapped Axios instance attached to the request object (via middleware-axios)
    const response = await req.axiosMiddleware.get('https://jsonplaceholder.typicode.com/users');
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

export default router;
```

### Nunjucks templating
This project uses [Nunjucks](https://mozilla.github.io/nunjucks/) for server-side HTML templating. You can render Nunjucks templates from your TypeScript route handlers just as you would from JavaScript. Templates are located in the `views/` directory and are compatible with both JS and TS backends.

### Project structure and source directory
- Project-specific TypeScript code should go in `src/scripts/`.
- Other source TypeScript files are located in `src/`, `middleware/`, `routes/`, and `utils/`.
- Compiled JavaScript output is placed in the `public/` directory.
- Do not edit files in `public/` directly; always edit the `.ts` source files.

### Import paths and path aliases
- The project uses path aliases (see `tsconfig.json`), such as `import foo from '#utils/foo'`.
- Ensure your editor/IDE is configured to recognize these aliases for best developer experience.

### Running and debugging
- The app is started using the compiled JS in `public/` (see `npm run dev` and `npm run start`).
- If you want to run TypeScript directly (e.g., for debugging), consider using `ts-node` or a similar tool, but this is not the default workflow.

### Type definitions
- Type definitions for Node, Express, and other dependencies are included as dev dependencies (see `@types/*` packages in `package.json`).
- These are required for type safety and improved autocompletion in TypeScript.

## Licence

[Licence](./LICENSE)

[Standards Link]: https://operations-engineering-reports.cloud-platform.service.justice.gov.uk/public-report/govuk-frontend-express "Change this to point at your repo. Also needs changing in the url in the icon below."
[Standards Icon]: https://img.shields.io/endpoint?labelColor=231f20&color=005ea5&style=for-the-badge&label=MoJ%20Compliant&url=https%3A%2F%2Foperations-engineering-reports.cloud-platform.service.justice.gov.uk%2Fapi%2Fv1%2Fcompliant_public_repositories%2Fendpoint%2Fgovuk-frontend-express&logo=data:image/png;base64,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