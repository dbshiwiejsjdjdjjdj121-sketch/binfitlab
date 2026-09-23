import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Copy,
  FolderOpen,
  LoaderCircle,
  Plus,
  Redo2,
  RotateCw,
  Save,
  Trash2,
  Undo2,
} from "lucide-react";
import {
  DEFAULT_BIN,
  drawerGrid,
  footprint,
  layoutIssues,
  newProject,
  parseProject,
  projectSchema,
  type Project,
  type Placement,
  type Bin,
} from "../core/project";
import { download, makePrintBundle, projectTiles } from "../core/export";
import { BedFields, NumberField } from "./Fields";
import { BinFields } from "./Generator";
const STORAGE = "gridfit-project-v1";
function initialProject() {
  const p = newProject();
  p.bins = [
    { id: "starter-1", x: 0, y: 0, rotated: false, model: { ...DEFAULT_BIN } },
    {
      id: "starter-2",
      x: 2,
      y: 0,
      rotated: false,
      model: { ...DEFAULT_BIN, nx: 3, ny: 2 },
    },
    {
      id: "starter-3",
      x: 0,
      y: 3,
      rotated: false,
      model: { ...DEFAULT_BIN, nx: 2, ny: 2, columns: 2 },
    },
  ];
  return p;
}
export default function Planner() {
  const [project, setProject] = useState<Project>(initialProject),
    [selected, setSelected] = useState<string | null>("starter-1"),
    [ready, setReady] = useState(false),
    [storageStatus, setStorageStatus] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [progress, setProgress] = useState("");
  const [tab, setTab] = useState<"drawer" | "bin">("drawer"),
    [, setHistoryVersion] = useState(0);
  const past = useRef<Project[]>([]),
    future = useRef<Project[]>([]),
    input = useRef<HTMLInputElement>(null),
    board = useRef<HTMLDivElement>(null),
    abort = useRef<AbortController | null>(null);
  const drag = useRef<{
    id: string;
    clientX: number;
    clientY: number;
    x: number;
    y: number;
  } | null>(null);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE);
      if (saved) {
        const p = parseProject(saved);
        setProject(p);
        setSelected(p.bins[0]?.id || null);
      }
    } catch {
      setStorageStatus(
        "Saved project could not be restored. Import a backup to recover it.",
      );
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready || !projectSchema.safeParse(project).success) return;
    try {
      localStorage.setItem(STORAGE, JSON.stringify(project));
      setStorageStatus("Saved on this device");
    } catch {
      setStorageStatus(
        "Local saving is unavailable. Download your project to keep it.",
      );
    }
  }, [project, ready]);
  useEffect(() => () => abort.current?.abort(), []);
  function change(p: Project) {
    abort.current?.abort();
    setBusy(false);
    setProgress("");
    past.current = [...past.current.slice(-29), project];
    future.current = [];
    setProject(p);
    setHistoryVersion((n) => n + 1);
    setMessage("");
  }
  function undo() {
    const p = past.current.pop();
    if (p) {
      future.current.push(project);
      setProject(p);
      setHistoryVersion((n) => n + 1);
    }
  }
  function redo() {
    const p = future.current.pop();
    if (p) {
      past.current.push(project);
      setProject(p);
      setHistoryVersion((n) => n + 1);
    }
  }
  const parsed = projectSchema.safeParse(project),
    g = parsed.success
      ? drawerGrid(project.drawer)
      : { nx: 0, ny: 0, spareX: 0, spareY: 0, originX: 0, originY: 0 };
  const issues = parsed.success
    ? layoutIssues(project)
    : [parsed.error.issues[0].message];
  const active = project.bins.find((p) => p.id === selected),
    covered = project.bins.reduce((n, p) => n + p.model.nx * p.model.ny, 0);
  function updateBin(p: Placement) {
    change({
      ...project,
      bins: project.bins.map((b) => (b.id === p.id ? p : b)),
    });
  }
  function add(model: Bin = { ...DEFAULT_BIN, nx: 2, ny: 2 }, rotated = false) {
    if (project.bins.length >= 100) {
      setMessage("A project supports up to 100 bins.");
      return;
    }
    const p: Placement = {
      id: crypto.randomUUID(),
      x: 0,
      y: 0,
      rotated,
      model: { ...model },
    };
    for (let y = 0; y < g.ny; y++)
      for (let x = 0; x < g.nx; x++) {
        p.x = x;
        p.y = y;
        const next = { ...project, bins: [...project.bins, p] };
        if (!layoutIssues(next).length) {
          change(next);
          setSelected(p.id);
          setTab("bin");
          return;
        }
      }
    setMessage(
      "There is no free space for this bin. Move or remove a bin, or increase the usable drawer size.",
    );
  }
  function move(dx: number, dy: number) {
    if (!active) return;
    const f = footprint(active),
      x = Math.max(0, Math.min(g.nx - f.nx, active.x + dx)),
      y = Math.max(0, Math.min(g.ny - f.ny, active.y + dy));
    if (x !== active.x || y !== active.y) updateBin({ ...active, x, y });
  }
  function remove() {
    if (active) {
      change({
        ...project,
        bins: project.bins.filter((b) => b.id !== active.id),
      });
      setSelected(null);
    }
  }
  async function importProject(file: File) {
    try {
      if (file.size > 1048576)
        throw new Error("Project files must be smaller than 1 MiB.");
      const p = parseProject(await file.text());
      change(p);
      setSelected(p.bins[0]?.id || null);
      setMessage("Project imported. Review the layout before printing.");
    } catch (e) {
      setMessage(`Could not import this project. ${(e as Error).message}`);
    }
  }
  async function exportKit() {
    setMessage("");
    setBusy(true);
    const controller = new AbortController();
    abort.current = controller;
    try {
      const tiles = projectTiles(project);
      const bytes = await makePrintBundle(
        project,
        tiles,
        project.bed,
        (label, done, total) => setProgress(`${label} · ${done}/${total}`),
        controller.signal,
      );
      if (!controller.signal.aborted) {
        download(bytes, "gridfit-drawer-print-kit.zip", "application/zip");
        setProgress(
          "Print kit ready: STL models, quantities, layout, project and guide.",
        );
      }
    } catch (e) {
      if (!controller.signal.aborted) setMessage((e as Error).message);
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }
  return (
    <div className="planner-shell">
      <div className="planner-toolbar">
        <label className="project-name">
          <input
            aria-label="Project name"
            value={project.name}
            maxLength={80}
            onChange={(e) => change({ ...project, name: e.target.value })}
          />
          <span>
            <span className="status-dot ready" />
            {storageStatus || "Local project"}
          </span>
        </label>
        <div className="toolbar-actions">
          <button
            className="button small secondary"
            disabled={busy}
            onClick={() => input.current?.click()}
          >
            <FolderOpen size={15} />
            <span>Open</span>
          </button>
          <input
            ref={input}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void importProject(file);
              e.target.value = "";
            }}
          />
          <button
            className="button small secondary"
            disabled={!parsed.success}
            onClick={() =>
              download(
                JSON.stringify(project, null, 2),
                "my-drawer.gridfit.json",
                "application/json",
              )
            }
          >
            <Save size={15} />
            <span>Save project</span>
          </button>
          <button
            className="button small primary"
            disabled={busy || !!issues.length || !project.bins.length}
            onClick={exportKit}
          >
            {busy ? (
              <LoaderCircle size={15} className="spin" />
            ) : (
              <ArrowDownToLine size={15} />
            )}
            <span>{busy ? "Preparing…" : "Export print kit"}</span>
          </button>
        </div>
      </div>
      <div className="planner-body">
        <aside className="controls-panel planner-controls">
          <div className="panel-tabs">
            <button
              className={tab === "drawer" ? "active" : ""}
              onClick={() => setTab("drawer")}
            >
              Drawer setup
            </button>
            <button
              className={tab === "bin" ? "active" : ""}
              onClick={() => setTab("bin")}
            >
              Selected bin
            </button>
          </div>
          <fieldset className="control-fields" disabled={busy}>
            {tab === "drawer" ? (
              <>
                <h3>Inside dimensions</h3>
                <div className="field-row">
                  <NumberField
                    label="Drawer width"
                    value={project.drawer.width}
                    suffix="mm"
                    min={20}
                    max={840}
                    onChange={(v) =>
                      change({
                        ...project,
                        drawer: { ...project.drawer, width: v! },
                      })
                    }
                  />
                  <NumberField
                    label="Drawer depth"
                    value={project.drawer.depth}
                    suffix="mm"
                    min={20}
                    max={840}
                    onChange={(v) =>
                      change({
                        ...project,
                        drawer: { ...project.drawer, depth: v! },
                      })
                    }
                  />
                </div>
                <NumberField
                  label="Clear height (optional)"
                  value={project.drawer.height}
                  suffix="mm"
                  nullable
                  min={1}
                  max={1000}
                  onChange={(v) =>
                    change({
                      ...project,
                      drawer: { ...project.drawer, height: v },
                    })
                  }
                />
                <p className="helper">
                  Measure usable space inside the closed drawer. Unknown height
                  stays “not checked”.
                </p>
                <h3 className="spaced">Edge clearance</h3>
                <div className="field-row">
                  {(["left", "right"] as const).map((key) => (
                    <NumberField
                      key={key}
                      label={`${key[0].toUpperCase() + key.slice(1)} margin`}
                      value={project.drawer[key]}
                      min={0}
                      max={100}
                      suffix="mm"
                      onChange={(v) =>
                        change({
                          ...project,
                          drawer: { ...project.drawer, [key]: v! },
                        })
                      }
                    />
                  ))}
                </div>
                <div className="field-row">
                  {(["front", "back"] as const).map((key) => (
                    <NumberField
                      key={key}
                      label={`${key[0].toUpperCase() + key.slice(1)} margin`}
                      value={project.drawer[key]}
                      min={0}
                      max={100}
                      suffix="mm"
                      onChange={(v) =>
                        change({
                          ...project,
                          drawer: { ...project.drawer, [key]: v! },
                        })
                      }
                    />
                  ))}
                </div>
                <details className="bed-details">
                  <summary>Print bed</summary>
                  <BedFields
                    bed={project.bed}
                    onChange={(bed) => change({ ...project, bed })}
                  />
                </details>
              </>
            ) : active ? (
              <>
                <h3>
                  Bin {project.bins.indexOf(active) + 1}
                  <span>
                    {active.rotated ? "Rotated 90°" : "Original orientation"}
                  </span>
                </h3>
                <BinFields
                  bin={active.model}
                  onChange={(model) => updateBin({ ...active, model })}
                />
                <div className="field-row">
                  <NumberField
                    label="Grid position X"
                    value={active.x}
                    min={0}
                    max={19}
                    onChange={(v) => updateBin({ ...active, x: v! })}
                  />
                  <NumberField
                    label="Grid position Y"
                    value={active.y}
                    min={0}
                    max={19}
                    onChange={(v) => updateBin({ ...active, y: v! })}
                  />
                </div>
                <div className="bin-actions">
                  <button
                    className="button small secondary"
                    onClick={() =>
                      updateBin({ ...active, rotated: !active.rotated })
                    }
                  >
                    <RotateCw size={15} />
                    Rotate
                  </button>
                  <button
                    className="button small secondary"
                    onClick={() => add(active.model, active.rotated)}
                  >
                    <Copy size={15} />
                    Duplicate
                  </button>
                  <button
                    className="icon-button danger"
                    aria-label="Delete selected bin"
                    onClick={remove}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="move-controls">
                  <span>Move one cell</span>
                  <button
                    className="icon-button"
                    aria-label="Move bin left"
                    onClick={() => move(-1, 0)}
                  >
                    <ArrowLeft size={15} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label="Move bin toward back"
                    onClick={() => move(0, 1)}
                  >
                    <ArrowUp size={15} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label="Move bin toward front"
                    onClick={() => move(0, -1)}
                  >
                    <ArrowDown size={15} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label="Move bin right"
                    onClick={() => move(1, 0)}
                  >
                    <ArrowRight size={15} />
                  </button>
                </div>
              </>
            ) : (
              <div className="empty-selection">
                <p>
                  Select a bin in the drawer to change its size, compartments
                  and position.
                </p>
                <button className="button primary" onClick={() => add()}>
                  <Plus size={16} />
                  Add a bin
                </button>
              </div>
            )}
          </fieldset>
          <div className="planner-sidebar-footer">
            <strong>
              {project.bins.length} bins <span>·</span>{" "}
              {Math.max(0, g.nx * g.ny - covered)} free cells
            </strong>
            <p>Single layer · Integer grid · Local storage</p>
          </div>
        </aside>
        <section className="layout-panel">
          <div className="layout-toolbar">
            <div>
              <span className="eyebrow">DRAWER LAYOUT</span>
              <h2>
                {g.nx} × {g.ny} grid{" "}
                <small>
                  {g.nx * 42} × {g.ny * 42} mm
                </small>
              </h2>
            </div>
            <div className="toolbar-actions">
              <button
                className="icon-button"
                aria-label="Undo layout change"
                disabled={!past.current.length || busy}
                onClick={undo}
              >
                <Undo2 size={17} />
              </button>
              <button
                className="icon-button"
                aria-label="Redo layout change"
                disabled={!future.current.length || busy}
                onClick={redo}
              >
                <Redo2 size={17} />
              </button>
              <button
                className="button small primary"
                disabled={busy || !parsed.success}
                onClick={() => add()}
              >
                <Plus size={16} />
                Add bin
              </button>
            </div>
          </div>
          <div className="drawer-stage">
            <span className="ruler-top">
              {g.nx * 42} mm grid · {project.drawer.width} mm drawer
            </span>
            <div
              className="drawer-board"
              ref={board}
              tabIndex={0}
              role="group"
              aria-label="Drawer layout. Select a bin, then use arrow keys to move it; R rotates and Delete removes it."
              style={{
                width: `min(100%, ${(420 * (g.nx || 1)) / (g.ny || 1)}px)`,
                maxHeight: "none",
                aspectRatio: `${g.nx || 1}/${g.ny || 1}`,
                backgroundSize: `${100 / (g.nx || 1)}% ${100 / (g.ny || 1)}%`,
              }}
              onKeyDown={(e) => {
                if (busy || !active) return;
                const moves: Record<string, [number, number]> = {
                  ArrowLeft: [-1, 0],
                  ArrowRight: [1, 0],
                  ArrowUp: [0, 1],
                  ArrowDown: [0, -1],
                };
                if (moves[e.key]) {
                  e.preventDefault();
                  move(...moves[e.key]);
                } else if (e.key.toLowerCase() === "r") {
                  e.preventDefault();
                  updateBin({ ...active, rotated: !active.rotated });
                } else if (e.key === "Delete") {
                  e.preventDefault();
                  remove();
                }
              }}
            >
              {g.nx > 0 &&
                g.ny > 0 &&
                project.bins.map((p, i) => {
                  const f = footprint(p);
                  return (
                    <button
                      key={p.id}
                      className={`placed-bin color-${i % 4} ${selected === p.id ? "selected" : ""}`}
                      aria-label={`Select bin ${i + 1}, ${f.nx} by ${f.ny} cells`}
                      aria-pressed={selected === p.id}
                      disabled={busy}
                      style={{
                        left: `${(p.x / g.nx) * 100}%`,
                        bottom: `${(p.y / g.ny) * 100}%`,
                        width: `${(f.nx / g.nx) * 100}%`,
                        height: `${(f.ny / g.ny) * 100}%`,
                      }}
                      onClick={() => {
                        setSelected(p.id);
                        setTab("bin");
                      }}
                      onPointerDown={(e) => {
                        setSelected(p.id);
                        setTab("bin");
                        drag.current = {
                          id: p.id,
                          clientX: e.clientX,
                          clientY: e.clientY,
                          x: p.x,
                          y: p.y,
                        };
                        e.currentTarget.setPointerCapture(e.pointerId);
                      }}
                      onPointerCancel={() => {
                        drag.current = null;
                      }}
                      onPointerUp={(e) => {
                        const start = drag.current,
                          rect = board.current?.getBoundingClientRect();
                        drag.current = null;
                        if (!start || !rect) return;
                        const dx = Math.round(
                            (e.clientX - start.clientX) / (rect.width / g.nx),
                          ),
                          dy = -Math.round(
                            (e.clientY - start.clientY) / (rect.height / g.ny),
                          );
                        if (dx || dy)
                          updateBin({
                            ...p,
                            x: Math.max(0, Math.min(g.nx - f.nx, start.x + dx)),
                            y: Math.max(0, Math.min(g.ny - f.ny, start.y + dy)),
                          });
                      }}
                    >
                      <span
                        className="bin-compartments"
                        style={{
                          gridTemplateColumns: `repeat(${p.rotated ? p.model.rows : p.model.columns},1fr)`,
                          gridTemplateRows: `repeat(${p.rotated ? p.model.columns : p.model.rows},1fr)`,
                        }}
                      >
                        {Array.from(
                          {
                            length: Math.min(
                              36,
                              p.model.columns * p.model.rows,
                            ),
                          },
                          (_, j) => (
                            <i key={j} />
                          ),
                        )}
                      </span>
                      <span className="bin-caption">
                        <strong>B{i + 1}</strong>
                        <span>
                          {f.nx} × {f.ny} · {p.model.heightU}U
                        </span>
                      </span>
                    </button>
                  );
                })}
              {!project.bins.length && (
                <div className="board-empty">
                  <Plus size={24} />
                  <span>Add your first bin</span>
                </div>
              )}
            </div>
            <span className="front-label">FRONT OF DRAWER</span>
          </div>
          <div className="layout-metrics">
            <div>
              <span>Grid centered in drawer</span>
              <strong>
                {g.originX.toFixed(1)} mm left · {g.originY.toFixed(1)} mm front
              </strong>
            </div>
            <div>
              <span>Height clearance</span>
              <strong>
                {project.drawer.height == null
                  ? "Not checked — add height"
                  : "Measured during export; confirm assembled fit"}
              </strong>
            </div>
          </div>
          {!!issues.length && (
            <div className="error-box" role="alert">
              {issues.map((s, i) => (
                <p key={i}>{s}</p>
              ))}
            </div>
          )}
          {message && (
            <p className="notice-box" role="status">
              {message}
            </p>
          )}
          {progress && (
            <p className="notice-box" role="status">
              {progress}
              {busy && (
                <button
                  className="text-button"
                  onClick={() => {
                    abort.current?.abort();
                    setBusy(false);
                    setProgress("Export cancelled.");
                  }}
                >
                  Cancel
                </button>
              )}
            </p>
          )}
          <p className="layout-help">
            Drag a bin to move it. Use the side panel for exact positions. Your
            print kit includes unique models, quantities and an assembly map.
          </p>
        </section>
      </div>
    </div>
  );
}
