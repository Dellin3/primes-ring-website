# PRIMES Saturn Rings Project Content and Evidence Audit

**Audit date:** 2026-08-30
**Repository:** `https://github.com/Dellin3/primes-ring-website` (configured as `origin`; the public URL was reachable during this audit)
**Deployed site named in the repository:** `https://primes-ring-website-p9yv.vercel.app`
**Audit mode:** read-only inspection of the pre-audit repository; this document is the only file added.

## Audit standards and scope

This audit distinguishes what the repository **contains** from what the website **describes**. A statement in website copy is evidence that the repository makes that statement; it is not, by itself, evidence that the described numerical research was implemented or validated.

The tracked workspace contains 43 non-`node_modules` files:

- 5 application/configuration source files: `src/App.jsx`, `src/App.css`, `src/index.css`, `src/main.jsx`, and `src/components/SaturnModel.jsx`
- 5 Cassini-derived CSV files under `public/data/`
- 18 raster image/texture files under `public/images/` and `public/textures/`
- 1 SVG symbol file and 1 GLB model
- repository, deployment, package, sitemap, crawler, verification, and documentation files

No `scripts/`, `notebooks/`, `figures/`, or research-code package exists. No `.py`, `.ipynb`, `.m`, `.R`, research JSON, derived-root file, branch-output file, reconstruction output, validation output, or project-paper PDF was found. The only executable scientific/numerical logic is client-side JavaScript embedded primarily in `src/App.jsx`.

### Evidence levels used in this document

- **Traceable:** input, implementation, and output path are identifiable in the repository.
- **Partially traceable:** the repository identifies a plausible source or input, but an original label, conversion script, generation script, or validation artifact is missing.
- **Untraceable:** the repository provides only a caption, generic credit, visual asset, or prose claim.

---

# 1. Current website structure

## 1.1 Application and routing structure

The site is a React/Vite single-page application. `src/main.jsx:1-16` mounts `App` inside `BrowserRouter`; it does not declare React Router `<Routes>`. Instead, `src/App.jsx:12-27` maps pathname strings to panel identifiers, and `src/App.jsx:2774-2791` recognizes `/algorithms/:slug`. Unknown paths are redirected to `/` by the application.

Vercel rewrites for the panel routes and `/algorithms/:slug` are in `vercel.json:1-13`.

The current application exposes 10 base panel routes and 11 generated algorithm-detail routes, for 21 navigable route patterns in total.

| Current route | Rendering source | Purpose | Scope | Evidence/content status |
|---|---|---|---|---|
| `/` | `renderMenu()`, `src/App.jsx:2845-3122` | Research-first project homepage | Whole project, with one Dell-focused section | Mix of real-input description, general mathematics, synthetic interactives, and schematics |
| `/data-hub` | `renderDataHub()`, `src/App.jsx:3126-3203` | Curated links to PDS/JPL data resources | Whole-project data context | External real-data references; no additional local data |
| `/math` | `renderMath()`, `src/App.jsx:3291-3378`; `StationaryPhaseDemo`, `src/App.jsx:1887-2057` | Formula library and branch intuition | General framework and synthetic method demo | Equations/prose plus a synthetic cubic branch model |
| `/viewer` | `renderDataViewer()`, `src/App.jsx:3622-3659`; `CassiniDataViewer`, `src/App.jsx:2059-2772` | Explore five local Cassini-derived radial profiles and export windows | Real-input data tool | Real Cassini-derived input; descriptive statistics and moving-average residuals are not research validation |
| `/overview` | `renderOverview()`, `src/App.jsx:3205-3238` | “Current Results & Diagnostics” summary | Whole project | Prose/status summary only; no result files or validated quantitative results |
| `/background` | `renderBackground()`, `src/App.jsx:3240-3289` | Radio-occultation and ring-region context | Whole-project background | Public imagery plus explanatory prose |
| `/team` | `renderTeam()`, `src/App.jsx:3380-3440` | Interactive contribution dashboard | Whole team | Explicit website statements; no paper or contribution record in repository to corroborate details |
| `/algorithms` | `renderAlgorithms()`, `src/App.jsx:3442-3568` | Pipeline and numerical-method library | Multiple methods across the project | Mostly candidate/planned/prototype prose and schematic SVG illustrations |
| `/algorithms/:slug` | `src/App.jsx:2780-2789, 3460-3508` | Detail view for one method | One method per URL | Generic explanation and a schematic illustration; not a separate implementation |
| `/gallery` | `renderGallery()`, `src/App.jsx:3570-3620` | Public mission imagery and context | Whole-project communication | Static imagery with generic source classes, usually without exact catalog IDs |
| `/progress` | `renderProgress()`, `src/App.jsx:3661-3680` | Completed/in-progress/next status list | Whole project | Website-authored status claims |

### Dynamic method routes

The method names in `numericalMethodsToolkit` (`src/App.jsx:230-351`) produce these routes via `getMethodSlug()` (`src/App.jsx:177-183`):

1. `/algorithms/pchip-interpolation`
2. `/algorithms/cubic-spline-interpolation`
3. `/algorithms/floater-hormann-rational-interpolation`
4. `/algorithms/pade-approximation-initializer`
5. `/algorithms/newton-root-finding`
6. `/algorithms/halley-root-finding`
7. `/algorithms/pseudo-arclength-continuation`
8. `/algorithms/least-squares-fitting`
9. `/algorithms/branch-bookkeeping`
10. `/algorithms/local-diagnostics-and-confidence-score`
11. `/algorithms/stationary-phase-reliability-benchmark`

These are views over hard-coded descriptions and SVG sketches in `src/App.jsx`; they are not backed by eleven research implementation modules.

## 1.2 Major homepage sections

| Homepage section / component | Source | Purpose | Whole project or specific method | Real project data | Schematic/model data | Placeholder content | Repetition |
|---|---|---|---|---|---|---|---|
| Research hero and `HeroScientificFigure` | Rendered at `src/App.jsx:2848-2882`; component at `src/App.jsx:1246-1376` | Identify project, authors, mentor, scientific problem, and radio-occultation geometry | Whole project | No numerical data | Yes: author-generated SVG; explicitly labeled “not raw Cassini data” | No | Radio-occultation explanation repeats `/background` |
| The Research Question | `src/App.jsx:2884-2910` | Observation → inverse problem → numerical challenge | Whole project | No | Conceptual text only | No | Repeats hero, `/background`, and `/math` |
| `StationaryRootReliabilityExplorer` | Rendered at `src/App.jsx:2911`; implementation at `src/App.jsx:1407-1627` | Show two roots approaching a normalized fold and schematic diagnostics responding | Specific synthetic fold/reliability mechanism | No | Yes: normalized saddle-node-like branches and schematic units | No; it is a functioning synthetic demo | Overlaps later bifurcation and confidence sections |
| Core Research Methods | `src/App.jsx:2913-2931`; descriptions at `src/App.jsx:141-166` | Summarize six claimed research-method areas | Multiple methods | No | No numerical output; prose only | Not placeholder, but implementation status is not shown per card | Repeats `/algorithms`, `/math`, pipeline, and team page |
| Contributor Focus — Dell Li | `src/App.jsx:2933-2957` | Describe branch bookkeeping/local diagnostics and proposed root record | One contributor/method interface | No | Returned tuple and workflow are conceptual | No explicit placeholder; supporting research artifact is absent | Repeats root explorer, reliability preview, `/team`, and `/algorithms` |
| Near a Bifurcation | `src/App.jsx:2959-2979`; `SchematicBranchFigure` at `src/App.jsx:1192-1233` | Explain separated branches versus fold neighborhood | One method concept | No | Yes: author-generated static branch schematic | No | Strongly duplicates the root explorer and `/math` toy demo |
| Research Pipeline | `src/App.jsx:2981-3013`; data at `src/App.jsx:103-139` | Show seven conceptual stages from RSS data to reconstruction | Whole project | Mentions real input, but uses no data | Pipeline itself is schematic | No | Repeats Core Methods and `/algorithms` pipeline |
| Reliability-Diagnostic Preview | `src/App.jsx:3015-3051` | Present `q_curv`, `q_sep`, `q_jump`, and `C_s` concept | Specific diagnostic concept | No | Formula/status treatment only; thresholds are not supplied | No, but it has no validation artifact | Duplicates root explorer and Dell section |
| Cassini Data Provenance | `src/App.jsx:3053-3087` | Preview viewer and list five local samples | Whole-project input/data layer | Yes: screenshot and identifiers for five CSV inputs | Screenshot is static, but represents the real viewer | No | Repeats `/viewer` and `/data-hub` |
| Research Learning Resources | `src/App.jsx:3089-3108` | Preserve educational and mission links | Secondary educational resources | No | No | The text mentions worksheet/teacher material not present as a local route or file; external starter site is real and reachable | Repeats `/background`; points to external Research Starter Lab |
| Sources & Credits | `src/App.jsx:3110-3120` | Distinguish public PDS data, NASA/JPL imagery, and website schematics | Whole project | Describes real inputs | Describes schematics | No | Repeats provenance notes in hero, viewer, gallery, and data section |

