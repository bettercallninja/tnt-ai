# Scripts Directory

This directory contains utility scripts for managing the backend services.

## Available Scripts

### 🚀 start-libretranslate.ps1 / start-libretranslate.sh

Scripts to start the LibreTranslate Docker container with health checks and status monitoring.

**Windows (PowerShell):**
```powershell
.\scripts\start-libretranslate.ps1
```

**Linux/Mac (Bash):**
```bash
# Make executable (first time only)
chmod +x scripts/start-libretranslate.sh

# Run the script
./scripts/start-libretranslate.sh
```

**Features:**
- Checks if Docker is running
- Starts LibreTranslate container via docker-compose
- Waits for service to be ready (with timeout)
- Displays useful commands and status
- Color-coded output for easy reading

**Requirements:**
- Docker and Docker Compose installed
- `docker-compose.yml` file in backend directory

### 📝 prepare_nllb_ct2.sh

*Legacy script for preparing NLLB CTranslate2 models (no longer used with LibreTranslate integration)*

## Troubleshooting

### Permission Denied (Linux/Mac)

If you get a "permission denied" error on Linux/Mac, make the script executable:

```bash
chmod +x scripts/start-libretranslate.sh
```

### Docker Not Running

If you see "Docker is not running" error:
- **Windows**: Start Docker Desktop
- **Linux**: Run `sudo systemctl start docker`
- **Mac**: Start Docker Desktop app

### Script Not Found

Make sure you're running the script from the `backend` directory:

```bash
cd backend
./scripts/start-libretranslate.sh
```

Or use the full path:

```bash
./backend/scripts/start-libretranslate.sh
```
