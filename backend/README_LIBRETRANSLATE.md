# LibreTranslate Setup Guide

This project uses [LibreTranslate](https://github.com/LibreTranslate/LibreTranslate) for translation services.

## Option 1: Local Docker Setup (Recommended)

### Prerequisites
- Docker and Docker Compose installed

### Steps

1. **Start LibreTranslate server**:
   
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

2. **Check logs to ensure models are downloading**:
   ```powershell
   docker-compose logs -f libretranslate
   ```
   
   First startup will take time as it downloads language models for English, Turkish, Arabic, and Persian.

3. **Verify it's running**:
   ```powershell
   curl http://localhost:5000/languages
   ```
   
   Or open in browser: http://localhost:5000

4. **Update your `.env` file**:
   ```
   LIBRETRANSLATE_URL=http://localhost:5000
   ```

5. **Stop the service** (when needed):
   ```powershell
   docker-compose down
   ```

### Configuration Options

The `docker-compose.yml` file includes several optimization options:

- **`LT_LOAD_ONLY`**: Only loads specified languages to save memory
- **`LT_CHAR_LIMIT`**: Maximum characters per translation request
- **`LT_THREADS`**: Number of threads for translation
- **`LT_DISABLE_FILES_TRANSLATION`**: Disables file upload translation
- **`LT_DISABLE_WEB_UI`**: Set to "true" to disable the web interface

### Memory Requirements

- **Minimal setup** (2-4 languages): ~2-4 GB RAM
- **Full setup** (all languages): ~8-16 GB RAM

## Option 2: Python Package Installation

If you prefer to run LibreTranslate directly without Docker:

1. **Install LibreTranslate**:
   ```powershell
   pip install libretranslate
   ```

2. **Run the server**:
   ```powershell
   libretranslate --load-only en,tr,ar,fa --port 5000
   ```

3. **Or with more options**:
   ```powershell
   libretranslate --load-only en,tr,ar,fa --port 5000 --disable-files-translation --char-limit 5000
   ```

## Option 3: Use Public API

If you don't want to host locally, you can use the public instance:

```
LIBRETRANSLATE_URL=https://libretranslate.com
```

**Note**: The public API has rate limits and may require an API key for heavy usage.

## Testing Translation

Test the translation endpoint:

```powershell
curl -X POST http://localhost:5000/translate `
  -H "Content-Type: application/json" `
  -d '{"q":"Hello, how are you?","source":"en","target":"tr","format":"text"}'
```

## Supported Languages

- `en` - English
- `tr` - Turkish  
- `ar` - Arabic
- `fa` - Persian

For the full list of supported languages, visit: http://localhost:5000/languages

## API Authentication (Optional)

To enable API key authentication:

1. Update `docker-compose.yml`:
   ```yaml
   environment:
     LT_API_KEYS: "true"
     LT_API_KEYS_DB_PATH: "/app/db/api_keys.db"
   ```

2. Generate an API key:
   ```powershell
   docker exec -it libretranslate ltmanage keys add
   ```

3. Add to `.env`:
   ```
   LIBRETRANSLATE_API_KEY=your-generated-key
   ```

## Troubleshooting

### Container won't start
- Check Docker is running
- Ensure port 5000 is not in use
- Check logs: `docker-compose logs libretranslate`

### Models not downloading
- Check internet connection
- Check disk space (models can be large)
- Wait longer - first download takes time

### Out of memory errors
- Reduce number of languages in `LT_LOAD_ONLY`
- Increase Docker memory limit in Docker Desktop settings
- Reduce `LT_THREADS` value

## Performance Tips

1. **Only load needed languages** - Each language pair adds memory overhead
2. **Use SSD storage** - Faster model loading
3. **Allocate sufficient RAM** - At least 4GB for 4 languages
4. **Use local instance** - Much faster than public API
