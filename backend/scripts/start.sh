#!/bin/bash
set -e

# ═══════════════════════════════════════════════════════════════
#        TNT-AI Backend Startup Script - World-Class Edition
# ═══════════════════════════════════════════════════════════════
#
# Usage:
#   ./scripts/start.sh first-run    # Complete setup
#   ./scripts/start.sh dev          # Development mode
#   ./scripts/start.sh prod         # Production mode
#   ./scripts/start.sh dev --skip-docker  # Skip LibreTranslate
#
# ═══════════════════════════════════════════════════════════════

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV_PATH="$PROJECT_ROOT/.venv"
REQUIREMENTS_FILE="$PROJECT_ROOT/requirements.txt"
DOCKER_COMPOSE="$PROJECT_ROOT/docker-compose.yml"

# Parse arguments
MODE="${1:-dev}"
SKIP_DOCKER=false
if [[ "$2" == "--skip-docker" ]] || [[ "$1" == "--skip-docker" ]]; then
    SKIP_DOCKER=true
    MODE="${MODE//--skip-docker/}"
    MODE="${MODE:-dev}"
fi

# ═══════════════════════════════════════════════════════════════
#                         COLORS & FORMATTING
# ═══════════════════════════════════════════════════════════════

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# ═══════════════════════════════════════════════════════════════
#                         HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════

