#!/bin/bash

echo "=========================================="
echo "Redis Hybrid Persistence Visualization"
echo "=========================================="
echo ""

echo "[1/3] Checking Docker container..."
if ! docker ps --filter "name=redis-hybrid" --format "{{.Names}}" | grep -q redis-hybrid; then
    echo "ERROR: redis-hybrid container is not running!"
    echo "Please start it first: docker-compose up -d redis-hybrid"
    exit 1
fi
echo "OK: Container is running"
echo ""

echo "[2/3] Installing Node.js dependencies..."
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "Dependencies already installed"
fi
echo ""

echo "[3/3] Starting API server..."
echo ""
echo "API Server will run on http://localhost:3000"
echo "Dashboard: Open dashboard.html in your browser"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

node api-server.js

