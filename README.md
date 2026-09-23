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

`dist/client` is the static website. No database, accounts, model-upload API, or cloud renderer is required. Nine public-content routes are prerendered. All preview pages are `noindex`; the preview robots file disallows crawling and its sitemap is empty.

## Features

- Integer-grid bins, regular compartments, optional stacking lip; actual STL preview and dimensions.
- Thin baseplates; automatic complete-cell tiling for a printer bed and edge margin; individual STL and assembly ZIP.
- Drawer measurements and margins; add, move, rotate, duplicate and delete bins; keyboard movement, undo/redo; bounds and overlap checks.
- Local project autosave, validated JSON import/export, unique models with quantities, assembly SVG, manifest, CSV and printable HTML guide.
- Cancellable worker jobs. Editing invalidates old results; mesh/size failures block export. No project data leaves the browser.

## Geometry provenance

- Rebuilt commit: `910e22d8607fd7f5f51ad5e5cbc5287a76810bfd` (MIT), vendored unchanged.
- OpenSCAD browser build: `2025.03.25.wasm24456`, git `ce5039f8a9545ad5a8cf197b3ca11c0939bc67f1`, Manifold backend.
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

## Public release

The domain **binfitlab.com** and its HTTPS certificate are configured. The website is currently hosted as **owner-private** while a source-captured engine build is prepared. Contact: yiwangyuai@gmail.com. Application source is published at https://github.com/dbshiwiejsjdjdjjdj121-sketch/binfitlab.

Physical fit testing remains incomplete. The user requested an initial public beta with accurate testing labels. A beta needs all software checks and complete corresponding source; a stable release also needs physical fit evidence. The exact dependency sources of the legacy prebuilt engine have not been established. A fresh upstream build with pinned dependencies is prepared in the public repository's `engine/` directory; its GitHub workflow currently needs the owner's authenticated browser session because the CLI token cannot write workflows.

Production configuration uses `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_SOURCE_URL`, `NEXT_PUBLIC_PUBLIC_RELEASE=true`, and `NEXT_PUBLIC_RELEASE_CHANNEL=beta` or `stable`. Export these environment variables when building (see `.env.example`). `npm run check:release` and the production build block an incomplete release. After the evidence is complete, update the compatibility copy from actual results, build the static site, verify canonical URLs and sitemap, deploy, and verify the domain in Search Console.

Run `npx tsx scripts/check-assembly.ts` after regenerating the geometry fixtures to compare nominal assembly collisions with independently sourced reference parts. See `validation/reports/digital-assembly.md` for its assumptions and limits.

## License

Application code: GPL-3.0-only. Vendored upstream projects retain their licenses and notices; see `public/licenses/`. The original Gridfinity system is credited to Zack Freedman. This is an independent project.
