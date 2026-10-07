# Saturn website: continue GEO work

Production target: https://saturnringlab.com

Former production origin: https://primes-ring-website-p9yv.vercel.app

This change starts from the actual production branch `codex/primes-feedback-20261001`, commit `49b831d35307d8ca07d0598df9a70f5c0ec01fa2`. Do not deploy the older default `main` tree over this site: preserve the feedback API, contact information, research story, real Cassini images, KaTeX and existing interactive graphs.

## Verify and publish

Run `npm ci`, `npm run lint`, `npm test`, `npm run build`, then `npm run check:seo`. Build produces real React HTML for 19 routes, with 16 public canonical URLs. The client hydrates those same components. `/data` and six `/data/:slug` routes retain interactive tools while exposing the verified archive catalog. `/datasets` and six `/datasets/:slug` pages provide source-backed product descriptions, field units, limits, metadata links and Dataset structured data. `/research` preserves the working-manuscript evidence and scope.

Deploy this tested tree to the existing Vercel project for **p9yv**, retaining feedback configuration. Confirm raw responses for `/`, `/data`, `/research`, `/datasets/rev133e-x43-dlp-500m` and `/feedback`; canonical URLs and titles must match each route. Confirm invalid paths return HTTP 404 and the custom noindex page. `/explorations` and `/feedback` remain available but noindex, and are absent from the sitemap. Never serialize visitor notes into public HTML. Parameterized explorer views use a clean public canonical; notes remain exclusively in browser storage and are never serialized into generated HTML.

After successful deployment run `npm run seo:submit` once. It verifies the deployed public IndexNow key and the live sitemap before sending only same-origin public canonical URLs to IndexNow. Accepted URLs are not guaranteed to be indexed. This command never runs as part of build or CI.

## Selected custom domain

The owner selected and purchased `saturnringlab.com`. Configure this domain on the existing **p9yv** production project and set `VITE_PUBLIC_SITE_URL=https://saturnringlab.com` before building; the existing `VITE_SITE_URL` alias remains supported. The source fallback and checked-in discovery templates now use this selected origin. React metadata, JSON-LD, sitemap, robots and llms all use the same build origin. The Research Starter Lab link uses its selected `https://researchstarterlab.com/` origin.

`vercel.json` permanently redirects only the public home, data/explorer, dataset/detail and research routes on the exact old `primes-ring-website-p9yv.vercel.app` host and the `www.saturnringlab.com` host to the corresponding apex-domain path. Host conditions use explicit equality. The apex domain, local development and unrelated preview hosts do not match these migration rules. Existing legacy path redirects remain in place. After publication, verify HTTP 308 responses and preserved query parameters on actual deployed responses, then verify new-domain canonicals, the IndexNow key and discovery-file origins. Do not redirect every old path to the new homepage.

Keep the former origin's `/explorations`, `/feedback`, `/api/*` and static assets accessible. Browser-local notebook records belong to their original browser origin and cannot be transferred by a domain redirect; visitors can still read and export existing notes from the former `/explorations` page. The existing notebook has an export function; it does not yet offer a backup-import UI. The feedback server explicitly trusts both the selected apex and the former production origin while retaining its existing CSRF checks and trusted deployment-origin logic. Those private pages retain noindex and remain absent from the sitemap. Do not use a project-wide redirect for the old origin, and do not redirect feedback POST requests or serialize visitor notes into public HTML. The `www` origin may use a separate Vercel domain redirect to the apex once added to the same project.

When changing domains again, update both the build origin and these explicit host migration rules. A build-origin override alone does not alter deployment redirect destinations.

Google Search Console and Bing Webmaster verification, sitemap submission and AI reporting require the owner's connected accounts or credentials. Preserve the existing Google verification file. Confirm Search generative AI inclusion is enabled. Track real visits and completed tool tasks separately from crawler activity and AI citations; SEO changes do not establish a promised traffic multiplier. llms.txt is an optional documentation index, not a Google ranking factor.

See the existing feedback handoff for deployment credentials and feedback-specific configuration. Do not submit test messages to production as part of read-only checks.
