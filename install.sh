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

if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed. Please install Node.js 18+.${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Node.js found ($(node --version))"

if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed.${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} npm found ($(npm --version))"

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
cd "$PROJECT_DIR/database"
docker compose up -d
echo "Waiting for database to start..."
sleep 5

# Create the database and user if they don't exist
docker exec vie-db psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'vie-db'" | grep -q 1 || \
    docker exec vie-db psql -U postgres -c "CREATE DATABASE \"vie-db\";"

docker exec vie-db psql -U postgres -tc "SELECT 1 FROM pg_roles WHERE rolname = 'vie'" | grep -q 1 || \
    docker exec vie-db psql -U postgres -c "CREATE USER vie WITH PASSWORD 'CompeteToAdvance';"

docker exec vie-db psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE \"vie-db\" TO vie;" 2>/dev/null || true
docker exec vie-db psql -U postgres -d vie-db -c "GRANT ALL ON SCHEMA public TO vie;" 2>/dev/null || true

echo -e "${GREEN}✓${NC} Database is running"
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
npm install
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
