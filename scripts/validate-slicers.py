"""Reproducible CLI slicing checks. Outputs are QA artifacts, never printer-ready downloads."""
import json, os, pathlib, re, subprocess

ROOT = pathlib.Path(__file__).resolve().parents[1]
PRUSA = pathlib.Path(os.environ.get('PRUSA_SLICER', ROOT / 'artifacts/tooling/prusa-volume/Original Prusa Drivers/PrusaSlicer.app/Contents/MacOS/PrusaSlicer'))
CURA = pathlib.Path(os.environ.get('CURA_ENGINE', ROOT / 'artifacts/tooling/cura-volume/UltiMaker Cura.app/Contents/Frameworks/CuraEngine'))
DEFINITIONS = pathlib.Path(os.environ.get('CURA_DEFINITIONS', ROOT / 'artifacts/tooling/cura-volume/UltiMaker Cura.app/Contents/Resources/share/cura/resources/definitions'))
settings = json.loads((ROOT / 'validation/cura-test-settings.json').read_text())
models = json.loads((ROOT / 'artifacts/geometry-report.json').read_text())['results']
reports = []
for model in models:
    key = model['key']
    stl = ROOT / f'artifacts/test-kit/models/{key}.stl'
    for engine in ['prusa', 'cura']:
        outdir = ROOT / f'artifacts/slicing/{engine}'
        outdir.mkdir(parents=True, exist_ok=True)
        output = outdir / f'{key}.gcode'
        if engine == 'prusa':
            args = [str(PRUSA), '--datadir', str(ROOT / 'artifacts/tooling/prusa-data'), '--export-gcode', '--layer-height', '0.2', '--first-layer-height', '0.2', '--nozzle-diameter', '0.4', '--filament-diameter', '1.75', '--temperature', '210', '--bed-temperature', '60', '--bed-shape', '0x0,220x0,220x220,0x220', '--perimeters', '3', '--fill-density', '15%', '--center', '110,110', '--output', str(output), str(stl)]
        else:
            args = [str(CURA), 'slice', '-j', str(DEFINITIONS / 'fdmprinter.def.json')]
            for k, v in settings.items():
                args += ['-s', k + '=' + (str(v).lower() if isinstance(v, bool) else str(v))]
            args += ['-e0', '-j', str(DEFINITIONS / 'fdmextruder.def.json'), '-l', str(stl), '-o', str(output)]
        result = subprocess.run(args, capture_output=True, text=True, timeout=90)
        log = result.stdout + result.stderr
        (outdir / f'{key}.log').write_text(log)
        warnings = [s for s in log.splitlines() if re.search(r'\[warning\]|\[error\]|repair|non.manifold', s, re.I)]
        geometry_warnings = [s for s in warnings if 'reset_flow_duration' not in s]
        code = output.read_text() if output.exists() else ''
        layers = len(re.findall(r'^;LAYER_CHANGE$', code, re.M)) if engine == 'prusa' else len(re.findall(r'^;LAYER:\d+$', code, re.M))
        has_extrusions = bool(re.search(r'^G1 .*X.*E', code, re.M))
        passed = result.returncode == 0 and not geometry_warnings and has_extrusions and abs(layers * .2 - model['size'][2]) <= .41
        reports.append({'engine': engine, 'model': key, 'exitCode': result.returncode, 'layers': layers, 'expectedHeightMm': model['size'][2], 'hasExtrusions': has_extrusions, 'warnings': warnings, 'passed': passed})
        print(engine, key, 'PASS' if passed else 'FAIL', layers, geometry_warnings, flush=True)
(ROOT / 'artifacts/slicer-report.json').write_text(json.dumps({'prusaVersion':'2.9.6', 'curaEngineVersion':'5.13.0', 'conditions': 'CLI generic QA setup; PLA temperatures, 0.4 mm nozzle, 0.2 mm layers. Not a tested printer profile. G-code must not be sent to a real printer.', 'results':reports}, indent=2))
if not all(x['passed'] for x in reports):
    raise SystemExit(1)
