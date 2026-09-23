import hashlib, json, pathlib, subprocess, sys
root, output = map(pathlib.Path, sys.argv[1:])
def git(path, *args):
    return subprocess.check_output(['git', '-C', str(path), *args], text=True).strip()
records=[]
for p in [root, *sorted((root/'libs').iterdir())]:
    if not p.is_dir():
        continue
    record={'path':str(p.relative_to(root)) or '.', 'files':0}
    if (p/'.git').exists():
        record.update(commit=git(p,'rev-parse','HEAD'), origin=git(p,'remote','get-url','origin'))
        record['submodules']=git(p,'submodule','status','--recursive')
        record['patch']=git(p,'diff','--binary')
    records.append(record)
files=[]
for p in sorted(root.rglob('*')):
    if not p.is_file() or '.git' in p.parts or p.name=='cmake.tar.gz':
        continue
    files.append({'path':str(p.relative_to(root)), 'bytes':p.stat().st_size,
                  'sha256':hashlib.file_digest(p.open('rb'),'sha256').hexdigest()})
(output/'source-manifest.json').write_text(json.dumps({'sources':records,'files':files},indent=2)+'\n')
