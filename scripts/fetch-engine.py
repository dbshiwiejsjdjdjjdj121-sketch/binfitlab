"""Fetch the unchanged official development engine; verify every byte before use."""
import hashlib, io, json, pathlib, urllib.request, zipfile
root = pathlib.Path(__file__).resolve().parents[1]
manifest = json.loads((root / 'vendor/manifest.json').read_text())
blob = urllib.request.urlopen(manifest['archiveUrl'], timeout=60).read()
if hashlib.sha256(blob).hexdigest() != manifest['archiveSha256']:
    raise SystemExit('Official engine archive checksum mismatch; nothing was installed.')
archive = zipfile.ZipFile(io.BytesIO(blob))
verified = []
for filename in ['openscad.js', 'openscad.wasm']:
    matches = [p for p in archive.namelist() if pathlib.PurePosixPath(p).name == filename]
    if len(matches) != 1:
        raise SystemExit(f'Unexpected archive structure for {filename}.')
    data = archive.read(matches[0])
    expected = next(x for x in manifest['files'] if x['path'] == 'public/engine/' + filename)
    if len(data) != expected['bytes'] or hashlib.sha256(data).hexdigest() != expected['sha256']:
        raise SystemExit(f'Engine checksum mismatch: {filename}. Nothing was installed.')
    verified.append((root / expected['path'], data))
for path, data in verified:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
print('Pinned official development engine downloaded and verified.')
