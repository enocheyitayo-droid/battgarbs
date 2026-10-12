# Modal deployment preparation

Chosen host: Modal. The prepared app is CPU-only for background removal. FLUX/ControlNet and TripoSR are not installed or deployed. No cloud resources were launched while preparing this file.

1. Set up a Modal account/workspace and determine a spending ceiling before deploying. Install the Modal CLI in a development environment and authenticate with `modal token new`. Do not paste tokens into chat or commit them.
2. Create a Modal Secret named `battgarbs-ai-worker` containing AI_WORKER_TOKEN. Use the same private value in Netlify's function environment. Never expose it as NEXT_PUBLIC_.
3. Prepare the checksum-verified U2NETp weights as described in README.md. The Modal image includes only the Python code, dependencies and weight file; it does not copy your .env or customer photos.
4. After account/budget approval, run `modal deploy ai-worker/modal_app.py` from the project root. Deployment can incur image-build and runtime charges. The configuration uses EU placement and eu-west routing, one CPU, 2 GB RAM, a maximum of one container, no minimum warm containers and a 60-second scale-down window. These concurrency settings are not a hard monthly spending cap.
5. Use the returned HTTPS ASGI base URL as AI_WORKER_URL in Netlify. Do not append /runsync or replace it with a RunPod endpoint. Our route posts multipart image bytes to /api/clean-background.
6. Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in Netlify, apply migrations 001 and 002 in the production Supabase project, and redeploy the website. The current private-designs bucket remains in use.
7. Verify /health, a token-authenticated inference, cross-user storage denial and the full saved-image flow before inviting customers. Test cold starts as well as warmed requests. The website's 25-second worker timeout remains in place. If cold starts exceed it, implement queued jobs with polling rather than promising synchronous completion.

Modal's EU placement is broader than a specific Frankfurt Supabase project. Verify provider data-residency settings against the client's requirements before sending customer photos. Model generation will need a separately configured, licensed GPU backend and measured budgets; it is not enabled merely by choosing Modal.

References: https://modal.com/docs/guide/webhooks, https://modal.com/docs/guide/secrets, https://modal.com/docs/guide/region-selection and https://modal.com/pricing

Modal documents that payloads larger than 2 MiB may use object storage in us-east even with regional routing. EU placement alone is not an assurance of EU-only processing. Review the complete transfer requirements before customer uploads; the image endpoint must remain disabled until the agreed processing setup is approved.
