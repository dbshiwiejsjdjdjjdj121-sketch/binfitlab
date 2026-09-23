"""Plot actual extrusion moves for representative G-code layers (QA only)."""
import html, json, pathlib, re
root=pathlib.Path(__file__).resolve().parents[1]
engine=json.loads((root/'vendor/manifest.json').read_text())['openscadVersion']
parts=['<!doctype html><html lang="en"><meta charset="utf-8"><title>Slicer layer review</title><style>body{font:13px system-ui;padding:24px;max-width:1100px;margin:auto}section{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}svg{width:100%;height:220px;background:#f4f6ef}h2{font-size:16px;margin-top:24px}</style><h1>Independent slicer layer comparison</h1><p>Engine '+html.escape(engine)+'. Actual extrusion paths, generic QA settings; not printer-ready instructions.</p>']
for slicer in ['prusa','cura']:
 for key in ['bin-1x1-2u-1x1-lip','bin-2x1-3u-2x1-lip','plate-1x1']:
  layers={}; layer=-1; x=y=e=0.; erel=False; xyzrel=False
  for line in (root/f'artifacts/slicing/{slicer}/{key}.gcode').read_text().splitlines():
   if line==';LAYER_CHANGE':layer+=1
   if line.startswith(';LAYER:'):layer=int(line.split(':')[1])
   tokens=line.split(';')[0].split()
   if not tokens:continue
   op=tokens[0];args={m.group(1):float(m.group(2)) for t in tokens[1:] if (m:=re.fullmatch(r'([XYZE])(-?\d+(?:\.\d+)?)',t))}
   if op=='M82':erel=False
   elif op=='M83':erel=True
   elif op=='G90':xyzrel=False
   elif op=='G91':xyzrel=True
   elif op=='G92':x=args.get('X',x);y=args.get('Y',y);e=args.get('E',e)
   elif op in ['G0','G1']:
    nx=(x+args.get('X',0)) if xyzrel else args.get('X',x)
    ny=(y+args.get('Y',0)) if xyzrel else args.get('Y',y)
    ne=e+args.get('E',0) if erel else args.get('E',e)
    if layer>=0 and ne-e>1e-7 and (nx!=x or ny!=y):layers.setdefault(layer,[]).append((x,y,nx,ny))
    x,y,e=nx,ny,ne
  available=sorted(layers);selected=[available[0],available[len(available)//2],available[-1]]
  parts.append(f'<h2>{slicer}: {key}</h2><section>')
  for index in selected:
   segments=layers[index];xs=[v for s in segments for v in [s[0],s[2]]];ys=[v for s in segments for v in [s[1],s[3]]]
   xmin,ymin,xmax,ymax=min(xs)-2,min(ys)-2,max(xs)+2,max(ys)+2
   path=''.join(f'M{x:.3f},{y:.3f}L{nx:.3f},{ny:.3f}' for x,y,nx,ny in segments)
   parts.append(f'<div><p>Layer {index} · {len(segments)} extrusion moves</p><svg viewBox="{xmin} {ymin} {xmax-xmin} {ymax-ymin}"><path d="{path}" fill="none" stroke="#354c31" stroke-width="0.18"/></svg></div>')
  parts.append('</section>')
(root/'artifacts/slicing/layer-preview.html').write_text(''.join(parts))
print('Generated slice-layer preview from six current G-code files.')
