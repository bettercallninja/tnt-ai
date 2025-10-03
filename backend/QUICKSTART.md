# Quick Start Guide

## Running the Translation Service

### 1. Start LibreTranslate Server

**Using Docker (Recommended)**:

*Windows (PowerShell):*
```powershell
.\scripts\start-libretranslate.ps1
```

*Linux/Mac (Bash):*
```bash
chmod +x scripts/start-libretranslate.sh
./scripts/start-libretranslate.sh
```

Or manually:
```bash
docker-compose up -d libretranslate
```

**Without Docker**:
```bash
pip install libretranslate
libretranslate --load-only en,tr,ar,fa --port 5000
```

### 2. Start the Backend API

```powershell
uvicorn app:app --host 0.0.0.0 --port 8080 --reload
```

### 3. Test the Translation

**Check LibreTranslate is running**:
```powershell
curl http://localhost:5000/languages
```

**Test translation endpoint**:
```powershell
curl -X POST http://localhost:5000/translate `
  -H "Content-Type: application/json" `
  -d '{"q":"Hello world","source":"en","target":"tr","format":"text"}'
```

**Test your backend API**:
```powershell
# This will require an audio file
curl -X POST http://localhost:8080/v1/transcribe_translate `
  -F "file=@test_audio.wav" `
  -F "target_lang=Turkish"
```

## Configuration

Create a `.env` file (copy from `.env.example`):

```env
# Server
HOST=0.0.0.0
PORT=8080

# Whisper
WHISPER_MODEL=small
WHISPER_MODEL_DIR=models/whisper

# LibreTranslate (local)
LIBRETRANSLATE_URL=http://localhost:5000
LIBRETRANSLATE_API_KEY=

# Default target language
DEFAULT_TARGET_LANG=English
```

## Supported Languages

- English (en)
- Turkish (tr)
- Arabic (ar)
- Persian/Farsi (fa)

## Architecture

```
Audio File → Whisper (Speech-to-Text) → LibreTranslate API → Translated Text
```

1. **Whisper**: Transcribes audio to text and detects source language
2. **LibreTranslate**: Translates text from source to target language
3. **FastAPI Backend**: Orchestrates the pipeline

## Stopping Services

```powershell
# Stop LibreTranslate
docker-compose down

# Stop backend (Ctrl+C in the terminal)
```

## Troubleshooting

See `README_LIBRETRANSLATE.md` for detailed troubleshooting steps.
