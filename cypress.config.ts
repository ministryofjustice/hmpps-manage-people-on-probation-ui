import fs from 'fs'
import { defineConfig } from 'cypress'
import dotenv from 'dotenv'
import coverageTask from '@cypress/code-coverage/task'
import stubs from './wiremock/stubs'

// Read directly from feature.env rather than process.env: the app itself is started with
// `node --env-file=feature.env`, a separate process whose environment isn't inherited by
// whatever shell later runs Cypress (locally or in CI), so process.env can't be relied on here.
const featureEnv = fs.existsSync('feature.env') ? dotenv.parse(fs.readFileSync('feature.env')) : {}

export default defineConfig({
  chromeWebSecurity: false,
  fixturesFolder: 'integration_tests/fixtures',
  screenshotsFolder: 'test_results/screenshots',
  videosFolder: 'test_results/videos',
  reporter: 'cypress-multi-reporters',
  reporterOptions: {
    configFile: 'reporter-config.json',
  },
  video: true,
  screenshotOnRunFailure: true,
  taskTimeout: 60000,
  numTestsKeptInMemory: 20,
  experimentalMemoryManagement: true,
  e2e: {
    setupNodeEvents(on, config) {
      coverageTask(on, config)
      on('task', {
        ...stubs,
        log(message) {
          // eslint-disable-next-line no-console
          console.log(message)
          return null
        },
      })
      return {
        ...config,
        env: { ...config.env, TIER_CHANGE_PROMPT_WINDOW_DAYS: featureEnv.TIER_CHANGE_PROMPT_WINDOW_DAYS },
      }
    },
    baseUrl: 'http://localhost:3007',
    excludeSpecPattern: '**/!(*.cy).ts',
    specPattern: 'integration_tests/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'integration_tests/support/index.ts',
    experimentalRunAllSpecs: true,
    env: {
      codeCoverage: {
        url: 'http://localhost:3007/__coverage__',
      },
    },
    retries: {
      runMode: 1,
    },
  },
})