## 1.3 Current interactive components

| Component | Source | Interaction | Input | Evidence classification |
|---|---|---|---|---|
| `HeroScientificFigure` | `src/App.jsx:1246-1376` | CSS animation pauses outside viewport; focus/hover labels; 3D modal link | Hard-coded SVG paths | `SCHEMATIC_ONLY` |
| `SaturnModelModal` / `SaturnModel` | `src/App.jsx:1378-1405`; `src/components/SaturnModel.jsx:1-231` | Orbit controls, autorotation, procedural textures | Random/procedural Three.js textures, no Cassini dataset | `SCHEMATIC_ONLY` |
| `StationaryRootReliabilityExplorer` | `src/App.jsx:1407-1627` | Accessible range slider updates branches and four diagnostics | Analytic normalized fold coded in component; schematic units | `SYNTHETIC_METHOD_TEST` |
| `StationaryPhaseDemo` | `src/App.jsx:1887-2057`; root solver helpers at `src/App.jsx:1642-1720` | Slider selects `x` and displays real roots of `y³ + xy − 1 = 0` | Synthetic cubic equation | `SYNTHETIC_METHOD_TEST` |
| `CassiniDataViewer` | `src/App.jsx:2059-2772` | Dataset selector, sliding window, SVG plots, statistics, residual plot, CSV export | Five local PDS-derived CSVs | Real input; outputs discussed in Sections 2 and 5 |
| Team dashboard | `src/App.jsx:3380-3438` | Select a team member | Hard-coded contribution statements | Content navigation, not scientific data |
| Algorithm pipeline | `src/App.jsx:3511-3535` | Select one of six pipeline stages | Hard-coded descriptions/statuses | Schematic project organization |
| Method detail views / `MethodIllustration` | `src/App.jsx:1722-1885, 3460-3507` | Route-based selection of eleven methods | Hard-coded SVG coordinates and prose | `SCHEMATIC_ONLY` / `SYNTHETIC_METHOD_TEST` |

---

# 2. Dataset inventory

## 2.1 Research datasets

Exactly five research data files were found. All share the same 13 columns:

`ring_radius_km`, `pole_correction_km`, `timing_correction_km`, `ring_longitude_deg`, `observed_ring_azimuth_deg`, `normalized_signal_power`, `normal_optical_depth`, `phase_shift_deg`, `normal_optical_depth_threshold`, `observed_event_time_s`, `ring_event_time_s`, `spacecraft_event_time_s`, `observed_ring_elevation_deg`.

Units are encoded in column names for kilometers (`_km`), degrees (`_deg`), and seconds (`_s`). `src/App.jsx:2650-2653` explicitly says radius is kilometers from Saturn’s center and optical depth is dimensionless. The repository does not include a complete data dictionary for the remaining normalized/threshold fields.

The site identifies all five files as local CSV conversions of public NASA PDS Ring-Moon Systems Node `CORSS_8001` Cassini RSS TAB products (`src/App.jsx:90-101, 2401, 2644-2653`). No PDS label, direct per-product archive URL, checksum, extraction log, conversion script, or provenance manifest is present, so provenance is **partially traceable**, not end-to-end reproducible.

| Classification | File and full repository path | Type / approximate size | Rows | Event / revolution | Band | Ingress/egress | Radius range | Original source documented in repository | Processing script | Current use | Downloadable |
|---|---|---:|---:|---|---|---|---|---|---|---|---|
| `REAL_CASSINI_SOURCE` | `public/data/cassini_rev007e_k34.csv` | CSV, 8,037 bytes (~7.8 KiB) | 51 data rows | `Rev007E`; `RSS_2005_123_K34_E` (`src/App.jsx:844-852`) | `K34` | Filename/event has `E`; the repository does not define the suffix | 74,495.0–74,620.0 km | Generic `CORSS_8001` source statement at `src/App.jsx:96-101` | None found | `/viewer`; homepage viewer screenshot/list | Selected windows export through `src/App.jsx:2316-2329`; full static file is web-addressable but has no direct full-file UI link |
| `REAL_CASSINI_SOURCE` | `public/data/cassini_rev010e_k25.csv` | CSV, 7,344 bytes (~7.2 KiB) | 54 data rows | `Rev010E`; `RSS_2005_177_K25_E` (`src/App.jsx:853-861`) | `K25` | `E` suffix present; not locally defined | 72,012.5–72,145.0 km | Same generic `CORSS_8001` statement | None found | `/viewer` | Same selected-window export behavior |
| `REAL_CASSINI_SOURCE` | `public/data/cassini_rev054ce_k55.csv` | CSV, 4,159 bytes (~4.1 KiB) | 25 data rows | `Rev054CE`; `RSS_2007_353_K55_E` (`src/App.jsx:862-870`) | `K55` | `E` suffix present; not locally defined | 88,655.0–88,715.0 km | Same generic `CORSS_8001` statement | None found | `/viewer` | Same selected-window export behavior |
| `REAL_CASSINI_SOURCE` | `public/data/cassini_rev089ce_k34.csv` | CSV, 8,111 bytes (~7.9 KiB) | 55 data rows | `Rev089CE`; `RSS_2008_291_K34_E` (`src/App.jsx:871-879`) | `K34` | `E` suffix present; not locally defined | 104,812.5–104,947.5 km | Same generic `CORSS_8001` statement | None found | `/viewer` | Same selected-window export behavior |
| `REAL_CASSINI_SOURCE` | `public/data/cassini_rev133e_x34.csv` | CSV, 5,028 bytes (~4.9 KiB) | 35 data rows | `Rev133E`; `RSS_2010_170_X34_E` (`src/App.jsx:880-888`) | `X34` | `E` suffix present; not locally defined | 72,012.5–72,097.5 km | Same generic `CORSS_8001` statement | None found | `/viewer` | Same selected-window export behavior |

**Classification rationale:** `REAL_CASSINI_SOURCE` includes processed observation data derived from a documented Cassini source. These files meet that repository-level definition because the source statement names PDS, the Ring-Moon Systems Node, `CORSS_8001`, RSS, and TAB-to-CSV conversion. They are **not** classified `DERIVED_FROM_REAL_CASSINI` because they are observation-profile subsets, not repository-generated roots, branches, reconstruction, or validation outputs.

Together the five files contain 220 data rows and 32,679 bytes. All use 2.5 km radial sampling despite being registered under the `TAU_10KM` product label; the repository does not explain that relationship.

## 2.2 Derived, synthetic, schematic, and unknown data-like material

No persisted `DERIVED_FROM_REAL_CASSINI` dataset was found.

