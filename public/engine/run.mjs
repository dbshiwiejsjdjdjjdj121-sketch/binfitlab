// Adapter for the unmodified, pinned OpenSCAD WASM distribution.
import OpenSCAD from './openscad.js';
export async function renderScad(source, files, wasmBinary, log = () => {}) {
  // Emscripten 6's web build uses instantiateWasm rather than wasmBinary.
  // Compile first so a corrupt/incompatible binary rejects this task directly.
  const compiled = await WebAssembly.compile(wasmBinary);
  const app = await OpenSCAD({
    noInitialRun: true, noExitRuntime: true, print: log, printErr: log,
    instantiateWasm(imports, receive) {
      const instance = new WebAssembly.Instance(compiled, imports);
      receive(instance);
      return instance.exports;
    },
  });
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
