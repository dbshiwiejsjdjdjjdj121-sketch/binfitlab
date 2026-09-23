export const USAGE_CHOICE_KEY = "binfitlab-usage-opt-in";
let storageFailed = false;
export type UsageTool = "bin" | "plate" | "drawer";
export type UsageOutcome = "success" | "error" | "cancelled" | "timeout";
export type UsageReason = "none" | "engine" | "mesh" | "runtime" | "timeout";
export function privacySignal() {
  return (
    typeof navigator !== "undefined" &&
    (navigator.doNotTrack === "1" ||
      (navigator as Navigator & { globalPrivacyControl?: boolean })
        .globalPrivacyControl === true)
  );
}
export function usageEnabled() {
  if (typeof window === "undefined" || privacySignal() || storageFailed)
    return false;
  try {
    return localStorage.getItem(USAGE_CHOICE_KEY) === "yes";
  } catch {
    return false;
  }
}
export function setUsageEnabled(enabled: boolean) {
  try {
    localStorage.setItem(USAGE_CHOICE_KEY, enabled ? "yes" : "no");
    storageFailed = false;
    window.dispatchEvent(new Event("binfitlab-usage-change"));
    return true;
  } catch {
    storageFailed = true;
    window.dispatchEvent(new Event("binfitlab-usage-change"));
    return false;
  }
}
export function durationBucket(ms: number) {
  return ms < 1000
    ? "under_1s"
    : ms < 3000
      ? "1_3s"
      : ms < 10000
        ? "3_10s"
        : ms < 30000
          ? "10_30s"
          : ms < 90000
            ? "30_90s"
            : "90s_plus";
}
function send(event: {
  event: "generation" | "download";
  tool: UsageTool;
  outcome: UsageOutcome | "started";
  reason: UsageReason;
  duration: string;
}) {
  if (!usageEnabled()) return;
  // An explicit, bounded schema: never pass model settings, errors, URLs or IDs.
  void fetch("/api/usage", {
    method: "POST",
    credentials: "omit",
    mode: "same-origin",
    cache: "no-store",
    referrerPolicy: "no-referrer",
    keepalive: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  }).catch(() => {
    /* Optional telemetry must never interrupt a tool. */
  });
}
export function recordGeneration(
  tool: UsageTool,
  outcome: UsageOutcome,
  elapsedMs: number,
  reason: UsageReason = "none",
) {
  send({
    event: "generation",
    tool,
    outcome,
    reason,
    duration: durationBucket(elapsedMs),
  });
}
export function recordDownload(tool: UsageTool) {
  send({
    event: "download",
    tool,
    outcome: "started",
    reason: "none",
    duration: "not_applicable",
  });
}
