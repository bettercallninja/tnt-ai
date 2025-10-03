#!/bin/bash
# Start the FastAPI backend server

echo -e "\033[0;32mStarting TNT-AI Backend Server...\033[0m"

# Check if LibreTranslate is running
echo -e "\n\033[0;36mChecking LibreTranslate status...\033[0m"
if curl -sf http://localhost:5000/languages &> /dev/null; then
    echo -e "\033[0;32m✓ LibreTranslate is running\033[0m"
else
    echo -e "\033[0;33m⚠ Warning: LibreTranslate is not running!\033[0m"
    echo -e "  Start it with: ./scripts/start-libretranslate.sh"
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "\033[0;31mExiting...\033[0m"
        exit 1
    fi
fi

echo -e "\n\033[0;36mStarting FastAPI server...\033[0m"
echo -e "\033[0;37mServer will be available at:\033[0m"
echo -e "  • API: \033[0;36mhttp://localhost:8080\033[0m"
echo -e "  • Docs: \033[0;36mhttp://localhost:8080/docs\033[0m"
echo -e "  • ReDoc: \033[0;36mhttp://localhost:8080/redoc\033[0m"
echo -e "\n\033[0;33mPress Ctrl+C to stop the server\033[0m\n"

# Activate virtual environment and run uvicorn
if [ -f ".venv/bin/activate" ]; then
    source .venv/bin/activate
    python -m uvicorn app:app --host 0.0.0.0 --port 8080 --reload
else
    echo -e "\033[0;31mError: Virtual environment not found at .venv\033[0m"
    echo -e "\033[0;33mPlease create it with: python -m venv .venv\033[0m"
    exit 1
fi
