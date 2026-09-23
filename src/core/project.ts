import { z } from "zod";

export const PROFILE = "classic42-rebuilt-v1";
export const MODEL_COMMIT = "910e22d8607fd7f5f51ad5e5cbc5287a76810bfd";
export const ENGINE_VERSION = "2026.09.24.binfit1";
export const PITCH = 42;
export const UNIT_HEIGHT = 7;
const count = (max: number) => z.number().int().min(1).max(max);
const finite = z.number().finite();
export const binSchema = z
  .object({
    kind: z.literal("bin"),
    nx: count(8),
    ny: count(8),
    heightU: z.number().int().min(2).max(12),
    columns: count(6),
    rows: count(6),
    lip: z.boolean(),
  })
  .strict()
  .refine(
    (b) =>
      (b.nx * 42 - 5.2) / b.columns >= 8 && (b.ny * 42 - 5.2) / b.rows >= 8,
    "Each compartment needs at least 8 mm of usable width.",
  );
export const plateSchema = z
  .object({ kind: z.literal("plate"), nx: count(8), ny: count(8) })
  .strict();
export const modelSchema = z.union([binSchema, plateSchema]);
export type Bin = z.infer<typeof binSchema>;
export type Plate = z.infer<typeof plateSchema>;
export type Model = Bin | Plate;
export const DEFAULT_BIN: Bin = {
  kind: "bin",
  nx: 2,
  ny: 3,
  heightU: 3,
  columns: 1,
  rows: 1,
  lip: true,
};
export const bedSchema = z
  .object({
    width: finite.min(42).max(1000),
    depth: finite.min(42).max(1000),
    margin: finite.min(0).max(50),
  })
  .strict();
export type Bed = z.infer<typeof bedSchema>;
export const DEFAULT_BED: Bed = { width: 220, depth: 220, margin: 5 };
export const drawerSchema = z
  .object({
    width: finite.min(20).max(840),
    depth: finite.min(20).max(840),
    height: finite.min(1).max(1000).nullable(),
    left: finite.min(0).max(100),
    right: finite.min(0).max(100),
    front: finite.min(0).max(100),
    back: finite.min(0).max(100),
  })
  .strict();
export type Drawer = z.infer<typeof drawerSchema>;
export const DEFAULT_DRAWER: Drawer = {
  width: 287,
  depth: 410,
  height: null,
  left: 1,
  right: 1,
  front: 1,
  back: 1,
};
const placementSchema = z
  .object({
    id: z.string().regex(/^[a-zA-Z0-9_-]{1,60}$/),
    x: z.number().int().min(0).max(19),
    y: z.number().int().min(0).max(19),
    rotated: z.boolean(),
    model: binSchema,
  })
  .strict();
export type Placement = z.infer<typeof placementSchema>;
export const projectSchema = z
  .object({
    schemaVersion: z.literal(1),
    profile: z.literal(PROFILE),
    name: z.string().trim().min(1).max(80),
    drawer: drawerSchema,
    bed: bedSchema,
    bins: z.array(placementSchema).max(100),
  })
  .strict()
  .superRefine((p, c) => {
    if (new Set(p.bins.map((b) => b.id)).size !== p.bins.length)
      c.addIssue({ code: "custom", message: "Bin IDs must be unique." });
  });
export type Project = z.infer<typeof projectSchema>;
export function newProject(): Project {
  return {
    schemaVersion: 1,
    profile: PROFILE,
    name: "My drawer",
    drawer: { ...DEFAULT_DRAWER },
    bed: { ...DEFAULT_BED },
    bins: [],
  };
}
export function parseProject(text: string): Project {
  if (new TextEncoder().encode(text).length > 1048576)
    throw new Error("Project files must be smaller than 1 MiB.");
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("The file is not valid JSON.");
  }
  const result = projectSchema.safeParse(data);
  if (!result.success) {
    const issue = result.error.issues[0];
    throw new Error(
      `${issue.path.join(".") || "Project"}: ${issue.message}. Use a BinFit Lab version 1 project file.`,
    );
  }
  return result.data;
}
export function footprint(p: Placement) {
  return p.rotated
    ? { nx: p.model.ny, ny: p.model.nx }
    : { nx: p.model.nx, ny: p.model.ny };
}
export function drawerGrid(d: Drawer) {
  const width = d.width - d.left - d.right,
    depth = d.depth - d.front - d.back;
  const nx = Math.max(0, Math.floor((width + 1e-8) / PITCH)),
    ny = Math.max(0, Math.floor((depth + 1e-8) / PITCH));
  return {
    nx,
    ny,
    spareX: width - nx * PITCH,
    spareY: depth - ny * PITCH,
    originX: d.left + (width - nx * PITCH) / 2,
    originY: d.front + (depth - ny * PITCH) / 2,
  };
}
export function layoutIssues(p: Project): string[] {
  const g = drawerGrid(p.drawer),
    issues: string[] = [];
  if (!g.nx || !g.ny)
    issues.push("The usable drawer space cannot fit a 42 mm grid cell.");
  p.bins.forEach((a, i) => {
    const f = footprint(a);
    if (a.x + f.nx > g.nx || a.y + f.ny > g.ny)
      issues.push(`Bin ${i + 1} extends beyond the usable grid.`);
    p.bins.slice(i + 1).forEach((b, j) => {
      const t = footprint(b);
      if (
        a.x < b.x + t.nx &&
        a.x + f.nx > b.x &&
        a.y < b.y + t.ny &&
        a.y + f.ny > b.y
      )
        issues.push(`Bins ${i + 1} and ${i + j + 2} overlap.`);
    });
  });
  return issues;
}
export type Tile = { id: string; x: number; y: number; nx: number; ny: number };
export function splitPlate(nx: number, ny: number, bed: Bed): Tile[] {
  count(20).parse(nx);
  count(20).parse(ny);
  bedSchema.parse(bed);
  const tx = Math.min(
    8,
    Math.floor((bed.width - bed.margin * 2 + 1e-8) / PITCH),
  );
  const ty = Math.min(
    8,
    Math.floor((bed.depth - bed.margin * 2 + 1e-8) / PITCH),
  );
  if (tx < 1 || ty < 1)
    throw new Error(
      "The usable print bed must fit a full 42 × 42 mm cell. Reduce the margin or use a larger bed.",
    );
  const tiles: Tile[] = [];
  for (let y = 0; y < ny; y += ty)
    for (let x = 0; x < nx; x += tx)
      tiles.push({
        id: `P${tiles.length + 1}`,
        x,
        y,
        nx: Math.min(tx, nx - x),
        ny: Math.min(ty, ny - y),
      });
  return tiles;
}
export function modelKey(m: Model) {
  return m.kind === "plate"
    ? `plate-${m.nx}x${m.ny}`
    : `bin-${m.nx}x${m.ny}-${m.heightU}u-${m.columns}x${m.rows}-${m.lip ? "lip" : "flat"}`;
}
export function modelFitsBed(size: number[], bed: Bed) {
  const w = bed.width - 2 * bed.margin,
    d = bed.depth - 2 * bed.margin;
  return (
    (size[0] <= w + 0.01 && size[1] <= d + 0.01) ||
    (size[1] <= w + 0.01 && size[0] <= d + 0.01)
  );
}
export function mm(value: number, unit: "mm" | "in") {
  return unit === "in" ? value * 25.4 : value;
}
export function displayLength(value: number, unit: "mm" | "in" = "mm") {
  return (unit === "in" ? value / 25.4 : value)
    .toFixed(unit === "in" ? 3 : 2)
    .replace(/\.?0+$/, "");
}
