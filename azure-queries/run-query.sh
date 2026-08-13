#!/usr/bin/env bash
set -euo pipefail

: "${APP_ID:?APP_ID environment variable must be set}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

QUERY_FILE="${1:?Usage: ./run-query.sh <path-to-kql-file>}"
REQUEST_FILE="$SCRIPT_DIR/request.json"
RESULT_FILE="$SCRIPT_DIR/result.json"

QUERY=$(cat "$QUERY_FILE")

token=$(az account get-access-token \
  --resource https://api.applicationinsights.io \
  --query accessToken \
  -o tsv)

jq -nc --arg query "$QUERY" '{query: $query}' > "$REQUEST_FILE"

if ! curl --fail-with-body -sSL \
  -H "Authorization: Bearer $token" \
  -H "Content-Type: application/json" \
  --data @"$REQUEST_FILE" \
  "https://api.applicationinsights.io/v1/apps/$APP_ID/query" \
  > "$RESULT_FILE"; then
  if jq -e '.error' "$RESULT_FILE" > /dev/null 2>&1; then
    echo "Application Insights query failed:"
    jq '.error' "$RESULT_FILE"
  else
    echo "Application Insights query failed."
    if [[ -s "$RESULT_FILE" ]]; then
      cat "$RESULT_FILE"
    fi
  fi
  exit 1
fi

if jq -e '.error' "$RESULT_FILE" > /dev/null; then
  echo "Application Insights query failed:"
  jq '.error' "$RESULT_FILE"
  exit 1
fi

jq '{
  columns: (.tables[0].columns | map(.name)),
  rowCount: (.tables[0].rows | length)
}' "$RESULT_FILE"

count=$(jq -r '.tables[0].rows | length // 0' "$RESULT_FILE")

echo "Found $count results."
echo

# Print results as a pretty-printed, aligned table using whichever columns the query returns
jq -r '
  .tables[0] as $table |
  ($table.columns | map(.name)) as $columns |
  [$columns] + $table.rows
  | map(
      map(tostring) | join("|")
    )
  | .[]
' "$RESULT_FILE" | column -t -s '|'
