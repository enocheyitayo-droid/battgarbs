# Account-free background worker demo

Run from the Batt Garbs project folder:

```powershell
npm run demo:background
```

This sends one sample dress image to the configured Modal worker. Real worker usage may be billable. To use your own photo:

```powershell
npm run demo:background -- "C:\path\dress.png"
```

Open outputs/worker-demo/index.html after a successful run. It shows the original and actual processed PNG side by side. Files are stored only on this computer; there is no Supabase storage, customer authentication or cloud database in this demo. Errors do not create a fabricated success result.

.env.local now contains the specified Modal HTTPS URL and the existing private worker token. The two requested Supabase settings are blank until you create a project. The token must match the battgarbs-ai-worker secret on Modal.

The production route /api/ai/process remains authenticated and requires Supabase. It sends Bearer AI_WORKER_TOKEN server-side, reserves a quota-controlled job, stores the original and processed PNG in private-designs, and returns a five-minute signed preview URL. Migration 003 adds public-catalogue and private-atelier without changing private-designs paths. Local SQL tests verify measurement ownership, assigned designer access, unrelated-user denial and private storage policies. Remote migrations and the complete Supabase flow cannot run before a project is configured.

## Design studio upload integration

Create your own design now posts uploaded references to /api/ai/background whenever /api/status reports workerConfigured. The canvas keeps the original as version one and displays the returned studio PNG as version two, with undo/redo and comparison. A configured worker suppresses the general missing-AI setup notice; background removal does not imply garment redesign support.

Without Supabase, LOCAL_BACKGROUND_DEMO=true enables processing only in development on localhost. The browser receives image bytes and saves through the existing device design demo; no Supabase persistence is claimed. In production, the route delegates to the authenticated quota/storage processor and requires configured Supabase. Local worker credentials are never returned in status or image responses. Configure AI_WORKER_URL and AI_WORKER_TOKEN in the hosting environment separately before expecting the shared site to use Modal.

Generate concept now prepares the existing raster preview and saves the written design choices without calling OpenAI. It reuses a Modal-prepared image or attempts background removal once; worker failures gracefully use the local reference. Each brief entry states that requested garment changes are not rendered. No generative credits are required for this action.

