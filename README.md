# Manage a Supervision UI

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
npm run setup
```

If this fails run `npm install` first to ensure package-lock.json is inline with package.json


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

### Docker compose

There are two Docker Compose files in this repository:

- `docker-compose.yml` - builds and runs the app image alongside a WAF (ModSecurity) container in front of it, using your local `.env` file (dev credentials, connected to the real dev backend/downstream services that all test users share). **If you need to test WAF rules using copies of real production note data (e.g. to reproduce a 406 response), if a request passes the WAF rules it will be saved to the real dev backend.** Only use test data here, never real production data, to avoid persisting it anywhere.
- `docker-compose-feature-dev.yml` - runs the app in feature/test mode against Wiremock stubs, alongside a WAF container. There is no real backend involved, so nothing is ever saved, even if a request passes the WAF rules - this is the **safe option** for testing WAF rules with copies of real production note data.

To build and run the app with the WAF:

```shell
docker compose up --build
```

Open http://localhost:8080 to hit the app through the WAF (the app itself runs on http://localhost:3000).

To run the feature/test setup (Wiremock + app + WAF) locally:

```shell
docker compose -f docker-compose-feature-dev.yml up --build
```

Open http://localhost:8081 to hit the app through the WAF (the app itself runs on http://localhost:3007).

Stop and remove containers for either setup with:

```shell
docker compose down
# or
docker compose -f docker-compose-feature-dev.yml down
```

#### Checking WAF audit logs

When testing the WAF, ModSecurity audit logs are written to `./waf-logs` (this directory is git-ignored, so logs won't be committed). The main log file is `./waf-logs/audit.log`.

To find out why a request was blocked, search the log for the relevant rule and matched data, for example:

```shell
# Find which variable/argument triggered a rule
grep "against variable \`ARGS" waf-logs/audit.log

# Find a specific rule id
grep "ruleId" waf-logs/audit.log

# Find what data actually matched the rule
grep "Matched Data:" waf-logs/audit.log
```

Alternatively, open `waf-logs/audit.log` directly in your IDE and use find/search for the same terms (e.g. `` against variable `ARGS` ``, `ruleId`, `Matched Data:`).

You can also tail the log while reproducing the request:

```shell
tail -f waf-logs/audit.log
```
