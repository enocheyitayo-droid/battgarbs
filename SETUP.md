# Platform setup

The app uses Next.js, React/TypeScript, Tailwind utilities plus atelier CSS, Three.js, an Express image endpoint and Supabase/PostgreSQL. Next.js runs behind the custom Node server so the existing image API stays server-only. Existing storefront and device-local demo remain available; the Private atelier is the persistent production workspace.

## Supabase

1. Use a new development Supabase project. Apply supabase/migrations/001_platform.sql in its SQL editor. The migration defines tables, RLS, restricted transactional RPCs and a private storage bucket. It is intended for a fresh public schema, not an existing unrelated production project.
2. Add SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY to .env. Use an sb_publishable_ key. No service-role or secret key is needed or accepted by the public configuration endpoint. Keep OPENAI_API_KEY server-only.
3. Set Auth site URL and redirects to http://localhost:4173 during local development. Enable email/password. Use real confirmed accounts; confirmation delivery depends on your Supabase mail configuration.
4. Restart npm run dev. Register test bride and designer accounts in Private atelier. New users are always brides; signup metadata cannot grant a privileged role.
5. Bootstrap one administrator in the SQL editor using its verified auth user UUID: update public.users set role='admin' where id='<verified UUID>'; then sign in as this administrator and approve the designer role in Administration.
6. Add licensed models following public/models/README.md. Inspect each dress and component. Enable approved templates through SQL: update public.garment_templates set enabled=true where id='aurelia'; drafts may be saved with missing assets but quotes require an approved template and the UI requires a successfully loaded model.

## Journey

Register/confirm bride → select garment/components/material → moodboard → save draft → reopen exact version → save linked reception transformation → choose approved designer → optionally share one private measurement record → submit quote. Designer signs in → opens submitted version → reviews shared measurements and transformation feasibility → issues itemised quote. Bride approves quote → order created with payment_status=not_configured. Designer advances sewing → fitting → completed. Events and private in-app notifications are recorded transactionally. No payment is taken or marked successful. Email/SMS, deposits, live fabric physics and automated sewing patterns are not implemented.

Measurements are stored only in PostgreSQL, never device-local storage. Access is owner-only except the specific record deliberately linked to a quote for its assigned designer. Private storage restricts object paths to authenticated-user UUID folders. Moodboard references are currently saved inside the private design version JSON; the Saved designs tab also supports separate private reference uploads and short-lived signed previews.

## Validation

npm run build
npm test
$env:PLAYWRIGHT_CHANNEL='chrome'; npm run test:ui

Database tests use embedded PostgreSQL (PGlite) with minimal Auth/Storage stubs to verify migrations, RPCs and RLS. They do not prove the live Supabase Auth, email delivery, Storage service or your actual GLB assets. Run the live journey after supplying credentials/assets; do not report these live checks as passed beforehand.

## Integration references

No third-party garment engine is embedded. CLO API plugins run in CLO, and exported web assets are a separate workflow. Review commercial asset and software licences with the supplier. Tailornova, Zakeke and Browzwear are references rather than copied assets or integrated services.
- https://developer.clo3d.com/
- https://support.clo3d.com/hc/en-us/articles/360051525034-glTF-2-0-GLTF-GLB-File
- https://tailornova.com/faq
- https://www.zakeke.com/integrations/api/
- https://help.browzwear.com/
- https://supabase.com/docs/guides/database/secure-data

## Verified locally

Production Next.js build and TypeScript checks passed. Eight Node/PostgreSQL checks passed, including the quote/order lifecycle, transformation review, private measurements, immutable events, private storage paths, signup-role escalation prevention and secret-safe API configuration. Sixteen desktop/mobile browser checks passed across the final runs; the model-control check uses a synthetic test-only glTF fixture, not a supplied bridal garment. Live Supabase authentication/email/storage and real bridal GLB validation have not run because the URL, publishable key and garment files are still absent locally.

## Netlify

The site uses Netlify's current automatic Next.js adapter and the app/api route handlers; the local custom Express process is not required on Netlify. netlify.toml publishes .next after npm run build. .netlify linking metadata is ignored.

Keep OPENAI_LIVE_ENABLED unset for a client demonstration. Hosted edits then return an explicit unconfigured state without making paid calls. To enable later, configure OPENAI_LIVE_ENABLED=true, OPENAI_API_KEY, SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY privately in Netlify's environment settings, with appropriate function/build scopes, and redeploy. Configure account rate/cost controls before opening live generation to customers. Never copy .env into published output or use NEXT_PUBLIC_ for secrets. Add the final hosted URL to Supabase Auth's permitted site/redirect URLs.

A manual deploy is a snapshot; local changes do not update the shareable site automatically.

### Windows packaging

The local Netlify adapter may require symlinks that Windows does not allow for this session. scripts/netlify-windows.cjs scopes an ordinary-file-copy fallback to this project's generated function staging folder. Load it with NODE_OPTIONS when running the local Netlify build.

Use build:share for the client preview. After Netlify packaging, run scripts/sanitize-netlify.ps1: the adapter can copy the project's .env independently of the Next.js build. This script removes local environment files only from generated staging and the function archive, preserving the original project environment file. Verify both the archive and static files before uploading. Do not publish a standalone server archive containing your local environment file.

For a prebuilt local deploy, use --no-build, --dir .netlify/static and --functions .netlify/functions-internal; do not upload the raw .next directory as static files. The generated Netlify function manifest provides the server routes.
