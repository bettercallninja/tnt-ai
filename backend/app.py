import asyncio
import os
import subprocess
import tempfile
from typing import Optional

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import whisper
from settings import settings
from translate_nllb import OfflineTranslator, LANG_NAME_TO_CODE

app = FastAPI(title="Offline STT + Translate")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"], allow_headers=["*"], allow_credentials=True
)

# ----- Load models at startup -----
whisper_model = whisper.load_model(
    settings.WHISPER_MODEL,
    download_root=settings.WHISPER_MODEL_DIR,
)
# NOTE: The SPM models should match the NLLB conversion you used.
translator = OfflineTranslator(
    ct2_dir=settings.CT2_MODEL_DIR,
    spm_src_path=settings.SPM_SRC,
    spm_tgt_path=settings.SPM_TGT,
)

class TranscribeTranslateResp(BaseModel):
    transcript: str
    translation: str
    lang: str  # BCP-47-ish, e.g. "tr", "en", "fa"

SUPPORTED_LANG_CODES = {
    "ar": "Arabic", "en": "English", "fa": "Persian", "tr": "Turkish",
}

BCP_TO_NLLB = {
    "tr": "tur_Latn",
    "en": "eng_Latn",
    "fa": "pes_Arab",
    "ar": "arb_Arab",
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
        text = (result.get("text") or "").strip()
        lang = (result.get("language") or "unknown").lower()
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

    # We assume SPM source model expects source tokens of the transcript language.
    # For multi-lingual routing you can keep multiple SPM pairs and CT2 dirs and select per-request.
    try:
        source_lang_code = BCP_TO_NLLB.get(lang)
        if source_lang_code is None:
            source_lang_code = BCP_TO_NLLB.get("en")
        translated = await asyncio.to_thread(
            translator.translate,
            text,
            target_lang=target_lang_code,
            source_lang=source_lang_code,
        )
    except Exception as e:
        raise HTTPException(500, f"Translation error: {e}")

    lang_display = SUPPORTED_LANG_CODES.get(lang, lang)
    return TranscribeTranslateResp(transcript=text, translation=translated, lang=lang_display)
