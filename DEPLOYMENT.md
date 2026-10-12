# Batt Garbs shared site

Live URL: https://battgarbs-atelier-7d4c2a.netlify.app
Netlify project: https://app.netlify.com/projects/battgarbs-atelier-7d4c2a
Published deploy: 6acb7c45b321ea96f1777e0f
Updated: 11 October 2026

Larger horizontal header wordmark sourced from the existing BattGarbs site. Original four-ring Rey spinner geometry/CSS animation integrated with a bounded loading lifecycle and reduced-motion support. Country-based language suggestion uses a Netlify Edge Function; language flags offer English/German with a remembered manual override. Prototype banner/footer wording removed. Sample content and unconfigured operations remain clearly described.

Twenty existing desktop/mobile checks and two region/preference checks passed locally. The live country endpoint returned HTTP 200 with the expected language mapping. Local credentials were excluded from staging and server archive. See PRODUCTION-STORAGE.md for the Supabase/Azure recommendation and remaining production configuration.

Manual deployments are snapshots; editing localhost does not automatically publish.

Latest update: redesigned responsive footer, restrained scroll reveals and loading transitions on new page navigation. Build and 13 server tests passed; desktop/mobile transition and corrected studio interaction checks passed. Deployment secret scan found zero matches. Modal CPU worker preparation is documented; no cloud worker was launched. Supabase configuration remains pending.

