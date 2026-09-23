import { useId, useState } from "react";
import { site } from "../site";
import { ENGINE_VERSION, MODEL_COMMIT, PROFILE } from "../core/project";
import { download } from "../core/export";

const steps = {
  bin: [
    "Choose a quick-start size or set the width, depth and height. One grid cell is 42 mm.",
    "Check the measured size below the preview. Set your printer dimensions under Print bed.",
    "Download the STL and open it in your slicer in millimeters, at 100% scale.",
  ],
  plate: [
    "Choose the total grid size, then enter your print bed dimensions and edge margin.",
    "Use the assembly map to preview each tile. Large grids split along whole cells.",
    "Download all tiles + guide for the complete set, quantities and assembly map.",
  ],
  drawer: [
    "Replace the example drawer measurements with your inside dimensions, then set your print bed.",
    "Move or resize the starter bins. Add more as needed; overlaps and out-of-bounds bins block export.",
    "Export the print kit. Each model is checked before the ZIP is created; the guide lists quantities and placement.",
  ],
};

export function QuickGuide({ kind }: { kind: keyof typeof steps }) {
  return (
    <details className="tool-details quick-guide">
      <summary>New here? 3 quick steps</summary>
      <ol>
        {steps[kind].map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </details>
  );
}

export type CheckRow = { label: string; value: string };
export function ExportChecks({
  summary,
  rows,
}: {
  summary: string;
  rows: CheckRow[];
}) {
  return (
    <details className="tool-details export-checks">
      <summary>{summary}</summary>
      <dl>
        {rows.map((row) => (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
      <p>
        Physical fit is not yet verified.{" "}
        <a href="/compatibility/">See testing details</a>.
      </p>
    </details>
  );
}

export function ToolFeedback({
  tool,
  context,
  description,
}: {
  tool: "bin" | "plate" | "drawer";
  context: unknown;
  description: string;
}) {
  const id = useId();
  const [category, setCategory] = useState("Generation problem");
  const body = [
    `BinFit Lab feedback: ${category}`,
    `Tool: ${tool}`,
    description,
    `Model engine: ${ENGINE_VERSION}; profile: ${PROFILE}`,
    "",
    "What happened / what worked:",
    "",
    ...(category === "Generation problem"
      ? ["Browser and device:"]
      : [
          "Printer, material, slicer and settings:",
          "Fit observations (please attach a photo if available):",
        ]),
    "",
    "Please attach the diagnostic JSON downloaded from the tool. Attachments are not added automatically.",
  ].join("\n");
  return (
    <details className="tool-details tool-feedback">
      <summary>Report a problem or share a print</summary>
      <div className="feedback-content">
        <label htmlFor={id}>Feedback type</label>
        <select
          id={id}
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          <option>Generation problem</option>
          <option>Print or fit problem</option>
          <option>Successful print</option>
        </select>
        <p>
          Save your current settings, then attach the file to your email. You
          can review it first. Nothing is sent automatically.
        </p>
        <div className="feedback-actions">
          <button
            className="button small secondary"
            onClick={() =>
              download(
                JSON.stringify(
                  {
                    formatVersion: 1,
                    tool,
                    category,
                    createdAt: new Date().toISOString(),
                    engine: ENGINE_VERSION,
                    modelCommit: MODEL_COMMIT,
                    profile: PROFILE,
                    physicalValidation: "pending",
                    context,
                  },
                  (_key, value) =>
                    typeof value === "number" && !Number.isFinite(value)
                      ? "Invalid / empty input"
                      : value,
                  2,
                ),
                `binfitlab-${tool}-diagnostic.json`,
                "application/json",
              )
            }
          >
            Save diagnostic file
          </button>
          <a
            className="button small secondary"
            href={`mailto:${site.contact}?subject=${encodeURIComponent(`BinFit Lab — ${category}`)}&body=${encodeURIComponent(body)}`}
          >
            Open email draft
          </a>
        </div>
        <p>
          No mail app? Send the file to{" "}
          <a href={`mailto:${site.contact}`}>{site.contact}</a>.
        </p>
      </div>
    </details>
  );
}
