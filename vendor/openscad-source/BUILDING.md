# BinFit Lab OpenSCAD browser engine

Engine version: `2026.09.24.binfit1`.
OpenSCAD commit: `04834adb1ba3c9a6e4160747c91cbadbce9c37b3`.
Builder commit: `dc2ff913b4193b1ebfef863da3f7e84f8fbc1e11` from openscad/openscad-wasm.
Application build configuration: BinFit Lab commit `6c756102222b77dd4a899d37cbe36a4888e9a4fa`.

The source archive was captured before compiling. It contains the complete OpenSCAD tree, recursive submodules, dependency source trees, applied patches, Makefile, Dockerfiles and support scripts. `source-manifest.json` records their commits, patches and individual file hashes. The GMP download URL was changed to the GNU mirror. The browser configuration sets the version/commit explicitly and uses the web module, Manifold backend and the upstream single-threaded build.

The CMake executable archive is a build tool, and is not included in the source tarball. Its fixed download URL (CMake 4.4.2) is in the captured Makefile. Emscripten 6.0.5 comes from its official SDK image. `emscripten-system-source.tar.gz` contains the SDK system-library sources; `build-environment.txt`, `base-image.json` and the full build log record the build environment and image identities.

## Rebuild from the captured sources

Use an x86-64 Linux host with Docker/Buildx, GNU make, wget and enough disk/memory for the full C++ build. The recorded build ran on GitHub's Ubuntu 24.04 runner. Download the source archive and `build.sh` into an empty directory, then:

```sh
tar -xzf openscad-corresponding-source.tar.gz
make -C engine-source libs/cmake.tar.gz
mkdir -p output
bash build.sh base
bash build.sh engine
```

The browser JavaScript and WASM files will be in `output/`. The Dockerfiles in the archive are the exact ones used by the recorded build. For a fresh source fetch, use the repository's workflow at the recorded BinFit Lab commit; it sets `ENGINE_SOURCE_REF` and executes `engine/build.sh` stages in order.

The archive includes preferred source, license texts and build instructions. This record does not claim a bit-for-bit reproducible container: Linux package repositories and build-tool availability can change. The distributed binary itself is fixed by `engine-sha256.txt` and the application's `vendor/manifest.json`. Update the engine only after repeating geometry, native, browser and slicer checks. No physical print result is implied by this build.
