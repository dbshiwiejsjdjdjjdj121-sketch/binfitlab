# Digital assembly checks

The 2026.09.24.binfit1 fixtures were compared with independently generated vector76 reference meshes using Manifold solid intersections. The test centers XY and sweeps the relative bottom height in 0.25 mm steps. A collision volume below 0.001 mm³ counts as no collision at that sample. Inputs, bounds and every sample are in `digital-assembly.json`.

- Our 1×1 bin / our 1×1 plate: no collision at +0.25 mm.
- Our 1×1 bin / independent reference plate: no collision at +0.00 mm.
- Independent reference bin / our plate: no collision at +0.25 mm.
- Our 2×1 bin / two edge-to-edge 1×1 plates: no collision at +0.25 mm.

There is small solid interference at zero bottom offset with our plate. This is why putting both STL bottoms at Z=0 is not a correct universal assembly assumption. The sampled offsets are nominal CAD configurations, not measured seating heights or printer tolerances.

This test does **not** measure friction, shrinkage, roughness, adhesion, warping, insertion/removal force or real-world drawer fit. It does not replace the physical test kit. Rerun against regenerated fixtures after replacing the engine.
