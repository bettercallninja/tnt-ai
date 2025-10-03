# CPU-only, small and simple
FROM python:3.11-slim

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
EXPOSE 8080
ENV HOST=0.0.0.0 PORT=8080 WHISPER_MODEL=small \
    CT2_MODEL_DIR=models/ct2-nllb-200-600M-int8 \
    SPM_SRC=models/spm/src.model \
    SPM_TGT=models/spm/tgt.model

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "1"]
