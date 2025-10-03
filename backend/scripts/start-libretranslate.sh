#!/bin/bash
# Start LibreTranslate Server using Docker

echo -e "\033[0;32mStarting LibreTranslate server...\033[0m"

# Check if Docker is running
if ! docker ps &> /dev/null; then
    echo -e "\033[0;31mError: Docker is not running. Please start Docker first.\033[0m"
    exit 1
fi

# Start the container
echo -e "\033[0;33mLaunching LibreTranslate container...\033[0m"
docker-compose up -d libretranslate

if [ $? -eq 0 ]; then
    echo -e "\n\033[0;32mLibreTranslate server is starting up!\033[0m"
    echo -e "\033[0;33mThis may take a few minutes on first run while models are downloaded.\033[0m"
    echo -e "\n\033[0;36mUseful commands:\033[0m"
    echo "  - View logs:        docker-compose logs -f libretranslate"
    echo "  - Check status:     docker-compose ps"
    echo "  - Stop server:      docker-compose down"
    echo "  - Web interface:    http://localhost:5000"
    echo "  - Test API:         curl http://localhost:5000/languages"
    echo -e "\n\033[0;33mWaiting for server to be ready...\033[0m"
    
    # Wait for health check
    max_attempts=30
    attempt=0
    ready=false
    
    while [ $attempt -lt $max_attempts ] && [ "$ready" = false ]; do
        sleep 2
        ((attempt++))
        
        if curl -sf http://localhost:5000/languages &> /dev/null; then
            ready=true
            echo -e "\n\033[0;32m✓ LibreTranslate is ready!\033[0m"
            echo -e "\033[0;36mAccess it at: http://localhost:5000\033[0m"
        else
            echo -n "."
        fi
    done
    
    if [ "$ready" = false ]; then
        echo -e "\n\033[0;33mServer is still starting. Check logs with:\033[0m"
        echo -e "\033[0;36mdocker-compose logs -f libretranslate\033[0m"
    fi
else
    echo -e "\n\033[0;31mFailed to start LibreTranslate.\033[0m"
    echo -e "\033[0;33mCheck Docker logs for details.\033[0m"
fi
