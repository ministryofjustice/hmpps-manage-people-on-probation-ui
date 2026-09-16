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

### Local request/route logging

In development (`NODE_ENV=development`), the app logs one `request received`
and one `request completed` debug line per request (see
`server/middleware/requestLogger.ts`), skipping static assets (`/assets/*`,
`/favicon.ico`). The completed line includes a `handlers` array - the full,
correctly-ordered chain of middleware and controllers that actually ran for
that request, including handlers from `router.all()`/`router.use()` calls
that Express's own `req.route.stack` would miss (see
`server/middleware/instrumentRouter.ts` for how this is captured).

This logging can be disabled by setting `DISABLE_DEV_REQUEST_LOGGING=true`.
It's set this way in `feature.env` and `docker-compose-feature-dev.yml`
(used by `npm run start-feature`/`start-feature:dev` and Cypress/CI runs),
since Cypress fires many rapid automated requests and the verbose handler
logging would flood test output there for no benefit. If you don't see these
log lines locally, check this isn't set in your environment.

Each entry is formatted as `<registrationMethod>:<name>`, e.g:

- `use:session` - registered via `app.use(...)` or `router.use(...)`
- `all:getSentences` - registered via `router.all(...)` (runs for every HTTP method on that path)
- `get:forceValidation` / `post:checkAnswers` - registered via `router.get(...)` / `router.post(...)` (runs only for that HTTP method)

This prefix reflects how the handler was *registered*, not the HTTP method of
the incoming request (that's the separate top-level `method` field). Handlers
with no function name (common with factory-pattern middleware/controllers,
e.g. `(dep) => (req, res, next) => {...}`) show as `unnamed#<position>`
instead - name the inner function to get a real name in the log.

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

Alternatively, open `waf-logs/audit.log` directly in your IDE and use find/search for the same terms (e.g. "against variable `ARGS`", "ruleId", "Matched Data:").

You can also tail the log while reproducing the request:

```shell
tail -f waf-logs/audit.log
```

## Running Azure query locally

### Pre-requisites

Install:

- Azure CLI
- jq
- curl

MacOS:

```bash
brew install azure-cli jq curl
```

### Azure login: complete 2-factor authentication and then pick subscription if prompted

```bash
az login
```

### Set application ID, get value from Application Insights

Find the App ID for the relevant Application Insights resource either via the Azure Portal (resource **Overview** page, or **Configure → API Access**) or the Azure CLI:

```bash
# lists all Application Insights resources you have access to, with their App IDs
az monitor app-insights component show \
  --query "[].{name:name, resourceGroup:resourceGroup, appId:appId}" \
  -o table
```

If prompted to install the `application-insights` CLI extension, accept (`Y`), or avoid the prompt in future with:

```bash
az config set extension.use_dynamic_install=yes_without_prompt
```

Then export the App ID:

```bash
export APP_ID="<application-insights-app-id>"
```

### Set application ID (fish shell), get value from Application Insights

```bash
set -x APP_ID "<application-insights-app-id>"
```

### Execute query and output to console

This runs the same count query used by the scheduled Slack report (`.github/workflows/reports.yml`), which reads directly from this `.kql` file:

```bash
cd azure-queries
./run-query.sh service-unavailable-page-views.kql
```

Both this query and the investigation query below take an optional lookback-days arg selecting a
single, complete local day, N days back from today: `0d` = today, `1d` = yesterday (the default
used by the scheduled report), `7d` = the single day exactly a week ago (not a rolling 7-day
window). Defaults to `0d` when run manually via `run-query.sh` without this arg:

```bash
./run-query.sh service-unavailable-page-views.kql 7d
```

For investigating individual occurrences (timestamp, user ID, operation ID and page path), run the investigation query instead:

```bash
cd azure-queries
./run-query.sh service-unavailable-page-views-investigation.kql
```

### Export results as CSV

`run-query.sh` writes the raw Application Insights response to `azure-queries/result.json`. Pass
`--csv=<path>` (in any position, alongside the other args) to have it also write a CSV (with a
header row) in one go — no separate `jq` step needed:

```bash
cd azure-queries
./run-query.sh service-unavailable-page-views-investigation.kql --csv=results.csv
```

Or, if you'd rather do it manually / need a different shape, run the query first and then pipe
`result.json` through `jq` yourself:

```bash
cd azure-queries
./run-query.sh service-unavailable-page-views-investigation.kql
jq -r '.tables[0].rows[] | @csv' result.json > results.csv
```

### Investigating exceptions and cross-service tracing

All services share a single Application Insights instance, differentiated only by
`cloud_RoleName` — so a single `APP_ID` and a single query already returns telemetry for every
service sharing an `operation_Id`, no need to switch resources.

`ui-exceptions-trace.kql` finds exceptions raised by the UI and lists the affected `operation_Id`
(trace id) values, and `cross-service-operation-trace.kql` shows a clean, chronologically-ordered
timeline for those trace ids using `union` across item types (like a one-off Application Insights
GUI query) rather than joining tables — joining fans out into many duplicate-looking rows, because
a single trace can contain dozens of spans (this app uses OpenTelemetry auto-instrumentation,
which records every internal middleware/function call as well as real outbound HTTP calls). Both
support optional positional args passed to `run-query.sh`: a lookback window (defaults to `0d`,
i.e. today only) and, for the trace query, a comma-separated list of `operation_Id` values. Add
`--csv=<path>` to export the results as CSV at the same time.

1. Run the finder query and note the `operation_Id` values in the results:

   ```bash
   cd azure-queries
   ./run-query.sh ui-exceptions-trace.kql --csv=results.csv
   ```

2. Run the trace query, passing those `operation_Id` values, to see the full cross-service
   timeline in one go:

   ```bash
   ./run-query.sh cross-service-operation-trace.kql 0d <op-id-1>,<op-id-2>,<op-id-3> --csv=trace.csv
   ```

   Filter/group the CSV by `cloud_RoleName` to see each service's side of the trace, so you can
   tell whether a downstream service completed the request successfully (issue is on the network
   path between services), never received it, or failed itself.
