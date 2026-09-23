import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { mkdirSync } from "node:fs";
import { createLocalUsageDB } from "./local-usage-db.mjs";
import worker from "../worker/index.js";
mkdirSync("artifacts", { recursive: true });
const DB = createLocalUsageDB("artifacts/usage-preview.sqlite");
const root = resolve("dist/client"),
  port = Number(process.env.PORT || 3000);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".wasm": "application/wasm",
  ".svg": "image/svg+xml",
  ".xml": "application/xml",
  ".txt": "text/plain",
  ".stl": "application/octet-stream",
};
createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", "http://localhost");
    if (url.pathname.startsWith("/api/")) {
      const chunks = [];
      let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 512) {
          res.writeHead(413);
          res.end();
          return;
        }
        chunks.push(chunk);
      }
      const request = new Request(`http://${req.headers.host}${req.url}`, {
        method: req.method,
        headers: req.headers,
        ...(!["GET", "HEAD"].includes(req.method)
          ? { body: Buffer.concat(chunks) }
          : {}),
      });
      const result = await worker.fetch(request, { DB });
      res.writeHead(result.status, Object.fromEntries(result.headers));
      res.end(Buffer.from(await result.arrayBuffer()));
      return;
    }
    let path = resolve(root, "." + decodeURIComponent(url.pathname));
    if (!path.startsWith(root + sep) && path !== root) {
      res.writeHead(403);
      res.end();
      return;
    }
    const info = await stat(path);
    if (info.isDirectory()) {
      if (!url.pathname.endsWith("/")) {
        res.writeHead(308, { Location: url.pathname + "/" + url.search });
        res.end();
        return;
      }
      path = resolve(path, "index.html");
    }
    const body = await readFile(path);
    res.writeHead(200, {
      "Content-Type": types[extname(path)] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    res.end(
      await readFile(resolve(root, "404.html")).catch(() => "Page not found"),
    );
  }
}).listen(port, "127.0.0.1", () =>
  console.log(`GridFit Lab preview: http://localhost:${port}`),
);
