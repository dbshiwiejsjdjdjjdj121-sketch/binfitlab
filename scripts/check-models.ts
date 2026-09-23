import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { modelSource } from "../src/core/scad";
import { inspectStl, normalizeStl } from "../src/core/mesh";
import { simplifyStl } from "../src/core/simplify";
import Module from "manifold-3d";
import {
  DEFAULT_BIN,
  modelKey,
  MODEL_COMMIT,
  ENGINE_VERSION,
  type Model,
} from "../src/core/project";
// @ts-expect-error The pinned Emscripten build ships JavaScript without declarations.
import { renderScad } from "../public/engine/run.mjs";
const files = JSON.parse(readFileSync("public/engine/rebuilt.json", "utf8"));
const wasm = new Uint8Array(readFileSync("public/engine/openscad.wasm"));
const kernel = await Module();
kernel.setup();
const models: Model[] = [
  { ...DEFAULT_BIN, nx: 1, ny: 1, heightU: 2 },
  DEFAULT_BIN,
  { ...DEFAULT_BIN, nx: 2, ny: 1, columns: 2 },
  { ...DEFAULT_BIN, nx: 1, ny: 1, heightU: 8, lip: false },
  { ...DEFAULT_BIN, nx: 2, ny: 2, columns: 2, rows: 2 },
  { kind: "plate", nx: 1, ny: 1 },
  { kind: "plate", nx: 2, ny: 1 },
  { kind: "plate", nx: 5, ny: 5 },
];
mkdirSync("artifacts/test-kit/models", { recursive: true });
const results = [];
for (const model of models) {
  const start = performance.now(),
    logs: string[] = [],
    source = modelSource(model);
  const bytes = simplifyStl(
    await renderScad(source, files, wasm, (x: string) => logs.push(x)),
    kernel,
  );
  const report = inspectStl(bytes),
    key = modelKey(model);
  const expected = [
    model.nx * 42 - (model.kind === "bin" ? 0.5 : 0),
    model.ny * 42 - (model.kind === "bin" ? 0.5 : 0),
  ];
  if (
    !report.valid ||
    expected.some((n, i) => Math.abs(n - report.size[i]) > 0.05)
  )
    throw new Error(
      `${key} failed: ${JSON.stringify(report)}\n${logs.join("\n")}`,
    );
  writeFileSync(`artifacts/test-kit/models/${key}.stl`, bytes);
  writeFileSync(`artifacts/test-kit/models/${key}.scad`, source);
  const elapsedMs = Math.round(performance.now() - start);
  results.push({ key, model, ...report, elapsedMs, logs });
  console.log(
    key,
    JSON.stringify({
      size: report.size,
      triangles: report.triangles,
      elapsedMs,
      valid: report.valid,
    }),
  );
}
writeFileSync(
  "artifacts/geometry-report.json",
  JSON.stringify(
    {
      date: new Date().toISOString(),
      modelCommit: MODEL_COMMIT,
      engine: ENGINE_VERSION,
      results,
    },
    null,
    2,
  ),
);
