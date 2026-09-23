// Digital nominal-geometry check. This cannot establish printed tolerances.
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import Module from "manifold-3d";
import { normalizeStl, inspectStl } from "../src/core/mesh";
const api = await Module();
api.setup();
const fixtureRecord = JSON.parse(
  readFileSync("artifacts/geometry-report.json", "utf8"),
);
function load(path: string) {
  const bytes = normalizeStl(readFileSync(path)),
    report = inspectStl(bytes);
  if (!report.valid) throw new Error(`Invalid input mesh: ${path}`);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const vertices: number[] = [],
    triangles: number[] = [],
    ids = new Map<string, number>();
  for (let i = 0; i < report.triangles; i++)
    for (let j = 0; j < 3; j++) {
      const p = [0, 1, 2].map((k) =>
        view.getFloat32(84 + i * 50 + 12 + j * 12 + k * 4, true),
      );
      const key = p.join(",");
      if (!ids.has(key)) {
        ids.set(key, vertices.length / 3);
        vertices.push(...p);
      }
      triangles.push(ids.get(key)!);
    }
  const solid = api.Manifold.ofMesh(
    new api.Mesh({
      numProp: 3,
      vertProperties: new Float32Array(vertices),
      triVerts: new Uint32Array(triangles),
    }),
  );
  if (solid.status() !== "NoError")
    throw new Error(`${path}: ${solid.status()}`);
  // Center the part in XY and put its lowest point at zero.
  const centered = solid.translate([
    -(report.min[0] + report.max[0]) / 2,
    -(report.min[1] + report.max[1]) / 2,
    -report.min[2],
  ]);
  solid.delete();
  return { solid: centered, report, path };
}
const ours = load("artifacts/test-kit/models/bin-1x1-2u-1x1-lip.stl");
const plate = load("artifacts/test-kit/models/plate-1x1.stl");
const spanning = load("artifacts/test-kit/models/bin-2x1-3u-2x1-lip.stl");
const referenceBin = load(
  "deliverables/gridfit-fit-test-kit/reference/reference-bin-1x1-2u.stl",
);
const referencePlate = load(
  "deliverables/gridfit-fit-test-kit/reference/reference-plate-1x1.stl",
);
const pieces = [ours, plate, spanning, referenceBin, referencePlate];
const results: unknown[] = [];
function check(
  label: string,
  bin: typeof ours,
  base: typeof ours,
  xy = [0, 0],
) {
  const rows = [];
  for (let z = 0; z <= 5; z += 0.25) {
    const positioned = bin.solid.translate([xy[0], xy[1], z]);
    const collision = positioned.intersect(base.solid);
    rows.push({ zMm: z, intersectionMm3: collision.volume() });
    collision.delete();
    positioned.delete();
  }
  const first = rows.find((r) => r.intersectionMm3 < 0.001);
  if (!first || first.zMm > 0.5)
    throw new Error(
      `${label}: nominal seating offset exceeded the 0.5 mm regression limit.`,
    );
  results.push({
    label,
    bin: bin.path,
    base: base.path,
    firstNoCollisionOffsetMm: first?.zMm ?? null,
    samples: rows,
  });
}
try {
  check("Our bin / our plate", ours, plate);
  check("Our bin / independent plate", ours, referencePlate);
  check("Independent bin / our plate", referenceBin, plate);
  const left = plate.solid.translate([-21, 0, 0]),
    right = plate.solid.translate([21, 0, 0]);
  const joined = left.add(right);
  left.delete();
  right.delete();
  check("Our 2x1 bin across two edge-to-edge 1x1 plates", spanning, {
    ...plate,
    solid: joined,
    path: "two our plates, center separation 42 mm",
  });
  joined.delete();
  const record = {
    date: new Date().toISOString(),
    engine: fixtureRecord.engine,
    modelCommit: fixtureRecord.modelCommit,
    type: "Nominal CAD collision sweep, not a print or physical fit test",
    limit:
      "XY centered. Z sampled every 0.25 mm. Collision threshold 0.001 mm3. Material shrinkage, extrusion, support, adhesion, warping, surface roughness and insertion forces are not simulated.",
    inputs: pieces.map(({ path, report }) => ({
      path,
      report,
      sha256: createHash("sha256").update(readFileSync(path)).digest("hex"),
    })),
    results,
  };
  writeFileSync(
    "validation/reports/digital-assembly.json",
    JSON.stringify(record, null, 2) + "\n",
  );
  console.log(
    JSON.stringify(
      results.map((r: any) => ({
        label: r.label,
        firstNoCollisionOffsetMm: r.firstNoCollisionOffsetMm,
      })),
      null,
      2,
    ),
  );
} finally {
  for (const p of pieces) p.solid.delete();
}
