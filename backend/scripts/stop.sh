#!/bin/bash

# ═══════════════════════════════════════════════════════════════
#                   Stop TNT-AI Services
# ═══════════════════════════════════════════════════════════════

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

CYAN='\033[0;36m'
YELLOW='\033[0;33m'
GREEN='\033[0;32m'
NC='\033[0m'

banner() {
    echo -e "${YELLOW}$(printf '═%.0s' {1..64})${NC}"
    printf "${YELLOW}║%*s${NC}\n" 35 "Stopping TNT-AI Services" | sed "s/ $/║/"
    echo -e "${YELLOW}$(printf '═%.0s' {1..64})${NC}"
}

clear
banner

cd "$PROJECT_ROOT"

if [[ "$1" == "--all" ]]; then
    echo -e "\n${YELLOW}Stopping and removing all containers, networks, and volumes...${NC}"
    docker-compose down -v
    echo -e "${GREEN}✓ All services stopped and cleaned${NC}"
else
    echo -e "\n${YELLOW}Stopping containers...${NC}"
    docker-compose down
    echo -e "${GREEN}✓ Services stopped (data preserved)${NC}"
fi

echo ""
