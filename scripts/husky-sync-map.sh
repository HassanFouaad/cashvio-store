#!/usr/bin/env sh
set -e

if [ "$#" -lt 1 ]; then
  echo "Usage: sh scripts/husky-sync-map.sh \"<index:code command>\"" >&2
  exit 1
fi

eval "$1"

if ! git diff --quiet -- MAP.md; then
  git add MAP.md
  printf '\nhusky: staged updated MAP.md\n'
fi
