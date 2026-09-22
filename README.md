# Saturn — A Cassini Explorer

A focused MIT PRIMES 2026 research website with three core areas:

- **Explore data:** six Cassini RSS observations, three signal variables, exact radial windows, two-point comparison, and CSV export.
- **My notebook:** autosaved drafts, named observations, restore, rename, delete, and export. Notes stay in the current browser; there is no account or cloud synchronization.
- **Project research:** the whole team’s methods, reported manuscript results, interactive benchmark inspection, and actual archive coverage.

**Project research** connects Padé / least-squares initialization, continuation, refinement, and branch bookkeeping to three reported result sets: local angular-integral accuracy, generic-fold verification, and synthetic branch identity. A compact teaching model and archive disclosure add detail without extra top-level routes. **Sources & credits** keeps provenance and attribution together. Previous public routes redirect to the relevant retained destination.

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
```

The automated checks cover all six observation products (1,566,902 converted rows, 193 SHA-256 chunk hashes), display coordinates, exact export precision, notebook persistence, and saved-record/draft restoration. Automated checks do not substitute for a live browser review.

## Data and interpretation

`public/data/observations` contains the converted public NASA PDS Cassini RSS diffraction-limited profiles. Wide views use a reduced overview. Small windows load the original converted Float64 rows and verify their hashes before exact inspection and export. The calibrated profiles retain diffraction effects; they are not new high-resolution reconstruction results. Missing and negative measurements remain unchanged. Stored phase values are plotted without connecting or unwrapping them.

Research methods and results are transcribed from the team's supplied working manuscript, sections 3–6. The website does not run the scientific reconstruction solver. Table 3's eight local angular-integral offsets give maximum symmetric discrepancy **59.5629% → 2.2872%**; the conclusion's **0.0242%** maximum conflicts with the table, body, and Figure 18. The 37.5% reduction is in integrand sampling work against all-quadrature, not measured runtime. Source details and limits are recorded in `docs/TEAM_RESEARCH_EVIDENCE.md`.

The full manuscript and scientific solver are not hosted here. The archive record count is not a method benchmark or a claim about how much data the team used in its experiments. The reported scalar-phase tests do not establish a complete high-resolution ring reconstruction. The Saturn background is artistic imagery, not an observational reconstruction.

## Interface structure

- `src/orbit/OrbitShell.jsx`: shared space background, navigation, and source dialog.
- `src/orbit/Home.jsx`: focused entry and an actual observation overview.
- `src/orbit/Explorer.jsx`: data workspace.
- `src/orbit/Notebook.jsx`: observation notebook and access to all observations.
- `src/orbit/Research.jsx`: whole-project research and data coverage.
- `src/orbit/ResearchMethod.jsx`: three-stage method explanation and branch teaching model.
- `src/orbit/ResearchEvidence.jsx`: reported result views and Table 3 chart.
- `src/content/paperEvidence.js`: source-attributed numerical evidence, not simulated outputs.
- `src/lib/explorerSession.js`: restoration and URL identity rules.
- `src/lib/explorations.js`: existing versioned browser storage, preserved across the redesign.

## Deployment

The existing GitHub-to-Vercel integration builds branch previews. This redesign lives on `codex/saturn-observatory`; review it before merging into the production branch. Vercel may require the project owner's sign-in to view previews. No production settings or account permissions are changed by this branch.