| Classification | Item | Location | Persistence / purpose |
|---|---|---|---|
| `SYNTHETIC_METHOD_TEST` | Normalized two-branch fold and diagnostics (`Δφ`, `|ψ″|`, `q_jump`, `C_s`) | `StationaryRootReliabilityExplorer`, `src/App.jsx:1407-1627` | Generated in browser; no output file; values explicitly shown as schematic units |
| `SYNTHETIC_METHOD_TEST` | Cubic implicit branch model `F(x,y)=y³+xy−1=0` | `src/App.jsx:1642-1720, 1887-2057` | Generated in browser; no output file |
| `SCHEMATIC_ONLY` | Method illustration coordinates | `MethodIllustration`, `src/App.jsx:1722-1885` | Hard-coded SVG paths; no external data |
| `SCHEMATIC_ONLY` | Hero radio-occultation geometry | `HeroScientificFigure`, `src/App.jsx:1246-1376` | Hard-coded SVG paths; explicitly not raw data |
| `SCHEMATIC_ONLY` | Static homepage branch diagram | `SchematicBranchFigure`, `src/App.jsx:1192-1233` | Hard-coded SVG paths |
| `SCHEMATIC_ONLY` | Unused local-window schematic | `SchematicDataViewerFigure`, `src/App.jsx:1158-1190` | Hard-coded SVG paths; retained but not rendered |
| `PLACEHOLDER_OR_UNKNOWN` | `public/model/Saturn.glb` | `public/model/Saturn.glb` | No source, generator, license, or code reference; current 3D modal does not use it |
| `PLACEHOLDER_OR_UNKNOWN` | `public/icons.svg` | `public/icons.svg` | Generic symbol sprite; no code reference or provenance |

`package.json`, `package-lock.json`, `vercel.json`, `public/sitemap.xml`, `public/sitemap.txt`, `public/llms.txt`, and `public/robots.txt` are structured/text files but are software manifests or site metadata, not research datasets.

---

# 3. Figure and visualization inventory

## 3.1 Generated and interactive figures

| Title/component | Source path | Input | Generation path | Static / interactive | Real Cassini-derived values | Synthetic / schematic | Homepage | Presentation support | Provenance traceable |
|---|---|---|---|---|---|---|---|---|---|
| Radio-occultation Figure 01 | `HeroScientificFigure`, `src/App.jsx:1246-1376` | None | Inline SVG + CSS animation | Animated/focusable SVG | No | Schematic | Yes | Yes, if retained with current “not raw Cassini data” label | Yes as author-generated code |
| Stationary-root reliability explorer | `src/App.jsx:1407-1627` | Normalized analytic fold generated in component | Inline calculations and SVG | Interactive slider | No | Synthetic method demonstration | Yes | Yes for explaining mechanism, not as result evidence | Yes |
| Static branch schematic | `src/App.jsx:1192-1233` | None | Inline SVG | Static | No | Schematic | Yes | Limited; duplicates stronger interactive | Yes |
| Unused local-window SVG | `src/App.jsx:1158-1190` | None | Inline SVG | Static, not rendered | No | Schematic | No | Low | Yes |
| Toy cubic branch diagram | `StationaryPhaseDemo`, `src/App.jsx:1887-2057` | `y³+xy−1=0` | Browser root bracketing/bisection in `src/App.jsx:1642-1720` | Interactive slider | No | Synthetic | No (`/math`) | Yes as a clearly labeled toy model | Yes |
| Numerical method illustrations | `MethodIllustration`, `src/App.jsx:1722-1885` | Hard-coded points/curves | Inline SVG | Static per method route | No | Schematic/synthetic | No (`/algorithms/:slug`) | Yes as explanatory thumbnails only | Yes |
| Cassini RSS main radial-profile chart | `src/App.jsx:2190-2246, 2524-2614` | Selected local CSV | Browser parse/sort and SVG polyline | Interactive | Yes | No, except moving-average overlay | Indirect screenshot only | **Strong**: direct real-input plot | Partially; PDS conversion path missing |
| Full-profile overview | `src/App.jsx:2248-2278, 2615-2641` | Selected local CSV | Browser SVG polyline | Interactive | Yes | No | Indirect screenshot only | Strong supporting navigator | Partially |
| Moving-average residual chart | `src/App.jsx:2168-2188, 2280-2314, 2707-2751` | Selected real-data window | Five-point moving average (`halfWindow=2`) and browser SVG | Interactive | Uses real input | Model is a generic smoothing baseline, not a validated reconstruction | Indirect screenshot only | Limited unless labeled as exploratory smoothing | Code traceable; scientific validation absent |
| Procedural Saturn 3D model | `src/components/SaturnModel.jsx:1-231`; modal at `src/App.jsx:1378-1405` | Randomly generated canvas textures and hard-coded ring geometry | Three.js / React Three Fiber | Interactive WebGL | No | Schematic/procedural | Accessible from hero | Presentation context only, not scientific evidence | Code traceable; physical/data provenance absent |

## 3.2 Static asset inventory

No image-generation script, original figure project file, embedded source URL, catalog-ID manifest, or image license file was found.

| Asset | Current/known use | Data basis visible from repository | Homepage | Presentation value | Provenance |
|---|---|---|---|---|---|
| `public/images/data viewer.png` | Homepage data-provenance preview (`src/App.jsx:3063-3068`) | Screenshot visibly identifies Rev007E/K34 and `RSS_2005_123_K34_E`; values correspond to the viewer’s real-input workflow | Yes | **Strongest static project visual** | Partially traceable to local viewer and CSV; screenshot-generation step absent |
| `public/images/bifurcation.jpg` | No current direct code reference; concept duplicated by inline SVG | Synthetic fold graphic | No | Useful only if labeled synthetic | Repository does not identify creator/generator |
| `public/images/saturn-rings-labeled.jpg` | Featured reference, gallery, background (`src/App.jsx:549-562, 3272-3285, 3578-3613`) | Public ring map/image | No | Strong mission/radial context | Generic NASA/JPL-Caltech/SSI credit only; no catalog ID or direct source |
| `public/images/cassini-occultation.jpg` | Gallery and background (`src/App.jsx:563-569, 3243-3255`) | Appears to be a simulated/data-derived color rendering, not an occultation geometry diagram | No | Potentially useful with corrected caption/source | Generic NASA/JPL credit; Data Hub separately links JPL PIA07873, but the asset is not explicitly mapped to that ID |
| `public/images/cassini-division.jpg` | Gallery (`src/App.jsx:570-576`) | Mission image/context | No | Contextual | Generic NASA/JPL-Caltech/SSI credit only |
| `public/images/ring-detail.jpg` | Gallery (`src/App.jsx:577-583`) | Mission image/context | No | Strong fine-structure motivation | Generic NASA/JPL-Caltech/SSI credit only |
| `public/images/rings-and-waves.jpg` | Gallery and math lead (`src/App.jsx:584-590, 3294-3306`) | Cassini-derived image/visualization claimed by copy | No | Strong background visual | Generic NASA/JPL credit; no product/image ID |
| `public/images/great-divide.jpg` | Gallery (`src/App.jsx:591-597`) | Mission image/context | No | Contextual | Generic NASA/JPL-Caltech/SSI credit only |
| `public/images/small-particles.jpg` | Gallery (`src/App.jsx:598-604`) | Caption calls it a Cassini-derived visualization | No | Contextual | Generic NASA/JPL credit; no product/image ID |
| `public/images/vims-grain-size.jpeg` | Gallery, Data Hub lead (`src/App.jsx:605-611, 3129-3141`) | VIMS grain-size composite label is embedded in image | No | Useful multi-instrument context | Generic NASA/JPL credit; no exact product/catalog ID in repository |
| `public/images/saturn-rings-hero.jpg` | Social preview only (`src/App.jsx:10`; `index.html:27-48`) | Saturn ring image/visualization | Not visible in current homepage body | Social/mission context | Generic or absent direct provenance; no catalog ID |
| `public/images/saturn-full-view.jpg` | Unused | Saturn image/visualization | No | Contextual only | Untraceable locally |
| `public/images/saturn-edge-rings.png` | Unused | Saturn image/visualization | No | Contextual only | Untraceable locally |
| `public/images/saturn.png` | Favicon (`index.html:5`) | Saturn image | Browser chrome only | Branding | Untraceable locally |
| `public/images/giant planets and their rings.png` | Unused | Despite filename, image shows Saturn rather than a documented comparison dataset | No | Low without source | Untraceable locally |
| `public/images/student-research-pathway.png` | Unused | Author/unknown educational diagram | No | Resource-page candidate | No generation/source metadata |
| `public/images/cassini learning pipeline.png` | Unused | Author/unknown educational diagram | No | Resource-page candidate | No generation/source metadata |
| `public/textures/deep-space-background.jpg` | Unused | Astronomical deep-field texture unrelated to evidenced Saturn analysis | No | Not project evidence | Untraceable locally |
| `public/model/Saturn.glb` | Unused; current model is procedural | Unknown | No | Unclear | Untraceable locally |
| `public/icons.svg` | Unused generic social/documentation symbols | Generic vectors | No | None for research presentation | Untraceable locally |

