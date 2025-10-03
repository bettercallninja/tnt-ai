# Backend Setup

1. Install system deps: `ffmpeg`, Python 3.11+
2. Create venv and install requirements:
```

cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

```
3. Put models in `models/`:
- Whisper: will auto-download to cache; to pin offline, place the `.pt` in `models/whisper/` and set env `WHISPER_MODEL_DIR` accordingly or prewarm cache.
- NLLB CT2 + SentencePiece: convert and copy under `models/ct2-nllb-200-600M-int8` and `models/spm/`.
4. Run:
```

uvicorn app\:app --host 0.0.0.0 --port 8080

```
5. Test with `curl`:
```

curl -F "file=@/path/audio.wav" -F "target\_lang=English" [http://localhost:8080/v1/transcribe\_translate](http://localhost:8080/v1/transcribe_translate)

```
