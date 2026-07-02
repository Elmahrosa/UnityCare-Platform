#!/bin/bash
set -e

PORT="${PORT:-8000}"

exec uvicorn app.main:app --host 0.0.0.0 --port "$PORT" --workers 4
