# Background-processing worker

This is a separate Python/FastAPI CPU service, not a Netlify Python function. The Next.js upload route authenticates the Supabase user, uses their RLS-protected storage access, reserves a rate-limited processing record and forwards bytes to the token-protected worker. It returns the actual saved studio PNG and a short-lived private preview. Failed processing attempts to remove uploaded files and marks the job failed. The original image is kept separately when processing succeeds.

## Local setup

Use Python 3.11+ and create a virtual environment in this folder. Install requirements.txt. Tests also require httpx. A local virtual environment has been prepared in .venv.

Set U2NET_HOME to this folder's models directory and provision u2netp.onnx there before starting. Model loading does not download weights during HTTP requests. The official rembg source specifies https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2netp.onnx with MD5 8e83ca70e441ab06c318d82300c84806. The locally prepared file was checked against that value. Models and virtual environments are ignored and are not bundled into the website deployment. Review each model's own licence before commercial hosting; rembg's code licence does not automatically license every supported model.

Add AI_WORKER_URL=http://localhost:8000 and a random AI_WORKER_TOKEN of at least 32 characters to the app's private .env file. Do not use NEXT_PUBLIC_ and do not paste the token into chat. The same token must be supplied to the worker. Install python-dotenv when using uvicorn --env-file.

From the app root, run:

```powershell
./ai-worker/.venv/Scripts/python.exe -m uvicorn main:app --app-dir ai-worker --host 127.0.0.1 --port 8000 --env-file .env
```

Restart the Node server after setting its environment. Apply supabase/migrations/002_image_jobs.sql after migration 001. The account must have a public.users profile. The existing private-designs bucket is used; there is no new unrestricted private-atelier bucket or service-role upload bypass.

In Private atelier → Create your dress, use “Prepare a white studio image”. Sign in, select a PNG/JPEG/WebP up to 2 MB, process and add the stored image to the moodboard. A failed retry preserves the last successful preview. The signed preview expires in five minutes; adding the image downloads the private saved object through the authenticated session. The moodboard still stores its references as private JSON image data pending the object-reference migration described in PRODUCTION-STORAGE.md.

## Hosting

Run the worker on a separate HTTPS container/VM with Python, CPU ONNX dependencies and persistent model files. One process handles one inference at a time. Set matching AI_WORKER_TOKEN values in the worker and Netlify function environment, and set AI_WORKER_URL to the real HTTPS service URL. localhost on Netlify refers to Netlify's own runtime, not this computer. Redeploy after configuring variables. Build the website on Linux before enabling production image processing, so Sharp's native dependencies match the hosted runtime.

U2NETp background removal is CPU-capable. It preserves a detected foreground, including a person wearing the dress. It is not clothing-only segmentation, body removal or construction/fit verification. Fine lace and transparent fabrics require maker review.

Requests must be token-authenticated and have a known body size. Limits are 2 MB/image, 20 million input pixels, resized to a maximum of 1024 pixels per side, with a 2 MB PNG output cap. The Next route times out after 25 seconds. The database enforces five reservations per fifteen minutes and twenty per day per user. Failures count toward these limits. A cold worker may require prewarming; sustained workloads should use an asynchronous job queue rather than increasing Netlify request timeouts indefinitely.

## Redesign and reconstruction

/api/redesign and /api/generate-3d return 501. No FLUX, ControlNet, TripoSR or InstantMesh backend is installed. A single-image reconstruction mesh is not automatically split into independently editable Bodice, Skirt, Sleeves, Train and Overskirt parts. Do not rename a complete mesh or duplicate it to pretend those components exist. Future reconstruction outputs require private ownership, actual GLB validation, component inspection and maker approval before connecting them to AssetViewer.

## Verification

```powershell
./ai-worker/.venv/Scripts/python.exe -m unittest discover -s ai-worker -p test_main.py
npm test
npm run build
```

The worker tests inject a known foreground mask to verify actual PNG output, white compositing, upload limits, authentication and unavailable-3D responses. Route tests inject storage/auth/provider responses; PostgreSQL tests verify private jobs and quotas. These do not prove a live Supabase deployment. A real local U2NETp check passed on 11 October 2026: RGB PNG output, 573 × 1024, 201,162 bytes. The initial cold run took 113 seconds including first-time initialization. After prewarming, requests took approximately 1.5 seconds on this machine; production hardware and load will differ. Startup now warms the configured model before accepting requests.

References: https://github.com/danielgatis/rembg and https://github.com/VAST-AI-Research/TripoSR/blob/main/run.py