## 3.3 Strongest verified or partially verified visuals

1. **Live Cassini RSS radial-profile viewer** — strongest evidence-bearing visualization because its input CSV, event ID, columns, plotting code, and displayed metadata are in the repository (`src/App.jsx:844-888, 2059-2772`; `public/data/*.csv`). It remains only partially provenance-traceable because the PDS labels and conversion script are absent.
2. **`public/images/data viewer.png`** — strongest static project screenshot; it visibly identifies Rev007E/K34 and uses the implemented viewer.
3. **Interactive synthetic branch demonstrations** — the homepage reliability explorer and `/math` cubic demo are fully reproducible from repository code and useful for presentation, but they are demonstrations, not Cassini-derived results.
4. **Labeled ring map and JPL occultation visual** — useful public context, but exact local-asset provenance should be attached before formal presentation.

No verified reconstruction figure, stationary-root track from Cassini data, interpolation error plot, continuation benchmark, branch-record output, caustic diagnostic on real data, or validated stationary-phase comparison figure exists.

---

# 4. Research module inventory

| Supported module | Scientific purpose | Code | Data | Figures | Implemented now | Verified output | Synthetic demonstration only | Incomplete/missing | Represented on site |
|---|---|---|---|---|---|---|---|---|---|
| Cassini observation and profile handling | Load, inspect, subset, and export RSS radial profiles | CSV parser/column selection/statistics/export at `src/App.jsx:890-1130, 2059-2772` | Five `public/data/*.csv` files | Live main/overview plots and `data viewer.png` | Yes, as front-end inspection tooling | Plots and exported selected windows are reproducible from local files | Moving-average “model fit” is exploratory | Original labels, download/conversion script, manifest, checksums, complete data dictionary | Homepage, `/viewer`, `/data-hub`, `/background` |
| Phase model/evaluation | Define oscillatory phase and motivate stationary points | Prose/formulas at `src/App.jsx:354-539, 3291-3378` | None | General method sketches | No phase-evaluation implementation | None | Formula illustrations only | Actual project phase function, parameter definitions, evaluator, test values, performance/error outputs | Homepage, `/math`, `/algorithms` |
| One-dimensional interpolation | Approximate phase efficiently using PCHIP, cubic spline, Floater–Hormann | Descriptions at `src/App.jsx:141-145, 230-263`; generic SVGs in `MethodIllustration` | None | Method SVGs | No numerical interpolation code found | None | Schematic examples only | Source samples, algorithms/notebooks, comparison protocol, errors/timing, output figures | Homepage and `/algorithms` |
| Stationary-root solving | Solve `∂ψ/∂φ=0`, potentially with Newton/Halley | Descriptions/formulas at `src/App.jsx:276-297, 484-524`; synthetic root bracketing at `src/App.jsx:1642-1720` | None from Cassini | Newton/Halley sketches; cubic demo | Only bisection-like solving of a toy cubic is executable | Synthetic roots are reproducible | Yes | Project phase derivative, initializers, Newton/Halley implementation, convergence records, real/synthetic test suite | Homepage, `/math`, `/algorithms` |
| Continuation / pseudo-arclength continuation | Preserve solution branches through folds | Description at `src/App.jsx:298-307`; static SVG at `src/App.jsx:1783-1797` | None | Continuation sketch | No continuation algorithm found | None | Yes | Predictor/corrector code, step control, branch outputs, fold tests, comparisons with natural continuation | Homepage and `/algorithms` |
| Branch bookkeeping | Preserve branch identity and attach phase/curvature/status | Description at `src/App.jsx:320-329, 525-539, 672-693`; UI at `src/App.jsx:2933-2957` | None | Bookkeeping sketch | Data structure is described but not implemented as persisted/computed records | None | Schematic matching only | Record schema, matching algorithm, branch IDs over parameter sequence, tests, serialized output | Homepage, `/team`, `/algorithms` |
| Bifurcation/fold treatment | Detect merges/disappearances and avoid unsafe single-branch interpolation | Synthetic components at `src/App.jsx:1192-1233, 1407-1627, 1642-1720, 1887-2057` | None | Multiple fold diagrams | Synthetic interaction is implemented | Synthetic state transitions reproducible | Yes | Project-specific Taylor/discriminant code, caustic handling, local refinement algorithm, real/synthetic validation | Homepage, `/math`, `/algorithms` |
| Local reliability diagnostics | Combine curvature, branch separation, and jump behavior | Synthetic calculations at `src/App.jsx:1437-1490`; formula preview at `src/App.jsx:3015-3051` | None | Live synthetic diagnostic panel | Implemented only for normalized toy fold | Synthetic values reproduce from component | Yes | Justified thresholds, units/scaling, Cassini/project root input, calibration and validation | Homepage, `/team`, `/algorithms` |
| Multivariate interpolation | Represent genuinely multi-branch stationary-angle structure | Prose at `src/App.jsx:162-165, 652-669` | None | None specific | No numerical implementation found | None | No executable demo | Formulation, implementation, datasets, tests, outputs | Homepage Core Methods and `/team` |
| Stationary-phase evaluation | Approximate isolated stationary contributions | Formula at `src/App.jsx:456-471` | None | Formula only | No evaluator found | None | Explanatory only | Amplitude/phase input, summation implementation, asymptotic assumptions, numerical integral comparison | `/math`, pipeline language |
| Reconstruction and validation | Reconstruct ring structure and compare with a trusted reference/full integral | Planned descriptions at `src/App.jsx:222-227, 309-318, 341-351` | No derived data | Benchmark schematic only | No reconstruction or scientific validation implementation found | None | Benchmark image is schematic; viewer residual is only moving-average residual | Reconstruction code/output, reference integral, metrics, uncertainty, validation protocol, reproducible figures | Homepage pipeline, `/overview`, `/algorithms`, `/progress` |

---

# 5. Real result audit

## 5.1 Result inventory

No item meets `VERIFIED_REAL_RESULT`: there is no end-to-end provenance package plus generating code plus validated project output.

