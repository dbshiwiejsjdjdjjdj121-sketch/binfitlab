# Compact tool help and export evidence — 2026-09-24

The existing workbench now includes collapsed three-step help, actual export checks and an optional feedback disclosure. No modal onboarding, extra routes, accounts, submission service or automatic uploads were added. Feedback uses a local diagnostic download and a mailto draft; visitors attach and send files themselves.

Validation on the public-beta build:

- TypeScript check and all 11 core rule tests passed.
- All 15 Playwright tests passed in one run (1.1 minutes), including the existing browser, WebKit, mobile, 20-cycle cancellation and accessibility checks.
- Two added scenarios verify that disclosures begin collapsed, expanded mobile controls remain accessible, mail drafts carry the selected feedback type, diagnostics match the current inputs, and invalid edits remove stale mesh and bed results.
- Drawer summaries appear only after all STL generation and ZIP assembly succeeds. Changing the clear height invalidates previous evidence immediately. A too-short drawer causes export failure without retaining a successful model check. Unknown height remains explicitly unchecked.
- Successful 60 mm drawer export reports 30.45 mm spare using the conservative maximum bin height plus full 5 mm plate bound. This is a software bound, not a measured assembled fit.
- No off-origin requests occurred during the feedback scenario; tests did not send email. Desktop and expanded mobile screenshots were inspected locally.

Model source, engine assets and geometry algorithms are unchanged. Existing geometric, native and slicer evidence still applies to the same engine; physical fit remains pending. A complete 3D printer compatibility claim is not made.
