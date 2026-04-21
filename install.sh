#!/usr/bin/env bash
set -e

# Team-Vie Install Script
# This script sets up the entire development environment

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "========================================="
echo "  Team-Vie Installation"
echo "========================================="
echo ""

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

# ── 1. Check prerequisites ──────────────────────────────────
echo "Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Docker found"

if command -v bun &> /dev/null; then
    echo -e "${GREEN}✓${NC} Bun found ($(bun --version)) — will use Bun for frontend"
    FRONTEND_CMD="bun"
elif command -v node &> /dev/null; then
    NODE_MAJOR=$(node -e "process.stdout.write(String(process.versions.node.split('.')[0]))")
    NODE_MINOR=$(node -e "process.stdout.write(String(process.versions.node.split('.')[1]))")
    if [ "$NODE_MAJOR" -gt 20 ] || { [ "$NODE_MAJOR" -eq 20 ] && [ "$NODE_MINOR" -ge 19 ]; }; then
        echo -e "${GREEN}✓${NC} Node.js found ($(node --version)) — will use npm for frontend"
        FRONTEND_CMD="npm"
    else
        echo -e "${RED}Error: Node.js $(node --version) is too old. Vite requires Node >= 20.19.${NC}"
        echo "  Install Bun: https://bun.sh"
        echo "  Or upgrade Node via nvm: nvm install 22 && nvm use 22"
        exit 1
    fi
else
    echo -e "${RED}Error: Neither Bun nor Node.js is installed.${NC}"
    echo "  Install Bun: https://bun.sh"
    echo "  Or install Node.js >= 20.19: https://nodejs.org"
    exit 1
fi

# Check for mamba or conda
if command -v mamba &> /dev/null; then
    CONDA_CMD="mamba"
    echo -e "${GREEN}✓${NC} mamba found"
elif command -v conda &> /dev/null; then
    CONDA_CMD="conda"
    echo -e "${YELLOW}!${NC} mamba not found, falling back to conda"
else
    echo -e "${RED}Error: Neither mamba nor conda is installed.${NC}"
    echo "  Install mamba: https://mamba.readthedocs.io/en/latest/installation.html"
    echo "  Or install conda: https://docs.conda.io/en/latest/miniconda.html"
    exit 1
fi

echo ""

# ── 2. Start database ───────────────────────────────────────
echo "Setting up PostgreSQL database..."
cd "$PROJECT_DIR"
docker compose up -d database

echo "Waiting for database to become healthy..."
until docker exec vie-db pg_isready -U vie -d vie-db > /dev/null 2>&1; do
    sleep 1
done

echo -e "${GREEN}✓${NC} Database is ready"
echo ""


# ── 3. Create Python environment with mamba/conda ────────────
echo "Setting up Python environment with ${CONDA_CMD}..."
cd "$PROJECT_DIR"

# Create or update the environment
if $CONDA_CMD env list | grep -q "^vie "; then
    echo "  Environment 'vie' already exists, updating..."
    $CONDA_CMD env update -n vie -f environment.yml --prune
else
    $CONDA_CMD env create -f environment.yml
fi
echo -e "${GREEN}✓${NC} Python environment 'vie' is ready"
echo ""

# ── 4. Run migrations and seed data ─────────────────────────
echo "Running Django migrations and seeding data..."

# Activate env and run migrations
eval "$(conda shell.bash hook)"
conda activate vie

cd "$PROJECT_DIR/server/VieBackend"
python manage.py migrate --run-syncdb
python manage.py seed_data

echo -e "${GREEN}✓${NC} Migrations and seed data complete"
echo ""

# ── 5. Install frontend dependencies ────────────────────────
echo "Installing frontend dependencies..."
cd "$PROJECT_DIR/client"
if [ "$FRONTEND_CMD" = "bun" ]; then
    bun install
else
    npm install
fi
nvm install 22 && nvm use 22 
echo -e "${GREEN}✓${NC} Frontend dependencies installed"
echo ""

# ── Done ─────────────────────────────────────────────────────
echo "========================================="
echo -e "${GREEN}  Installation Complete!${NC}"
echo "========================================="
echo ""
echo "Default login credentials:"
echo "  Username: demo"
echo "  Password: demo1234"
echo ""
echo "To start the application, run:"
echo "  ./start.sh"
echo ""
