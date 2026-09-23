import { mkdirSync, writeFileSync, copyFileSync } from "node:fs";
import { routes, site } from "../src/site";
if (site.publicRelease) await import("./release-gate");
mkdirSync("public", { recursive: true });
for (const name of ["manifold.js", "manifold.wasm"])
  copyFileSync(`node_modules/manifold-3d/${name}`, `public/engine/${name}`);
await import("./verify-vendor");
writeFileSync(
  "public/robots.txt",
  site.publicRelease
    ? `User-agent: *\nAllow: /\nSitemap: ${site.origin}/sitemap.xml\n`
    : "User-agent: *\nDisallow: /\n",
);
writeFileSync(
  "public/sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${site.publicRelease ? routes.map((r) => `<url><loc>${site.origin}${r.path}</loc></url>`).join("") : ""}</urlset>`,
);
writeFileSync(
  "public/_headers",
  "/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n/engine/*\n  Cache-Control: public, max-age=86400\n",
);
