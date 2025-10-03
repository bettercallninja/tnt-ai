#!/bin/bash
# Start both LibreTranslate and Backend servers

echo -e "\033[0;36m╔════════════════════════════════════════════════════════════╗\033[0m"
echo -e "\033[0;36m║              Starting TNT-AI Full Stack                   ║\033[0m"
echo -e "\033[0;36m╚════════════════════════════════════════════════════════════╝\033[0m\n"

# Start LibreTranslate
echo -e "\033[0;33mStep 1: Starting LibreTranslate...\033[0m"
./scripts/start-libretranslate.sh

echo -e "\n\033[0;33mWaiting 5 seconds for LibreTranslate to stabilize...\033[0m"
sleep 5

# Start Backend
echo -e "\n\033[0;33mStep 2: Starting Backend API...\033[0m"
echo -e "\033[0;36mNote: This will run in the foreground. Open a new terminal to use other commands.\033[0m"
echo -e "\033[0;33mPress Ctrl+C to stop both services.\033[0m\n"

./scripts/start-backend.sh
