export const site = {
  name: "BinFit Lab",
  origin: process.env.NEXT_PUBLIC_SITE_URL || "https://binfitlab.com",
  publicRelease: process.env.NEXT_PUBLIC_PUBLIC_RELEASE === "true",
  releaseChannel: process.env.NEXT_PUBLIC_RELEASE_CHANNEL || "preview",
  contact: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "yiwangyuai@gmail.com",
  sourceUrl:
    process.env.NEXT_PUBLIC_SOURCE_URL ||
    "https://github.com/dbshiwiejsjdjdjjdj121-sketch/binfitlab",
};
export const routes = [
  {
    path: "/",
    title: "Gridfinity tools for a better-fitting drawer",
    description:
      "Make Gridfinity bins, split baseplates for your printer, and plan an entire drawer. Free, local tools with real STL downloads.",
    short: "Home",
  },
  {
    path: "/gridfinity-bin-generator/",
    title: "Gridfinity Bin Generator — Free Local STL Downloads",
    description:
      "Generate Gridfinity bins with integer grid sizes, compartments and optional stacking lips. Preview the actual STL and measure its dimensions before downloading.",
    short: "Bin generator",
    kind: "bin",
  },
  {
    path: "/gridfinity-baseplate-generator/",
    title: "Gridfinity Baseplate Generator — Split to Fit Your Printer",
    description:
      "Generate Gridfinity baseplates and split large grids into printable tiles. Download STL files, quantities and a labeled assembly map.",
    short: "Baseplate generator",
    kind: "plate",
  },
  {
    path: "/gridfinity-drawer-planner/",
    title: "Gridfinity Drawer Planner — Layout, Bins & Print Kit",
    description:
      "Plan a single-layer Gridfinity drawer using your inside measurements. Arrange bins, check overlaps and download a complete local print kit.",
    short: "Drawer planner",
    kind: "drawer",
  },
  {
    path: "/gridfinity-dimensions/",
    title: "Gridfinity Dimensions — 42 mm Grid, Bin Sizes & Height",
    description:
      "Understand 42 mm grid pitch, 7 mm height units, real bin dimensions, baseplates and why stacking lips change total height.",
    short: "Dimensions",
  },
  {
    path: "/guides/print-and-fit-test/",
    title: "Gridfinity Print & Fit Test — A Practical Checklist",
    description:
      "Check an exported STL, slice a small sample and test it against reference Gridfinity parts before printing a full drawer.",
    short: "Print & fit guide",
  },
  {
    path: "/compatibility/",
    title: "BinFit Lab Compatibility & Validation Status",
    description:
      "See the supported Gridfinity profile, model source, mesh checks and physical fit testing status. Understand what has and has not been verified.",
    short: "Compatibility",
  },
  {
    path: "/about/",
    title: "About BinFit Lab — Open Source Organization Tools",
    description:
      "Independent, open-source Gridfinity tools for bins, baseplates and drawer layouts, built on Gridfinity Rebuilt and OpenSCAD.",
    short: "About",
  },
  {
    path: "/privacy/",
    title: "Privacy — Your BinFit Lab Designs Stay on Your Device",
    description:
      "How BinFit Lab handles local project storage, generated models and downloads, without accounts or cloud model processing.",
    short: "Privacy",
  },
] as const;
export type Route = (typeof routes)[number];
