# Saturn — A Cassini Explorer

A focused MIT PRIMES 2026 research website with two working areas:

- **Explore data:** six Cassini RSS observations, three signal variables, exact radial windows, two-point comparison, and CSV export.
- **My notebook:** autosaved drafts, named observations, restore, rename, delete, and export. Notes stay in the current browser; there is no account or cloud synchronization.

Research context, source links, limitations, and a clearly labeled illustrative branch model are available through **Research & sources**. Previous public routes redirect to the relevant retained destination.

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

The research paper, scientific reconstruction code, and research results are not yet public. The Saturn background is artistic imagery, not an observational reconstruction.

## Interface structure

- `src/orbit/OrbitShell.jsx`: shared space background, navigation, and research/source dialog.
- `src/orbit/Home.jsx`: focused entry and an actual observation overview.
- `src/orbit/Explorer.jsx`: data workspace.
- `src/orbit/Notebook.jsx`: observation notebook.
- `src/lib/explorerSession.js`: restoration and URL identity rules.
- `src/lib/explorations.js`: existing versioned browser storage, preserved across the redesign.

## Deployment

The existing GitHub-to-Vercel integration builds branch previews. This redesign lives on `codex/saturn-observatory`; review it before merging into the production branch. Vercel may require the project owner's sign-in to view previews. No production settings or account permissions are changed by this branch.
