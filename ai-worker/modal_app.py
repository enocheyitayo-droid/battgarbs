"""Prepared Modal deployment; importing this file does not deploy or bill a worker."""
from pathlib import Path
import hashlib
import modal

ROOT = Path(__file__).resolve().parent
MODEL = ROOT / "models/u2netp.onnx"
if not MODEL.is_file() or hashlib.md5(MODEL.read_bytes()).hexdigest() != "8e83ca70e441ab06c318d82300c84806":
    raise RuntimeError("Prepare the verified U2NETp weight file before deploying.")

image = (
    modal.Image.debian_slim(python_version="3.12")
    .pip_install_from_requirements(str(ROOT / "requirements.lock.txt"))
    .add_local_file(str(ROOT / "main.py"), "/app/main.py", copy=True)
    .add_local_file(str(MODEL), "/models/u2netp.onnx", copy=True)
    .env({"U2NET_HOME": "/models", "NUMBA_CACHE_DIR": "/tmp/numba"})
)
app = modal.App("battgarbs-background-worker")

@app.function(
    image=image,
    secrets=[modal.Secret.from_name("battgarbs-ai-worker", required_keys=["AI_WORKER_TOKEN"])],
    cpu=1.0,
    memory=2048,
    timeout=300,
    max_containers=1,
    min_containers=0,
    scaledown_window=60,
    region="eu",
    routing_region="eu-west",
)
@modal.asgi_app()
def worker():
    import sys
    sys.path.insert(0, "/app")
    from main import app as api
    return api
