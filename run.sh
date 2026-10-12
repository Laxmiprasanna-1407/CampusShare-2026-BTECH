#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"

echo "============================================================"
echo "  CampusShare: Peer-to-Peer College Item Rental Platform"
echo "============================================================"

# 1. Create .env from .env.example if missing
if [ ! -f "$DIR/.env" ]; then
    echo "[INFO] .env not found. Creating .env from .env.example..."
    cp "$DIR/.env.example" "$DIR/.env"
    echo "[OK] Created .env with safe local defaults."
fi

# 2. Make mvnw executable if needed
if [ -f "$DIR/backend/mvnw" ]; then
    chmod +x "$DIR/backend/mvnw"
fi

# 3. Start Backend in background
echo "[INFO] Starting Spring Boot Backend (Profile: local, H2 in MySQL mode)..."
cd "$DIR/backend"
./mvnw spring-boot:run -Dspring-boot.run.profiles=local > "$DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > "$DIR/.backend.pid"

echo "[INFO] Backend started with PID $BACKEND_PID. Waiting for port 8080..."
sleep 6

# 4. Start Frontend
echo "[INFO] Starting React + Vite Frontend..."
cd "$DIR/frontend"
npm run dev &
FRONTEND_PID=$!
echo $FRONTEND_PID > "$DIR/.frontend.pid"

echo ""
echo "============================================================"
echo "  CampusShare is running!"
echo "============================================================"
echo "  Frontend Web App:    http://localhost:5173"
echo "  Backend REST API:    http://localhost:8080"
echo "  Swagger OpenAPI UI:  http://localhost:8080/swagger-ui.html"
echo "  Actuator Health:     http://localhost:8080/actuator/health"
echo "============================================================"
echo "  To stop services, run ./stop.sh"
echo "============================================================"
