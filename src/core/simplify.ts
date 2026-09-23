import { inspectStl, normalizeStl } from "./mesh";
import type Module from "manifold-3d";
type Kernel = Awaited<ReturnType<typeof Module>>;
export const EXPORT_TOLERANCE_MM = 0.005;
// Cura welds vertices within 0.03 mm. Thin triangles along the rounded lip can
// collapse under that tolerance even in a closed STL. Bounded simplification
// removes those slivers without redesigning the model. No hole filling occurs.
export function simplifyStl(bytes: Uint8Array, api: Kernel): Uint8Array {
  const source = normalizeStl(bytes),
    before = inspectStl(source);
  if (!before.valid)
    throw new Error(
      "The source mesh is not a closed, consistently oriented solid.",
    );
  const data = new DataView(
      source.buffer,
      source.byteOffset,
      source.byteLength,
    ),
    verts: number[] = [],
    triangles: number[] = [],
    ids = new Map<string, number>();
  for (let i = 0; i < before.triangles; i++)
    for (let j = 0; j < 3; j++) {
      const p = [0, 1, 2].map((k) =>
        data.getFloat32(84 + i * 50 + 12 + j * 12 + k * 4, true),
      );
      const key = p.join(",");
      if (!ids.has(key)) {
        ids.set(key, verts.length / 3);
        verts.push(...p);
      }
      triangles.push(ids.get(key)!);
    }
  const original = api.Manifold.ofMesh(
    new api.Mesh({
      numProp: 3,
      vertProperties: new Float32Array(verts),
      triVerts: new Uint32Array(triangles),
    }),
  );
  let simplified: ReturnType<typeof original.simplify> | undefined;
  try {
    if (original.status() !== "NoError")
      throw new Error("The export mesh could not be validated.");
    simplified = original.simplify(EXPORT_TOLERANCE_MM);
    if (simplified.status() !== "NoError")
      throw new Error("The export mesh could not be simplified safely.");
    const mesh = simplified.getMesh(),
      count = mesh.triVerts.length / 3;
    const out = new Uint8Array(84 + count * 50),
      view = new DataView(out.buffer);
    view.setUint32(80, count, true);
    for (let i = 0; i < count; i++)
      for (let j = 0; j < 3; j++)
        for (let k = 0; k < 3; k++)
          view.setFloat32(
            84 + i * 50 + 12 + j * 12 + k * 4,
            mesh.vertProperties[mesh.triVerts[i * 3 + j] * mesh.numProp + k],
            true,
          );
    const result = normalizeStl(out),
      after = inspectStl(result);
    if (
      !after.valid ||
      after.size.some((v, i) => Math.abs(v - before.size[i]) > 0.011) ||
      Math.abs(after.volume - before.volume) / before.volume > 0.002
    )
      throw new Error(
        "Export processing changed the model beyond its allowed tolerance.",
      );
    return result;
  } finally {
    simplified?.delete();
    original.delete();
  }
}
