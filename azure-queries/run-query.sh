#!/usr/bin/env bash
set -euo pipefail

: "${APP_ID:?APP_ID environment variable must be set}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Parse an optional --csv=<path> flag out of the args, wherever it appears,
# leaving the remaining args as the usual positional ones.
CSV_FILE=""
POSITIONAL=()
for arg in "$@"; do
  if [[ "$arg" == --csv=* ]]; then
    CSV_FILE="${arg#--csv=}"
  else
    POSITIONAL+=("$arg")
  fi
done
set -- "${POSITIONAL[@]:-}"

QUERY_FILE="${1:?Usage: ./run-query.sh <path-to-kql-file> [lookback-days, e.g. 0d, 1d, 7d] [operation-ids, comma-separated] [--csv=<output-path>]}"
LOOKBACK_DAYS="${2:-0d}"
OPERATION_IDS="${3:-}"
REQUEST_FILE="$SCRIPT_DIR/request.json"
RESULT_FILE="$SCRIPT_DIR/result.json"

# Substitute __LOOKBACK_DAYS__ placeholder (if present) with the value passed
# in as the second arg, defaulting to 0d. Files without the placeholder are
# unaffected.
QUERY=$(sed "s/__LOOKBACK_DAYS__/${LOOKBACK_DAYS}/g" "$QUERY_FILE")

# Substitute __OPERATION_IDS__ placeholder (if present) with a quoted,
# comma-separated list built from the third arg, e.g. "id1, id2" becomes
# "id1","id2" for use inside a KQL dynamic([...]) array (whitespace around
# each id is trimmed so "id1, id2" and "id1,id2" behave the same). Files
# without the placeholder, or invocations without a third arg, are
# unaffected.
if [[ -n "$OPERATION_IDS" ]]; then
  QUOTED_OPERATION_IDS=$(echo "$OPERATION_IDS" | tr ',' '\n' | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' -e 's/^\(.*\)$/"\1"/' | paste -sd, -)
  QUERY=$(echo "$QUERY" | sed "s/__OPERATION_IDS__/${QUOTED_OPERATION_IDS}/g")
fi

# Fail fast with a clear error if the query still requires operation-ids
# (i.e. the placeholder is present) but none were supplied, rather than
# sending invalid KQL (with a literal "__OPERATION_IDS__" token) to
# Application Insights.
if [[ "$QUERY" == *"__OPERATION_IDS__"* ]]; then
  echo "Error: $QUERY_FILE requires a comma-separated operation-ids arg (third positional arg), but none was provided." >&2
  exit 1
fi

token=$(az account get-access-token \
  --resource https://api.applicationinsights.io \
  --query accessToken \
  -o tsv)

jq -nc --arg query "$QUERY" '{query: $query}' > "$REQUEST_FILE"

http_status=$(curl -sSL -o "$RESULT_FILE" -w "%{http_code}" \
  -H "Authorization: Bearer $token" \
  -H "Content-Type: application/json" \
  --data @"$REQUEST_FILE" \
  "https://api.applicationinsights.io/v1/apps/$APP_ID/query")

if [[ "$http_status" -lt 200 || "$http_status" -ge 300 ]]; then
  echo "Application Insights query failed with HTTP status $http_status"
  if jq -e '.error' "$RESULT_FILE" > /dev/null 2>&1; then
    jq '.error' "$RESULT_FILE"
  elif [[ -s "$RESULT_FILE" ]]; then
    cat "$RESULT_FILE"
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

if [[ -n "$CSV_FILE" ]]; then
  jq -r '
    .tables[0] as $table |
    ($table.columns | map(.name)) as $columns |
    [$columns] + $table.rows
    | .[]
    | @csv
  ' "$RESULT_FILE" > "$CSV_FILE"
  echo
  echo "Wrote CSV (with header row) to $CSV_FILE"
fi
