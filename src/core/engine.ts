import type { Model } from "./project";
import type { MeshReport } from "./mesh";
import {
  recordGeneration,
  type UsageTool,
  type UsageOutcome,
  type UsageReason,
} from "./usage";
export type GeneratedModel = {
  bytes: Uint8Array;
  report: MeshReport;
  elapsedMs: number;
};
let sequence = 0;
export function generateModel(
  model: Model,
  signal?: AbortSignal,
  tool: UsageTool = model.kind,
): Promise<GeneratedModel> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Generation cancelled.", "AbortError"));
      return;
    }
    const started = performance.now();
    let recorded = false;
    const record = (outcome: UsageOutcome, reason: UsageReason = "none") => {
      if (recorded) return;
      recorded = true;
      recordGeneration(tool, outcome, performance.now() - started, reason);
    };
    let worker: Worker;
    try {
      worker = new Worker(new URL("./geometry.worker.ts", import.meta.url), {
        type: "module",
      });
    } catch (error) {
      record("error", "runtime");
      reject(error);
      return;
    }
    const jobId = ++sequence;
    const cleanup = () => {
      clearTimeout(timer);
      worker.terminate();
      signal?.removeEventListener("abort", cancel);
    };
    const cancel = () => {
      cleanup();
      record("cancelled");
      reject(new DOMException("Generation cancelled.", "AbortError"));
    };
    const timer = setTimeout(() => {
      cleanup();
      record("timeout", "timeout");
      reject(
        new Error(
          "This model took longer than 90 seconds. Try a smaller grid or fewer compartments.",
        ),
      );
    }, 90000);
    signal?.addEventListener("abort", cancel, { once: true });
    worker.onerror = (e) => {
      cleanup();
      record("error", "runtime");
      reject(
        new Error(
          e.message || "The model engine stopped unexpectedly. Please retry.",
        ),
      );
    };
    worker.onmessage = (e) => {
      if (e.data.jobId !== jobId) return;
      cleanup();
      if (e.data.ok) {
        record("success");
        resolve({
          bytes: new Uint8Array(e.data.buffer),
          report: e.data.report,
          elapsedMs: e.data.elapsedMs,
        });
      } else {
        record(
          "error",
          /mesh|STL|finite|triangle|volume|bound/i.test(String(e.data.error))
            ? "mesh"
            : "engine",
        );
        reject(new Error(e.data.error));
      }
    };
    worker.postMessage({ jobId, model });
  });
}
