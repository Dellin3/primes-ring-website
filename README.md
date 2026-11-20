# Saturn Ring Lab

A sourced website about Saturn — the planet, its rings, its moons and the missions that studied it — built around six real Cassini radio observations of the rings. It serves two audiences on the same pages: students and amateur astronomers, and researchers who want the data. Live at https://saturnringlab.com.

- **The planet** (`/planet`): key facts, interior, weather (including the 2026 ten-sided south-pole wave), seasons, day length and magnetic field. Every number names the page it was checked against.
- **The rings** (`/rings`): a to-scale ring map whose regions open the data explorer, the PDS ring table, a glossary for reading a radio signal, five guided observations in real Cassini data, and the open question of the rings' age. The data explorer (`/data`) and observation catalog (`/datasets`) belong to this section.
- **The moons** (`/moons`): nine highlight cards and a sortable, filterable table of sixteen moons, downloadable as CSV.
- **Missions** (`/missions`): a sourced timeline from Galileo to Dragonfly.
- **Explore data:** six described Cassini RSS observations, three signal variables, exact radial windows, drag-to-zoom, hover readout, reset, a visible source line, two-point comparison, and CSV export of every exact row in any window.
- **Measure:** a measurement lab under the explorer computes window statistics and a gap width, saves a baseline, compares a second configuration, and copies or downloads a reproduction record. The guided activity “Is the Encke Gap the same width in every observation?” starts from the Rings page.
- **My notebook:** autosaved drafts, named observations, restore, rename, delete, and export. Notes stay in the current browser; there is no account or cloud synchronization.
- **Feedback:** a persistent entry opens `/feedback`, a standalone Saturn-background page with one form for name, email, problem type, and message. Failed submissions preserve the text. The page shows no email address; if direct submission is unavailable it says so and keeps the submit button disabled.

**Sources & credits** keeps provenance and attribution together. Previous public routes redirect to the relevant retained destination.

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

The automated checks cover all six observation products (1,566,902 converted rows, 193 SHA-256 chunk hashes), display coordinates, exact export precision, notebook persistence, and saved-record/draft restoration. `tests/saturn-content.test.mjs` re-measures every number quoted in the guided ring observations from the exact Cassini chunks, checks that each guided link opens an exact-size window, and checks that every cited source exists and uses HTTPS. `tests/site-identity.test.mjs` checks the site name and that no page or public file carries old project branding, the owner's email address, or links to removed pages. Automated checks do not substitute for a live browser review.

After editing `src/content/moons.js`, run `npm run data:moons` to regenerate `public/downloads/saturn-major-moons.csv`; a test fails if the page and the download disagree.

## Data and interpretation

`public/data/observations` contains the converted public NASA PDS Cassini RSS diffraction-limited profiles. Wide views use a reduced overview. Small windows load the original converted Float64 rows and verify their hashes before exact inspection and export. The calibrated profiles retain diffraction effects; they are not new high-resolution reconstruction results, and the site does not run any reconstruction. Missing and negative measurements remain unchanged. Stored phase values are plotted without connecting or unwrapping them.

The record count describes the archive coverage on this site. The Saturn background is artistic imagery, not an observational reconstruction.

## Interface structure

- `src/content/site.js`: the site name, public origin and outbound links.
- `src/orbit/OrbitShell.jsx`: shared space background, navigation, and source dialog.
- `src/orbit/Home.jsx`: entry, the four-section index, and an actual observation overview.
- `src/orbit/SaturnPage.jsx` and `SaturnPage.css`: shared section-page parts (hero, chapters, source notes, sources card), on top of the shared editorial styles in `Research.css`.
- `src/orbit/Planet.jsx`, `Rings.jsx` (with `RingMap.jsx`), `Moons.jsx`, `Missions.jsx`: the four Saturn sections.
- `src/content/saturn.js`: the source registry, key facts and section list; `rings.js`, `moons.js` and `missions.js` hold each section's content.
- `src/content/photos.js`: the NASA photographs on the section pages, each with its NASA page, credit and how its colors were made (see `docs/SITE_ARCHITECTURE.md`).
- `src/orbit/Explorer.jsx`: data workspace.
- `src/orbit/Notebook.jsx`: observation notebook and access to all observations.
- `src/lib/explorerSession.js`: restoration and URL identity rules.
- `src/lib/explorations.js`: existing versioned browser storage, preserved across the redesign.

## Deployment

Deploy this source as the existing **Vite** project on Vercel (`npm run build`, output `dist`). Keep the root `api/` directory and `vercel.json`; uploading only `dist` does not include the feedback receiver. See [Codex deployment handoff](CODEX_HANDOFF.md) for the feedback design and target project.

For direct form submissions, follow **[反馈功能部署说明](docs/FEEDBACK_SETUP.md)**: connect a **private** Vercel Blob store, configure Resend, and set the server-only environment variables from `.env.example`. Feedback is stored privately before a notification is requested for the site owner’s address (`CONTACT_EMAIL` in `server/feedback.mjs`, never sent to browsers). If the receiver is unconfigured or unreachable, the page says so and keeps the message on screen; it never reports an unsaved message as submitted.

`npm run dev` previews the interface without Vercel Functions. Use `vercel dev` for a real local API check. Mocked tests do not prove live email delivery; after deployment, submit a clearly labelled test yourself and verify the private record and your inbox.

## Public HTML and discovery

The production build prerenders shared React components to 22 route documents and hydrates them in the browser. The sitemap has 19 public URLs: home, the four section pages, data, the dataset catalog, six interactive observation routes and six product-detail routes. Update the URL count in `scripts/check-seo.mjs` when a public page is added. Product details derive from the verified catalog; no new results or licenses are asserted. Lazy-route CSS is included in static HTML so section content remains readable with JavaScript disabled. Notebook and feedback are noindex and absent from the sitemap; local notes are never serialized. The selected production origin is `https://saturnringlab.com`; `VITE_PUBLIC_SITE_URL` can override it before building so metadata and discovery files stay consistent. Public pages on the former Vercel origin redirect to matching custom-domain paths. The former notebook and feedback routes remain accessible because browser-local notes belong to their original origin; existing notes can still be read and exported there. The current notebook does not have an import UI. See `GEO_CODEX_HANDOFF.md` before any further domain migration. `npm run seo:submit` is an explicit post-deployment IndexNow action, never a build side effect.
