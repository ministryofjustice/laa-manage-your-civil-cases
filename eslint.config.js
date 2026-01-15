import globals from 'globals';
import jsdocPlugin from 'eslint-plugin-jsdoc';
import tsParser from '@typescript-eslint/parser';
import love from 'eslint-config-love';

export default [

  {
  ...love,
  },

  {
    files: ['**/*.js', '**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
  },


  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        projectService: true,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      jsdoc: jsdocPlugin,
    },
    rules: {
  
      
      'require-unicode-regexp': ['error', { requireFlag: 'u' }], // enforces unicode but allows u instead of v
      'indent': 'off',
      'linebreak-style': 'off',
      'quotes': 'off',
      'semi': 'off',
      'no-console': 'off',
      'no-param-reassign': ['error', { props: false }],
      'no-negated-condition': 'off',
      'jsdoc/check-alignment': 'error',
      'jsdoc/check-param-names': 'error',
      'jsdoc/check-tag-names': 'error',
      'jsdoc/check-types': 'error',
      'jsdoc/implements-on-classes': 'error',
      'jsdoc/newline-after-description': 'off',
      'jsdoc/no-undefined-types': 'error',
      'jsdoc/require-description': 'error',
      'jsdoc/require-jsdoc': [
        'error',
        {
          require: {
            FunctionDeclaration: true,
            MethodDefinition: true,
            ClassDeclaration: true,
            ArrowFunctionExpression: true,
            FunctionExpression: true,
          },
        },
      ],
      'jsdoc/require-param': 'error',
      'jsdoc/require-param-description': 'error',
      'jsdoc/require-param-name': 'error',
      'jsdoc/require-param-type': 'error',
      'jsdoc/require-returns': 'error',
      'jsdoc/require-returns-check': 'error',
      'jsdoc/require-returns-description': 'error',
      'jsdoc/require-returns-type': 'error',

    
      '@typescript-eslint/naming-convention': 'off',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-extraneous-class': ['error', { allowStaticOnly: true }],
      '@typescript-eslint/no-namespace': 'off', // allow namespaces for some cases
      '@typescript-eslint/triple-slash-reference': [
        'error',
        { path: 'never', types: 'prefer-import', lib: 'never' },
      ],
      '@typescript-eslint/no-empty-interface': 'off',
      '@typescript-eslint/no-var-requires': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },


  {
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-interface': 'off',
      '@typescript-eslint/no-namespace': 'off',
    },
  },

  // 5. Ignore patterns
  {
    ignores: [
      'node_modules/*',
      'public/*',
      'tests/**/*.spec.ts',
      'tests/playwright/**/*.spec.ts',
      'tests/playwright/fixtures/*',
      'tests/playwright/factories/*',
      'tests/playwright/pages/*',
      'tests/playwright/utils/*',
      'tests/playwright/playwright.config.ts',
      'tests/helpers/*',
      'docs/source/javascripts/application.js',
      'docs/source/javascripts/govuk_frontend.js',
      'eslint.config.js',
      'coverage',
      'scripts/e2e_coverage/*',
    ],
  },
];
