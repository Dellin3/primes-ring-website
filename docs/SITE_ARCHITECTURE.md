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
| `/` | Gateway: hero, then four chapters — the 3D signal scene, one live observation, inside the research, and the sections by priority |
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

The site owner asked for this structure in November 2026 (exhibition redesign). Excluding the shared footer, the homepage contains:

1. **Hero.** The background (`/images/saturn-observatory.webp`, `.saturn-image`) keeps its asset, crop, focal position and pointer drift; nothing new moves it. Only the foreground changed: three set lines in the heading, a shorter paragraph, one primary action (Open the explorer), one secondary (Follow the signal, to chapter 01), a text link (Guided measurement), the research question in plain words, and a staggered entrance (`.hero-enter`, 600 ms, 16 px).
2. **01 Follow the signal** (`src/orbit/home/SignalScene.jsx`): the 3D scene beside three steps — the geometry, a crossing becomes a profile, your turn (section 4c).
3. **02 Try one real observation** (`ObservationPreview.jsx`): the explorer's own chart and exact-data loader on three guided windows from `src/content/rings.js` (Encke Gap, Maxwell Gap, C ring meets B ring). Click or arrow keys inspect samples; dragging zooms; links open the same window in the explorer or the guided measurement.
4. **03 Inside the research** (`InsideResearch.jsx`): Figure 14 from the team's working manuscript, numbered marks for what its caption names, the research question, the method and its limits, and who worked on what (from the manuscript's acknowledgments).
5. **04 Continue exploring** (`ContinueExploring.jsx`): Rings as the largest destination, then the planet and research, then moons and missions, each photograph credited.

Each chapter is a full-width band with its own ground (observatory, instrument room, study, departure hall). Sections fade and rise 16 px once as they enter (`useRevealOnScroll` in `src/lib/motion.js`); content already on screen, prerendered HTML and reduced-motion visitors are never hidden. Foreground annotations in chapters 03 and 04 move up to 8–10 px with a fine pointer on wide screens (`usePointerDepth`); charts, tables, reading text and the hero background never do.

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

## 4a. Explorer workflow and measurement lab

The data explorer (`src/orbit/Explorer.jsx`) supports one complete workflow:

1. **Choose an observation.** Each card in `ObservationPicker` shows the Rev, date (from the PDS ring observation ID), direction, band and DSN station, the main rings covered (from the PDS ring table) and the row count; “Keep this window when switching” carries the window, threshold and activity to another observation that covers it.
2. **Select an interval.** Type radii, use ±, or drag across the chart. Windows up to `recommended_exact_window_records` load SHA-256-verified exact rows; wider windows draw the display overview, and the chart legend and source line say so.
3. **Read the chart.** Axes carry units; the legend names the series and markers; hovering shows the nearest sample’s value, radius and sample index (or “overview point”).
4. **Reset.** “Reset view” returns to the observation’s example window and optical depth.
5. **Trace the source.** The source line under the chart names the PDS data set, product and web-data version, states what is drawn, and links to the observation details and PDS documentation.
6. **Export.** “Download CSV” (exact windows) or “Export N exact rows” (overview windows, loaded on demand) writes every exact row in the inclusive window with full Float64 precision and a provenance header. Exports never contain overview points.

The measurement lab (`src/orbit/MeasurementLab.jsx`, `src/lib/windowMeasurements.js`) computes statistics and a gap width (longest unbroken run below an optical-depth threshold) from the exact rows, saves a baseline in this browser (`src/lib/labStore.js`), compares a second configuration only where variables match and flags different thresholds or windows, and copies or downloads a reproduction record (dataset, PDS product, web-data version, window, threshold, results, method and a link that reopens each view). Guided activities live in `src/content/labActivities.js`; their expected values are re-measured from the exact chunks by `tests/lab-activity.test.mjs`.

Every figure or number is labeled with `EvidenceTag`: Cassini observation, derived on this site, synthetic teaching model, or illustration. The site does not run the team’s reconstruction method; the lab says so.

### Layout of the explorer

The working area comes first: a short intro (details under “How to use this page”), the current observation (Rev, direction, band and station, date, coverage, rows, product), a compact switcher (one chip per observation, “Keep this window when switching”, and “Compare all 6” for the described cards), then the chart with its zoom controls in the heading. The source line spans the bottom of the workspace; the lab and the catalog follow. At 1440 × 900 the whole chart is in the first screen. On phones the switcher scrolls sideways, and provenance comes after the chart and the point readout.

## 4b. Background treatments

The home hero keeps `/images/saturn-observatory.webp` (`.saturn-image` in `OrbitShell`). Other pages use one of three coordinated treatments from `src/orbit/surfaces.css`: the deep field (narrative pages), decorative ring arcs (Rings, data and dataset pages) and the instrument surface (explorer, lab and data tables). The stars and arcs are drawn in CSS and are not data; the Sources & credits dialog says so.

## 4c. The signal scene

`src/lib/ringScene.js` holds every number the scene uses; `tests/ring-scene.test.mjs` checks them.

- **To scale:** Saturn's equatorial and polar radii (the NSSDC values in `src/content/saturn.js`) and every ring radius (the PDS ring table in `src/content/rings.js`). Ring brightness follows Rev 007's normal optical depth: the median of the source points the display overview kept in each 256 km bucket, shown as 1 − e^(−τ). Until that file loads (and in the prerendered page) the rings use one typical value per ring from inside the PDS table's range.
- **Schematic:** Cassini's distance, its path, the direction to Earth (28° above the ring plane) and the straight radial track of the crossing. The scene says so on the stage and in the step text. The sweep (“Play the crossing”) is illustrative timing, not Cassini's motion.
- **Real readouts:** the profile strip draws Rev 007's display overview; the readout reports the nearest stored overview point exactly, never an interpolated value. Each ring links to the ring map's exact Rev 007 window.
- **Renderers:** an SVG drawing from the same geometry is prerendered and is the full fallback without WebGL (presets, dragging, selection and the profile all work). With WebGL, `src/orbit/home/saturnWebgl.js` (three.js, already a dependency) is imported when the section enters the viewport. It renders on demand only — camera moves, drags, crossing changes — with the pixel ratio capped at 1.75, and stops while the section is off screen or the tab is hidden.
- **Interaction:** drag (mouse or pen; a sideways swipe on touch, which keeps vertical scrolling), arrow keys on the focused scene, four preset views plus Reset, labels and a button for every feature, and step buttons as well as scrolling (desktop pins the scene while the three steps scroll by; phones show the scene, then step buttons, then the active step). Views ease over 0.9 s; with reduced motion they change at once and nothing plays by itself.

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
- The homepage contains the hero and the four chapters in section 2; the hero background is not altered or animated.
- New top-level sections require the site owner's review.
