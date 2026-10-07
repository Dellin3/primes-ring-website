# Saturn website: continue GEO work

Production target: https://primes-ring-website-p9yv.vercel.app

This change starts from the actual production branch `codex/primes-feedback-20261001`, commit `49b831d35307d8ca07d0598df9a70f5c0ec01fa2`. Do not deploy the older default `main` tree over this site: preserve the feedback API, contact information, research story, real Cassini images, KaTeX and existing interactive graphs.

## Verify and publish

Run `npm ci`, `npm run lint`, `npm test`, `npm run build`, then `npm run check:seo`. Build produces real React HTML for 19 routes, with 16 public canonical URLs. The client hydrates those same components. `/data` and six `/data/:slug` routes retain interactive tools while exposing the verified archive catalog. `/datasets` and six `/datasets/:slug` pages provide source-backed product descriptions, field units, limits, metadata links and Dataset structured data. `/research` preserves the working-manuscript evidence and scope.

Deploy this tested tree to the existing Vercel project for **p9yv**, retaining feedback configuration. Confirm raw responses for `/`, `/data`, `/research`, `/datasets/rev133e-x43-dlp-500m` and `/feedback`; canonical URLs and titles must match each route. Confirm invalid paths return HTTP 404 and the custom noindex page. `/explorations` and `/feedback` remain available but noindex, and are absent from the sitemap. Never serialize visitor notes into public HTML. Parameterized explorer views use a clean public canonical; notes remain exclusively in browser storage and are never serialized into generated HTML.

After successful deployment run `npm run seo:submit` once. It verifies the deployed public IndexNow key and the live sitemap before sending only same-origin public canonical URLs to IndexNow. Accepted URLs are not guaranteed to be indexed. This command never runs as part of build or CI.

## Custom domain later

Set `VITE_PUBLIC_SITE_URL=https://your-domain.example` before building; the existing `VITE_SITE_URL` alias is also supported. This controls React metadata, JSON-LD, sitemap, robots and llms consistently. Do not invent a domain or purchase one without the user's selected domain. Configure the domain on the existing production project, rebuild, then verify permanent redirects from old URLs to the corresponding new path with query parameters preserved, correct canonicals, key-file access and sitemap origins. Do not redirect every old path to the new homepage.

Google Search Console and Bing Webmaster verification, sitemap submission and AI reporting require the owner's connected accounts or credentials. Preserve the existing Google verification file. Confirm Search generative AI inclusion is enabled. Track real visits and completed tool tasks separately from crawler activity and AI citations; SEO changes do not establish a promised traffic multiplier. llms.txt is an optional documentation index, not a Google ranking factor.

See the existing feedback handoff for deployment credentials and feedback-specific configuration. Do not submit test messages to production as part of read-only checks.
