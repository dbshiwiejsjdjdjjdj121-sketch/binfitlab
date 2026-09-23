# Slicer review

- PrusaSlicer 2.9.6 and CuraEngine 5.13.0 independently sliced the same eight final STL fixtures.
- Generic CLI QA conditions: 0.4 mm nozzle, 0.2 mm layers, PLA temperature settings, 3 perimeters and 15% infill. These are software validation settings, not a tested physical printer profile.
- All 16 runs produced extrusion paths and layer counts consistent with model height within the configured 0.41 mm allowance, with no mesh warnings in the final runs.
- Cura emitted a `reset_flow_duration` definition warning before resolved settings were applied. This does not concern the mesh; it is retained in the report rather than hidden.
- The initial unsimplified rounded-lip bin triggered Cura's “overlapping faces” warning. CuraEngine merges vertices within 0.03 mm. Manifold simplification with a 0.005 mm surface bound removed the problematic slivers. All geometry, native and slicer checks were repeated on the final processed STL.
- Native OpenSCAD 2026.09.22 versus browser OpenSCAD 2025.03.25.wasm24456: dimensions remain within 0.05 mm and volume within 0.2%; the largest observed relative volume change after simplification is approximately 0.1254%.
- First, middle and last extruded layers of the small bin, divided bin and thin plate were plotted from both G-code outputs and visually inspected. Expected closed floors, compartment walls and lip paths were visible. The very thin upper edge of the 1 × 1 plate yields 24 layers in PrusaSlicer and 25 in Cura; Cura's last layer consists of short side segments. This is a slicer treatment of the taper and must be included in the external physical sample review.

Local visual evidence: `artifacts/slicing/layer-preview.html` and `.png`.
QA G-code is deliberately excluded from the external test kit. Do not send it to a real printer.

Not yet performed: physical print tests, calibrated tolerance measurements, real drawer assembly and test prints using the independent reference parts.
