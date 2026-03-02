#!/usr/bin/env bash
set -e
cd /app/backend
# If data/docs is empty, copy sample docs from image so ingest has content
if [ ! -f data/docs/meal_plans.txt ] 2>/dev/null; then
  mkdir -p data/docs
  cp -n data.docs.bak/* data/docs/ 2>/dev/null || true
fi
exec "$@"
