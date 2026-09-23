# Exact browser engine provenance

The unmodified binary in `public/engine/openscad.{js,wasm}` is the official
`OpenSCAD-2025.03.25.wasm24456-WebAssembly-web.zip` build, archive SHA-256
`0968af31b9c9b3bba68d9031de1695ccae51c32231a1aab4ef27b18c86379f3b`.

Running that binary with `--info` reports OpenSCAD commit
`ce5039f8a9545ad5a8cf197b3ca11c0939bc67f1`, Emscripten 3.1.34, Boost 1.82,
Eigen 3.3.90, CGAL 5.4.5-I-900, Clipper2 1.5.2, Manifold 3.0.1, GLib 2.75.0,
libzip 1.9.99, fontconfig 2.14.1, FreeType 2.13.0 and HarfBuzz 7.1.0.

Upstream source:
https://github.com/openscad/openscad/tree/ce5039f8a9545ad5a8cf197b3ca11c0939bc67f1

The checked-in `.gitmodules`, `CMakeLists.txt` and `scripts/wasm-base-docker-run.sh`
are unmodified files at that commit. `Dockerfile.base` is an upstream historical
WASM build recipe at openscad/openscad-wasm commit
`ce3dd0ecbae17dc5a4727db4fcd8bf1020837187`; its correspondence to the official
prebuilt dependencies has NOT been established. It is a research reference,
not a claimed bit-for-bit reproducible build recipe.

Before public binary distribution, archive complete corresponding source,
submodules, dependency sources, relevant patches and the actual build recipe
for the prebuilt binary. Alternatively build a fresh pinned engine from a fully
captured source tree, update `vendor/manifest.json`, and rerun geometry, native,
browser and slicer comparisons. Do not mark the `correspondingSource` release
gate passed merely because the application code is on GitHub or this file
links to upstream source. This local preview has not been published.
