#!/usr/bin/env bash
set -euo pipefail
# This script outlines how to place converted models locally.
# 1) Obtain NLLB-200 distilled 600M (fairseq) and matching tokenizer files.
# 2) Convert to CTranslate2 INT8.
# 3) Place outputs under backend/models/ accordingly.

# Example (pseudo-steps, adapt to your paths):
# ct2-converter --model_dir /path/to/nllb/fairseq --output_dir models/ct2-nllb-200-600M-int8 --quantization int8
# cp /path/to/spm/src.model models/spm/src.model
# cp /path/to/spm/tgt.model models/spm/tgt.model

echo "✅ After running, ensure paths in settings.py match your files."
