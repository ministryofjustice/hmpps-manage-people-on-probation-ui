#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT=${1:-dev}

case "$ENVIRONMENT" in
  dev)
    NAMESPACE="hmpps-manage-people-on-probation-dev"
    SIGN_IN_URL="https://sign-in-dev.hmpps.service.justice.gov.uk"
    ;;
  preprod)
    NAMESPACE="hmpps-manage-people-on-probation-preprod"
    SIGN_IN_URL="https://sign-in-preprod.hmpps.service.justice.gov.uk"
    ;;
  prod)
    NAMESPACE="hmpps-manage-people-on-probation-prod"
    SIGN_IN_URL="https://sign-in.hmpps.service.justice.gov.uk"
    ;;
  *)
    echo "Unknown environment: $ENVIRONMENT"
    echo "Usage: $0 [dev|preprod|prod]"
    exit 1
    ;;
esac

AUTH_STRING=$(
  kubectl -n "$NAMESPACE" get secrets hmpps-manage-people-on-probation-ui -o json |
    jq -r '.data | map_values(@base64d) | "\(.SYSTEM_CLIENT_ID):\(.SYSTEM_CLIENT_SECRET)"'
)

CLIENT_AUTH=$(printf %s "$AUTH_STRING" | base64 | tr -d '\n')

POD=$(kubectl -n "$NAMESPACE" get pods --field-selector=status.phase==Running -o jsonpath="{.items[0].metadata.name}")

if [ -z "$POD" ]; then
  echo "No running pod found in namespace $NAMESPACE" >&2
  exit 1
fi

AUTH_TOKEN=$(
  kubectl -n "$NAMESPACE" exec "$POD" -- \
    wget -q -O - \
    --post-data "" \
    "$SIGN_IN_URL/auth/oauth/token?grant_type=client_credentials" \
    --header "Authorization: Basic $CLIENT_AUTH" |
    jq -r .access_token
)

if [ -z "$AUTH_TOKEN" ] || [ "$AUTH_TOKEN" = "null" ]; then
  echo "Failed to retrieve auth token for environment '$ENVIRONMENT'" >&2
  exit 1
fi

echo "$AUTH_TOKEN"
