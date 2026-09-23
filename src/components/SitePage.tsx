import { useEffect, useState, lazy, Suspense } from "react";
import Head from "next/head";
import {
  ArrowRight,
  ArrowUpRight,
  Box,
  Check,
  Grid2X2,
  Layers3,
  LockKeyhole,
  Menu,
  Move,
  Ruler,
  X,
} from "lucide-react";
import { routes, site, type Route } from "../site";
import { MODEL_COMMIT } from "../core/project";
import { BrandArt } from "./BrandArt";
const Generator = lazy(() => import("./Generator"));
const Planner = lazy(() => import("./Planner"));
export function Logo() {
  return (
    <a className="logo" href="/" aria-label="BinFit Lab home">
      <span className="logo-mark">
        <i />
        <i />
        <i />
        <i />
      </span>
      <span>
        binfit<span className="logo-light">lab</span>
        <sup>✳</sup>
      </span>
    </a>
  );
}
function Header({ path }: { path: string }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="header-inner">
        <Logo />
        <nav
          className={open ? "main-nav open" : "main-nav"}
          aria-label="Main navigation"
        >
          <a
            href="/gridfinity-bin-generator/"
            className={
              path.includes("generator") || path.includes("planner")
                ? "active"
                : ""
            }
          >
            Tools
          </a>
          <a
            href="/gridfinity-dimensions/"
            className={path.includes("dimensions") ? "active" : ""}
          >
            Dimensions
          </a>
          <a
            href="/guides/print-and-fit-test/"
            className={path.includes("guides") ? "active" : ""}
          >
            Print guide
          </a>
          <a href="/about/" className={path === "/about/" ? "active" : ""}>
            About
          </a>
        </nav>
        <a className="header-cta" href="/gridfinity-drawer-planner/">
          Plan a drawer <ArrowUpRight size={15} />
        </a>
        <button
          className="mobile-menu icon-button"
          aria-label={open ? "Close navigation" : "Open navigation"}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  );
}
function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <Logo />
        <p>A little structure. A lot more space.</p>
        <span className="footer-small">
          Independent tools for the Gridfinity community.
        </span>
      </div>
      <nav aria-label="Footer navigation">
        <a href="/compatibility/">Compatibility & testing</a>
        <a href="/guides/print-and-fit-test/">Print & fit guide</a>
        <a href="/privacy/">Privacy</a>
        <a href="/about/#open-source">Open source</a>
      </nav>
      <div className="footer-right">
        <span className="status-dot ready" /> Made to run in your browser
        <br />
        <small>Free to use. No account needed.</small>
      </div>
    </footer>
  );
}
function ToolNavigation({ kind }: { kind: string }) {
  return (
    <nav className="tool-navigation" aria-label="Choose a tool">
      {routes
        .filter((r) => "kind" in r)
        .map((r) => {
          const k = "kind" in r ? r.kind : "";
          const Icon = k === "bin" ? Box : k === "plate" ? Grid2X2 : Layers3;
          return (
            <a
              key={r.path}
              className={kind === k ? "active" : ""}
              aria-current={kind === k ? "page" : undefined}
              href={r.path}
            >
              <Icon size={17} />
              {r.short}
            </a>
          );
        })}
      <span>FREE · NO SIGN-UP</span>
    </nav>
  );
}
function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <div className="pill">
            <span className="status-dot ready" /> SMALL TOOLS. SATISFYING ORDER.
          </div>
          <h1>
            A place for everything.
            <br />
            <em>Built to fit.</em>
          </h1>
          <p>
            Turn that almost-organized drawer into a perfect fit. Make custom
            Gridfinity bins, build a baseplate, and bring a little order to your
            everyday.
          </p>
          <div className="hero-actions">
            <a className="button primary" href="/gridfinity-bin-generator/">
              Make your first bin <ArrowRight size={18} />
            </a>
            <a className="button text" href="/gridfinity-drawer-planner/">
              Plan a whole drawer <ArrowUpRight size={17} />
            </a>
          </div>
          <div className="hero-promises">
            <span>
              <Check size={14} />
              Free, no account
            </span>
            <span>
              <Check size={14} />
              Real STL downloads
            </span>
            <span>
              <Check size={14} />
              On your device
            </span>
          </div>
        </div>
        <div className="hero-visual">
          <div className="art-tag">
            <span>THE EVERYDAY DRAWER</span>
            <strong>Everything, in its place.</strong>
          </div>
          <BrandArt />
          <div className="art-chip">
            <Grid2X2 size={17} />
            <span>
              One grid.<strong>Endless arrangements.</strong>
            </span>
          </div>
        </div>
      </section>
      <section className="tools-section">
        <div className="section-title">
          <div>
            <span className="eyebrow">YOUR WORKBENCH</span>
            <h2>Start with what you need.</h2>
          </div>
          <p>From one small bin to an entire drawer.</p>
        </div>
        <div className="tool-cards">
          {[
            {
              icon: Box,
              n: "01",
              title: "Make a bin",
              desc: "The right size. The right compartments. A home for every little thing.",
              href: "/gridfinity-bin-generator/",
              cta: "Open bin generator",
              cls: "bin",
            },
            {
              icon: Grid2X2,
              n: "02",
              title: "Build a baseplate",
              desc: "Give your bins a place to belong. Split any grid to fit your print bed.",
              href: "/gridfinity-baseplate-generator/",
              cta: "Open baseplate generator",
              cls: "plate",
            },
            {
              icon: Layers3,
              n: "03",
              title: "Plan your drawer",
              desc: "Measure once. Arrange your bins. Download the whole print kit.",
              href: "/gridfinity-drawer-planner/",
              cta: "Open drawer planner",
              cls: "drawer",
            },
          ].map(({ icon: Icon, ...t }) => (
            <a className={`tool-card ${t.cls}`} key={t.title} href={t.href}>
              <div className="card-top">
                <span className="card-icon">
                  <Icon size={26} strokeWidth={1.5} />
                </span>
                <span className="card-number">{t.n}</span>
              </div>
              <h3>{t.title}</h3>
              <p>{t.desc}</p>
              <span className="card-link">
                {t.cta}
                <ArrowUpRight size={18} />
              </span>
            </a>
          ))}
        </div>
      </section>
      <section className="how-section">
        <div>
          <span className="eyebrow">FROM MEASUREMENTS TO MAKING</span>
          <h2>
            Your next organized drawer
            <br />
            is three steps away.
          </h2>
          <a href="/guides/print-and-fit-test/">
            New to Gridfinity? Start here <ArrowRight size={16} />
          </a>
        </div>
        <ol>
          {[
            {
              icon: Ruler,
              title: "Measure your space",
              text: "Use the inside dimensions of your drawer and your printer’s usable bed.",
            },
            {
              icon: Move,
              title: "Make it your own",
              text: "Choose sizes, add compartments, and arrange a layout that makes sense for you.",
            },
            {
              icon: Layers3,
              title: "Print a sample, then the set",
              text: "Download your STL files, check them in a slicer, and test the fit before a full print.",
            },
          ].map(({ icon: Icon, title, text }) => (
            <li key={title}>
              <Icon size={23} strokeWidth={1.4} />
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
      <div className="privacy-band">
        <LockKeyhole size={21} />
        <p>
          <strong>Your ideas stay on your workbench.</strong> Models are
          generated in your browser. No accounts, no uploads, no cloud queue.
        </p>
        <a href="/privacy/">
          How it works <ArrowUpRight size={16} />
        </a>
      </div>
    </>
  );
}
function ToolContent({ kind }: { kind: string }) {
  return (
    <section className="tool-explainer">
      <div>
        <span className="eyebrow">GOOD TO KNOW</span>
        <h2>
          {kind === "bin"
            ? "A familiar grid. A bin that’s yours."
            : kind === "plate"
              ? "Big layouts. Manageable prints."
              : "Measure the drawer, then make it work."}
        </h2>
        <p>
          {kind === "bin"
            ? "Gridfinity uses a 42 mm grid and 7 mm height units. A 2 × 3 bin has an 83.5 × 125.5 mm outer footprint, leaving a small perimeter clearance. The displayed total height is measured from the generated STL, including its rounded stacking lip."
            : kind === "plate"
              ? "A baseplate uses the full 42 mm cell pitch. Large layouts are divided at complete grid boundaries so each tile fits within your print bed and edge margin. A 6 × 9 grid on a 220 mm bed with 5 mm margins becomes four tiles: 5 × 5, 1 × 5, 5 × 4 and 1 × 4."
              : "Subtract your chosen edge clearances from the inside drawer dimensions, then divide by 42 and round down. BinFit Lab centers that grid in the remaining space. Bin positions snap to whole cells, with overlap and boundary checks before export."}
        </p>
        <p>
          These tools use the pinned Gridfinity Rebuilt model profile. Physical
          fit testing is pending; start with a small sample and an independently
          sourced reference part.
        </p>
      </div>
      <div className="explainer-links">
        <a href="/gridfinity-dimensions/">
          <Ruler size={18} />
          <span>
            Understand the dimensions
            <small>Grid pitch, height units and clearances</small>
          </span>
          <ArrowUpRight size={16} />
        </a>
        <a href="/guides/print-and-fit-test/">
          <Layers3 size={18} />
          <span>
            Before your first print
            <small>A practical slicing and fit checklist</small>
          </span>
          <ArrowUpRight size={16} />
        </a>
        <a href="/compatibility/">
          <Check size={18} />
          <span>
            What’s supported<small>Model source and validation status</small>
          </span>
          <ArrowUpRight size={16} />
        </a>
      </div>
    </section>
  );
}
function Content({ path }: { path: string }) {
  if (path === "/gridfinity-dimensions/")
    return (
      <>
        <p className="lead">
          The Gridfinity system starts with a 42 mm square. Bin footprints leave
          a small gap; baseplates keep the full grid pitch.
        </p>
        <div className="article-callout">
          <strong>Bin footprint = grid count × 42 mm − 0.5 mm</strong>
          <span>
            The 0.5 mm is removed once per overall dimension, not once per cell.
          </span>
        </div>
        <h2>Common bin footprints</h2>
        <table>
          <thead>
            <tr>
              <th>Grid size</th>
              <th>Outer width</th>
              <th>Outer depth</th>
              <th>Matching plate area</th>
            </tr>
          </thead>
          <tbody>
            {[
              [1, 1],
              [1, 2],
              [2, 2],
              [2, 3],
              [3, 3],
              [4, 2],
            ].map(([x, y]) => (
              <tr key={`${x}-${y}`}>
                <td>
                  {x} × {y}
                </td>
                <td>{x * 42 - 0.5} mm</td>
                <td>{y * 42 - 0.5} mm</td>
                <td>
                  {x * 42} × {y * 42} mm
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <h2>Height units and the stacking lip</h2>
        <p>
          One height unit (U) is 7 mm. In this profile, 3U gives 21 mm before
          the stacking lip. Rebuilt rounds the lip’s top edge, so its measured
          addition is about 3.55 mm, rather than the sharp profile’s nominal 4.4
          mm. A generated 3U lipped bin is approximately 24.55 mm tall. Use the
          exact total shown in the generator for your file.
        </p>
        <p>
          The thin baseplate is 5 mm tall, but the bin nests into it. Adding 5
          mm to the bin height gives a conservative upper bound, not an exact
          assembled height. Where clearance is tight, verify the physical
          assembly before printing the whole drawer.
        </p>
        <h2>Fitting a drawer</h2>
        <p>
          For a 287 × 410 mm drawer with a 1 mm margin on each side, usable
          space is 285 × 408 mm. It holds a 6 × 9 grid (252 × 378 mm). Centering
          leaves 17.5 mm on the left and right, and 16 mm at the front and back,
          measured from the drawer walls.
        </p>
        <h2>Millimeters and inches</h2>
        <p>
          One inch is exactly 25.4 mm. Generated STL files use millimeter
          coordinates; STL itself does not declare units. Import into your
          slicer as millimeters at 100% scale. The display unit toggle never
          scales the model.
        </p>
        <Sources />
      </>
    );
  if (path === "/guides/print-and-fit-test/")
    return (
      <>
        <p className="lead">
          A clean mesh is a starting point. A small, checked print is how you
          learn whether the model fits your printer, material and existing
          Gridfinity parts.
        </p>
        <div className="article-callout">
          <strong>Start with one bin and one plate.</strong>
          <span>
            Physical fit testing for this website is pending. The following is a
            test procedure, not a claim that a printer profile has been
            certified.
          </span>
        </div>
        <h2>1. Check the download</h2>
        <p>
          Open the STL in your slicer as millimeters at 100% scale. Compare its
          bounding dimensions to those shown in BinFit Lab. A 1 × 1 bin should
          be 41.5 mm wide; a 1 × 1 plate should be 42 mm wide. Stop if the scale
          differs.
        </p>
        <h2>2. Slice for your own printer</h2>
        <p>
          Use the manufacturer’s printer and material profile. Place the flat
          underside on the bed. Review the entire layer preview for missing
          walls, isolated islands, unexpected support and incomplete floors. If
          the slicer repairs the mesh, record its warning rather than ignoring
          it.
        </p>
        <p>
          For the external test protocol, begin with PLA, a 0.4 mm nozzle and
          0.2 mm layers on a known working printer profile. These settings
          describe the test conditions; temperature, cooling and speed still
          come from your printer and material profile.
        </p>
        <h2>3. Test against independent parts</h2>
        <ul>
          <li>
            Our bin should seat in an independently sourced Gridfinity baseplate
            without forcing it.
          </li>
          <li>An independent reference bin should seat in our baseplate.</li>
          <li>
            A 2 × 1 bin should sit across two adjacent plate tiles without
            rocking or binding.
          </li>
          <li>A second bin should stack and lift off by hand.</li>
        </ul>
        <p>
          Two parts from the same generator fitting each other does not
          establish compatibility with other Gridfinity models. Record the
          reference model’s author, source and version.
        </p>
        <h2>4. Check the drawer</h2>
        <p>
          Assemble the sample on its baseplate. Measure the height and close the
          drawer gently. Check access to contents and clearance to anything
          above the drawer. Record plate gaps, bin seating and any elephant-foot
          interference before changing a slicer compensation setting.
        </p>
        <h2>Keep a useful test record</h2>
        <p>
          Save the generated model name, model version, printer, nozzle,
          filament, slicer version and profile. Add photographs from above, from
          the side and across the seam, plus measured dimensions and a pass/fail
          result. If you adjust a parameter, repeat the same checks.
        </p>
        <p>
          <a href="/compatibility/">
            See supported features and the current validation status →
          </a>
        </p>
      </>
    );
  if (path === "/compatibility/")
    return (
      <>
        <p className="lead">
          This release uses one fixed Gridfinity profile. Supported features and
          validation evidence are kept separate so you can judge whether a model
          is suitable for your project.
        </p>
        <table>
          <thead>
            <tr>
              <th>Check</th>
              <th>Status</th>
              <th>Meaning</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Source model</td>
              <td>Version pinned</td>
              <td>Gridfinity Rebuilt, commit {MODEL_COMMIT.slice(0, 12)}</td>
            </tr>
            <tr>
              <td>Generated mesh</td>
              <td>Checked before download</td>
              <td>
                Finite coordinates, closed edges, consistent orientation,
                positive volume and requested XY dimensions
              </td>
            </tr>
            <tr>
              <td>Exported height</td>
              <td>Measured</td>
              <td>
                Bounds of the actual exported STL, including the rounded lip
              </td>
            </tr>
            <tr>
              <td>Printer/material fit</td>
              <td>Pending</td>
              <td>
                No physical fit results have been collected for this website
              </td>
            </tr>
          </tbody>
        </table>
        <h2>Recorded software checks</h2>
        <p>
          Eight representative models were compared with native OpenSCAD and
          sliced with both PrusaSlicer and Cura. Three additional boundary
          configurations were checked for mesh validity and dimensions. Four
          nominal assembly checks compare our parts with each other and with
          independently sourced reference parts, including a bin across a plate
          seam. These checks do not measure printed friction, shrinkage or fit.
        </p>
        <p>
          <a
            href={`${site.sourceUrl}/tree/codex/engine-build/validation/reports`}
          >
            Read the test settings and results →
          </a>
        </p>
        <p>
          Want to help verify real-world fit? Our small test kit contains STL
          samples, independent reference parts, a measurement sheet and a
          step-by-step test procedure. Slice it using your own printer profile.
          Send results to <a href={`mailto:${site.contact}`}>{site.contact}</a>.
        </p>
        <p>
          <a
            href={`${site.sourceUrl}/raw/refs/heads/codex/engine-build/deliverables/gridfit-fit-test-kit.zip`}
          >
            Download the physical fit test kit (ZIP) →
          </a>
        </p>
        <h2>Supported in this version</h2>
        <ul>
          <li>
            42 mm pitch; rectangular bins from 1–8 cells per axis and 2–12U
            high.
          </li>
          <li>
            Regular compartments, up to 6 per axis when each compartment has
            sufficient width; optional stacking lip.
          </li>
          <li>
            Thin, 5 mm baseplates without magnet holes, screws or connectors.
          </li>
          <li>
            Baseplate layouts up to 20 × 20 cells, split into tiles of at most 8
            × 8 cells and constrained by the usable print bed.
          </li>
          <li>
            Single-layer drawer projects with up to 100 bins, whole-cell
            placement and 90° rotation.
          </li>
          <li>
            Binary STL, project JSON and ZIP print kits. Files use millimeter
            coordinates.
          </li>
        </ul>
        <h2>Not included yet</h2>
        <p>
          Half-grid bins, arbitrary cutouts, freely positioned dividers,
          mounting holes, connection hardware, multilayer plans, STEP and GLB
          export are outside this release.
        </p>
        <h2>What a geometry check cannot prove</h2>
        <p>
          Mesh checks do not establish physical tolerances, material shrinkage,
          bed adhesion or every possible parameter combination. Export
          processing welds coordinates at 0.00001 mm, removes collapsed faces
          and simplifies the surface within 0.005 mm. Closure, dimensions and
          volume are checked again; holes are not filled. A failed mesh is
          blocked from export.
        </p>
        <p>
          Drawer exports check each generated bin against the printer bed and
          reject a bin that is already taller than the drawer. Where nesting
          determines the final clearance, the print guide explicitly asks for an
          assembled fit check.
        </p>
        <Sources />
      </>
    );
  if (path === "/privacy/")
    return (
      <>
        <p className="lead">
          Your drawer measurements, layouts and generated models are processed
          on your device.
        </p>
        <h2>Local model generation</h2>
        <p>
          Your browser downloads the site, the model library and the OpenSCAD
          engine. It then generates geometry locally in a background worker.
          This application does not send your project, dimensions or STL files
          to a model-generation server.
        </p>
        <h2>Project storage</h2>
        <p>
          The drawer planner saves the current project in your browser’s local
          storage under <code>gridfit-project-v1</code>. Anyone using the same
          browser profile may be able to see it. Clearing this site’s browser
          data deletes the local copy. Download a project JSON file if you need
          a backup or want to move it to another device.
        </p>
        <h2>Downloads and imports</h2>
        <p>
          STL, ZIP and JSON downloads are assembled in your browser. Imported
          project JSON files are read locally and checked against the supported
          format. There is no cloud account or synchronization.
        </p>
        <h2>Connections and analytics</h2>
        <p>
          The current application does not include advertising, third-party
          analytics, tracking cookies or remote fonts. The website is hosted
          with OpenAI Sites on Cloudflare. These hosting services may receive
          normal connection information such as IP address, user agent and
          requested URL when serving website assets. Contact the site maintainer
          at <a href={`mailto:${site.contact}`}>{site.contact}</a>.
        </p>
        <h2>External links</h2>
        <p>
          Source-code and reference links open other websites with their own
          policies. BinFit Lab does not control those services.
        </p>
      </>
    );
  return (
    <>
      <p className="lead">
        BinFit Lab is an independent set of tools for making modular storage fit
        real spaces: one bin, one baseplate, or an entire drawer.
      </p>
      <h2>Made for the whole workflow</h2>
      <p>
        The goal is to connect measurements to usable print files. You can
        generate a bin, split a baseplate around your printer’s bed, and
        assemble a drawer plan with a model list and quantities. Everything runs
        in your browser without an account.
      </p>
      <h2 id="open-source">Built on open source</h2>
      <p>
        Geometry comes from{" "}
        <a href="https://github.com/kennetek/gridfinity-rebuilt-openscad">
          Gridfinity Rebuilt
        </a>
        , created by Kenneth Hodson and contributors, with credit to the
        original Gridfinity work by Zack Freedman. The thin baseplate code also
        credits Arthur Moore. The browser engine is{" "}
        <a href="https://github.com/openscad/openscad-wasm">OpenSCAD WASM</a>,
        using the Manifold backend.
      </p>
      <p>
        BinFit Lab’s application code is licensed under GPL-3.0. Upstream files
        retain their original licenses and notices.{" "}
        <a href="/licenses/THIRD_PARTY_NOTICES.txt">Read third-party notices</a>
        .
      </p>
      {site.sourceUrl && (
        <p>
          <a href={site.sourceUrl}>View this website’s source code →</a>
        </p>
      )}
      <p>
        <a href={site.engineSourceUrl}>
          Download engine source and build records →
        </a>
      </p>
      <h2>Testing, with clear limits</h2>
      <p>
        We publish model provenance and check the geometry before export.
        External physical fit testing is still pending. We do not claim
        certified printer compatibility or firsthand print results that have not
        been collected.
      </p>
      <h2>Independent project</h2>
      <p>
        This website is not the official Gridfinity project and is not
        affiliated with the benchmark generator websites. Gridfinity is credited
        to its original creators.
      </p>
      {site.contact ? (
        <p>
          Contact: <a href={`mailto:${site.contact}`}>{site.contact}</a>
        </p>
      ) : (
        <p>
          This is a development preview. The public maintainer contact will be
          supplied before launch.
        </p>
      )}
    </>
  );
}
function Sources() {
  return (
    <div className="sources">
      <h2>Model sources</h2>
      <p>
        Dimensions here describe the pinned Rebuilt profile, not every
        Gridfinity variation.
      </p>
      <a
        href={`https://github.com/kennetek/gridfinity-rebuilt-openscad/tree/${MODEL_COMMIT}`}
      >
        Gridfinity Rebuilt — pinned model source ↗
      </a>
      <a href="https://gridfinity.xyz/specification/">
        Community Gridfinity specification ↗
      </a>
    </div>
  );
}
export default function SitePage({ route }: { route: Route }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const kind = "kind" in route ? route.kind : null,
    home = route.path === "/";
  const title = `${route.title} | BinFit Lab`;
  const schema = kind
    ? {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: `BinFit Lab ${route.short}`,
        url: site.origin + route.path,
        applicationCategory: "DesignApplication",
        operatingSystem: "Web browser",
        isAccessibleForFree: true,
        description: route.description,
      }
    : {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: route.title,
        url: site.origin + route.path,
        description: route.description,
      };
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={route.description} />
        <meta
          name="robots"
          content={site.publicRelease ? "index,follow" : "noindex,nofollow"}
        />
        <link rel="canonical" href={site.origin + route.path} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={route.description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={site.origin + route.path} />
        <meta name="theme-color" content="#f7f7f2" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
          }}
        />
      </Head>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header path={route.path} />
      <main id="main" className={home ? "page home" : "page"}>
        {home ? (
          <Home />
        ) : kind ? (
          <>
            <div className="tool-page-heading">
              <div>
                <span className="eyebrow">THE GRIDFIT WORKBENCH</span>
                <h1>
                  {kind === "bin"
                    ? "Small things, perfectly placed."
                    : kind === "plate"
                      ? "A solid start for every setup."
                      : "Your drawer. Your arrangement."}
                </h1>
                <p>
                  {kind === "bin"
                    ? "Dial in the dimensions. Add compartments. Make room for what matters."
                    : kind === "plate"
                      ? "Choose your grid. We’ll split it into pieces your printer can handle."
                      : "Bring your measurements. Give every little thing a place to land."}
                </p>
              </div>
              <span className="preview-badge">
                {site.releaseChannel === "beta"
                  ? "Beta · physical fit testing pending"
                  : site.releaseChannel === "stable"
                    ? "Core release"
                    : "Development preview"}
              </span>
            </div>
            <ToolNavigation kind={kind} />
            <Suspense
              fallback={
                <div className="tool-loading">Opening your workbench…</div>
              }
            >
              {mounted ? (
                kind === "drawer" ? (
                  <Planner />
                ) : (
                  <Generator kind={kind} />
                )
              ) : (
                <div className="tool-loading">
                  The interactive tool loads in your browser. Your projects
                  remain on your device.
                </div>
              )}
            </Suspense>
            <ToolContent kind={kind} />
          </>
        ) : (
          <article className="article">
            <nav className="breadcrumbs" aria-label="Breadcrumb">
              <a href="/">Home</a>
              <span>/</span>
              <span>{route.short}</span>
            </nav>
            <span className="eyebrow">THE GRIDFIT FIELD NOTES</span>
            <h1>
              {route.short === "Compatibility"
                ? "Know what you’re printing."
                : route.short === "Dimensions"
                  ? "A small grid. The right dimensions."
                  : route.short === "Print & fit guide"
                    ? "A better first print starts here."
                    : route.short === "Privacy"
                      ? "Your work stays with you."
                      : "A little more order, by design."}
            </h1>
            <Content path={route.path} />
          </article>
        )}
      </main>
      <Footer />
    </>
  );
}
