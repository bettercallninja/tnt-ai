from __future__ import annotations

import ctranslate2
import sentencepiece as spm
from typing import List, Optional


# Simple language name → code map for display; adjust as needed.
LANG_NAME_TO_CODE = {
    "Turkish": "tur_Latn",
    "English": "eng_Latn",
    "Persian": "pes_Arab",
    "Farsi": "pes_Arab",
    "Arabic": "arb_Arab",
}


def _as_lang_token(code: str) -> str:
    normalized = code.strip()
    if not normalized:
        raise ValueError("language code cannot be empty")
    if normalized.startswith("__") and normalized.endswith("__"):
        return normalized
    return f"__{normalized}__"


class OfflineTranslator:
    def __init__(self, ct2_dir: str, spm_src_path: str, spm_tgt_path: str, device: str = "cpu"):
        self.translator = ctranslate2.Translator(ct2_dir, device=device)
        self.spm_src = spm.SentencePieceProcessor(model_file=spm_src_path)
        self.spm_tgt = spm.SentencePieceProcessor(model_file=spm_tgt_path)


    def _tokenize(self, text: str) -> List[str]:
        return self.spm_src.encode(text, out_type=str)


    def _detokenize(self, tokens: List[str]) -> str:
        return self.spm_tgt.decode(tokens)


    def _guard_token(self, processor: spm.SentencePieceProcessor, token: str) -> str:
        if processor.piece_to_id(token) < 0:
            raise ValueError(f"SentencePiece model is missing required token: {token}")
        return token


    def translate(
        self,
        text: str,
        *,
        target_lang: str,
        source_lang: Optional[str] = None,
        beam_size: int = 4,
    ) -> str:
        if not text.strip():
            return ""
        tokens = self._tokenize(text)

        if source_lang:
            source_token = self._guard_token(self.spm_src, _as_lang_token(source_lang))
            if not tokens or tokens[0] != source_token:
                tokens = [source_token] + tokens

        target_prefix = None
        if target_lang:
            target_token = self._guard_token(self.spm_tgt, _as_lang_token(target_lang))
            target_prefix = [[target_token]]

        results = self.translator.translate_batch(
            [tokens],
            beam_size=beam_size,
            target_prefix=target_prefix,
        )
        best = results[0].hypotheses[0]
        return self._detokenize(best)