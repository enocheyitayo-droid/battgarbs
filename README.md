# BattGarbs atelier prototype

Next.js + React/TypeScript application with a private Supabase atelier, Three.js garment viewer, Tailwind utilities and a Node/Express image-edit endpoint. See SETUP.md for database and asset setup.

## Run

Requires Node.js 22+. In this directory:

```sh
npm install
npm run dev
```

Open http://localhost:4173. For a compiled preview: `npm run build`, then `npm start`.

## Enable live OpenAI edits

Copy `.env.example` to `.env`, set `OPENAI_API_KEY` privately, and restart the server. Never put the key in a `VITE_` variable or frontend code. The model defaults to `gpt-image-1.5` and can be changed with `OPENAI_IMAGE_MODEL`. Image-edit support verified against [OpenAI's official edit reference](https://developers.openai.com/api/reference/resources/images/methods/edit). API billing/access are separate from a ChatGPT subscription. A missing key gives a configuration message and never fabricates a successful edit.

The server binds to 127.0.0.1. The private atelier has Supabase authentication, PostgreSQL/RLS and private storage. Keep this build local until you configure and verify the live services, garment licences, rate/cost controls and deployment settings. Only one image edit runs at a time. No reference images or keys are logged. Validated raster images are resized before forwarding to OpenAI.

## Private atelier

- Three approved-asset template definitions and GLB component loading; missing assets/nodes are explicit errors, never procedural substitutes.
- Shared structured configuration, visual materials, undo/redo, version save/reopen/duplicate/export and moodboard images/drawing/notes.
- Email/password authentication, bride/designer/admin roles, private measurements and reference uploads.
- Transactional itemised quotes, approval, orders, production events and private in-app updates. Payments remain unconfigured.
- Linked reception transformations, compatibility validation and assigned-tailor feasibility review.
- Admin roles, materials, production-template approval and audit history.

No licensed garment GLBs or live Supabase configuration are bundled. Local database tests verify RPCs/RLS with embedded PostgreSQL; live Auth/Storage and real garment testing remain pending until setup.

## Legacy demo

- English/German customer journeys, sample dress catalogue, size/colour choice, bag and simulated checkout.
- White image studio with uploads, change suggestions, physical-detachability requests, live image edits, version history, undo/redo, comparison and zoom.
- 3D interaction demo: rotate and zoom, drag sample components, toggle sleeves/train/overskirt, swap silhouette, change colour and visual dress dimensions, and send a snapshot into the design brief. Geometry is procedural illustration, not a real gown model or fit simulation.
- Device-local saved designs and quote requests, JSON exports, existing-dress transformation journey.
- Atelier demo for briefs, draft quotes, stages and separate consultation, sewing and fitting dates (Berlin local time).

The two bridal photos are AI-generated samples, not BattGarbs product photography. Other sample dresses use original illustrative SVG artwork. All prices and customer records are examples. Quotes, checkout and scheduling do not send messages, charge money or reserve real production capacity. The legacy demo uses browser-local storage. The Private atelier uses Supabase and never silently falls back to local data for cloud operations. AI concepts need maker review; they are not patterns or fit guarantees. Pending text requests are labelled as not yet visualised in submitted briefs.

The studio opens in bridal photo mode, showing photorealistic AI-generated front/side/back concepts on white. Swipe or select an angle and save that view into a brief. Lace look currently has a front view only. These are concept angles, not a continuous 3D reconstruction. The procedural 3D interaction demo remains a separate optional tab; AI editing is also optional. Browsing prepared images incurs no API charges.

`public/images/bridal-views.png` was created with built-in imagegen using a three-panel prompt: same adult model in an ivory satin sweetheart A-line gown with off-shoulder sleeves, full-length front/profile/back views, white seamless studio, realistic fabric, no text or logos.

Bridal assets were created with the built-in imagegen tool: `public/images/aurelia-bridal.webp` and `public/images/celeste-bridal.webp` (original PNGs retained). Prompts: an ivory satin A-line sweetheart gown with off-shoulder draped sleeves in a warm white studio; and an ivory lace long-sleeve A-line gown in a white studio. Both request photorealistic full-length adult bridal fashion photography, soft lighting, no text or logos.

## Validation

```sh
npm run build
npm test
npx playwright install chromium
npm run test:ui
```

API tests use an injected provider response and make no paid calls. UI tests cover shopping, edits, undo/brief consistency, persistence, uploads, missing setup, German and mobile overflow. Real live generation requires your configured API access and is not included in mocked verification.

## Editorial brand update — 10 October 2026

The homepage uses the supplied Batt Garbs shield/wordmark, upright Montserrat typography (self-hosted with its OFL licence), black/orange accents, an editorial bridal grid and the supplied dress-only satin image. The hero joins the three supplied clips into a muted loop, with a preserved portrait mobile version and a desktop composition with a soft extended background. It includes play/pause controls and stays paused for reduced-motion preferences. Supplied/generative imagery remains labelled as concept content.

Original clips are in public/videos; the website uses hero.mp4 and hero-mobile.mp4. The supplied logo is preserved at public/brand/batt-garbs-logo.png. The exact original logo font was not provided; Montserrat follows its bold, geometric, upright lettering without altering the logo itself.