| Result or potentially presentable item | Dataset | Generating code | Output file | Figure | Quantitative metric actually available | Validation evidence | Reproducible from repository | Confidence classification |
|---|---|---|---|---|---|---|---|---|
| Five local Cassini RSS radial-profile subsets | Five `public/data/*.csv` files | Conversion code absent; browser loading at `src/App.jsx:2059-2141` | The CSV files themselves | Live viewer | Raw/profile columns; row counts and radial ranges | PDS/CORSS source assertion, event IDs; no labels/checksums | Local display yes; source conversion no | `PARTIALLY_TRACEABLE_REAL_RESULT` |
| Radius vs. normal-optical-depth/signal-power viewer | Same five CSVs | `src/App.jsx:2114-2278, 2524-2641` | No generated persisted figure | Main SVG and overview | Min/max, mean, median, standard deviation, local-peak count (`src/App.jsx:970-1021, 2362-2372`) | No independent comparison; these are descriptive summaries | Yes from local CSVs | `REAL_INPUT_BUT_UNVERIFIED_OUTPUT` |
| Selected-window moving-average overlay and residual | Selected real-data window | `movingAverage` and residual logic at `src/App.jsx:994-1002, 2168-2188, 2280-2314` | No persisted output | Viewer overlay/residual SVG | RMS residual, bias, window statistics (`src/App.jsx:2171-2187, 2380-2387, 2707-2751`) | None; moving average is not identified as a physical/reconstruction model | Yes | `REAL_INPUT_BUT_UNVERIFIED_OUTPUT` |
| Selected-window CSV export | Selected real-data window | `src/App.jsx:2316-2329` | User-downloaded `cassini_<dataset>_window_<min>_<max>.csv` | None | Original selected rows only | Not applicable | Yes | `REAL_INPUT_BUT_UNVERIFIED_OUTPUT` |
| Homepage stationary-root reliability explorer | None | `src/App.jsx:1407-1627` | None | Interactive branches/diagnostics | Schematic `Δφ`, `|ψ″|`, `q_jump`, `C_s` | Analytic code only; not connected to project phase or Cassini data | Yes | `SYNTHETIC_DEMONSTRATION` |
| `/math` cubic branch roots | None | `src/App.jsx:1642-1720, 1887-2057` | None | Interactive branch plot | Number and location of real roots of `y³+xy−1=0` | Internally reproducible; no relation to Cassini established | Yes | `SYNTHETIC_DEMONSTRATION` |
| Hero radio-occultation mechanism | None | `src/App.jsx:1246-1376` | None | Inline SVG | None | Conceptual only | Yes | `SCHEMATIC_EXPLANATION` |
| Static bifurcation/branch diagrams | None | `src/App.jsx:1192-1233`; `public/images/bifurcation.jpg` | Raster asset has no generator | Static SVG/raster | None | None | Inline SVG yes; raster generation no | `SCHEMATIC_EXPLANATION` |
| Eleven numerical-method examples | None | Descriptions `src/App.jsx:230-351`; SVG renderer `src/App.jsx:1722-1885` | None | Method SVGs | No measured error/timing/convergence metrics | None | Visuals yes | `SCHEMATIC_EXPLANATION` |
| Procedural Saturn model | None | `src/components/SaturnModel.jsx` | Runtime WebGL only | 3D model | None | No physical or image validation | Runtime generation yes, appearance is randomized | `SCHEMATIC_EXPLANATION` |
| Claimed future reconstruction/benchmark | No dataset | No generating code | No output | Benchmark sketch only | None | None | No | `PLACEHOLDER_OR_UNKNOWN` |

## 5.2 Current language requiring scientific-credibility review

These are audit flags, not rewritten claims:

1. **“Results” framing without repository results.** SEO calls `/overview` “Saturn Rings Reconstruction Results” (`src/App.jsx:64-66`) and the page heading is “Current Results & Diagnostics” (`src/App.jsx:3208`), but the page contains only prose and explicitly says no final reconstruction results (`src/App.jsx:3210-3234`).
2. **Reconstruction pipeline may read as implemented.** Homepage stage 07 says “sum reliable contributions” (`src/App.jsx:134-137`), although no stationary-phase summation or reconstruction code/output exists.
3. **Core-method cards omit status.** The homepage lists interpolation comparisons, pseudo-arclength continuation, discriminant diagnostics, and multivariate interpolation (`src/App.jsx:141-165`) without exposing that the detailed toolkit labels many as candidate, planned, or prototype (`src/App.jsx:230-351`).
4. **Reliability formula has no repository validation.** The homepage says thresholds remain in validation (`src/App.jsx:3019-3029`), but no threshold values, test dataset, validation code, or output is present.
5. **Detailed contributor claims rely on website copy.** `teamMembers` attributes paper sections and technical modules (`src/App.jsx:614-693`), but no paper or contribution record exists in the repository.
6. **Image provenance is over-broad.** Multiple assets are assigned generic NASA/JPL/SSI source classes (`src/App.jsx:90-98, 548-611`) without exact image IDs, source URLs, or licenses.
7. **`cassini-occultation.jpg` is captioned as geometry.** The asset used at `src/App.jsx:3243-3255` visually resembles the JPL PIA07873 simulated/data-derived ring rendering, not a spacecraft-to-Earth geometry diagram. The repository should not use the image itself as evidence of geometry without an exact source mapping.
8. **“Paper-Based Contribution Dashboard” is not paper-backed locally.** The title at `src/App.jsx:3383` cannot be checked against a paper in this repository.
9. **Progress labels can overstate implementation depth.** “Stationary-root reliability checks” and “Branch bookkeeping prototype” are listed as in progress (`src/App.jsx:823-830`), while the repository contains a synthetic UI diagnostic and descriptive record, not project-data algorithms.
10. **The viewer’s “Model Fit On” label is stronger than its implementation.** The toolbar uses that phrase (`src/App.jsx:2475-2488`), but the model is a five-point moving average (`src/App.jsx:994-1002, 2171-2176`), not a fitted physical reconstruction model.

---

# 6. Team contribution evidence

The repository explicitly names Dell Li, Maiya Qiu, and Yutong Zhao as authors and Dr. Ryan Maguire as mentor on the homepage (`src/App.jsx:2857-2858`). Structured data names the three students (`src/App.jsx:2811-2815`). Detailed contribution statements exist only as website constants/UI copy; there is no paper, signed contribution statement, module ownership file, or research-code history in the repository that independently substantiates them.

| Contributor | Stated contribution | Supporting repository text | Documentation classification | Confidence |
|---|---|---|---|---|
| Dell Li | Branch bookkeeping, local diagnostics, reliability testing, research portal; abstract and named paper sections; branch record/confidence/viewer/portal module | `src/App.jsx:672-693`; focused homepage statement at `src/App.jsx:2933-2957`; root explorer strip at `src/App.jsx:1620-1624` | `EXPLICITLY_DOCUMENTED` as a website statement; not independently corroborated | Medium for what the site claims; low for completed research implementation |
| Maiya Qiu | Interpolation and stationary-root numerical methods; C-spline, PCHIP, Floater–Hormann, Newton, Halley, pseudo-arclength continuation | `src/App.jsx:629-650` | `EXPLICITLY_DOCUMENTED` as a website statement; not independently corroborated | Medium for role statement; low for implemented outputs |
| Yutong Zhao | Theoretical background and multivariate interpolation; wave optics, Huygens–Fresnel, ring geometry, stationary phase, RBF-style reconstruction | `src/App.jsx:652-670` | `EXPLICITLY_DOCUMENTED` as a website statement; not independently corroborated | Medium for role statement; low for implemented outputs |
| Dr. Ryan Maguire | Mentor/research advisor providing guidance, mathematical supervision, and project direction | `src/App.jsx:614-628`; mentor line `src/App.jsx:2858` | `EXPLICITLY_DOCUMENTED` as a website statement; not independently corroborated | Medium |
| Whole student team | Authors of “New Methods Toward High-Resolution Reconstruction of Saturn’s Rings” | Project title and byline at `src/App.jsx:2848-2858`; SEO title at `src/App.jsx:45-47` | `EXPLICITLY_DOCUMENTED` in website | Medium pending paper/citation artifact |
| Algorithm code ownership by individual students | No source files identify authorship, and this audit does not infer it from Git history or filenames | No supporting artifact found | `NOT_DOCUMENTED` | High confidence that it is absent from this repository |
| Responsibility for validation, data conversion, and figure generation | No explicit assignment found | No supporting artifact found | `NOT_DOCUMENTED` | High confidence that it is absent from this repository |

