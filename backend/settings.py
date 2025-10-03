from pydantic import BaseModel
import os


class Settings(BaseModel):
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8080"))


    # Whisper
    WHISPER_MODEL: str = os.getenv("WHISPER_MODEL", "small") # tiny|base|small|medium|large-v3
    WHISPER_MODEL_DIR: str = os.getenv("WHISPER_MODEL_DIR", "models/whisper")


    # NLLB via CTranslate2
    CT2_MODEL_DIR: str = os.getenv("CT2_MODEL_DIR", "models/ct2-nllb-200-600M-int8")
    SPM_SRC: str = os.getenv("SPM_SRC", "models/spm/src.model")
    SPM_TGT: str = os.getenv("SPM_TGT", "models/spm/tgt.model")


    # Language routing
    DEFAULT_TARGET_LANG: str = os.getenv("DEFAULT_TARGET_LANG", "English") # e.g., "English", "Turkish", "Persian"


settings = Settings()