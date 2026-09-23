import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { inspectStl, normalizeStl } from "../src/core/mesh";
const exe =
  process.env.OPENSCAD_NATIVE ||
  resolve(
    "artifacts/tooling/openscad-volume/OpenSCAD.app/Contents/MacOS/OpenSCAD",
  );
const source = JSON.parse(
  readFileSync("artifacts/geometry-report.json", "utf8"),
);
mkdirSync("artifacts/native", { recursive: true });
const results = [];
for (const m of source.results) {
  const path = resolve(`artifacts/native/${m.key}.stl`);
  execFileSync(
    exe,
    [
      "--backend=Manifold",
      "--export-format",
      "binstl",
      "-o",
      path,
      resolve(`artifacts/test-kit/models/${m.key}.scad`),
    ],
    { env: { ...process.env, OPENSCADPATH: resolve("vendor") }, stdio: "pipe" },
  );
  const report = inspectStl(normalizeStl(new Uint8Array(readFileSync(path))));
  const dimensions = report.size.map((v, i) => v - m.size[i]);
  const volumeRelativeDifference =
    Math.abs(report.volume - m.volume) / m.volume;
  const passed =
    report.valid &&
    dimensions.every((v) => Math.abs(v) <= 0.05) &&
    volumeRelativeDifference < 0.002;
  results.push({ model: m.key, dimensions, volumeRelativeDifference, passed });
}
const version = execFileSync(exe, ["--version"], {
  encoding: "utf8",
  stdio: ["pipe", "pipe", "pipe"],
});
writeFileSync(
  "artifacts/native-comparison.json",
  JSON.stringify(
    {
      nativeVersion: version.trim() || "2026.09.22",
      browserEngine: source.engine,
      modelCommit: source.modelCommit,
      simplificationToleranceMm: 0.005,
      results,
    },
    null,
    2,
  ),
);
if (!results.every((r) => r.passed))
  throw new Error("Native comparison failed.");
console.log(
  `${results.length} native comparisons passed; max relative volume difference: ${Math.max(...results.map((r) => r.volumeRelativeDifference))}`,
);
