# Saturn Website Architecture

## Purpose

This document defines Architecture Pass 2 (October 2026). The site grew from a single research project into a sourced website about the whole of Saturn, with the MIT PRIMES Saturn rings project kept as its own section and archived year by year. The site owner approved this structure; it replaces Pass 1's three-module research layout and four-block homepage.

The site serves two audiences on the same pages:

- **Students and amateur astronomers:** plain-language chapters, guided observations, a glossary, and a source next to every number.
- **Researchers:** exact data windows, a machine-readable catalog, citation details, reproduction scripts, and a downloadable moons table.

Content is centralized in:

- `src/content/saturn.js` — the source registry (id → title, publisher, HTTPS URL), moon count, key facts, NSSDC table and the section list
- `src/content/rings.js` — ring regions (PDS ring table), guided observations and their data checks, glossary
- `src/content/moons.js` — sixteen moons as published strings, highlight cards, CSV export
- `src/content/missions.js` — the missions timeline
- `src/content/primesCohorts.js` — one record per PRIMES cohort
- `src/content/project.js` — 2026 team identity and links
- `src/content/datasets.js` and `public/data/observations/catalog.json` — the Cassini observations

## 1. Canonical route map

| Route | Purpose |
| --- | --- |
| `/` | Gateway: hero, the five-section index, and the first-observation preview |
| `/planet` | The planet: facts, interior, weather, seasons and day, magnetic field |
| `/rings` | The rings: to-scale map, ring table, reading a signal, guided observations, ring age |
| `/moons` | The moons: highlight cards, sortable table, CSV download |
| `/missions` | Missions timeline from 1610 to Dragonfly |
| `/research` | PRIMES project archive (one card per cohort) |
| `/research/:year` | One cohort; 2026 uses the full research story, later years the cohort template |
| `/data`, `/data/:datasetSlug` | Data explorer (part of the Rings section) |
| `/datasets`, `/datasets/:datasetSlug` | Observation catalog, product details, and the researcher guide |
| `/explorations` | My notebook (noindex) |
| `/feedback` | Feedback form (noindex) |
| `/*` | Not-found page unless the path is a documented legacy redirect |

Primary navigation: The planet · Rings · Moons · Missions · Research · My notebook · Feedback · Sources & credits (the “i” button; the footer link on small screens). Rings stays highlighted on `/data` and `/datasets`. The site mark links to Home.

## 2. Homepage

Excluding the shared footer, the homepage contains only:

