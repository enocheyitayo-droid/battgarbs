# Batt Garbs production storage plan

Recommendation: keep Netlify for the website and Supabase for PostgreSQL, authentication and private file storage. Choose the specific Central EU (Frankfurt) region for the production project. Do not select a general Europe region if the requirement is specifically EU hosting.

## Records and files

- PostgreSQL: customer accounts/roles, structured garment configurations and linked versions, measurements, material catalogue, quotes, orders, approvals and audit events.
- Public catalogue assets: approved product images, brand assets, licensed garment GLBs and textures. Current hero clips and static catalogue assets can remain on Netlify initially.
- Private uploads: customer dress photos, inspiration boards and generated concepts. Access through authenticated ownership or explicitly assigned-design access, with short-lived signed URLs.
- Private documents: quote PDFs, fitting notes and production handoff documents. Designer access must follow the selected order/quote permissions.
- Backups: database backups plus a separate copy/export of object-storage files. Test restoring both together.

## Work before live customer use

1. Configure a production Supabase project, URL and publishable key, apply reviewed migrations and approve the first designer/admin accounts.
2. Move moodboard image bytes out of design-version JSON into private storage, keeping file IDs/paths in the structured record. The current cloud draft format still embeds moodboard references in its private JSON.
3. Configure upload validation/limits, file lifecycle and deletion, authorised designer sharing and storage backups.
4. Configure transactional email for signup, recovery, quote updates and fitting notices. In-app updates already exist; real email sending is not yet connected.
5. Configure payment-provider test accounts before any live deposits. Existing checkout is explicitly a preview and must not be presented as a completed real payment.
6. Supply approved product data, pricing and licensed, component-ready GLB assets. Marketing images are not editable 3D garment models.
7. Test actual bride/designer accounts on the deployed domain, including cross-user denial, reopen/version consistency and upload privacy.

## Cost and platform choice

Supabase Pro currently starts from US$25/month, with 8 GB database disk and 100 GB file storage in the plan. This is a starting backend price, not the entire website operating cost; hosting, usage overages, email, AI calls and asset production are separate.

Azure Blob Storage is an object-storage service. A full Azure migration would also need database, customer authentication and application integration choices. Consider Azure later if the client already has a Microsoft cloud setup or a specific enterprise requirement. There is no reason to move the present Supabase-backed architecture just to store dress images.

Sources checked 10 October 2026:
- https://supabase.com/pricing
- https://supabase.com/docs/guides/platform/regions
- https://supabase.com/docs/guides/platform/backups
- https://azure.microsoft.com/en-us/products/storage/blobs
- https://azure.microsoft.com/en-us/products/postgresql

Geographic language defaults use Netlify's coarse country information. German is suggested for Germany; English otherwise, with browser language fallback when country is unavailable. A customer's explicit language choice overrides later detection. Flags denote language choices, not verified citizenship, shipping destination or tax location.
