#!/usr/bin/env bash
# Run the frontend dev server (Node.js 12+).
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT/frontend"


# Check Node is available (Vite 2 works on Node 12+)
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required. Install from https://nodejs.org/"
  exit 1
fi

if [[ ! -d node_modules ]]; then
  echo "Installing dependencies..."
  npm install
fi

exec npm run dev
