import { modelSchema, type Model } from "./project";
export function modelSource(input: Model): string {
  const m = modelSchema.parse(input);
  const common = "$fa=4; $fs=0.25;\n";
  if (m.kind === "plate")
    return (
      common +
      `use <rebuilt/gridfinity-rebuilt-baseplate.scad>\nuse <rebuilt/src/core/gridfinity-rebuilt-holes.scad>\ngridfinityBaseplate([${m.nx},${m.ny}],42,[0,0],0,bundle_hole_options(false,false,false,false,false,false),0,[0,0]);\n`
    );
  return (
    common +
    `include <rebuilt/src/core/standard.scad>\nuse <rebuilt/src/core/bin.scad>\nuse <rebuilt/src/core/cutouts.scad>\nuse <rebuilt/src/core/gridfinity-rebuilt-holes.scad>\nuse <rebuilt/src/helpers/grid.scad>\nuse <rebuilt/src/helpers/grid_element.scad>\nbin = new_bin([${m.nx},${m.ny}],${m.heightU * 7},include_lip=${m.lip},hole_options=bundle_hole_options(false,false,false,false,false,false));\nbin_render(bin) { bin_subdivide(bin,[${m.columns},${m.rows}]) { cut_compartment_auto(cgs(),5,false,0); } }\n`
  );
}
