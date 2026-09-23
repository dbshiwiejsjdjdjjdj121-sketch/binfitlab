# Browser verification — 2026-09-24 (Asia/Shanghai)

Executed against the locally served static production build with Playwright 1.58.2.

Passed scenarios:

1. All nine content routes return 200 with unique titles, canonical URLs, JSON-LD and preview noindex directives; unknown routes return 404.
2. Real Worker-generated STL download; binary mesh inspection; dimension changes invalidate the old download; invalid dimensions block export.
3. 6 × 9 baseplate split into four printable tiles; ZIP includes actual checked models and assembly information.
4. Drawer overlap rejection, undo, persistence across reload, malformed project rejection and complete print-kit download.
5. 390 px mobile viewport without horizontal overflow; no off-origin model or project requests.
6. Desktop home, generator and planner visual review, with actual WebGL model rendering using SwiftShader in headless Chromium.
7. Twenty sequential generation cycles, cancellation and recovery, checked dimensions and no page exceptions.
8. Mobile drawer cells retain square aspect; selection, rotation, undo and duplicate operate correctly. The initial CSS maximum-height distortion was corrected and this scenario rerun successfully.
9. macOS WebKit 26.0 loads the engine, generates a model and displays a WebGL canvas without page exceptions.

Accessibility: four axe-core WCAG 2 A/AA and WCAG 2.1 AA scans pass on home, bin generator, planner and privacy after adding the document language and improving text contrast. Automated scans are not a full accessibility certification.

Reports come from successive verification runs while fixing discovered issues. Final passing results cover all nine end-to-end scenarios and the four accessibility routes. `npm run test:browser` reruns the complete suite. CI skips the local WebKit smoke check unless its binary is installed.

Limits: these checks are local synthetic browser tests, not field telemetry, an exhaustive browser matrix, a memory-leak proof, or physical printer compatibility evidence.
