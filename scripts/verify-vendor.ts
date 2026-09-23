import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
const manifest = JSON.parse(readFileSync("vendor/manifest.json", "utf8"));
for (const file of manifest.files) {
  const bytes = readFileSync(file.path);
  if (
    bytes.length !== file.bytes ||
    createHash("sha256").update(bytes).digest("hex") !== file.sha256
  )
    throw new Error(
      `Pinned asset changed: ${file.path}. Review and revalidate before updating the manifest.`,
    );
}
console.log(`${manifest.files.length} pinned engine assets verified.`);
