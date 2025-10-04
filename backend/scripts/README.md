# TNT-AI Backend Scripts 🚀

World-class startup and management scripts for the TNT-AI backend service.

## 📋 Quick Start

### First Time Setup

**Windows (PowerShell):**
```powershell
.\scripts\start.ps1 -Mode first-run
```

**Linux/macOS (Bash):**
```bash
chmod +x scripts/*.sh
./scripts/start.sh first-run
```

This will:
- ✅ Check Python, Docker, and ffmpeg installation
- ✅ Install missing dependencies automatically
- ✅ Create Python virtual environment
- ✅ Install all Python packages
- ✅ Set up model directories

---

## 🎯 Running the Server

### Development Mode (Auto-reload)

**Windows:**
```powershell
.\scripts\start.ps1 -Mode dev
```

**Linux/macOS:**
```bash
./scripts/start.sh dev
```

Features:
- 🔄 Auto-reload on code changes
- 📊 Detailed logging
- 🐳 Starts LibreTranslate Docker container
- 🎤 Whisper transcription ready
- 🌐 API available at http://localhost:8080

### Production Mode (Optimized)

**Windows:**
```powershell
.\scripts\start.ps1 -Mode prod
```

**Linux/macOS:**
```bash
./scripts/start.sh prod
```

Features:
- ⚡ Multiple workers (auto-detect CPU cores)
- 📉 Minimal logging (warning level)
- 🔒 Proxy headers enabled
- 🚀 Optimized for performance
- 📈 No auto-reload

### Skip Docker (if LibreTranslate already running)

**Windows:**
```powershell
.\scripts\start.ps1 -Mode dev -SkipDocker
```

**Linux/macOS:**
```bash
./scripts/start.sh dev --skip-docker
```

---

## 🛑 Stopping Services

### Stop containers (preserve data)

**Windows:**
```powershell
.\scripts\stop.ps1
```

**Linux/macOS:**
```bash
./scripts/stop.sh
```

### Stop and remove all (including volumes)

**Windows:**
```powershell
.\scripts\stop.ps1 -All
```

**Linux/macOS:**
```bash
./scripts/stop.sh --all
```

---

## 📦 What Gets Installed

### First Run Setup Installs:

1. **ffmpeg** - Audio processing
   - Windows: via WinGet
   - macOS: via Homebrew
   - Linux: via apt/yum

2. **Python Virtual Environment** - Isolated dependencies
   - Location: `backend/.venv`

3. **Python Packages** (from requirements.txt):
   - FastAPI - Web framework
   - Uvicorn - ASGI server
   - Whisper - Speech recognition
   - httpx - HTTP client for LibreTranslate
   - Pydantic - Data validation

4. **Docker Services**:
   - LibreTranslate - Translation API (port 5000)

---

## 🔧 Configuration

### Environment Variables

Create `.env` file in `backend/` directory:

```bash
# Server
HOST=0.0.0.0
PORT=8080

# Whisper Model (tiny|base|small|medium|large|turbo)
WHISPER_MODEL=turbo
WHISPER_MODEL_DIR=models/whisper

# LibreTranslate API
LIBRETRANSLATE_URL=http://localhost:5000
LIBRETRANSLATE_API_KEY=

# Default Target Language
DEFAULT_TARGET_LANG=English
```

### Whisper Model Sizes

| Model  | Size  | Speed | Accuracy |
|--------|-------|-------|----------|
| tiny   | 39M   | ⚡⚡⚡  | ⭐       |
| base   | 74M   | ⚡⚡   | ⭐⭐     |
| small  | 244M  | ⚡     | ⭐⭐⭐   |
| medium | 769M  | 🐌    | ⭐⭐⭐⭐ |
| large  | 1550M | 🐌🐌  | ⭐⭐⭐⭐⭐|
| turbo  | 809M  | ⚡⚡   | ⭐⭐⭐⭐⭐|

**Recommended: `turbo`** - Best balance of speed and accuracy

