#!/usr/bin/env bash
set -euo pipefail
case "${1:?build stage required}" in
fetch)
  git clone https://github.com/openscad/openscad-wasm.git engine-source
  git -C engine-source checkout "$ENGINE_SOURCE_REF"
  cp engine/Dockerfile.web engine-source/Dockerfile
  python3 - <<'INNER'
from pathlib import Path
p=Path('engine-source/Makefile')
p.write_text(p.read_text().replace('https://gmplib.org/download/gmp/gmp-6.3.0.tar.xz','https://ftp.gnu.org/gnu/gmp/gmp-6.3.0.tar.xz'))
INNER
  make -C engine-source -j4 libs
  python3 -m venv /tmp/binfit-meson
  /tmp/binfit-meson/bin/pip install meson
  (cd engine-source/libs/glib && /tmp/binfit-meson/bin/meson subprojects download pcre2 gvdb)
  ;;
capture)
  mkdir -p output
  python3 engine/capture-sources.py engine-source output
  cp engine/build.sh output/build.sh
  tar --exclude-vcs --exclude='cmake.tar.gz' -czf output/openscad-corresponding-source.tar.gz engine-source
  sha256sum output/openscad-corresponding-source.tar.gz > output/source-sha256.txt
  ;;
base)
  docker buildx build --load --progress plain engine-source/libs -f engine-source/Dockerfile.base -t binfit-wasm-base \
    --build-arg EMSCRIPTEN_SDK_TAG=emscripten/emsdk:6.0.5 \
    --build-arg EMSCRIPTEN_FLAGS='-fexceptions -O3'
  docker image inspect binfit-wasm-base > output/base-image.json
  docker run --rm binfit-wasm-base sh -c 'emcc --version; dpkg-query -W' > output/build-environment.txt
  docker run --rm binfit-wasm-base tar -czf - -C /emsdk/upstream/emscripten system > output/emscripten-system-source.tar.gz
  ;;
engine)
  # The default Docker builder can read the base image loaded into this runner.
  docker buildx build --builder default --load --progress plain engine-source/libs/openscad -f engine-source/Dockerfile -t binfit-openscad \
    --build-arg DOCKER_TAG_BASE=binfit-wasm-base --build-arg CMAKE_BUILD_PARALLEL_LEVEL=2
  docker create --name binfit-output binfit-openscad
  docker cp binfit-output:/home/build/openscad.js output/openscad.js
  docker cp binfit-output:/home/build/openscad.wasm output/openscad.wasm
  docker rm binfit-output
  sha256sum output/openscad.js output/openscad.wasm > output/engine-sha256.txt
  ;;
*) echo 'Unknown stage' >&2; exit 2 ;;
esac