The progress list itself says the team/mentor must be asked which names and contributions may be public (`src/App.jsx:831-839`). That unresolved approval should supersede assumptions based on current UI visibility.

---

# 7. Paper, code, and research-asset inventory

| Asset/question | Repository finding | Status/evidence |
|---|---|---|
| Latest full paper PDF | No PDF found anywhere in the 43-file workspace; no paper URL in `README.md`, `src/App.jsx`, or site metadata | **Missing** |
| Earlier paper versions | None found or linked | **Missing/unknown** |
| Formal paper title | Present in homepage/SEO (`src/App.jsx:45-47, 2848-2856`) | Present as website copy, not a citation artifact |
| Authors and mentor | Present (`src/App.jsx:614-693, 2857-2858`) | Present as website copy |
| Citation information | No BibTeX, DOI, publication venue, paper date/version, abstract file, or recommended citation | **Missing** |
| GitHub repository URL | Configured remote is `https://github.com/Dellin3/primes-ring-website.git`; public repository URL was reachable on audit date | Present in Git configuration, absent from website UI and README |
| Downloadable code | Public GitHub repository provides source indirectly; website has no Paper & Code link or source archive link | Partially available |
| Release/version information | `package.json:3` is `0.0.0`; GitHub releases page reported no releases | No project release |
| Figure files | 18 raster/texture files, one SVG symbol file, and one GLB model under `public/` | Present |
| Figure-generation scripts | None found | **Missing** |
| Cleaned observation data | Five local Cassini RSS CSV subsets in `public/data/` | Present, partial provenance |
| Original PDS labels/raw inputs | None found | **Missing** |
| Data-processing/conversion scripts | None found | **Missing** |
| Derived roots/branches/diagnostics | No persisted derived files | **Missing** |
| Reconstruction output | None | **Missing** |
| Validation output | None | **Missing** |
| Supplementary material | None identified | **Missing** |
| Notebooks | None | **Missing** |
| Research scripts/packages | None | **Missing** |
| 3D asset | `public/model/Saturn.glb` exists but is unused and unprovenanced; active model is procedural `src/components/SaturnModel.jsx` | Present but not research evidence |

## 7.1 Link audit

Repository-authored external links are concentrated in `src/App.jsx:698-807` plus the external Research Starter Lab at `src/App.jsx:9`.

The following top-level links returned content during this audit:

- `https://pds-rings.seti.org/`
- `https://pds-rings.seti.org/cassini/`
- `https://pds-rings.seti.org/cassini/rss/`
- `https://pds.nasa.gov/ds-view/pds/viewDataset.jsp?dsid=CO-SR-UVIS-HSP-2%2F4-OCC-V2.0`
- `https://pds-rings.seti.org/cassini/uvis/`
- `https://pds-atmospheres.nmsu.edu/data_and_services/atmospheres_data/Cassini/inst-vims.html`
- `https://pds-atmospheres.nmsu.edu/data_and_services/atmospheres_data/Cassini/sci-rings.html`
- `https://www.jpl.nasa.gov/images/pia07873-radio-occultation-unraveling-saturns-rings/`
- `https://student-research-lab-theta.vercel.app/`
- `https://github.com/Dellin3/primes-ring-website`

No repository-authored top-level external link was proven broken during the audit. Link longevity is not guaranteed. The PDS Atmospheres pages contain some empty or legacy links internally, but those are not links authored by this repository.

Uncertain/missing links:

- No per-CSV PDS product or label URL.
- No paper link.
- No website link to its GitHub repository.
- No exact source URL for any local image asset.
- `index.html:59` loads `@google/model-viewer` from unpkg, but no `<model-viewer>` is used; this is an unnecessary external dependency rather than a content link.
- `public/model/Saturn.glb` and `public/icons.svg` are unreferenced.

---

# 8. Homepage architecture audit

The recommendations below are audit recommendations only. No architecture was changed.

| Current homepage section | Recommended action | Reason |
|---|---|---|
| Research hero / Figure 01 | `KEEP_ON_HOME` | It establishes project identity, authorship, mentor, scientific problem, and clearly labeled measurement geometry without asserting a result. |
| The Research Question | `KEEP_ON_HOME` | It gives the minimum observation → inverse problem → numerical challenge sequence needed to understand the project. |
| Stationary-root reliability explorer | `KEEP_ON_HOME` | It is the strongest reproducible explanation of the central branch-merging mechanism, provided its synthetic/schematic label remains prominent. |
| Core Research Methods | `MOVE_TO_RESEARCH` | It is a useful project map, but most methods lack implementation evidence and the content repeats `/algorithms`; a Research page can expose status and artifacts per method. |
| Contributor Focus — Dell Li | `MOVE_TO_RESEARCH` | Contribution evidence belongs with the complete team/module map; keeping one student’s section on the homepage can imply asymmetric project ownership. |
| Near a Bifurcation | `MERGE_WITH_ANOTHER_SECTION` | It substantially repeats the stronger interactive root explorer and the `/math` cubic demo. |
| Research Pipeline | `MOVE_TO_RESEARCH` | It is useful architecture, but currently depicts stages—including reconstruction—that are not implemented; a Research page can distinguish implemented/planned stages. |
| Reliability-Diagnostic Preview | `MERGE_WITH_ANOTHER_SECTION` | Its concepts and confidence states are already demonstrated more clearly by the interactive root explorer; derivation/status belongs in Research. |
| Cassini Data Provenance | `MOVE_TO_DATA_EXPLORER` | The dataset list, event IDs, source statement, and viewer screenshot directly support a future Cassini Data Explorer. |
| Research Learning Resources | `MOVE_TO_RESOURCES` | It is secondary educational material and includes references to resources not present locally. |
| Sources & Credits | `MOVE_TO_RESOURCES` | Central provenance notes should remain visible where needed, while a Resources page should contain complete citations, image IDs, and data lineage. |

No current homepage section is recommended `REMOVE_AS_PLACEHOLDER` because even the unimplemented-method sections communicate intended project scope. Sections should not be deleted until the missing paper, contribution approvals, and implementation artifacts establish what they can be replaced with.

---

# 9. Missing-material checklist

## Format glossary

- **CSV** — Comma-Separated Values（逗号分隔数据表，用于保存可读取的数值数据）
- **JSON** — JavaScript Object Notation（一种保存结构化元数据的文本格式）
- **SVG** — Scalable Vector Graphics（可无损缩放的矢量图格式）
- **PDF** — Portable Document Format（适合保存正式论文和图表的文档格式）

## P0 — required before homepage restructuring

- [ ] **Latest approved project paper.** Needed to verify title, abstract, notation, method scope, result status, authorship, mentor attribution, and contribution language. Likely source: all students and Dr. Ryan Maguire. Blocks redesign: **Yes**. Recommended: versioned PDF plus source archive if publication is allowed.
- [ ] **Approved contribution matrix.** Needed to represent the complete team without inferring ownership from current homepage emphasis. Likely source: team and mentor. Blocks redesign: **Yes**. Recommended: signed-off Markdown or JSON with contributor, approved role text, paper sections, implementation artifacts, and public/private status.
- [ ] **Claim-to-evidence register.** Needed to distinguish background, implemented method, draft result, in-validation result, and proposed work. Likely source: team/mentor. Blocks redesign: **Yes**. Recommended: CSV or JSON mapping claim → paper section → code → data → output → validation status.
- [ ] **Canonical data provenance package for the five CSVs.** Needed to verify that each local subset corresponds exactly to the stated `CORSS_8001` product/event. Likely source: person who downloaded/converted the PDS data. Blocks redesign: **Yes for evidence-forward claims**, not for visual layout. Recommended: original PDS labels, direct URLs, checksums, and a JSON manifest.
- [ ] **Public-release decision.** Needed because `README.md:5` warns against unpublished PRIMES data and `src/App.jsx:831-839` says names/contributions require team/mentor review. Likely source: team/mentor/PRIMES policy. Blocks redesign: **Yes**. Recommended: Markdown approval record listing publishable paper, code, data, figures, names, and claims.