---

## 🧪 Testing the API

### Using cURL

**Transcribe & Translate:**
```bash
curl -X POST http://localhost:8080/v1/transcribe_translate \
  -F "file=@audio.wav" \
  -F "target_lang=Turkish"
```

**Response:**
```json
{
  "transcript": "Hello, how are you?",
  "translation": "Merhaba, nasılsın?",
  "lang": "en"
}
```

### Using Postman

1. **Method:** POST
2. **URL:** `http://localhost:8080/v1/transcribe_translate`
3. **Body:** form-data
   - `file`: (Select audio file)
   - `target_lang`: `Turkish` / `Persian` / `Arabic` / `English`

### Supported Languages

| Language | Code |
|----------|------|
| English  | en   |
| Turkish  | tr   |
| Persian  | fa   |
| Arabic   | ar   |

---

## 📊 System Requirements

### Minimum:
- **CPU:** 4 cores
- **RAM:** 8GB
- **Disk:** 10GB free space
- **Python:** 3.10+
- **Docker:** Latest version

### Recommended (Production):
- **CPU:** 8+ cores
- **RAM:** 16GB+
- **Disk:** 20GB SSD
- **GPU:** CUDA-capable (optional, for faster Whisper)

---

## 🐛 Troubleshooting

### "ffmpeg not found"
- **Windows:** Restart PowerShell after first-run
- **Linux/macOS:** Run `sudo apt install ffmpeg` or `brew install ffmpeg`

### "Docker daemon not running"
- Start Docker Desktop
- Verify: `docker ps`

### "ModuleNotFoundError: No module named 'whisper'"
- Activate virtual environment manually:
  - Windows: `.venv\Scripts\Activate.ps1`
  - Linux/macOS: `source .venv/bin/activate`
- Reinstall: `pip install -r requirements.txt`

### "Port 8080 already in use"
- Stop existing process: 
  - Windows: `Get-Process -Id (Get-NetTCPConnection -LocalPort 8080).OwningProcess | Stop-Process`
  - Linux/macOS: `lsof -ti:8080 | xargs kill -9`

### LibreTranslate not responding
- Check Docker: `docker ps`
- View logs: `docker-compose logs libretranslate`
- Restart: `.\scripts\stop.ps1; .\scripts\start.ps1 -Mode dev`

---

## 📁 Project Structure

```
backend/
├── scripts/
│   ├── start.ps1          # Windows startup (dev/prod)
│   ├── start.sh           # Linux/macOS startup
│   ├── stop.ps1           # Windows stop script
│   ├── stop.sh            # Linux/macOS stop script
│   └── README.md          # This file
├── .venv/                 # Python virtual environment
├── models/
│   └── whisper/           # Whisper model cache
├── app.py                 # FastAPI application
├── settings.py            # Configuration
├── requirements.txt       # Python dependencies
└── docker-compose.yml     # LibreTranslate service
```

---

## 🚀 Performance Tips

### Development:
- Use `turbo` or `small` Whisper model for faster iteration
- Keep LibreTranslate running between sessions (`-SkipDocker`)

### Production:
- Use `turbo` or `large` for best quality
- Enable multiple workers (auto-configured)
- Use reverse proxy (nginx) for SSL/load balancing
- Monitor with `docker stats` and `htop`

### GPU Acceleration (Optional):
1. Install CUDA toolkit
2. Install `pip install openai-whisper[cuda]`
3. Whisper will automatically use GPU

---

## 📝 Logs

### View Backend Logs:
- Development mode shows live logs in console
- Production mode: Check `uvicorn` process output

### View LibreTranslate Logs:
```bash
docker-compose logs -f libretranslate
```

---

## 🎉 You're All Set!

Your TNT-AI backend is now ready for:
- 🎤 Audio transcription (Whisper)
- 🌍 Multi-language translation (LibreTranslate)
- 📱 Mobile app integration
- 🚀 Production deployment

Happy coding! 🎊
