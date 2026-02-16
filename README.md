#  Manage a Supervision UI

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=ministryofjustice_hmpps-manage-a-supervision-ui&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=ministryofjustice_hmpps-manage-a-supervision-ui)

[![Repository Standards](https://img.shields.io/badge/dynamic/json?color=blue&logo=github&label=MoJ%20Compliant&query=%24.message&url=https%3A%2F%2Foperations-engineering-reports.cloud-platform.service.justice.gov.uk%2Fapi%2Fv1%2Fcompliant_public_repositories%2Fhmpps-manage-people-on-probation-ui)](https://operations-engineering-reports.cloud-platform.service.justice.gov.uk/public-report/hmpps-manage-people-on-probation-ui 'Link to report')

User interface for the Manage a Supervision service.

Try it out in the dev environment: https://manage-people-on-probation-dev.hmpps.service.justice.gov.uk/

## Get started

### Pre-requisites

You'll need to install:

- [Node 22.x](https://nodejs.org/en/download) - Node and nvm installation. 
- [Docker](https://www.docker.com/)
- [Latest version of Java with Homebrew](https://formulae.brew.sh/formula/openjdk#default) - Needed for wiremock

### Dependencies

Install NPM package dependencies:

```shell
npm install
```

### Run the service

```shell
# Start the UI in test mode
npm run start-feature:dev
````
Open http://localhost:3007 in your browser.

### Integrate with dev services

- Request access for 1password, on the [#ask-operations-engineering](https://moj.enterprise.slack.com/archives/C01BUKJSZD4) channel. Once access granted, create a `.env` file and copy the environmental variables from 1password to your `.env`.
- Request user access for development and test, complete the Delius User Access Request form.

```shell
npm run start:dev
```

Open http://localhost:3000 in your browser.

## Formatting

### Check formatting

`npm run lint`

### Fix formatting

`npm run lint:fix`

## Testing

### Run unit tests

`npm run test`

### Running integration tests

To run the Cypress integration tests locally:

```shell
# Start the UI in test mode
npm run start-feature:dev

# Start the UI in test with integration test coverage instrumentation
npm run start-feature

# Run the tests in headless mode:
npm run int-test

# Or, run the tests with the Cypress UI:
npm run int-test-ui
```

### Dependency Checks

The template project has implemented some scheduled checks to ensure that key dependencies are kept up to date.
If these are not desired in the cloned project, remove references to `check_outdated` job from `.circleci/config.yml`
