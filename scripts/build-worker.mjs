import {
  copyFileSync,
  existsSync,
  mkdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
// Pages remain prerendered; the Worker adds only the optional counter endpoint.
rmSync("dist/server", { recursive: true, force: true });
mkdirSync("dist/server", { recursive: true });
copyFileSync("worker/index.js", "dist/server/index.js");
mkdirSync("dist/.openai", { recursive: true });
if (existsSync(".openai/hosting.json"))
  copyFileSync(".openai/hosting.json", "dist/.openai/hosting.json");
else
  writeFileSync(
    "dist/.openai/hosting.json",
    JSON.stringify({ d1: "DB" }) + "\n",
  );
