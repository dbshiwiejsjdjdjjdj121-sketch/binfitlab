export type MeshReport = {
  triangles: number;
  size: [number, number, number];
  min: number[];
  max: number[];
  volume: number;
  boundaryEdges: number;
  nonManifoldEdges: number;
  degenerateTriangles: number;
  orientationErrors: number;
  valid: boolean;
};
// STL repeats vertices as float32. Weld at 0.00001 mm and drop only collapsed
// faces caused by float32 serialization; never fill holes or change topology.
export function normalizeStl(bytes: Uint8Array): Uint8Array {
  if (bytes.length < 84) throw new Error("Incomplete STL.");
  const input = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength),
    n = input.getUint32(80, true);
  if (!n || n > 1000000 || bytes.length !== 84 + n * 50)
    throw new Error("Invalid STL.");
  const output = new Uint8Array(bytes.length),
    view = new DataView(output.buffer);
  output.set(
    new TextEncoder().encode("BinFit Lab | millimeters | welded 0.00001 mm"),
  );
  let count = 0;
  for (let i = 0; i < n; i++) {
    const points = [0, 1, 2].map((j) =>
      [0, 1, 2].map((k) => {
        const x = input.getFloat32(84 + i * 50 + 12 + j * 12 + k * 4, true);
        if (!Number.isFinite(x)) throw new Error("Non-finite STL coordinate.");
        return Math.round(x * 100000) / 100000;
      }),
    );
    const [a, b, c] = points,
      u = b.map((x, k) => x - a[k]),
      w = c.map((x, k) => x - a[k]);
    const normal = [
      u[1] * w[2] - u[2] * w[1],
      u[2] * w[0] - u[0] * w[2],
      u[0] * w[1] - u[1] * w[0],
    ];
    const length = Math.hypot(...normal);
    if (length < 1e-9) continue;
    normal.forEach((x, k) =>
      view.setFloat32(84 + count * 50 + k * 4, x / length, true),
    );
    points.forEach((p, j) =>
      p.forEach((x, k) =>
        view.setFloat32(84 + count * 50 + 12 + j * 12 + k * 4, x, true),
      ),
    );
    count++;
  }
  view.setUint32(80, count, true);
  return output.slice(0, 84 + count * 50);
}
export function inspectStl(bytes: Uint8Array): MeshReport {
  if (bytes.length < 84)
    throw new Error("The generated STL is empty or incomplete.");
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength),
    n = v.getUint32(80, true);
  if (!n || n > 1000000 || bytes.length !== 84 + n * 50)
    throw new Error("Invalid binary STL length or triangle count.");
  const min = [Infinity, Infinity, Infinity],
    max = [-Infinity, -Infinity, -Infinity];
  const edges = new Map<string, { count: number; direction: number }>();
  let volume = 0,
    degenerateTriangles = 0;
  const pointKey = (p: number[]) =>
    p.map((x) => Math.round(x * 100000)).join(",");
  for (let i = 0; i < n; i++) {
    const p: number[][] = [];
    for (let j = 0; j < 3; j++) {
      const xyz = [0, 1, 2].map((k) =>
        v.getFloat32(84 + i * 50 + 12 + j * 12 + k * 4, true),
      );
      if (xyz.some((x) => !Number.isFinite(x)))
        throw new Error("The mesh contains non-finite coordinates.");
      xyz.forEach((x, k) => {
        min[k] = Math.min(min[k], x);
        max[k] = Math.max(max[k], x);
      });
      p.push(xyz);
    }
    const [a, b, c] = p,
      u = b.map((x, k) => x - a[k]),
      w = c.map((x, k) => x - a[k]);
    const cross = [
      u[1] * w[2] - u[2] * w[1],
      u[2] * w[0] - u[0] * w[2],
      u[0] * w[1] - u[1] * w[0],
    ];
    if (Math.hypot(...cross) < 1e-9) degenerateTriangles++;
    volume +=
      (a[0] * (b[1] * c[2] - b[2] * c[1]) +
        a[1] * (b[2] * c[0] - b[0] * c[2]) +
        a[2] * (b[0] * c[1] - b[1] * c[0])) /
      6;
    const keys = p.map(pointKey);
    for (let j = 0; j < 3; j++) {
      const a = keys[j],
        b = keys[(j + 1) % 3],
        forward = a < b,
        key = forward ? `${a}|${b}` : `${b}|${a}`;
      const e = edges.get(key) || { count: 0, direction: 0 };
      e.count++;
      e.direction += forward ? 1 : -1;
      edges.set(key, e);
    }
  }
  let boundaryEdges = 0,
    nonManifoldEdges = 0,
    orientationErrors = 0;
  edges.forEach((e) => {
    if (e.count === 1) boundaryEdges++;
    else if (e.count !== 2) nonManifoldEdges++;
    else if (e.direction !== 0) orientationErrors++;
  });
  const size = max.map((x, k) => x - min[k]) as [number, number, number];
  return {
    triangles: n,
    size,
    min,
    max,
    volume,
    boundaryEdges,
    nonManifoldEdges,
    degenerateTriangles,
    orientationErrors,
    valid:
      volume > 0 &&
      size.every((x) => x > 0) &&
      !boundaryEdges &&
      !nonManifoldEdges &&
      !degenerateTriangles &&
      !orientationErrors,
  };
}
