# Optional usage counters — 2026-09-24

## Scope and interpretation

The visitor must opt in before any usage event is sent. The preference is device-local, contains no identifier, and can be changed in each tool or on the privacy page. DNT and GPC override a saved opt-in. No cookies, fingerprinting, third-party analytics, automatic design uploads or public statistics endpoint are used.

POST /api/usage accepts exactly five fields: event, tool, outcome, reason, duration. Values come from finite allowlists. Model settings, dimensions, filenames, IDs, project names, full error messages, IP addresses, user agents and referrers are not stored in the application counters. Hosting providers may still process ordinary request metadata, as explained on the privacy page.

Generation events describe started model-engine tasks, including previews and each distinct model in a print kit. They are not unique visitors or complete user sessions. Success means the engine returned a checked mesh. Error and timeout are failures; cancellation is reported separately and should not be counted as a model defect. Invalid inputs rejected before an engine task begins are not counted. Time is grouped into under 1 second, 1–3, 3–10, 10–30, 30–90 and 90+ seconds. The measured interval includes Worker initialization and mesh processing.

Download events count initiated STL or print-kit downloads, not files saved, slicer use, actual prints or successful physical fit. Project backups and diagnostic downloads are excluded. Counts describe participating browsers; blocked, offline and failed telemetry is dropped without retry. Counters are best-effort and client-reported, not suitable for billing, unique-user measurement or fraud-resistant analytics.

## Storage and owner access

Sites provides D1 under the DB binding. The generated Drizzle migration creates usage_daily with a compound primary key beginning with UTC day. Each accepted event atomically increments a daily aggregate and deletes rows older than the rolling 90-day window. If traffic stops, cleanup resumes with the next accepted event. Each bucket is capped at 1,000,000 to bound counters.

The public endpoint is write-only, same-origin allowlisted, body-limited to 512 bytes and rejects unknown fields. It exposes no statistics-reading route. The owner can inspect the database in Sites Settings, or ask Codex to read the aggregate table using the Sites database tools (overview first, then exact returned binding/table names). Local preview/test rows exist only in artifacts/usage-preview.sqlite and are never included in deployment archives.

## Verification

- Worker tests use the actual generated migration and in-memory SQLite. Repeated events aggregate, old rows are removed, unexpected personal fields and invalid enums are rejected, cross-origin and oversized bodies are blocked, privacy signals suppress writes, and missing storage responds safely.
- Browser tests exercise default-off, opt-in generation and download with successful endpoint responses, strict payload fields, opt-out, persisted choice and GPC overriding a saved opt-in.
- Existing generation, cancellation, export, accessibility, mobile, WebKit and public SEO checks remain part of the full regression suite.
- Production dependencies: npm audit --omit=dev reports zero vulnerabilities. The migration development toolchain reports four moderate advisories; it is not included in the browser or Worker artifact, and no development server is exposed by it.

The nine content pages remain prerendered. A small Worker serves those assets and the counters endpoint. OpenSCAD, model sources, geometry checks and slicer evidence are unchanged. Physical fit remains unverified.

Final local result: TypeScript check, all 15 core/Worker tests and all 17 browser tests passed. The complete browser run took 1.3 minutes.
