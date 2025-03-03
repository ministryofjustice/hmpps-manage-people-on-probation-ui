import { defineConfig } from 'cypress'

import stubs from './wiremock/stubs'

export default defineConfig({
  chromeWebSecurity: false,
  fixturesFolder: 'integration_tests/fixtures',
  screenshotsFolder: 'integration_tests/screenshots',
  videosFolder: 'integration_tests/videos',
  reporter: 'cypress-multi-reporters',
  reporterOptions: {
    configFile: 'reporter-config.json',
  },
  taskTimeout: 60000,
  numTestsKeptInMemory: 20,
  experimentalMemoryManagement: true,
  e2e: {
    baseUrl: 'http://localhost:3007',
    excludeSpecPattern: '**/!(*.cy).ts',
    specPattern: 'integration_tests/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'integration_tests/support/index.ts',
    setupNodeEvents: (on: (string, Record) => void): void => {
      on('task', {
        ...stubs,
      })
    },
  },
})
