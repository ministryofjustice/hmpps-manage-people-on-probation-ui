import hmppsConfig from '@ministryofjustice/eslint-config-hmpps'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'

export default [
  {
    ignores: [
      'playwright-report/**',
      '.zap/**',
      'instrumented/**',
      'server/views/_components/govuk/**',
      'server/views/_components/x-govuk/**',
      'assets/js/index.js',
    ],
  },
  ...hmppsConfig({
    extraPathsAllowingDevDependencies: ['e2e_tests/**', 'playwright.config.ts'],
    extraFrontendGlobals: { $: 'readonly', MOJFrontend: 'readonly' },
  }),
  {
    name: 'overrides',
    files: ['**/*.ts'],
    ignores: ['**/*.js'],
    plugins: {
      '@typescript-eslint': typescriptEslint,
    },
    languageOptions: {
      parser: tsParser,
    },
    rules: {
      // TODO remove these overrides and fix the issues:
      '@typescript-eslint/no-unused-vars': 0,
      '@typescript-eslint/no-explicit-any': 0,
      'import/prefer-default-export': 0,
      'import/no-unresolved': 'error',
      'import/no-relative-packages': 'off',
    },
  },
]
