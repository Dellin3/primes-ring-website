# MIT PRIMES Saturn Rings Website Architecture

## Purpose

This document defines Architecture Pass 1 for the complete MIT PRIMES 2026 Saturn Rings team project. The structure is intentionally stable while manuscript language, figures, scientific outputs, provenance records, and contributor descriptions remain subject to verification.

Project identity, team metadata, routes, research modules, and datasets are centralized in:

- `src/content/project.js`
- `src/content/researchModules.js`
- `src/content/datasets.js`

## 1. Canonical route map

| Route | Purpose |
| --- | --- |
| `/` | Short project gateway |
| `/research` | Whole-project research overview |
| `/research/:moduleSlug` | Reusable major-module detail template |
| `/data` | Catalog of public local Cassini-derived observation subsets |
| `/data/:datasetSlug` | One dataset record, profile viewer, derived-products state, and downloads |
| `/resources` | Paper status, public code, figures, data, and provenance gateway |
| `/*` | Not-found page unless the path is a documented legacy redirect |

The only primary navigation items are Research, Data, and Paper & Code. The site mark links to Home.

## 2. Homepage four-block limit

Excluding the shared footer, the homepage may contain only:

1. Project Hero
2. Research Preview
3. Cassini Data Explorer Preview
4. Research Assets Preview

The Hero has one project-level summary, one primary action, one secondary link, and one explanatory visual. The Research Preview contains exactly three major modules. The Data Preview lazily reads the conversion-verified DLP profile catalog and the featured product’s display-only source-sample overview. The Research Assets Preview contains only Paper, Code, and Data.

## 3. Research-module template

Every module detail page uses the same five areas:

1. The Question
2. Implementation
3. Real Data & Results
4. Explore
5. Reproducibility

Architecture Pass 1 populates only the broad question. All other areas use a deliberate verified-artifact empty state. New algorithms, interactives, and figures belong inside the appropriate module rather than in new top-level pages.

The current module names and descriptions are provisional architecture labels:

- Signal & Phase Approximation
- Stationary Roots & Continuation
- Reliability & Reconstruction Interface

Contributor arrays exist in `src/content/researchModules.js` and remain empty until the team contribution map is approved.

## 4. Dataset catalog and detail structure

`/data` is a master–detail observatory driven by `public/data/observations/catalog.json`. Only complete DLP profile products that pass PDS-label parsing, local conversion checks, exact-chunk hashing, deterministic source comparisons, and overview verification appear in the active rail.

Each observation viewer loads `metadata.json` and a display-only source-sample `overview.json` first. Optical-depth and signal-power extrema are retained; phase values are carried at the selected source rows and rendered as unconnected points without inferring continuity. Exact converted Float64 samples are stored in deterministic hashed binary chunks and fetched only when a selected radial interval requires them. The shared observation components, binary index, URL-state contract, provenance chain, and export format are observation-independent.

Each dataset detail page contains:

- Overview: documented PDS product identity and complete radial context
- Profile: Canvas rendering, variable selection, radial-window navigation, exact chunk loading, sample inspection, and selected-window export
- Derived Products: an explicit statement that no verified derived scientific output is currently published
- Provenance and Data Fields: expandable source lineage and PDS label documentation

The earlier small CSVs are labeled internally as legacy research-window subsets and archived outside public production assets. They are not complete observations and remain outside the active catalog until their parent-product mappings are verified.

## 5. Provisional content

The following material is provisional and may change without changing site architecture:

- Research module names, descriptions, order, and broad questions
- Research-module contributor metadata
- Public paper link and citation
- Figure lists and module interactives
- Detailed per-dataset provenance manifests
- Module implementation and reproducibility records

The public paper status is “Not yet available” as of the 2026-09-09 refinement. A submission or revision status requires author confirmation; no public manuscript link has been supplied.

## 6. Content requiring verified artifacts

Implementation descriptions, scientific results, stationary roots, branches, reliability diagnostics, reconstructions, validation claims, contributor assignments, publication figures, derived downloads, and citation data must not be added until verified artifacts are connected.

A verified result record should identify:

1. Input data
2. Generating code
3. Generated output
4. Figure-generation path, when applicable
5. Version or release state
6. Provenance and validation status

## 7. Private research material policy

`_research_private/` contains non-public working research material. It is ignored by Git and must remain outside the website source, `public/`, and generated deployment assets. Private manuscript files must not be imported, copied, linked, summarized as approved public copy, or exposed through any route or download control.

Only team- and mentor-approved public artifacts may be linked from `/resources`.

## 8. Real-result traceability rule

A result may be presented as a real project result only when it is traceable to input data, generating code, and a generated output. If any of those elements is unavailable, the site must use a restrained empty state or accurately describe the item as provisional, synthetic, schematic, or unverified.

Synthetic examples are explanatory tools only. They must never be labeled or styled as Cassini-derived results.

## 9. Legacy-route redirects

| Legacy route | Redirect |
| --- | --- |
| `/viewer` | `/data` |
| `/data-hub` | `/data` |
| `/math` | `/research` |
| `/algorithms` | `/research` |
| `/algorithms/:slug` | `/research` |
| `/overview` | `/research` |
| `/progress` | `/research` |
| `/team` | `/research` |
| `/background` | `/resources` |
| `/gallery` | `/resources` |

Legacy pages are not retained as hidden duplicate content.

## 10. Future content rules

- Add project identity changes in `src/content/project.js`.
- Add or revise major modules in `src/content/researchModules.js`.
- Add a public observation only through the conversion, build, and read-only verification workflow documented in `README.md`; legacy subsets must remain outside public production assets.
- Add algorithms, contributors, figures, results, interactives, and reproducibility records to an existing research module.
- Add paper, citation, public code, publication figures, and provenance resources through `/resources`.
- Do not create a top-level page to solve a content-organization problem without explicit architectural review.

## Permanent editorial rules

- One concept is explained once.
- Algorithms live inside research modules, not as top-level pages.
- Contributors are attribution metadata, not the site’s primary navigation.
- Synthetic examples are never labeled as real results.
- A result must be traceable to input data, generating code, and output.
- The homepage may contain only Hero, Research, Data Explorer, and Research Assets.
- New top-level pages require explicit architectural review.
