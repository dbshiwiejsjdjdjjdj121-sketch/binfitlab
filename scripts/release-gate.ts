import { readFileSync } from "node:fs";
import { site } from "../src/site";
const evidence = JSON.parse(readFileSync("validation/status.json", "utf8"));
const failures: string[] = [];
if (!/^https:\/\//.test(site.origin) || /localhost|example\./.test(site.origin))
  failures.push("Set the purchased production HTTPS domain.");
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(site.contact))
  failures.push("Set the real public maintainer contact.");
if (!/^https:\/\//.test(site.sourceUrl))
  failures.push("Set the public source repository URL.");
for (const key of [
  "browser",
  "geometry",
  "nativeComparison",
  "prusaSlicer",
  "cura",
  "correspondingSource",
])
  if (evidence[key]?.status !== "passed")
    failures.push(`${key}: verification is still pending.`);
if (!["beta", "stable"].includes(site.releaseChannel))
  failures.push("Select the beta or stable release channel explicitly.");
if (
  site.releaseChannel === "stable" &&
  evidence.physicalFit?.status !== "passed"
)
  failures.push("Stable release needs completed physical fit verification.");
if (failures.length)
  throw new Error(
    "Public release blocked:\n" + failures.map((x) => `- ${x}`).join("\n"),
  );
console.log("Public release checks passed.");