banner() {
    local text="$1"
    local color="${2:-$CYAN}"
    local width=64
    echo -e "${color}$(printf '═%.0s' {1..64})${NC}"
    printf "${color}║%*s${NC}\n" $(((${#text}+$width)/2)) "$text" | sed "s/ $/║/"
    echo -e "${color}$(printf '═%.0s' {1..64})${NC}"
}

step() {
    echo -e "\n${YELLOW}▶ $1${NC}"
}

success() {
    echo -e "  ${GREEN}✓ $1${NC}"
}

error() {
    echo -e "  ${RED}✗ $1${NC}"
}

info() {
    echo -e "  ${CYAN}ℹ $1${NC}"
}

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# ═══════════════════════════════════════════════════════════════
#                         FIRST RUN SETUP
# ═══════════════════════════════════════════════════════════════

initialize_first_run() {
    banner "TNT-AI First Run Setup" "$MAGENTA"
    
    # Check Python
    step "Checking Python installation..."
    if ! command_exists python3; then
        error "Python 3 not found! Please install Python 3.10+"
        exit 1
    fi
    PYTHON_VERSION=$(python3 --version)
    success "Found: $PYTHON_VERSION"
    
    # Check Docker
    step "Checking Docker installation..."
    if ! command_exists docker; then
        error "Docker not found! Please install Docker from https://docker.com"
        exit 1
    fi
    if ! docker ps >/dev/null 2>&1; then
        error "Docker daemon is not running! Please start Docker"
        exit 1
    fi
    success "Docker is running"
    
    # Check ffmpeg
    step "Checking ffmpeg installation..."
    if ! command_exists ffmpeg; then
        info "ffmpeg not found. Installing..."
        
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            if command_exists brew; then
                brew install ffmpeg
                success "ffmpeg installed via Homebrew"
            else
                error "Homebrew not found. Please install ffmpeg manually: https://ffmpeg.org"
                exit 1
            fi
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            # Linux
            if command_exists apt-get; then
                sudo apt-get update && sudo apt-get install -y ffmpeg
                success "ffmpeg installed via apt"
            elif command_exists yum; then
                sudo yum install -y ffmpeg
                success "ffmpeg installed via yum"
            else
                error "Package manager not recognized. Please install ffmpeg manually"
                exit 1
            fi
        else
            error "OS not recognized. Please install ffmpeg manually: https://ffmpeg.org"
            exit 1
        fi
    else
        success "Found: $(which ffmpeg)"
    fi
    
    # Create virtual environment
    step "Setting up Python virtual environment..."
    if [[ ! -d "$VENV_PATH" ]]; then
        python3 -m venv "$VENV_PATH"
        success "Virtual environment created"
    else
        success "Virtual environment already exists"
    fi
    
    # Install dependencies
    step "Installing Python dependencies..."
    source "$VENV_PATH/bin/activate"
    pip install --upgrade pip --quiet
    pip install -r "$REQUIREMENTS_FILE"
    success "Dependencies installed"
    
    # Create models directory
    step "Creating model directories..."
    mkdir -p "$PROJECT_ROOT/models/whisper"
    success "Model directories ready"
    
    info "Whisper model will be downloaded on first transcription request"
    
    success "\nFirst run setup completed successfully!"
    echo ""
}

# ═══════════════════════════════════════════════════════════════
#                     START LIBRETRANSLATE
# ═══════════════════════════════════════════════════════════════

start_libretranslate() {
    step "Starting LibreTranslate service..."
    
    cd "$PROJECT_ROOT"
    
    # Check if already running
    if docker ps --filter "name=libretranslate" --format "{{.Names}}" | grep -q "libretranslate"; then
        success "LibreTranslate is already running"
        return
    fi
    
    # Start with docker-compose
    docker-compose up -d --build libretranslate >/dev/null 2>&1
    
    # Wait for it to be healthy
    info "Waiting for LibreTranslate to be ready..."
    local max_retries=30
    local retries=0
    
    while [[ $retries -lt $max_retries ]]; do
        if curl -s http://localhost:5000/languages >/dev/null 2>&1; then
            success "LibreTranslate is ready at http://localhost:5000"
            return
        fi
        sleep 2
        ((retries++))
    done
    
    error "LibreTranslate failed to start within 60 seconds"
    docker-compose logs libretranslate
    exit 1
}

# ═══════════════════════════════════════════════════════════════
#                     START BACKEND SERVER
# ═══════════════════════════════════════════════════════════════

start_backend() {
    local run_mode="$1"
    
    step "Starting TNT-AI Backend API..."
    
    cd "$PROJECT_ROOT"
    source "$VENV_PATH/bin/activate"
    
    if [[ "$run_mode" == "dev" ]]; then
        info "Running in DEVELOPMENT mode (auto-reload enabled)"
        echo ""
        python -m uvicorn app:app --host 0.0.0.0 --port 8080 --reload
        
    elif [[ "$run_mode" == "prod" ]]; then
        info "Running in PRODUCTION mode"
        local workers=$(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 4)
        info "Workers: $workers (CPU cores)"
        info "Log Level: Warning"
        echo ""
        
        # Production settings: multiple workers, no reload, optimized
        python -m uvicorn app:app \
            --host 0.0.0.0 \
            --port 8080 \
            --workers "$workers" \
            --log-level warning \
            --no-access-log \
            --proxy-headers \
            --forwarded-allow-ips='*'
    fi
}

# ═══════════════════════════════════════════════════════════════
#                         MAIN EXECUTION
# ═══════════════════════════════════════════════════════════════

clear
banner "TNT-AI Backend Startup" "$CYAN"

# First run setup
if [[ "$MODE" == "first-run" ]]; then
    initialize_first_run
    echo ""
    info "Setup complete! Run with 'dev' to start the server"
    echo ""
    echo -e "${YELLOW}Quick Start Commands:${NC}"
    echo -e "  ${CYAN}Development:  ./scripts/start.sh dev${NC}"
    echo -e "  ${CYAN}Production:   ./scripts/start.sh prod${NC}"
    echo ""
    exit 0
fi

# Verify setup
if [[ ! -d "$VENV_PATH" ]]; then
    error "Virtual environment not found! Run: ./scripts/start.sh first-run"
    exit 1
fi

# Start LibreTranslate (unless skipped)
if [[ "$SKIP_DOCKER" == false ]]; then
    start_libretranslate
else
    info "Skipping Docker startup (--skip-docker flag set)"
fi

echo ""

# Start Backend
if [[ "$MODE" == "prod" ]]; then
    start_backend "prod"
else
    start_backend "dev"
fi
