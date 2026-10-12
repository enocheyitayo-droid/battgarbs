"""Authenticated CPU background worker. No fabricated redesign or 3D results."""
import asyncio
import io
import os
import secrets
from pathlib import Path
from functools import lru_cache
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, Header, HTTPException, Depends
from fastapi.responses import Response, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, ImageOps, UnidentifiedImageError
from starlette.concurrency import run_in_threadpool

MAX_BYTES = 2 * 1024 * 1024
Image.MAX_IMAGE_PIXELS = 20_000_000
ALLOWED = {"PNG", "JPEG", "WEBP"}

def authorize(authorization: str = Header(default="")):
    token = os.getenv("AI_WORKER_TOKEN", "")
    if len(token) < 32:
        raise HTTPException(503, "Worker authentication is not configured.")
    if not secrets.compare_digest(authorization, "Bearer " + token):
        raise HTTPException(401, "Worker authentication failed.")

@lru_cache(maxsize=1)
def session():
    directory = Path(os.getenv("U2NET_HOME", str(Path(__file__).parent / "models"))).resolve()
    # Provision weights explicitly. An HTTP request must never download models.
    if not (directory / "u2netp.onnx").is_file():
        raise HTTPException(503, "Background model is not prepared. See worker setup.")
    os.environ["U2NET_HOME"] = str(directory)
    try:
        from rembg import new_session
        return new_session("u2netp", providers=["CPUExecutionProvider"])
    except Exception:
        raise HTTPException(503, "Background model could not be loaded.")

def remove_foreground(image):
    from rembg import remove
    return remove(image, session=session())

def clean_image(data: bytes, remover=remove_foreground) -> bytes:
    try:
        with Image.open(io.BytesIO(data)) as source:
            if source.format not in ALLOWED:
                raise HTTPException(400, "Use a PNG, JPEG or WebP image.")
            if source.width * source.height > Image.MAX_IMAGE_PIXELS:
                raise HTTPException(413, "Image dimensions are too large.")
            source.load()
            image = ImageOps.exif_transpose(source).convert("RGBA")
            image.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
        cutout = remover(image).convert("RGBA")
        if cutout.size != image.size:
            raise HTTPException(502, "Invalid model output.")
        background = Image.new("RGBA", cutout.size, (255, 255, 255, 255))
        result = Image.alpha_composite(background, cutout).convert("RGB")
        output = io.BytesIO()
        result.save(output, format="PNG", optimize=True)
        if output.tell() > MAX_BYTES:
            raise HTTPException(413, "Processed image exceeds the storage limit.")
        return output.getvalue()
    except HTTPException:
        raise
    except (UnidentifiedImageError, OSError, ValueError):
        raise HTTPException(400, "The file is not a readable image.")
    except Image.DecompressionBombError:
        raise HTTPException(413, "Image dimensions are too large.")

def create_app(remover=remove_foreground):
    @asynccontextmanager
    async def lifespan(_app):
        directory = Path(os.getenv("U2NET_HOME", str(Path(__file__).parent / "models")))
        if remover is remove_foreground and len(os.getenv("AI_WORKER_TOKEN", "")) >= 32 and (directory / "u2netp.onnx").is_file():
            # Keep expensive model initialization outside a short Netlify call.
            await run_in_threadpool(session)
        yield
    app = FastAPI(title="Batt Garbs AI Worker", lifespan=lifespan)
    app.add_middleware(CORSMiddleware, allow_origins=os.getenv("AI_ALLOWED_ORIGINS", "http://localhost:4173").split(","), allow_credentials=False, allow_methods=["POST", "GET"], allow_headers=["Authorization", "Content-Type"])
    lock = asyncio.Lock()

    @app.middleware("http")
    async def protect_upload(request, call_next):
        # Authenticate and bound the body before multipart parsing. The Next
        # caller sends a known-size Blob, so chunked uploads are unnecessary.
        if request.url.path.startswith("/api/"):
            try:
                authorize(request.headers.get("authorization", ""))
            except HTTPException as error:
                return JSONResponse({"detail": error.detail}, status_code=error.status_code)
            if request.method == "POST" and request.url.path == "/api/clean-background":
                try:
                    length = int(request.headers.get("content-length", "0"))
                except ValueError:
                    length = 0
                if length <= 0 or request.headers.get("transfer-encoding"):
                    return JSONResponse({"detail": "A known-size upload is required."}, status_code=411)
                if length > 3 * 1024 * 1024:
                    return JSONResponse({"detail": "Upload body exceeds the limit."}, status_code=413)
        return await call_next(request)

    @app.get("/health")
    def health():
        return {"service": "battgarbs-worker", "background_model_prepared": (Path(os.getenv("U2NET_HOME", str(Path(__file__).parent / "models"))) / "u2netp.onnx").is_file(), "redesign_available": False, "reconstruction_available": False}

    @app.post("/api/clean-background", dependencies=[Depends(authorize)])
    async def clean_background(file: UploadFile = File(...)):
        if file.content_type not in {"image/png", "image/jpeg", "image/webp"}:
            raise HTTPException(400, "Use PNG, JPEG or WebP.")
        data = await file.read(MAX_BYTES + 1)
        await file.close()
        if not data or len(data) > MAX_BYTES:
            raise HTTPException(413, "Image must be between 1 byte and 2 MB.")
        if lock.locked():
            raise HTTPException(429, "Worker is busy. Retry shortly.")
        async with lock:
            try:
                output = await run_in_threadpool(clean_image, data, remover)
            except HTTPException:
                raise
            except Exception:
                raise HTTPException(503, "Background processing failed. Retry or check worker setup.")
        return Response(output, media_type="image/png", headers={"Cache-Control": "no-store"})

    @app.post("/api/generate-3d", dependencies=[Depends(authorize)])
    async def generate_3d():
        raise HTTPException(501, "No reconstruction backend is installed. A photo-to-mesh output does not automatically contain editable garment components.")

    @app.post("/api/redesign", dependencies=[Depends(authorize)])
    async def redesign():
        raise HTTPException(501, "No licensed redesign model is installed.")

    return app

app = create_app()
