import { Minus, Plus } from "lucide-react";
import type { Bed } from "../core/project";
export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
  nullable = false,
}: {
  label: string;
  value: number | null;
  onChange: (n: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  nullable?: boolean;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="number-input">
        <input
          aria-label={label}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={value == null || !Number.isFinite(value) ? "" : value}
          placeholder={nullable ? "Not set" : ""}
          onChange={(e) =>
            onChange(
              e.target.value === ""
                ? nullable
                  ? null
                  : NaN
                : Number(e.target.value),
            )
          }
        />
        {suffix && <small>{suffix}</small>}
      </div>
    </label>
  );
}
export function Stepper({
  label,
  value,
  onChange,
  min = 1,
  max = 8,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="stepper">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          disabled={value <= min}
          onClick={() => onChange(value - 1)}
        >
          <Minus size={14} />
        </button>
        <input
          type="number"
          aria-label={label}
          value={Number.isFinite(value) ? value : ""}
          min={min}
          max={max}
          onChange={(e) =>
            onChange(e.target.value === "" ? NaN : Number(e.target.value))
          }
        />
        <button
          type="button"
          aria-label={`Increase ${label}`}
          disabled={value >= max}
          onClick={() => onChange(value + 1)}
        >
          <Plus size={14} />
        </button>
      </div>
    </label>
  );
}
export function BedFields({
  bed,
  onChange,
}: {
  bed: Bed;
  onChange: (b: Bed) => void;
}) {
  return (
    <>
      <div className="field-row">
        <NumberField
          label="Bed width"
          value={bed.width}
          min={42}
          max={1000}
          suffix="mm"
          onChange={(v) => onChange({ ...bed, width: v! })}
        />
        <NumberField
          label="Bed depth"
          value={bed.depth}
          min={42}
          max={1000}
          suffix="mm"
          onChange={(v) => onChange({ ...bed, depth: v! })}
        />
      </div>
      <NumberField
        label="Bed edge margin"
        value={bed.margin}
        min={0}
        max={50}
        suffix="mm / side"
        onChange={(v) => onChange({ ...bed, margin: v! })}
      />
    </>
  );
}
