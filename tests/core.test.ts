import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_BIN,
  DEFAULT_BED,
  DEFAULT_DRAWER,
  binSchema,
  displayLength,
  drawerGrid,
  layoutIssues,
  mm,
  modelFitsBed,
  newProject,
  parseProject,
  splitPlate,
} from "../src/core/project";
import { modelSource } from "../src/core/scad";
import { inspectStl, normalizeStl } from "../src/core/mesh";
test("drawer grid uses inside margins once and centers the grid", () => {
  assert.deepEqual(drawerGrid(DEFAULT_DRAWER), {
    nx: 6,
    ny: 9,
    spareX: 33,
    spareY: 30,
    originX: 17.5,
    originY: 16,
  });
});
test("83.9 mm cannot hold two cells; exactly 84 mm can", () => {
  const d = { ...DEFAULT_DRAWER, left: 0, right: 0 };
  assert.equal(drawerGrid({ ...d, width: 83.9 }).nx, 1);
  assert.equal(drawerGrid({ ...d, width: 84 }).nx, 2);
});
test("plate tiles cover the grid exactly without duplicate margins", () => {
  const t = splitPlate(6, 9, DEFAULT_BED);
  assert.deepEqual(
    t.map((t) => [t.nx, t.ny]),
    [
      [5, 5],
      [1, 5],
      [5, 4],
      [1, 4],
    ],
  );
  const cells = new Set();
  for (const tile of t)
    for (let x = tile.x; x < tile.x + tile.nx; x++)
      for (let y = tile.y; y < tile.y + tile.ny; y++) {
        const key = `${x},${y}`;
        assert.ok(!cells.has(key));
        cells.add(key);
      }
  assert.equal(cells.size, 54);
});
test("too-small bed, non-finite values and fractional grid are rejected", () => {
  assert.throws(() => splitPlate(1, 1, { width: 42, depth: 42, margin: 1 }));
  assert.throws(() => splitPlate(1.5, 2, DEFAULT_BED));
  assert.throws(() => splitPlate(2, 2, { ...DEFAULT_BED, width: NaN }));
  assert.equal(
    binSchema.safeParse({ ...DEFAULT_BIN, nx: Infinity }).success,
    false,
  );
  assert.equal(
    binSchema.safeParse({ ...DEFAULT_BIN, nx: 1, columns: 6 }).success,
    false,
  );
});
test("overlap, rotation and boundary checks remain explicit", () => {
  const p = newProject();
  p.bins = [
    { id: "a", x: 0, y: 0, rotated: false, model: { ...DEFAULT_BIN } },
    { id: "b", x: 1, y: 1, rotated: true, model: { ...DEFAULT_BIN } },
  ];
  assert.match(layoutIssues(p).join(), /overlap/);
  p.bins[1].x = 5;
  assert.match(layoutIssues(p).join(), /beyond/);
  p.bins[1].x = 2;
  assert.deepEqual(layoutIssues(p), []);
});
test("project round-trip preserves unknown height and rejects incompatible or oversized input", () => {
  const p = newProject();
  assert.deepEqual(parseProject(JSON.stringify(p)), p);
  assert.equal(parseProject(JSON.stringify(p)).drawer.height, null);
  assert.throws(() => parseProject(JSON.stringify({ ...p, schemaVersion: 2 })));
  assert.throws(() => parseProject("x".repeat(1048577)));
  assert.throws(() => parseProject("{broken}"));
  assert.throws(() => parseProject(JSON.stringify({ ...p, extra: true })));
});
test("duplicate placement IDs are rejected", () => {
  const p = newProject(),
    b = { id: "a", x: 0, y: 0, rotated: false, model: DEFAULT_BIN };
  p.bins = [b, b];
  assert.throws(() => parseProject(JSON.stringify(p)));
});
test("millimeter conversion and display do not drop integer zeroes", () => {
  assert.equal(mm(1, "in"), 25.4);
  assert.equal(displayLength(210), "210");
  assert.equal(displayLength(0), "0");
  assert.equal(displayLength(25.4, "in"), "1");
});
test("bed fit considers rotation and edge margins", () => {
  assert.ok(
    modelFitsBed([220, 100, 10], { width: 120, depth: 240, margin: 5 }),
  );
  assert.ok(!modelFitsBed([220, 100, 10], DEFAULT_BED));
});
test("model source excludes holes, scoops and labels", () => {
  const s = modelSource(DEFAULT_BIN);
  assert.match(s, /bundle_hole_options\(false,false,false,false,false,false\)/);
  assert.match(s, /cut_compartment_auto\(cgs\(\),5,false,0\)/);
  assert.throws(() => modelSource({ ...DEFAULT_BIN, nx: -1 }));
});
test("malformed and empty binary meshes fail closed", () => {
  assert.throws(() => inspectStl(new Uint8Array(84)));
  assert.throws(() => normalizeStl(new Uint8Array(12)));
});
