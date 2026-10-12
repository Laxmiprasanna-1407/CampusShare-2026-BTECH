#!/usr/bin/env bash

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"

echo "============================================================"
echo "  Stopping CampusShare Services..."
echo "============================================================"

if [ -f "$DIR/.backend.pid" ]; then
    PID=$(cat "$DIR/.backend.pid")
    echo "Stopping Backend PID $PID..."
    kill $PID 2>/dev/null || true
    rm -f "$DIR/.backend.pid"
fi

if [ -f "$DIR/.frontend.pid" ]; then
    PID=$(cat "$DIR/.frontend.pid")
    echo "Stopping Frontend PID $PID..."
    kill $PID 2>/dev/null || true
    rm -f "$DIR/.frontend.pid"
fi

# Fallback kill by port
pkill -f "campusshare-backend" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

echo "[OK] CampusShare services stopped."