## P1 — required for the Cassini Data Explorer

- [ ] **Reproducible TAB-to-CSV conversion script.** Needed to regenerate local files and document filtering/subsetting. Source: original converter or a new team-reviewed implementation. Blocks Data Explorer credibility: **Yes**. Recommended: Python script plus locked environment file.
- [ ] **Dataset manifest.** Needed for event/revolution, band, ingress/egress, product type, resolution, source URL, local row count, radial range, checksum, and citation. Source: PDS labels and converter. Blocks Data Explorer credibility: **Yes**. Recommended: JSON.
- [ ] **Data dictionary and units.** Needed for all 13 fields, especially correction terms, event times, thresholds, normalized power, and sign conventions. Source: `CORSS_8001` documentation/PDS labels. Blocks reliable interpretation: **Yes**. Recommended: Markdown plus machine-readable JSON schema.
- [ ] **Original PDS label/document files.** Needed for per-product lineage and archive citation. Source: PDS Ring-Moon Systems Node. Blocks end-to-end provenance: **Yes**. Recommended: original label/TXT files preserved unchanged.
- [ ] **Subset-selection rationale.** Needed to explain why these five narrow radial windows and these rows were selected. Source: data preparer/team. Blocks interpretation: **No**, but required before presenting them as representative. Recommended: Markdown or CSV manifest fields.
- [ ] **Explicit full-file download links and citations.** Needed to distinguish full local subset downloads from selected-window exports. Source: website/data owner. Blocks redesign: **No**. Recommended: direct CSV links and citation text.
- [ ] **Viewer analysis definitions.** Needed to state that peak count, five-point moving average, RMS, and bias are exploratory display calculations rather than reconstruction validation. Source: developer/team. Blocks scientific labeling: **Yes**. Recommended: Markdown methods note.

## P2 — required for authentic research-module pages

- [ ] **Project phase function and evaluator.** Needed to replace generic `ψ` prose with inspectable project mathematics. Source: paper/theory module. Blocks authentic phase page: **Yes**. Recommended: paper section PDF/TeX plus tested Python/Julia/Matlab code.
- [ ] **Interpolation experiment package.** Needed for cubic spline, PCHIP, and Floater–Hormann claims. Source: interpolation contributor. Blocks result claims: **Yes**. Recommended: notebook/script, synthetic and project input CSV, error/timing CSV, and SVG/PDF figures.
- [ ] **Newton/Halley stationary-root implementation and tests.** Needed to show actual root sets, initial-guess sensitivity, convergence/failure cases, and tolerances. Source: root-solving contributor. Blocks implementation claims: **Yes**. Recommended: source module, test suite, JSON run metadata, CSV outputs.
- [ ] **Natural and pseudo-arclength continuation implementation.** Needed to substantiate fold tracking. Source: continuation contributor. Blocks continuation claims: **Yes**. Recommended: source module, synthetic benchmark, branch CSV, and SVG figure.
- [ ] **Branch-record schema and bookkeeping implementation.** Needed for `(φ_s, ψ, ψ″, amplitude, label, status, C_s)` records. Source: bookkeeping contributor. Blocks branch-output presentation: **Yes**. Recommended: JSON schema, code, unit tests, and sample JSON/CSV records.
- [ ] **Bifurcation/discriminant diagnostic implementation.** Needed to substantiate local Taylor/discriminant language. Source: relevant contributor/paper section. Blocks diagnostic claims: **Yes**. Recommended: derivation PDF/TeX, code, synthetic tests, and output CSV.
- [ ] **Reliability threshold definition and validation.** Needed for `τ_curv`, `τ_sep`, `τ_jump`, and `C_s`. Source: diagnostics contributor and mentor. Blocks confidence claims: **Yes**. Recommended: methods note, configuration JSON, validation script, and result CSV.
- [ ] **Multivariate interpolation implementation.** Needed to substantiate RBF/multi-branch claims. Source: theory/multivariate contributor. Blocks module authenticity: **Yes**. Recommended: code/notebook, test surfaces, quantitative comparison CSV, SVG/PDF figures.
- [ ] **Stationary-phase evaluator.** Needed to compute individual and summed contributions from actual roots. Source: project numerical code. Blocks reconstruction: **Yes**. Recommended: tested source module and serialized outputs.
- [ ] **Reconstruction implementation and outputs.** Needed before any higher-resolution reconstruction result can be claimed. Source: full team. Blocks reconstruction result page: **Yes**. Recommended: source package, immutable input manifest, output CSV/array files, run JSON, and vector figures.
- [ ] **Validation reference and protocol.** Needed to compare stationary-phase output against a fuller integral/reference reconstruction with justified metrics. Source: full team/mentor. Blocks validated results: **Yes**. Recommended: protocol PDF/Markdown, scripts, reference data, result CSV, and uncertainty figures.

## P3 — required for presentation mode

- [ ] **Approved presentation figure set.** Needed for consistent figure numbering, captions, data/schematic labels, and source citations. Source: team. Blocks presentation mode: **Yes**. Recommended: SVG/PDF plus PNG fallback.
- [ ] **One verified end-to-end result narrative.** Needed to demonstrate input → method → diagnostic → output → validation without mixing toy and real data. Source: team/mentor. Blocks a scientific results presentation: **Yes**. Recommended: Markdown storyboard linked to immutable artifacts.
- [ ] **Formal project citation and version.** Needed for title slide, QR/download page, and audience reference. Source: team/PRIMES. Blocks polished presentation: **Yes**. Recommended: BibTeX, CITATION.cff, and versioned release notes.
- [ ] **Presentation-safe team role text.** Needed to represent all students and mentor consistently. Source: team/mentor. Blocks team slide: **Yes**. Recommended: approved Markdown/JSON.
- [ ] **Figure accessibility package.** Needed for concise alt text, long descriptions, and color-independent interpretation. Source: figure authors. Blocks accessibility quality, not core redesign. Recommended: JSON/Markdown keyed by figure ID.
- [ ] **Offline/static presentation package.** Needed if network access is uncertain. Source: website maintainer. Blocks only offline presentation. Recommended: versioned release ZIP with built site and local assets.

## P4 — optional visual enhancements

- [ ] **Exact NASA/JPL/PDS catalog IDs and direct URLs for every image.** Source: asset collector. Blocks redesign: **No**, but improves credibility. Recommended: image-manifest JSON.
- [ ] **Regenerated method figures from actual scripts.** Source: module owners. Blocks redesign: **No** if current schematics remain clearly labeled. Recommended: SVG plus generation scripts.
- [ ] **Deterministic Saturn model textures or documented model source.** Source: 3D asset author. Blocks redesign: **No**. Recommended: GLB with license/source metadata or deterministic procedural seed.
- [ ] **Curated cleanup inventory for unused assets.** Source: website maintainer. Blocks redesign: **No**. Recommended: Markdown list; do not delete until provenance/publication review is complete.
- [ ] **Social-preview image aligned with current scientific hero.** Source: website maintainer. Blocks redesign: **No**. Recommended: 1200×630 PNG/SVG source with provenance.

---

# 10. Final audit summary

## A. What is already ready for public presentation

- The exact project title, three student names, and mentor attribution are clearly presented in `src/App.jsx:2848-2858`, subject to the unresolved public-approval note in `src/App.jsx:831-839`.
- The radio-occultation mechanism in `HeroScientificFigure` is a strong, explicitly labeled author schematic (`src/App.jsx:1246-1376`).
- The five local CSVs can be loaded, inspected, summarized, windowed, and exported by the functioning Cassini Data Viewer (`src/App.jsx:2059-2772`).
- The synthetic branch demonstrations are reproducible and clearly labeled as toy/schematic (`src/App.jsx:1407-1627, 1887-2057`).
- The PDS/JPL resource links in `src/App.jsx:698-807` were reachable during this audit.

