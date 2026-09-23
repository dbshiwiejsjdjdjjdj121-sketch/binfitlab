import { useEffect, useRef, useState } from "react";
import {
  ArrowDownToLine,
  Check,
  ChevronDown,
  Layers3,
  LoaderCircle,
  Package,
  ShieldCheck,
} from "lucide-react";
import {
  DEFAULT_BIN,
  DEFAULT_BED,
  binSchema,
  bedSchema,
  displayLength,
  modelFitsBed,
  modelKey,
  splitPlate,
  type Bin,
  type Tile,
} from "../core/project";
import { download, makePrintBundle } from "../core/export";
import { useModel } from "./useModel";
import { BedFields, Stepper } from "./Fields";
import Viewer from "./Viewer";

export function BinFields({
  bin,
  onChange,
}: {
  bin: Bin;
  onChange: (b: Bin) => void;
}) {
  return (
    <>
      <div className="field-row">
        <Stepper
          label="Width · X"
          value={bin.nx}
          onChange={(nx) => onChange({ ...bin, nx })}
        />
        <Stepper
          label="Depth · Y"
          value={bin.ny}
          onChange={(ny) => onChange({ ...bin, ny })}
        />
      </div>
      <div className="field-row">
        <Stepper
          label="Height · U"
          value={bin.heightU}
          min={2}
          max={12}
          onChange={(heightU) => onChange({ ...bin, heightU })}
        />
        <div className="unit-hint">
          <strong>
            {Number.isFinite(bin.heightU) ? bin.heightU * 7 : "—"} mm
          </strong>
          <span>before stacking lip</span>
        </div>
      </div>
      <div className="section-divider" />
      <h3>Compartments</h3>
      <div className="field-row">
        <Stepper
          label="Columns"
          value={bin.columns}
          max={6}
          onChange={(columns) => onChange({ ...bin, columns })}
        />
        <Stepper
          label="Rows"
          value={bin.rows}
          max={6}
          onChange={(rows) => onChange({ ...bin, rows })}
        />
      </div>
      <label className="toggle-row">
        <span>
          <strong>Stacking lip</strong>
          <small>Let another bin sit securely on top</small>
        </span>
        <input
          type="checkbox"
          role="switch"
          checked={bin.lip}
          onChange={(e) => onChange({ ...bin, lip: e.target.checked })}
        />
      </label>
    </>
  );
}
export function TileMap({
  tiles,
  selected,
  onSelect,
  nx,
  ny,
}: {
  tiles: Tile[];
  selected: number;
  onSelect: (n: number) => void;
  nx: number;
  ny: number;
}) {
  return (
    <div
      className="tile-map"
      style={{
        aspectRatio: `${nx}/${ny}`,
        gridTemplateColumns: `repeat(${nx},1fr)`,
        gridTemplateRows: `repeat(${ny},1fr)`,
      }}
      aria-label="Baseplate assembly map"
    >
      {tiles.map((t, i) => (
        <button
          key={t.id}
          className={selected === i ? "active" : ""}
          onClick={() => onSelect(i)}
          style={{
            gridColumn: `${t.x + 1} / span ${t.nx}`,
            gridRow: `${ny - t.y - t.ny + 1} / span ${t.ny}`,
          }}
          aria-label={`Preview tile ${t.id}, ${t.nx} by ${t.ny} cells`}
        >
          <strong>{t.id}</strong>
          <span>
            {t.nx} × {t.ny}
          </span>
        </button>
      ))}
    </div>
  );
}
export default function Generator({ kind }: { kind: "bin" | "plate" }) {
  const [bin, setBin] = useState<Bin>({ ...DEFAULT_BIN }),
    [bed, setBed] = useState({ ...DEFAULT_BED });
  const [nx, setNx] = useState(6),
    [ny, setNy] = useState(9),
    [selected, setSelected] = useState(0),
    [unit, setUnit] = useState<"mm" | "in">("mm");
  const [bundleStatus, setBundleStatus] = useState(""),
    [exportError, setExportError] = useState(""),
    [exporting, setExporting] = useState(false),
    [downloaded, setDownloaded] = useState(false);
  const bundleAbort = useRef<AbortController | null>(null);
  let tiles: Tile[] = [],
    validation = "";
  try {
    bedSchema.parse(bed);
    if (kind === "plate") tiles = splitPlate(nx, ny, bed);
    else binSchema.parse(bin);
  } catch (e) {
    validation =
      e instanceof Error && "issues" in e
        ? (e as { issues: { message: string }[] }).issues[0].message
        : String((e as Error).message);
  }
  const tile = tiles[Math.min(selected, tiles.length - 1)];
  const model = validation
    ? null
    : kind === "bin"
      ? bin
      : tile
        ? { kind: "plate" as const, nx: tile.nx, ny: tile.ny }
        : null;
  const generated = useModel(model),
    result = generated.result;
  const fits = result ? modelFitsBed(result.report.size, bed) : true;
  useEffect(() => {
    bundleAbort.current?.abort();
    setExporting(false);
    setBundleStatus("");
    setExportError("");
    setDownloaded(false);
  }, [JSON.stringify(bin), JSON.stringify(bed), nx, ny]);
  useEffect(() => () => bundleAbort.current?.abort(), []);
  async function exportBundle() {
    const abort = new AbortController();
    bundleAbort.current = abort;
    setExporting(true);
    setExportError("");
    try {
      const zip = await makePrintBundle(
        null,
        tiles,
        bed,
        (label, done, total) => setBundleStatus(`${label} · ${done}/${total}`),
        abort.signal,
      );
      if (!abort.signal.aborted) {
        download(zip, `gridfit-baseplate-${nx}x${ny}.zip`, "application/zip");
        setBundleStatus("Your print kit is ready.");
      }
    } catch (e) {
      if (!abort.signal.aborted) setExportError((e as Error).message);
    } finally {
      if (!abort.signal.aborted) setExporting(false);
    }
  }
  return (
    <div className="workspace">
      <aside className="controls-panel">
        <div className="panel-heading">
          <h2>{kind === "bin" ? "Make it yours" : "Build your foundation"}</h2>
          <p>
            {kind === "bin"
              ? "A little structure goes a long way."
              : "One grid. Sized for your printer."}
          </p>
        </div>
        <fieldset disabled={exporting} className="control-fields">
          {kind === "bin" ? (
            <>
              <h3>
                Bin dimensions <span>42 mm grid</span>
              </h3>
              <BinFields bin={bin} onChange={setBin} />
              <div className="quick-presets">
                <span>Quick start</span>
                {[
                  { label: "Small", nx: 1, ny: 1 },
                  { label: "Everyday", nx: 2, ny: 3 },
                  { label: "Wide", nx: 4, ny: 2 },
                ].map((p) => (
                  <button
                    key={p.label}
                    onClick={() =>
                      setBin({ ...DEFAULT_BIN, nx: p.nx, ny: p.ny })
                    }
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <h3>
                Overall grid <span>42 mm cells</span>
              </h3>
              <div className="field-row">
                <Stepper
                  label="Grid width · X"
                  value={nx}
                  max={20}
                  onChange={(v) => {
                    setNx(v);
                    setSelected(0);
                  }}
                />
                <Stepper
                  label="Grid depth · Y"
                  value={ny}
                  max={20}
                  onChange={(v) => {
                    setNy(v);
                    setSelected(0);
                  }}
                />
              </div>
              <p className="helper">
                Full size:{" "}
                {Number.isFinite(nx) && Number.isFinite(ny)
                  ? `${nx * 42} × ${ny * 42} mm`
                  : "—"}
                . Split into whole cells that fit your bed.
              </p>
            </>
          )}
          <details className="bed-details" open={kind === "plate"}>
            <summary>
              Print bed <ChevronDown size={15} />
            </summary>
            <BedFields bed={bed} onChange={setBed} />
          </details>
          {kind === "plate" && tiles.length > 0 && (
            <div className="tile-section">
              <h3>
                Assembly map <span>{tiles.length} pieces</span>
              </h3>
              <TileMap
                tiles={tiles}
                selected={Math.min(selected, tiles.length - 1)}
                onSelect={setSelected}
                nx={nx}
                ny={ny}
              />
              <p className="helper">
                Click a tile to preview it. Front edge is at the bottom.
              </p>
            </div>
          )}
        </fieldset>
        {validation && (
          <p role="alert" className="error-box">
            {validation}
          </p>
        )}
        {!fits && (
          <p role="alert" className="error-box">
            This bin exceeds your usable print bed, even when rotated. Reduce
            its footprint or adjust the bed.
          </p>
        )}
        <div className="export-actions">
          <button
            className="button primary full"
            disabled={!result || !!validation || !fits || exporting}
            onClick={() => {
              if (result && model) {
                download(result.bytes, `gridfit-${modelKey(model)}.stl`);
                setDownloaded(true);
              }
            }}
          >
            {downloaded ? <Check size={18} /> : <ArrowDownToLine size={18} />}{" "}
            {downloaded
              ? "STL ready — download again"
              : kind === "bin"
                ? "Download STL"
                : `Download ${tile?.id || "tile"} STL`}
          </button>
          {kind === "plate" && (
            <button
              className="button secondary full"
              disabled={!!validation || exporting || !tiles.length}
              onClick={exportBundle}
            >
              {exporting ? (
                <LoaderCircle size={17} className="spin" />
              ) : (
                <Package size={17} />
              )}{" "}
              {exporting
                ? "Preparing print kit…"
                : "Download all tiles + guide"}
            </button>
          )}
          {exporting && (
            <button
              className="text-button"
              onClick={() => {
                bundleAbort.current?.abort();
                setExporting(false);
                setBundleStatus("Export cancelled.");
              }}
            >
              Cancel export
            </button>
          )}
          {bundleStatus && (
            <p className="helper" role="status">
              {bundleStatus}
            </p>
          )}
          {exportError && (
            <p className="error-box" role="alert">
              {exportError}
            </p>
          )}
          <p className="local-note">
            <ShieldCheck size={13} /> Generated locally. Your design stays here.
          </p>
        </div>
      </aside>
      <section className="model-panel">
        <div className="model-heading">
          <div>
            <span className="eyebrow">
              {kind === "bin"
                ? "YOUR NEXT ORGANIZED CORNER"
                : `BASEPLATE · ${tile?.id || "PREVIEW"}`}
            </span>
            <h2>
              {kind === "bin"
                ? `${Number.isFinite(bin.nx) ? bin.nx : "—"} × ${Number.isFinite(bin.ny) ? bin.ny : "—"} storage bin`
                : `${tile?.nx || "—"} × ${tile?.ny || "—"} baseplate`}
            </h2>
          </div>
          <div className="segmented" aria-label="Display units">
            <button
              className={unit === "mm" ? "active" : ""}
              onClick={() => setUnit("mm")}
            >
              mm
            </button>
            <button
              className={unit === "in" ? "active" : ""}
              onClick={() => setUnit("in")}
            >
              in
            </button>
          </div>
        </div>
        <Viewer
          result={result}
          busy={generated.busy}
          error={validation || generated.error}
          kind={kind}
        />
        <div className="dimension-strip">
          {["Width", "Depth", "Total height"].map((label, i) => (
            <div key={label}>
              <span>{label}</span>
              <strong>
                {result ? displayLength(result.report.size[i], unit) : "—"}{" "}
                <small>{unit}</small>
              </strong>
            </div>
          ))}
          <div>
            <span>Geometry</span>
            <strong className="geometry-label">
              {result ? (
                <>
                  <Check size={15} /> Checked
                </>
              ) : generated.busy ? (
                "Building…"
              ) : (
                "Not checked"
              )}
            </strong>
          </div>
        </div>
        <div className="model-footnote">
          <Layers3 size={15} />
          <span>
            {result
              ? `${result.report.triangles.toLocaleString()} triangles · Dimensions measured from the download file.`
              : "Preview and download use the same final model."}
          </span>
          {generated.busy ? (
            <button className="text-button" onClick={generated.cancel}>
              Cancel
            </button>
          ) : generated.error ? (
            <button className="text-button" onClick={generated.retry}>
              Generate again
            </button>
          ) : null}
        </div>
        <div className="fit-note">
          <span className="note-mark">i</span>
          <p>
            <strong>Start small. Check the fit.</strong> Print one sample before
            a full set. Physical fit testing is pending.{" "}
            <a href="/guides/print-and-fit-test/">Read the fit guide ↗</a>
          </p>
        </div>
      </section>
    </div>
  );
}
