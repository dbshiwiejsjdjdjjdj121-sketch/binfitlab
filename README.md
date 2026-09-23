# BinFit Lab

A local-first Gridfinity workbench: parametric bins, printer-sized baseplate tiles, and a single-layer drawer planner. Independent UI; real STL geometry from a pinned Gridfinity Rebuilt model running in OpenSCAD WASM.

## Run locally

Use Node **22.23.2** (`nvm use`) and npm.

```sh
npm ci
python3 scripts/fetch-engine.py
npm run dev
```

Open http://localhost:3000. To inspect the static production build:

```sh
npm run build
npm run preview
```

`dist/client` contains the prerendered website. `dist/server/index.js` serves assets plus the optional usage counter endpoint. Sites D1 stores daily aggregates only; no accounts, model-upload API, or cloud renderer is used. Nine public-content routes are prerendered. All preview pages are `noindex`; the preview robots file disallows crawling and its sitemap is empty.

## Features

- Integer-grid bins, regular compartments, optional stacking lip; actual STL preview and dimensions.
- Thin baseplates; automatic complete-cell tiling for a printer bed and edge margin; individual STL and assembly ZIP.
- Drawer measurements and margins; add, move, rotate, duplicate and delete bins; keyboard movement, undo/redo; bounds and overlap checks.
- Local project autosave, validated JSON import/export, unique models with quantities, assembly SVG, manifest, CSV and printable HTML guide.
- Optional usage statistics are off by default. Opted-in browsers send only tool type, generation outcome, broad error category, time range and download-start events. No model parameters or visitor IDs are collected; see `validation/reports/usage-statistics.md`.
- Cancellable worker jobs. Editing invalidates old results; mesh/size failures block export. No automatic project uploads.
- Collapsed three-step help, current-model export checks and drawer export summaries. Feedback is opt-in: save a local diagnostic JSON and open an email draft; the visitor chooses whether to attach and send it.

## Geometry provenance

- Rebuilt commit: `910e22d8607fd7f5f51ad5e5cbc5287a76810bfd` (MIT), vendored unchanged.
- OpenSCAD browser build: `2026.09.24.binfit1`, git `04834adb1ba3c9a6e4160747c91cbadbce9c37b3`, Manifold backend.
- Export postprocessing: `manifold-3d@3.5.3`, maximum surface simplification **0.005 mm**, with before/after volume and bounds checks. This avoids tiny rounded-lip faces collapsing under Cura's 0.03 mm vertex merge. STL vertices are welded at 0.00001 mm; collapsed faces are removed. Holes are never filled.
- Preview and download use the same processed bytes. STL coordinates are in millimeters.
- `vendor/manifest.json` records the binary and source hashes. Source and license follow-up is documented in `vendor/openscad-source/README.md`.

## Validation

```sh
npm run typecheck
npm test
npm run test:geometry
npm run build
npx playwright install chromium webkit
npm run test:browser
```

Native and slicer comparisons require external binaries (kept out of git):

```sh
OPENSCAD_NATIVE=/path/to/OpenSCAD npm run test:native
PRUSA_SLICER=/path/to/PrusaSlicer CURA_ENGINE=/path/to/CuraEngine CURA_DEFINITIONS=/path/to/cura/definitions npm run test:slicers
```

See `validation/status.json` and `validation/reports/` for recorded evidence. `artifacts/` contains regenerated files, screenshots and QA G-code. **QA G-code is for inspection only and must not be sent to a real printer.** The external test kit includes STL files, not printer-specific G-code.

## Public beta

Production domain: https://binfitlab.com. Maintainer contact: yiwangyuai@gmail.com.

This release is a **public beta with physical fit testing pending**. All software checks were repeated against the source-captured engine. The application source is public; the [engine release](https://github.com/dbshiwiejsjdjdjjdj121-sketch/binfitlab/releases/tag/engine-2026.09.24-binfit1) includes the actual corresponding source tree, dependency sources, patches, checksums and build records. See `vendor/openscad-source/BUILDING.md`.

Production configuration is explicit:

```sh
NEXT_PUBLIC_PUBLIC_RELEASE=true NEXT_PUBLIC_RELEASE_CHANNEL=beta npm run build
```

The default configuration remains a non-indexable local preview. A public beta requires completed software/source checks; `stable` also requires physical fit evidence. `npm run check:release` enforces these gates. The nine public pages have canonical URLs, a sitemap and crawlable content. Engine assets use a hash-derived directory to prevent mixed browser caches.

`deliverables/gridfit-fit-test-kit.zip` contains seven sample parts, independent reference models, English/Chinese test instructions, a quote-request draft and results sheet. No printing service has been contacted or paid. Physical tolerances and real drawer clearance must still be measured. Run `npm run test:boundaries` and `npm run test:assembly` after replacing the engine. `scripts/plot-slices.py` plots actual G-code extrusion paths for software review; QA G-code is never a printer-ready download.

## License

Application code: GPL-3.0-only. Vendored upstream projects retain their licenses and notices; see `public/licenses/`. The original Gridfinity system is credited to Zack Freedman. This is an independent project.

## Usage counters and local preview

`npm run preview` serves the static build and counter API using Node 22 SQLite in `artifacts/usage-preview.sqlite`. Production uses the Sites `DB` binding, with schema-only generated migrations in `drizzle/`. `npm run db:generate` creates migrations after schema edits; never edit an applied migration. Statistics are visible only to the site owner through Sites database tools/settings. Public endpoints provide no read access. Downloads do not establish printing success.