## B. What is real but still needs provenance or validation

- All five CSV subsets are identified as PDS `CORSS_8001` RSS-derived data, but lack original labels, direct product URLs, checksums, and conversion scripts.
- Viewer plots and descriptive statistics use real inputs and are reproducible locally, but are not scientific reconstruction results.
- Moving-average residuals and RMS/bias values use real inputs but have no documented physical interpretation or validation role.
- Public mission imagery is likely authentic/contextual, but exact catalog IDs and per-file sources are generally absent.

## C. What is currently synthetic or schematic

- Hero radio-occultation SVG.
- Homepage stationary-root reliability explorer and all its diagnostic values.
- `/math` cubic branch model.
- Static homepage branch figure and `public/images/bifurcation.jpg`.
- All numerical-method SVG examples.
- Procedural 3D Saturn model.
- Educational pathway/pipeline graphics.
- Homepage pipeline and confidence preview.

## D. What is missing from each team research module

- **Maiya Qiu’s stated interpolation/root module:** no interpolation code, input/output datasets, comparison metrics, Newton/Halley implementation, PAC implementation, or generated figures.
- **Yutong Zhao’s stated theory/multivariate module:** no paper section, multivariate/RBF code, datasets, numerical outputs, or figures.
- **Dell Li’s stated bookkeeping/diagnostic module:** no branch-record schema implementation, branch matching output, project-data diagnostics, thresholds, reliability validation, or benchmark result; the portal/viewer and synthetic UI are present.
- **Dr. Ryan Maguire’s mentorship:** role is stated, but no approved project summary, paper, or release record is present.
- **Whole-team reconstruction:** no end-to-end phase/root/continuation/stationary-phase/reconstruction pipeline, derived output, or validation evidence.

## E. What must be obtained before redesigning the homepage

At minimum: the latest approved paper, an approved team contribution matrix, a claim-to-evidence register, per-file Cassini provenance, and a public-release decision. Without these, simplification risks preserving the wrong method emphasis, presenting plans as results, or omitting a team member’s actual work.

## F. Proposed minimal site map based only on verified existing content

1. **HOME** — project identity; concise research question; clearly labeled synthetic branch explorer; links to real data, research status, and resources.
2. **RESEARCH** — paper/framework when supplied; module-by-module status separating background, synthetic demonstrations, implemented code, and validated results; complete team contribution map.
3. **CASSINI DATA EXPLORER** — the current five-profile viewer, dataset manifest, PDS provenance, data dictionary, and downloads.
4. **PAPER & CODE / RESOURCES** — paper/citation when supplied, GitHub/source download, PDS/JPL references, figure credits, mission background, gallery, and educational resources.

This map does not justify a standalone “Results” page until validated project outputs exist.

## G. Five highest-risk scientific-credibility issues

1. **No paper or research implementation artifacts:** the site describes a broad numerical project, but the repository is currently a website plus five data subsets, synthetic demonstrations, and generic method prose.
2. **No end-to-end Cassini provenance:** local CSVs name credible events and `CORSS_8001`, but cannot be regenerated or checked against original PDS labels from repository materials.
3. **Synthetic diagnostics may be mistaken for project results:** the homepage reliability explorer and confidence formula are visually prominent but are not connected to Cassini data or a project phase function.
4. **Results/reconstruction terminology exceeds evidence:** `/overview`, pipeline, method cards, and SEO use result/reconstruction language without derived reconstruction outputs or validation.
5. **Contribution and image provenance are asserted but not independently documented:** detailed team roles lack the referenced paper, and most NASA/JPL assets lack exact catalog IDs/source URLs.

---

# Audit counts and unresolved questions

## Counts

- **Repository files inspected/inventoried:** 43 non-`node_modules` workspace files, plus configured Git remote and linked public pages.
- **Research datasets found:** 5 CSV files containing 220 data rows (32,679 bytes total); all classified `REAL_CASSINI_SOURCE` with partial end-to-end provenance.
- **Persisted derived research datasets found:** 0.
- **Static public visual/media assets found:** 20 (18 raster/texture files, 1 SVG symbol file, 1 GLB model).
- **Primary code-generated visualization systems found:** 8 (`HeroScientificFigure`, reliability explorer, two inline schematic components, `MethodIllustration`, `StationaryPhaseDemo`, `CassiniDataViewer`, and `SaturnModel`).
- **Research modules identified:** 11.
- **`VERIFIED_REAL_RESULT` items found:** 0.
- **Real-input but partial/unverified result families found:** 4 (local profile subsets, viewer plots/statistics, moving-average residual analysis, selected-window export).
- **Clearly synthetic/schematic primary visual items or method examples found:** 20 (hero SVG, reliability explorer, two inline schematics, cubic demo, eleven method examples, procedural Saturn model, bifurcation raster, and two educational diagrams), excluding repeated renderings and general mission imagery.

## Files inspected

The 43-file pre-audit workspace inventory was:

- Root/configuration: `.gitignore`, `README.md`, `eslint.config.js`, `index.html`, `package-lock.json`, `package.json`, `vercel.json`, `vite.config.js`
- Application source: `src/App.css`, `src/App.jsx`, `src/index.css`, `src/main.jsx`, `src/components/SaturnModel.jsx`
- Data: `public/data/cassini_rev007e_k34.csv`, `public/data/cassini_rev010e_k25.csv`, `public/data/cassini_rev054ce_k55.csv`, `public/data/cassini_rev089ce_k34.csv`, `public/data/cassini_rev133e_x34.csv`
- Images: `public/images/bifurcation.jpg`, `public/images/cassini learning pipeline.png`, `public/images/cassini-division.jpg`, `public/images/cassini-occultation.jpg`, `public/images/data viewer.png`, `public/images/giant planets and their rings.png`, `public/images/great-divide.jpg`, `public/images/ring-detail.jpg`, `public/images/rings-and-waves.jpg`, `public/images/saturn-edge-rings.png`, `public/images/saturn-full-view.jpg`, `public/images/saturn-rings-hero.jpg`, `public/images/saturn-rings-labeled.jpg`, `public/images/saturn.png`, `public/images/small-particles.jpg`, `public/images/student-research-pathway.png`, `public/images/vims-grain-size.jpeg`
- Other public assets/site metadata: `public/googlee78e70c2ff33c781.html`, `public/icons.svg`, `public/llms.txt`, `public/model/Saturn.glb`, `public/robots.txt`, `public/sitemap.txt`, `public/sitemap.xml`, `public/textures/deep-space-background.jpg`

## Unresolved questions

1. Where is the latest paper, and which version is approved for publication?
2. Are the title, author order, mentor attribution, and detailed contribution statements approved by all team members and PRIMES?
3. Which exact `CORSS_8001` files and labels produced each local CSV, and what filtering/conversion was applied?
4. Does `E` in each local event/product identifier mean egress in the intended metadata convention, and how should `CE` revolutions be described?
5. Who generated each local image and diagram, and what exact NASA/JPL/PDS catalog ID or license applies?
6. Where are the actual interpolation, root-finding, continuation, multivariate interpolation, bookkeeping, reconstruction, and validation implementations?
7. Are any derived outputs intentionally excluded because they are unpublished, or do they not yet exist?
8. What thresholds and evidence support the proposed confidence score?
9. Is the moving-average residual intended only as a viewer aid, or as part of a documented analysis protocol?
10. Which content may be released publicly as paper, source code, data, figures, and supplementary material?
11. Should `/math#stationary-demo` scroll to its target after route navigation? The current route-change effect scrolls to the top, and no explicit hash-scroll handler was found (`src/App.jsx:2818-2825`).
