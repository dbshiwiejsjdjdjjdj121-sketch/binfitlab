import { modelSource } from "./scad";
import { inspectStl } from "./mesh";
import { simplifyStl } from "./simplify";
import { modelSchema } from "./project";
self.onmessage = async (e: MessageEvent) => {
  const { jobId, model } = e.data,
    logs: string[] = [],
    start = performance.now();
  try {
    const validated = modelSchema.parse(model);
    const moduleUrl = "/engine/run.mjs";
    const kernelUrl = "/engine/manifold.js";
    const [
      { renderScad },
      { default: Module },
      filesResponse,
      wasmResponse,
      kernelResponse,
    ] = await Promise.all([
      import(/* @vite-ignore */ moduleUrl),
      import(/* @vite-ignore */ kernelUrl),
      fetch("/engine/rebuilt.json"),
      fetch("/engine/openscad.wasm"),
      fetch("/engine/manifold.wasm"),
    ]);
    if (!filesResponse.ok || !wasmResponse.ok || !kernelResponse.ok)
      throw new Error(
        "The model engine could not be downloaded. Check your connection and retry.",
      );
    const kernel = await Module({
      wasmBinary: new Uint8Array(await kernelResponse.arrayBuffer()),
    });
    kernel.setup();
    const bytes = simplifyStl(
      await renderScad(
        modelSource(validated),
        await filesResponse.json(),
        new Uint8Array(await wasmResponse.arrayBuffer()),
        (line: string) => {
          if (logs.length < 30) logs.push(line);
        },
      ),
      kernel,
    );
    const report = inspectStl(bytes);
    if (!report.valid)
      throw new Error(
        "The generated mesh failed its geometry checks. Export has been stopped.",
      );
    const expected = [
      validated.nx * 42 - (validated.kind === "bin" ? 0.5 : 0),
      validated.ny * 42 - (validated.kind === "bin" ? 0.5 : 0),
    ];
    if (expected.some((n, k) => Math.abs(n - report.size[k]) > 0.05))
      throw new Error(
        "The generated dimensions do not match the requested grid.",
      );
    const buffer = bytes.slice().buffer;
    self.postMessage(
      { jobId, ok: true, buffer, report, elapsedMs: performance.now() - start },
      { transfer: [buffer] },
    );
  } catch (error) {
    self.postMessage({
      jobId,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      logs,
    });
  }
};
