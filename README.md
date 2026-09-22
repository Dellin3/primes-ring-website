# Mathematics of Saturn Ring Occultations

This is a PRIMES Math Junior research portal for organizing mission context, mathematical framework, team research modules, visual references, and local Cassini ring-data inspection tools.

The site is built as a React/Vite front-end. It does not use a backend and should not include unpublished PRIMES data without permission.

## Portal Sections

- Project Overview
- Mission Background
- Mathematical Framework
- Team Members
- Algorithm Modules
- Visual Gallery
- Real Data Viewer
- Progress & Next Steps

## Current Features

- React + Vite research website with three research chapters
- Six Cassini DLP observations with progressively loaded exact sample windows
- Optical depth, normalized signal power, and phase inspection
- Local drafts and saved explorations, including overview views and notes
- Exact selected-window CSV, portable Markdown notes, and view-only share links
- Static and optional animated conceptual geometry, plus original learning diagrams

## Run Locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Data Commands

Data regeneration and verification are deliberately separate:

```bash
npm run data:build:catalog   # regenerates public web-observation artifacts
npm run data:verify:catalog  # read-only integrity verification
```

The verification command checks catalog identities, overview selection, exact
chunk hashes, converted sample comparisons, and public-path safety without
rewriting public assets.

## Data and Image Notes

- Public images are used for educational research context.
- Image credits should remain visible in the website.
- The Data Observatory uses conversion-verified complete DLP profile products;
  legacy research-window subsets are archived outside public production assets.
- Unpublished PRIMES data should not be added without permission.

## Current Status

The local second refinement is implemented and tested. See the [numbered implementation and browser acceptance report](docs/REFINEMENT_ACCEPTANCE_2026-09-09.md) for screenshots, data checks, zoom coverage, and the Safari testing limitation.

Public manuscript, scientific reconstruction implementation, research figures, and result fields remain empty until approved author materials are supplied. The [materials audit](docs/MATERIALS_2026-09-09.md) distinguishes these from the available website code, source data, and teaching resources.
