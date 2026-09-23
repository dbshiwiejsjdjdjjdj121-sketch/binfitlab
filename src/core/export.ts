import { strToU8, zipSync } from "fflate";
import { generateModel, type GeneratedModel } from "./engine";
import {
  ENGINE_VERSION,
  MODEL_COMMIT,
  PROFILE,
  footprint,
  drawerGrid,
  layoutIssues,
  modelFitsBed,
  modelKey,
  projectSchema,
  splitPlate,
  type Bed,
  type Model,
  type Project,
  type Tile,
} from "./project";
export function download(
  bytes: Uint8Array | string,
  name: string,
  type = "application/octet-stream",
) {
  const blob = new Blob(
    [typeof bytes === "string" ? bytes : (bytes.slice().buffer as ArrayBuffer)],
    { type },
  );
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export type BundleProgress = (
  label: string,
  completed: number,
  total: number,
) => void;
export async function makePrintBundle(
  project: Project | null,
  tiles: Tile[],
  bed: Bed,
  onProgress: BundleProgress,
  signal: AbortSignal,
) {
  if (project) {
    projectSchema.parse(project);
    const issues = layoutIssues(project);
    if (issues.length) throw new Error(issues.join(" "));
  }
  const entries = new Map<string, { model: Model; quantity: number }>();
  const add = (model: Model) => {
    const key = modelKey(model),
      old = entries.get(key);
    entries.set(key, { model, quantity: (old?.quantity || 0) + 1 });
  };
  tiles.forEach((t) => add({ kind: "plate", nx: t.nx, ny: t.ny }));
  project?.bins.forEach((p) => add(p.model));
  const files: Record<string, Uint8Array> = {},
    reports: Record<string, GeneratedModel["report"]> = {};
  let completed = 0;
  for (const [key, item] of entries) {
    onProgress(`Generating ${key}`, completed, entries.size);
    const result = await generateModel(item.model, signal);
    if (!modelFitsBed(result.report.size, bed))
      throw new Error(
        `${key} does not fit your print bed, even when rotated. Use a smaller bin or a larger bed.`,
      );
    if (
      project?.drawer.height != null &&
      item.model.kind === "bin" &&
      result.report.size[2] > project.drawer.height
    )
      throw new Error(
        `${key} is taller than the drawer. Reduce its height before exporting.`,
      );
    files[`models/${key}.stl`] = result.bytes;
    reports[key] = result.report;
    completed++;
  }
  onProgress("Packing your print kit", completed, entries.size);
  if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
  const grid = project ? drawerGrid(project.drawer) : null;
  const maxHeight = project?.bins.length
    ? Math.max(...project.bins.map((p) => reports[modelKey(p.model)].size[2]))
    : null;
  const heightCheck =
    project?.drawer.height == null
      ? "Not checked — drawer height was not supplied."
      : maxHeight == null
        ? "No bins to check."
        : maxHeight + 5 <= project.drawer.height
          ? "Bin height plus the full 5 mm plate fits. This conservative bound does not estimate nesting; confirm physical clearance."
          : "Bin alone fits, but assembled clearance needs physical confirmation. Do not print the full set before a fit test.";
  const manifest = {
    formatVersion: 1,
    profile: PROFILE,
    modelCommit: MODEL_COMMIT,
    engine: ENGINE_VERSION,
    units: "mm",
    createdAt: new Date().toISOString(),
    physicalValidation: "pending",
    heightCheck,
    bed,
    origin: grid
      ? {
          x: grid.originX,
          y: grid.originY,
          convention: "front-left; x right, y back",
        }
      : { x: 0, y: 0 },
    models: [...entries].map(([key, e]) => ({
      file: `models/${key}.stl`,
      ...e,
      report: reports[key],
    })),
    tiles: tiles.map((t) => ({
      ...t,
      xMm: t.x * 42,
      yMm: t.y * 42,
      file: `models/${modelKey({ kind: "plate", nx: t.nx, ny: t.ny })}.stl`,
    })),
    bins:
      project?.bins.map((p, i) => ({
        label: `B${i + 1}`,
        ...p,
        ...footprint(p),
        xMm: p.x * 42,
        yMm: p.y * 42,
        file: `models/${modelKey(p.model)}.stl`,
      })) || [],
  };
  files["manifest.json"] = strToU8(JSON.stringify(manifest, null, 2));
  if (project)
    files["project.gridfit.json"] = strToU8(JSON.stringify(project, null, 2));
  const nx = Math.max(...tiles.map((t) => t.x + t.nx)),
    ny = Math.max(...tiles.map((t) => t.y + t.ny));
  const rects = tiles
    .map(
      (t) =>
        `<rect x="${t.x * 42}" y="${(ny - t.y - t.ny) * 42}" width="${t.nx * 42}" height="${t.ny * 42}" fill="#f0f3dd" stroke="#7b825e"/><text x="${(t.x + t.nx / 2) * 42}" y="${(ny - t.y - t.ny / 2) * 42}" text-anchor="middle" font-size="12">${t.id}</text>`,
    )
    .join("");
  const bins =
    project?.bins
      .map((p, i) => {
        const f = footprint(p);
        return `<rect x="${p.x * 42 + 2}" y="${(ny - p.y - f.ny) * 42 + 2}" width="${f.nx * 42 - 4}" height="${f.ny * 42 - 4}" rx="4" fill="#c7dc71" fill-opacity=".6" stroke="#303b27"/><text x="${(p.x + f.nx / 2) * 42}" y="${(ny - p.y - f.ny / 2) * 42 + 14}" text-anchor="middle" font-size="11">B${i + 1}</text>`;
      })
      .join("") || "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-8 -8 ${nx * 42 + 16} ${ny * 42 + 16}">${rects}${bins}</svg>`;
  files["assembly.svg"] = strToU8(svg);
  files["print-list.csv"] = strToU8(
    "file,quantity,width_mm,depth_mm,height_mm\n" +
      [...entries]
        .map(
          ([k, e]) =>
            `models/${k}.stl,${e.quantity},${reports[k].size.map((n) => n.toFixed(3)).join(",")}`,
        )
        .join("\n"),
  );
  files["print-guide.html"] = strToU8(
    `<!doctype html><html lang="en"><meta charset="utf-8"><title>BinFit Lab print kit</title><style>body{font:16px/1.6 system-ui;max-width:880px;margin:40px auto;padding:24px;color:#253025}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:8px;text-align:left}svg{max-height:520px;width:100%}@media print{body{margin:0}}</style><h1>${escape(project?.name || "Baseplate print kit")}</h1><p>All STL dimensions are millimeters. Import at 100% scale. Physical fit validation is pending.</p><p>${heightCheck}</p>${svg}<p>View from above. Front edge is at the bottom. Origin is the front-left corner of the grid; positions in manifest.json are millimeters from that origin. Rotate a bin 90° on the layout when its rotated flag is true. Duplicate STL shapes are included once; print the stated quantity.</p><table><tr><th>Model</th><th>Quantity</th><th>Actual size (mm)</th></tr>${[...entries].map(([k, e]) => `<tr><td>${k}</td><td>${e.quantity}</td><td>${reports[k].size.map((n) => n.toFixed(2)).join(" × ")}</td></tr>`).join("")}</table><h2>Before printing the full drawer</h2><ol><li>Slice one small bin and one plate in your printer's profile, flat side down, at 100% scale.</li><li>Review every layer for missing walls and unexpected islands. Check the slicer's support preview.</li><li>Print a fit sample. Test it with an independently sourced Gridfinity part, then test a bin across a plate seam.</li><li>Measure drawer clearance after assembly. Check stacking, finger access and drawer closure.</li></ol><p>Profile ${PROFILE}; Rebuilt ${MODEL_COMMIT}; OpenSCAD ${ENGINE_VERSION}. Mesh checks do not certify physical fit. Files contain geometry, not printer-specific G-code.</p></html>`,
  );
  return zipSync(files, { level: 6 });
}
export function projectTiles(p: Project) {
  const g = drawerGrid(p.drawer);
  return splitPlate(g.nx, g.ny, p.bed);
}
