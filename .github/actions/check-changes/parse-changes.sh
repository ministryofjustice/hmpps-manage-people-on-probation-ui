#!/usr/bin/env bash

function toJsonArray() {
  jq --raw-input . | jq --slurp --compact-output .
}

function topLevelChanges() {
  sed -E 's|^projects/([^/$]*).*|\1|' | sort -u
}

if [ -n "$PROJECT_FILES" ]; then
  projects=$(echo "$PROJECT_FILES" | xargs -n1 | topLevelChanges | toJsonArray)
  echo "Changes detected in: $projects"
  echo "projects=$projects" | tee -a "$GITHUB_OUTPUT"
else
  echo "No changes detected"
  echo "projects=[]" | tee -a "$GITHUB_OUTPUT"
fi
