# Production implementation status

## Database and storage
Supabase configuration is pending. The app accepts SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY, or their documented NEXT_PUBLIC aliases. A service-role key is not required for customer operations. Apply migrations 001, 002 and 003 to the agreed project after reviewing them. Existing private-designs paths remain active; migration 003 adds public-catalogue and private-atelier without moving existing files. Measurements remain in protected PostgreSQL tables.

## Worker hosting
Modal CPU deployment is prepared in ai-worker/modal_app.py and validated locally. It has not been deployed. Follow ai-worker/MODAL-SETUP.md after configuring the account and spending ceiling. Background removal is implemented; cloud image flow still needs connected Supabase and worker verification. Cold starts may require asynchronous jobs. No GPU resources have been launched.

## Configurable garment assets
Approved GLB assets with the documented component nodes are still needed. Missing assets remain reported explicitly. A reconstructed single mesh does not provide independently detachable garment parts or validated sewing patterns.

## Advanced generation
FLUX/ControlNet and TripoSR are not implemented. Select licensed compatible model checkpoints and test preservation of garment details before enabling them. Benchmark end-to-end upload, inference, mesh export and download; do not promise 0.5-second delivery or production-ready garment geometry.

## Payments and notifications
Real payment provider configuration, verified webhooks and transactional email domain setup remain pending. Simulated checkout does not confirm a real payment. Production launch requires access-control checks, storage checks and the complete customer/designer journey against the connected services.
