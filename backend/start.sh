#!/bin/bash
set -e

echo "=== start.sh: Starting UnityCare backend ==="
echo "PORT env: $PORT"
echo "Python version: $(python3 --version 2>&1)"
echo "Uvicorn available: $(python3 -c 'import uvicorn; print(uvicorn.__version__)' 2>&1)"
echo "FastAPI available: $(python3 -c 'import fastapi; print(fastapi.__version__)' 2>&1)"
echo "=== Starting uvicorn on port 8000 ==="

exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4 --log-level debug
