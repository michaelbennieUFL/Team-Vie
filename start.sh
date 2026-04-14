#!/usr/bin/env bash

# Team-Vie Start Script
# Starts both the frontend and backend development servers.
# Press Ctrl+C to stop both servers gracefully.

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down servers...${NC}"

    if [ -n "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
        kill "$FRONTEND_PID" 2>/dev/null
        wait "$FRONTEND_PID" 2>/dev/null
        echo -e "${GREEN}✓${NC} Frontend stopped"
    fi

    if [ -n "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
        kill "$BACKEND_PID" 2>/dev/null
        wait "$BACKEND_PID" 2>/dev/null
        echo -e "${GREEN}✓${NC} Backend stopped"
    fi

    echo -e "${GREEN}All servers stopped.${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

echo "========================================="
echo "  Team-Vie Development Servers"
echo "========================================="
echo ""

# Check database is running
if ! docker ps --format '{{.Names}}' | grep -q vie-db; then
    echo -e "${YELLOW}Starting database...${NC}"
    cd "$PROJECT_DIR/database"
    docker compose up -d
    sleep 3
fi
echo -e "${GREEN}✓${NC} Database is running"

# Activate Python environment when available
if command -v conda &> /dev/null; then
    eval "$(conda shell.bash hook)"
    conda activate vie
elif command -v mamba &> /dev/null; then
    eval "$(mamba shell hook --shell bash)"
    mamba activate vie
elif command -v micromamba &> /dev/null; then
    eval "$(micromamba shell hook --shell bash)"
    micromamba activate vie
else
    echo -e "${YELLOW}Warning: conda/mamba/micromamba not found; using current Python environment.${NC}"
fi

# Start backend
echo -e "${GREEN}Starting backend server...${NC}"
cd "$PROJECT_DIR/server/VieBackend"
python manage.py runserver &
BACKEND_PID=$!
sleep 2

# Start frontend (prefer Bun; fall back to Node >= 20.19)
echo -e "${GREEN}Starting frontend server...${NC}"
cd "$PROJECT_DIR/client"
if command -v bun &> /dev/null; then
    bun run dev &
    FRONTEND_PID=$!
elif command -v node &> /dev/null; then
    NODE_MAJOR=$(node -e "process.stdout.write(String(process.versions.node.split('.')[0]))")
    NODE_MINOR=$(node -e "process.stdout.write(String(process.versions.node.split('.')[1]))")
    # Require Node >= 20.19
    if [ "$NODE_MAJOR" -gt 20 ] || { [ "$NODE_MAJOR" -eq 20 ] && [ "$NODE_MINOR" -ge 19 ]; }; then
        npm run dev &
        FRONTEND_PID=$!
    else
        echo -e "${RED}Error: Node.js $(node --version) is too old. Vite requires Node >= 20.19.${NC}"
        echo "  Install Bun (https://bun.sh) or run: nvm use (requires .nvmrc / nvm install 22)"
        cleanup
    fi
else
    echo -e "${RED}Error: Neither Bun nor Node.js is installed. Please install Bun (https://bun.sh) or Node.js >= 20.19.${NC}"
    cleanup
fi
sleep 2

echo ""
echo "========================================="
echo -e "${GREEN}  Servers are running!${NC}"
echo "========================================="
echo ""
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:8000"
echo ""
echo "  Default login:"
echo "    Username: demo"
echo "    Password: demo1234"
echo ""
echo "  Press Ctrl+C to stop both servers"
echo ""

# Wait for either process to exit
wait -n "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null

# If one exits, clean up the other
cleanup
