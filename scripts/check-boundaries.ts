import { readFileSync, writeFileSync } from "node:fs";
import Module from "manifold-3d";
import {
  DEFAULT_BIN,
  ENGINE_VERSION,
  MODEL_COMMIT,
  modelSchema,
  type Model,
} from "../src/core/project";
import { modelSource } from "../src/core/scad";
import { inspectStl } from "../src/core/mesh";
import { simplifyStl } from "../src/core/simplify";
// @ts-expect-error The pinned engine adapter is plain JavaScript.
import { renderScad } from "../public/engine/run.mjs";
const models: Model[] = [
  { ...DEFAULT_BIN, nx: 1, ny: 1, heightU: 2, columns: 4, rows: 4 },
  { ...DEFAULT_BIN, nx: 8, ny: 8, heightU: 12, columns: 6, rows: 6 },
  { kind: "plate", nx: 8, ny: 8 },
];
const files = JSON.parse(readFileSync("public/engine/rebuilt.json", "utf8"));
const wasm = readFileSync("public/engine/openscad.wasm");
const kernel = await Module();
kernel.setup();
const results = [];
for (const input of models) {
  const model = modelSchema.parse(input),
    start = performance.now();
  const bytes = simplifyStl(
    await renderScad(modelSource(model), files, wasm),
    kernel,
  );
  const report = inspectStl(bytes),
    inset = model.kind === "bin" ? 0.5 : 0;
  if (
    !report.valid ||
    Math.abs(report.size[0] - (model.nx * 42 - inset)) > 0.05 ||
    Math.abs(report.size[1] - (model.ny * 42 - inset)) > 0.05
  )
    throw new Error(
      `Boundary model failed: ${JSON.stringify({ model, report })}`,
    );
  results.push({
    model,
    ...report,
    elapsedMs: Math.round(performance.now() - start),
  });
  console.log(model.kind, model.nx, model.ny, report.valid, report.size);
}
writeFileSync(
  "validation/reports/boundary-geometry.json",
  JSON.stringify(
    {
      date: new Date().toISOString(),
      engine: ENGINE_VERSION,
      modelCommit: MODEL_COMMIT,
      results,
    },
    null,
    2,
  ) + "\n",
);
