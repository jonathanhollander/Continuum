#!/bin/bash

# Function to kill all child processes when script exits
trap 'kill $(jobs -p)' EXIT

echo "Starting Backend (FastAPI)..."
cd backend && uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

echo "Starting Frontend (SvelteKit)..."
cd frontend && npm run dev -- --host &
FRONTEND_PID=$!

echo "Dual-stack environment running."
echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:8000"

wait
