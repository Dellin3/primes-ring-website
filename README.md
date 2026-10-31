# Saturn — A Cassini Explorer

A sourced website about the whole of Saturn, built by the MIT PRIMES Saturn rings team for two audiences: students and amateur astronomers, and researchers who want the data. The team's own project research is one section of the site, archived year by year.

- **The planet** (`/planet`): key facts, interior, weather (including the 2026 ten-sided south-pole wave), seasons, day length and magnetic field. Every number names the page it was checked against.
- **The rings** (`/rings`): a to-scale ring map whose regions open the data explorer, the PDS ring table, a glossary for reading a radio signal, five guided observations in real Cassini data, and the open question of the rings' age. The data explorer (`/data`) and observation catalog (`/datasets`) belong to this section.
- **The moons** (`/moons`): nine highlight cards and a sortable, filterable table of sixteen moons, downloadable as CSV.
- **Missions** (`/missions`): a sourced timeline from Galileo to Dragonfly.
- **Research** (`/research`): the PRIMES project archive, one record per cohort. `/research/2026` is the 2026 team's full research story.
- **Explore data:** six Cassini RSS observations, three signal variables, exact radial windows, two-point comparison, and CSV export.
- **My notebook:** autosaved drafts, named observations, restore, rename, delete, and export. Notes stay in the current browser; there is no account or cloud synchronization.
- **Feedback:** a persistent entry opens `/feedback`, a standalone Saturn-background page with one form for name, email, problem type, and message. Failed submissions preserve the text; an email fallback appears if direct submission is unavailable.

**Project research 2026** connects Padé / least-squares initialization, continuation, refinement, and branch bookkeeping to three reported result sets: local angular-integral accuracy, generic-fold verification, and synthetic branch identity. **Sources & credits** keeps provenance and attribution together. Previous public routes redirect to the relevant retained destination.

## Run locally

```sh
npm ci
npm run dev
```

## Verify

```sh
npm run lint
npm test
npm run build
npm run check:seo
```

The automated checks cover all six observation products (1,566,902 converted rows, 193 SHA-256 chunk hashes), display coordinates, exact export precision, notebook persistence, and saved-record/draft restoration. `tests/saturn-content.test.mjs` re-measures every number quoted in the guided ring observations from the exact Cassini chunks, checks that each guided link opens an exact-size window, and checks that every cited source exists and uses HTTPS. Automated checks do not substitute for a live browser review.

After editing `src/content/moons.js`, run `npm run data:moons` to regenerate `public/downloads/saturn-major-moons.csv`; a test fails if the page and the download disagree.

## Data and interpretation

`public/data/observations` contains the converted public NASA PDS Cassini RSS diffraction-limited profiles. Wide views use a reduced overview. Small windows load the original converted Float64 rows and verify their hashes before exact inspection and export. The calibrated profiles retain diffraction effects; they are not new high-resolution reconstruction results. Missing and negative measurements remain unchanged. Stored phase values are plotted without connecting or unwrapping them.

Research methods and results are transcribed from the team's supplied working manuscript, sections 3–6. The website does not run the scientific reconstruction solver. Table 3's eight local angular-integral offsets give maximum symmetric discrepancy **59.5629% → 2.2872%**; the conclusion's **0.0242%** maximum conflicts with the table, body, and Figure 18. The 37.5% reduction is in integrand sampling work against all-quadrature, not measured runtime. Source details and limits are recorded in `docs/TEAM_RESEARCH_EVIDENCE.md`.

The full manuscript and scientific solver are not hosted here. The archive record count is not a method benchmark or a claim about how much data the team used in its experiments. The reported scalar-phase tests do not establish a complete high-resolution ring reconstruction. The Saturn background is artistic imagery, not an observational reconstruction.

## Interface structure

- `src/orbit/OrbitShell.jsx`: shared space background, navigation, and source dialog.
- `src/orbit/Home.jsx`: entry, the five-section index, and an actual observation overview.
- `src/orbit/SaturnPage.jsx` and `SaturnPage.css`: shared section-page parts (hero, chapters, source notes, sources card), reusing the research story's styles.
- `src/orbit/Planet.jsx`, `Rings.jsx` (with `RingMap.jsx`), `Moons.jsx`, `Missions.jsx`: the four Saturn sections.
- `src/orbit/ResearchArchive.jsx` and `CohortPage.jsx`: the year-by-year PRIMES archive and the template for future cohorts.
- `src/content/saturn.js`: the source registry, key facts and section list; `rings.js`, `moons.js`, `missions.js` and `primesCohorts.js` hold each section's content.
- `src/content/photos.js`: the NASA photographs on the section pages, each with its NASA page, credit and how its colors were made (see `docs/SITE_ARCHITECTURE.md`).
- `src/orbit/Explorer.jsx`: data workspace.
- `src/orbit/Notebook.jsx`: observation notebook and access to all observations.
- `src/orbit/Research.jsx`: the 2026 team's research story and data coverage (`/research/2026`).
- `src/orbit/ResearchMethod.jsx`: three-stage method explanation and branch teaching model.
- `src/orbit/ResearchEvidence.jsx`: reported result views and Table 3 chart.
- `src/content/paperEvidence.js`: source-attributed numerical evidence, not simulated outputs.
- `src/lib/explorerSession.js`: restoration and URL identity rules.
- `src/lib/explorations.js`: existing versioned browser storage, preserved across the redesign.

## Deployment

Deploy this source as the existing **Vite** project on Vercel (`npm run build`, output `dist`). Keep the root `api/` directory and `vercel.json`; uploading only `dist` does not include the feedback receiver. See [Codex deployment handoff](CODEX_HANDOFF.md) for the approved design, branch, and target project.

For direct form submissions, follow **[反馈功能部署说明](docs/FEEDBACK_SETUP.md)**: connect a **private** Vercel Blob store, configure Resend, and set the server-only environment variables from `.env.example`. Feedback is stored privately before a notification is requested for `Zhuoxuan780123@gmail.com`. If the receiver is unconfigured or unreachable, the page offers an email fallback; it never reports an unsaved message as submitted.

`npm run dev` previews the interface without Vercel Functions. Use `vercel dev` for a real local API check. Mocked tests do not prove live email delivery; after deployment, submit a clearly labelled test yourself and verify the private record and your inbox.

## Public HTML and discovery

The production build prerenders shared React components to 24 route documents and hydrates them in the browser. The sitemap has 21 public URLs: home, the five section pages, the 2026 cohort page, data, the dataset catalog, six interactive observation routes and six product-detail routes. A new cohort in `src/content/primesCohorts.js` is prerendered and added to the sitemap automatically; update the URL count in `scripts/check-seo.mjs` at the same time. Product details derive from the verified catalog; no new results or licenses are asserted. Lazy-route CSS is included in static HTML so research content remains readable with JavaScript disabled. Notebook and feedback are noindex and absent from the sitemap; local notes are never serialized. The selected production origin is `https://saturnringlab.com`; `VITE_PUBLIC_SITE_URL` can override it before building so metadata and discovery files stay consistent. Public pages on the former Vercel origin redirect to matching custom-domain paths. The former notebook and feedback routes remain accessible because browser-local notes belong to their original origin; existing notes can still be read and exported there. The current notebook does not have an import UI. See `GEO_CODEX_HANDOFF.md` before any further domain migration. `npm run seo:submit` is an explicit post-deployment IndexNow action, never a build side effect.
