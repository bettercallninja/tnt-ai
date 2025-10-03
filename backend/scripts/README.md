# Scripts Directory

Helper scripts for managing backend services.

## Available Scripts

### start-all.ps1 / start-all.sh ⭐

Starts both LibreTranslate and Backend API.

```powershell
# Windows
.\scripts\start-all.ps1

# Linux/Mac
./scripts/start-all.sh
```

### start-backend.ps1 / start-backend.sh

Starts the FastAPI backend server using virtual environment Python.

```powershell
# Windows
.\scripts\start-backend.ps1

# Linux/Mac  
./scripts/start-backend.sh
```

### start-libretranslate.ps1 / start-libretranslate.sh

Starts the LibreTranslate Docker container with health checks.

```powershell
# Windows
.\scripts\start-libretranslate.ps1

# Linux/Mac
./scripts/start-libretranslate.sh
```

## Troubleshooting

**Permission denied (Linux/Mac):**
```bash
chmod +x scripts/*.sh
```

**Docker not running:**
- Windows: Start Docker Desktop
- Linux: `sudo systemctl start docker`

**Scripts not found:** Run from backend directory
```bash
cd backend
./scripts/start-all.sh
```
