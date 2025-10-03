# TNT-AI Backend

Speech-to-text transcription with translation powered by Whisper and LibreTranslate.

## Prerequisites
- Python 3.11+
- ffmpeg (for audio processing)
- Docker & Docker Compose (recommended for LibreTranslate)

## Quick Start

### 1. Install Dependencies
```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# Linux/Mac
source .venv/bin/activate

pip install -r requirements.txt
```

### 2. Start Services

**Easiest - Start Everything:**
```powershell
# Windows
.\scripts\start-all.ps1

# Linux/Mac
chmod +x scripts/start-all.sh
./scripts/start-all.sh
```

**Or start services separately:**

Start LibreTranslate (translation service):
```powershell
# Windows
.\scripts\start-libretranslate.ps1

# Linux/Mac
./scripts/start-libretranslate.sh

# Or manually
docker-compose up -d libretranslate
```

Start Backend API:
```powershell
# Windows
.\scripts\start-backend.ps1

# Linux/Mac
./scripts/start-backend.sh

# Or manually (IMPORTANT: use venv Python!)
& .venv\Scripts\python.exe -m uvicorn app:app --host 0.0.0.0 --port 8080 --reload
```

> ⚠️ **Important**: Don't run `python app.py` directly! FastAPI apps must be run with uvicorn from the virtual environment.

### 3. Access the API

Once running:
- **API Docs**: http://localhost:8080/docs (Interactive Swagger UI)
- **API**: http://localhost:8080
- **ReDoc**: http://localhost:8080/redoc
- **LibreTranslate**: http://localhost:5000

## Testing

**Test LibreTranslate**:
```powershell
curl http://localhost:5000/languages
```

**Test the full pipeline**:
```powershell
curl -X POST http://localhost:8080/v1/transcribe_translate `
  -F "file=@test_audio.wav" `
  -F "target_lang=English"
```

## Architecture

```
Audio → Whisper (STT) → LibreTranslate API → Translated Text
```

- **Whisper**: Speech-to-text transcription + language detection
- **LibreTranslate**: Neural machine translation (local or remote)

## Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `HOST` | `0.0.0.0` | API server host |
| `PORT` | `8080` | API server port |
| `WHISPER_MODEL` | `small` | Whisper model size (tiny/base/small/medium/large-v3) |
| `WHISPER_MODEL_DIR` | `models/whisper` | Whisper models directory |
| `LIBRETRANSLATE_URL` | `http://localhost:5000` | LibreTranslate API endpoint |
| `LIBRETRANSLATE_API_KEY` | `` | Optional API key for authentication |
| `DEFAULT_TARGET_LANG` | `English` | Default translation target |

## Supported Languages

- English (en)
- Turkish (tr)
- Arabic (ar)
- Persian/Farsi (fa)

## LibreTranslate Setup Details

LibreTranslate provides the translation service. You can run it locally or use a remote instance.

### Docker Setup (Recommended)

The `docker-compose.yml` file is pre-configured with:
- Only loads needed languages (en, tr, ar, fa) to save memory
- Persistent model storage
- Health checks
- Optimized settings

**Configuration options** in `docker-compose.yml`:
- `LT_LOAD_ONLY`: Languages to load (reduces memory)
- `LT_CHAR_LIMIT`: Max characters per request
- `LT_THREADS`: Number of translation threads

### Python Package Installation

If you prefer not to use Docker:
```bash
pip install libretranslate
libretranslate --load-only en,tr,ar,fa --port 5000
```

### Using Public API

Set in `.env` file:
```
LIBRETRANSLATE_URL=https://libretranslate.com
```

Note: Public API has rate limits.

## Troubleshooting

### "ModuleNotFoundError: No module named 'whisper'"
**Problem**: Running `python app.py` directly or using system Python  
**Solution**: Use virtual environment Python with uvicorn:
```powershell
& .venv\Scripts\python.exe -m uvicorn app:app --host 0.0.0.0 --port 8080 --reload
```

### "LibreTranslate API error"
**Problem**: LibreTranslate is not running  
**Solution**: Start it first with `.\scripts\start-libretranslate.ps1`

### Docker not starting
- Ensure Docker Desktop is running
- Check port 5000 is not in use
- Check logs: `docker-compose logs libretranslate`

### Out of memory with LibreTranslate
- Reduce languages in `LT_LOAD_ONLY` in docker-compose.yml
- Increase Docker memory limit in Docker Desktop settings
- Use remote API instead of local instance

## Scripts

All helper scripts are in `backend/scripts/`:
- `start-all.ps1/.sh` - Start everything (LibreTranslate + Backend)
- `start-backend.ps1/.sh` - Start backend API only
- `start-libretranslate.ps1/.sh` - Start LibreTranslate only

See `scripts/README.md` for detailed script documentation.
