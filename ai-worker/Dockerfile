FROM python:3.12-slim
WORKDIR /app
COPY requirements.lock.txt ./
RUN pip install --no-cache-dir -r requirements.lock.txt && useradd --uid 10001 --create-home atelier
COPY main.py ./
# Prepare verified/licensed weights locally before building this worker image.
COPY models/u2netp.onnx ./models/u2netp.onnx
ENV U2NET_HOME=/app/models NUMBA_CACHE_DIR=/tmp/numba PYTHONDONTWRITEBYTECODE=1
USER atelier
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
