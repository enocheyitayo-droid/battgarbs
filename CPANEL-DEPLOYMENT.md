# cPanel staging deployment

Staging domain: https://staging.battgarbs.de/
App root: /home/battlykz/battgarbs-staging-app
Separate document root: /home/battlykz/staging.battgarbs.de
Runtime: Node.js 22.23.3, production mode.
Startup file: cpanel-server.cjs (Next.js HTTP server under Passenger).

The original battgarbs.de site and mail setup are preserved. Supabase and AI credentials have not been transferred. Configure production credentials separately after verifying the agreed privacy and storage setup.

Build with npm run build:share, package using scripts/package-cpanel.py. The package excludes local env files, raw work archives, node_modules, development output and build cache. Install dependencies on the Linux host using cPanel's Run NPM Install button, then Restart. Public file permissions must be 0644 (directories 0755), so Apache can serve them. A separate public-media repair archive was used for the first deployment.

Before switching the main domain, preserve a full backup of its WordPress files/database and record routing. Verify all staging pages, media and server APIs. No main-domain switch has been performed.

Verified: staging HTTPS homepage, hero video, logo, white-studio images, responsive About mini-gallery (6 images), Inspiration navigation, 3 muted videos and no audio elements. Status and platform config endpoints return 200 with unconfigured services; main domain still responds 200. No credentials were copied. Proof screenshot: outputs/cpanel-staging-proof.png.