1. Hero (with actions for the planet, the rings, and either the visitor's last exploration or the research)
2. Explore Saturn: one index of the five sections
3. Your first observation: the Rev 133 overview

## 3. Section pages

The four Saturn sections share one template from `src/orbit/SaturnPage.jsx` and reuse the research story's styles:

- `SectionHero`: eyebrow, two-line title, intro (optionally with sources) and an “On this page” chapter index
- `Chapter`: numbered chapter heading
- `SourceNote`: the compact “Source:” line under a fact, card, table or paragraph
- `SourcesCard`: the page's full source list

### Photographs

The section pages show NASA photographs registered in `src/content/photos.js`, each with the NASA page its title, date, credit and caption were checked against. `Photo` (hero, wide, gallery, card, inline, side and panel variants), `PhotoGallery` and `PhotoStrip` render them with the mission, how the colors were made, the date, the credit and a link to that page. Files on NASA's image service are loaded from NASA at display size; the three copies in `public/images/saturn/` were identified against their NASA pages. Add a photo only from a NASA page you have read; say when colors are false, infrared, simulated or brightened, and label illustrations as illustrations.

Every factual statement carries a `SourceNote` with registry ids. A value must say what its source says; unit conversions are allowed and must be exact. When sources disagree (for example, NASA pages that give the 2009 equinox as August 10 or 11), the page says so or uses the shared span. Values are checked against their sources before publishing; the Planet page states the month they were checked.

## 4. Rings section and guided observations

The ring map is drawn to scale from the PDS ring table; each region links to the data explorer on Rev 007 at a padded window inside that region. Each guided observation opens one exact window (at most 32,768 records, so exact samples always load) with the web-data version pinned in the URL. Every number a guided observation quotes is stored as a check in `src/content/rings.js` and re-measured from the exact Float64 chunks by `tests/saturn-content.test.mjs`; editing the text without the check, or the data without the text, fails the tests.

Comparisons between observations must explain why values differ (viewing geometry, measurement limits) rather than imply physical change.

## 5. Research archive and adding a cohort

`/research` lists cohorts from `src/content/primesCohorts.js`, newest first. To add a year:

1. Add an entry with `year`, `program`, `title`, `team`, `mentor`, `status`, `question`, `summary`, `focus`, `data`, `results` and `materials`.
2. Add a result to `results` only when it meets the traceability rule (section 8). Until then the cohort page shows “No verified results are published here yet.”
3. List only team- and mentor-approved public materials.
4. Run `npm run build`; the new `/research/<year>` page is prerendered and added to the sitemap automatically. Update the URL count in `scripts/check-seo.mjs`.

The 2026 cohort (`story: true`) keeps its full research story at `/research/2026`. Old anchors on `/research` (`#research-question`, `#research-method`, `#research-results`, `#research-team`) redirect to the same anchors on `/research/2026`.

## 6. Dataset catalog and detail structure

`/data` is the explorer and `/datasets` the master–detail catalog, both driven by `public/data/observations/catalog.json`. Only complete DLP profile products that pass PDS-label parsing, local conversion checks, exact-chunk hashing, deterministic source comparisons, and overview verification appear.

Each observation viewer loads `metadata.json` and a display-only source-sample `overview.json` first. Optical-depth and signal-power extrema are retained; phase values are carried at the selected source rows and rendered as unconnected points without inferring continuity. Exact converted Float64 samples are stored in deterministic hashed binary chunks and fetched only when a selected radial interval requires them.

The catalog page ends with a researcher guide: the PDS-recommended citation for CO-SR-RSS-4/5-OCC-V2.0, the reproduction scripts, machine-readable files, and cautions for comparing observations.

The earlier small CSVs are labeled internally as legacy research-window subsets and archived outside public production assets. They are not complete observations and remain outside the active catalog until their parent-product mappings are verified.

## 7. Private research material policy

`_research_private/` contains non-public working research material. It is ignored by Git and must remain outside the website source, `public/`, and generated deployment assets. Private manuscript files must not be imported, copied, linked, summarized as approved public copy, or exposed through any route or download control.

## 8. Real-result traceability rule

A result may be presented as a real project result only when it is traceable to input data, generating code, and a generated output. If any of those elements is unavailable, the site must use a restrained empty state or accurately describe the item as provisional, synthetic, schematic, or unverified.

Synthetic examples are explanatory tools only. They must never be labeled or styled as Cassini-derived results.

## 9. Legacy-route redirects

| Legacy route | Redirect |
| --- | --- |
| `/viewer`, `/data-hub` | `/data` |
| `/math`, `/algorithms`, `/algorithms/:slug`, `/overview`, `/team` | `/research` |
| `/research/signal-and-phase`, `/research/stationary-roots-and-continuation`, `/research/reliability-and-reconstruction` | `/research` |
| `/progress` | `/explorations` |
| `/resources`, `/background`, `/gallery` | `/?about=sources` |

Legacy pages are not retained as hidden duplicate content.

## 10. Future content rules

- Add or correct a fact in the matching content file, with a registry source; add new sources to `src/content/saturn.js` (HTTPS only).
- After editing `src/content/moons.js`, run `npm run data:moons`.
- Add a public observation only through the conversion, build, and read-only verification workflow documented in `README.md`.
- Add PRIMES work to its cohort record, not as a new top-level page.
- Do not create a top-level section without the site owner's review.

## Permanent editorial rules

- One concept is explained once; other pages link to it.
- Every number names its source; a value that disagrees with its current source is corrected to the source.
- Synthetic examples are never labeled as real results.
- A result must be traceable to input data, generating code, and output.
- The homepage contains only the hero, the section index, and the first-observation preview.
- New top-level sections require the site owner's review.
