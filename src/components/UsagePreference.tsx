import { useEffect, useState } from "react";
import { privacySignal, setUsageEnabled, usageEnabled } from "../core/usage";

export default function UsagePreference() {
  const [enabled, setEnabled] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    const sync = () => {
      setEnabled(usageEnabled());
      setBlocked(privacySignal());
    };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("binfitlab-usage-change", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("binfitlab-usage-change", sync);
    };
  }, []);
  return (
    <div className="usage-preference">
      <label>
        <input
          type="checkbox"
          checked={enabled}
          disabled={blocked}
          onChange={(e) => setError(!setUsageEnabled(e.target.checked))}
        />
        Help improve the tools with basic usage statistics
      </label>
      <small>
        {blocked
          ? "Disabled by your browser privacy preference. "
          : "Optional. No models, dimensions or visitor IDs. "}
        <a href="/privacy/#usage-statistics">Details</a>
      </small>
      {error && (
        <small role="status">
          Your preference could not be saved. Statistics stay off.
        </small>
      )}
    </div>
  );
}
