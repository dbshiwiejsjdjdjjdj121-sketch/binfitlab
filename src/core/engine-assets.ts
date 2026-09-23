import manifest from "../../vendor/manifest.json";

export const ENGINE_ASSET_REVISION = manifest.files
  .map((file) => file.sha256.slice(0, 12))
  .join("-");

export const ENGINE_ASSET_ROOT = `/engine/revisions/${ENGINE_ASSET_REVISION}/`;
