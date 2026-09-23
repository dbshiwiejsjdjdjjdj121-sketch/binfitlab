# Exact browser engine provenance

The browser engine is our source-captured OpenSCAD build `2026.09.24.binfit1`, commit `04834adb1ba3c9a6e4160747c91cbadbce9c37b3`. The JavaScript and WASM files are used unchanged; the local adapter uses the supported `instantiateWasm` hook and keeps the runtime alive until the Worker is terminated.

[Engine, complete corresponding source and build records](https://github.com/dbshiwiejsjdjdjjdj121-sketch/binfitlab/releases/tag/engine-2026.09.24-binfit1)

[Successful build run](https://github.com/dbshiwiejsjdjdjjdj121-sketch/binfitlab/actions/runs/35901275525)

The release contains all captured source trees, submodules, dependency sources and patches; an individual-file source manifest; the Emscripten system-library sources; Docker image and package records; the build log; and rebuilding instructions. See BUILDING.md. Source archive SHA-256: `d11159a0229963db1ecb263f379f0d660d6b24d217e7784e648ec3f7581a5c9d`.

`vendor/manifest.json` pins the downloadable binary ZIP and every browser engine asset. `public/licenses/OPENSCAD-THIRD-PARTY-LICENSES.md` retains notices copied from the actual captured sources. Browser assets are served under a directory derived from their hashes to prevent mixing revisions through stale caches.

`legacy-prebuilt/` contains historical research for the superseded 2025 official preview binary. Those files are not the recipe for the engine now distributed. The old binary is no longer used.

All software checks were repeated for the new build: eight fixtures, three boundary models, native comparison, Chromium/WebKit and both slicers. Physical print/fit testing remains pending. No bit-for-bit container reproducibility or printer certification is claimed.
