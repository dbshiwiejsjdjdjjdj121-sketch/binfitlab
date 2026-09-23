// Adapter for the unmodified, pinned OpenSCAD WASM distribution.
import OpenSCAD from './openscad.js';
export async function renderScad(source, files, wasmBinary, log = () => {}) {
  const app = await OpenSCAD({ noInitialRun: true, wasmBinary, print: log, printErr: log });
  for (const [path, content] of Object.entries(files)) {
    const full = '/rebuilt/' + path;
    app.FS.mkdirTree(full.slice(0, full.lastIndexOf('/')));
    app.FS.writeFile(full, content);
  }
  app.FS.writeFile('/input.scad', source);
  const code = app.callMain(['/input.scad', '--backend=Manifold', '--export-format', 'binstl', '-o', '/model.stl']);
  if (code) throw new Error(`OpenSCAD exited with status ${code}.`);
  return app.FS.readFile('/model.stl');
}
