# Backend Setup

## Prerequisites
- Python 3.11+
- ffmpeg (for audio processing)
- Docker & Docker Compose (recommended for LibreTranslate)

## Installation

1. **Create virtual environment and install dependencies**:
```bash
cd backend
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/Mac:
source .venv/bin/activate

pip install -r requirements.txt
```

2. **Set up LibreTranslate (Translation Service)**:

   **Option A - Docker (Recommended)**:
   
   *Windows (PowerShell):*
   ```powershell
   # Start LibreTranslate server
   .\scripts\start-libretranslate.ps1
   ```
   
   *Linux/Mac (Bash):*
   ```bash
   # Make script executable (first time only)
   chmod +x scripts/start-libretranslate.sh
   
   # Start LibreTranslate server
   ./scripts/start-libretranslate.sh
   ```
   
   Or manually:
   ```bash
   docker-compose up -d libretranslate
   ```
   
   **Option B - Python Package**:
   ```powershell
   pip install libretranslate
   libretranslate --load-only en,tr,ar,fa --port 5000
   ```
   
   See `README_LIBRETRANSLATE.md` for detailed setup instructions.

3. **Configure environment variables** (optional):
   ```powershell
   # Copy example env file
   copy .env.example .env
   
   # Edit .env as needed
   ```

4. **Whisper models** will auto-download on first use to the cache directory.
   - To use offline, place `.pt` files in `models/whisper/` and set `WHISPER_MODEL_DIR`

## Running

1. **Start LibreTranslate** (if not already running):
   ```powershell
   docker-compose up -d libretranslate
   ```

2. **Start the backend API**:
   ```powershell
   uvicorn app:app --host 0.0.0.0 --port 8080 --reload
   ```

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

## Quick Start

See `QUICKSTART.md` for a quick reference guide.
