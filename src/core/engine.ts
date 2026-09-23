import type { Model } from "./project";
import type { MeshReport } from "./mesh";
export type GeneratedModel = {
  bytes: Uint8Array;
  report: MeshReport;
  elapsedMs: number;
};
let sequence = 0;
export function generateModel(
  model: Model,
  signal?: AbortSignal,
): Promise<GeneratedModel> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Generation cancelled.", "AbortError"));
      return;
    }
    const worker = new Worker(
      new URL("./geometry.worker.ts", import.meta.url),
      { type: "module" },
    );
    const jobId = ++sequence;
    const cleanup = () => {
      clearTimeout(timer);
      worker.terminate();
      signal?.removeEventListener("abort", cancel);
    };
    const cancel = () => {
      cleanup();
      reject(new DOMException("Generation cancelled.", "AbortError"));
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(
        new Error(
          "This model took longer than 90 seconds. Try a smaller grid or fewer compartments.",
        ),
      );
    }, 90000);
    signal?.addEventListener("abort", cancel, { once: true });
    worker.onerror = (e) => {
      cleanup();
      reject(
        new Error(
          e.message || "The model engine stopped unexpectedly. Please retry.",
        ),
      );
    };
    worker.onmessage = (e) => {
      if (e.data.jobId !== jobId) return;
      cleanup();
      if (e.data.ok)
        resolve({
          bytes: new Uint8Array(e.data.buffer),
          report: e.data.report,
          elapsedMs: e.data.elapsedMs,
        });
      else reject(new Error(e.data.error));
    };
    worker.postMessage({ jobId, model });
  });
}
