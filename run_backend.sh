#!/usr/bin/env bash
# Run the backend using the project venv (so FastAPI and deps are found).
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT/backend"
if [[ ! -f "$ROOT/.venv/bin/python" ]]; then
  echo "Creating venv and installing dependencies..."
  python3 -m venv "$ROOT/.venv"
  "$ROOT/.venv/bin/pip" install -r "$ROOT/requirements.txt"
fi
exec "$ROOT/.venv/bin/python" -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
