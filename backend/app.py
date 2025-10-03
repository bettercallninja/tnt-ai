import asyncio
import os
import subprocess
import tempfile
from typing import Optional

import httpx
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import whisper
from settings import settings

app = FastAPI(title="tnt-ai")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"], allow_headers=["*"], allow_credentials=True
)

# ----- Load models at startup -----
whisper_model = whisper.load_model(
    settings.WHISPER_MODEL,
    download_root=settings.WHISPER_MODEL_DIR,
)

# HTTP client for LibreTranslate API
http_client = httpx.AsyncClient(timeout=30.0)

class TranscribeTranslateResp(BaseModel):
    transcript: str
    translation: str
    lang: str  # BCP-47-ish, e.g. "tr", "en", "fa"

SUPPORTED_LANG_CODES = {
    "ar": "Arabic", "en": "English", "fa": "Persian", "tr": "Turkish",
}

# Language name to LibreTranslate code mapping
LANG_NAME_TO_CODE = {
    "English": "en",
    "Turkish": "tr",
    "Persian": "fa",
    "Arabic": "ar",
}

# Whisper language codes to LibreTranslate codes
WHISPER_TO_LIBRETRANSLATE = {
    "tr": "tr",
    "en": "en",
    "fa": "fa",
    "ar": "ar",
}

# Whisper expects wav/float or a file path; we normalize via ffmpeg

def to_wav(input_bytes: bytes) -> bytes:
    with tempfile.NamedTemporaryFile(suffix=".in", delete=False) as fin:
        fin.write(input_bytes)
        fin.flush()
        in_path = fin.name
    out_path = in_path + ".wav"
    try:
        subprocess.run(
            ["ffmpeg", "-y", "-i", in_path, "-ac", "1", "-ar", "16000", out_path],
            check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE
        )
        with open(out_path, "rb") as f:
            return f.read()
    finally:
        for p in (in_path, out_path):
            try: os.remove(p)
            except: pass

@app.post("/v1/transcribe_translate", response_model=TranscribeTranslateResp)
async def transcribe_translate(
    file: UploadFile = File(...),
    target_lang: str = Form(default=settings.DEFAULT_TARGET_LANG)
):
    # target_lang is a human-readable name; pick its tokenizer/model at deploy time
    if target_lang not in LANG_NAME_TO_CODE:
        raise HTTPException(400, f"Unsupported target_lang: {target_lang}")
    target_lang_code = LANG_NAME_TO_CODE[target_lang]
    try:
        raw = await file.read()
    except Exception as e:
        raise HTTPException(400, f"Invalid upload: {e}")

    try:
        wav = await asyncio.to_thread(to_wav, raw)
    except Exception as e:
        raise HTTPException(500, f"Audio normalization failed: {e}")

    wav_path: Optional[str] = None
    try:
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tf:
            tf.write(wav)
            tf.flush()
            wav_path = tf.name
        result = await asyncio.to_thread(
            whisper_model.transcribe,
            wav_path,
            task="transcribe",
            fp16=False,
        )
        text_value = result.get("text", '')
        text = text_value[0].strip() if isinstance(text_value, list) and text_value else str(text_value).strip()
        
        lang_value = result.get("language", "unknown")
        lang = lang_value[0].lower() if isinstance(lang_value, list) and lang_value else str(lang_value).lower()
    except subprocess.CalledProcessError as e:
        raise HTTPException(500, f"Whisper execution failed: {e}")
    except Exception as e:
        raise HTTPException(500, str(e))
    finally:
        if wav_path:
            try:
                os.remove(wav_path)
            except OSError:
                pass

    if not text:
        return TranscribeTranslateResp(transcript="", translation="", lang=lang)

    # Translate using LibreTranslate API
    try:
        source_lang_code = WHISPER_TO_LIBRETRANSLATE.get(lang, "en")
        
        # Prepare request payload
        payload = {
            "q": text,
            "source": source_lang_code,
            "target": target_lang_code,
            "format": "text",
        }
        
        # Add API key if configured
        if settings.LIBRETRANSLATE_API_KEY:
            payload["api_key"] = settings.LIBRETRANSLATE_API_KEY
        
        # Call LibreTranslate API
        response = await http_client.post(
            f"{settings.LIBRETRANSLATE_URL}/translate",
            json=payload,
            headers={"Content-Type": "application/json"},
        )
        
        if response.status_code != 200:
            raise HTTPException(500, f"LibreTranslate API error: {response.text}")
        
        result = response.json()
        translated = result.get("translatedText", "")
        
    except httpx.HTTPError as e:
        raise HTTPException(500, f"Translation API request failed: {e}")
    except Exception as e:
        raise HTTPException(500, f"Translation error: {e}")

    lang_display = SUPPORTED_LANG_CODES.get(lang, lang)
    return TranscribeTranslateResp(transcript=text, translation=translated, lang=lang_display)

