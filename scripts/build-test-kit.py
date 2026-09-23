"""Prepare the small external print/fit handoff; no G-code or paid orders."""
import csv, hashlib, io, json, pathlib, shutil, zipfile
ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / 'deliverables/gridfit-fit-test-kit'
OUT.mkdir(parents=True, exist_ok=True)
for sub in ['models', 'reference', 'licenses', 'reports']:
    (OUT / sub).mkdir(exist_ok=True)
items = [
    ('A', 'models/bin-1x1-2u-1x1-lip.stl', 2, 'Our small bin; print two for stacking'),
    ('B', 'models/bin-2x1-3u-2x1-lip.stl', 1, 'Our divided bin; spans a seam between plates'),
    ('C', 'models/plate-1x1.stl', 2, 'Our plates; place side by side'),
    ('R1', 'reference/reference-bin-1x1-2u.stl', 1, 'Independent vector76 reference bin'),
    ('R2', 'reference/reference-plate-1x1.stl', 1, 'Independent vector76 reference plate'),
]
rows = []
for label, path, qty, purpose in items:
    source = ROOT / 'artifacts/test-kit' / path
    shutil.copyfile(source, OUT / path)
    rows.append({'label':label,'file':path,'quantity':qty,'purpose':purpose,'sha256':hashlib.sha256(source.read_bytes()).hexdigest()})
(OUT / 'manifest.json').write_text(json.dumps({'units':'mm','scale':'100%','status':'Physical tests pending','models':rows,'rebuiltCommit':'910e22d8607fd7f5f51ad5e5cbc5287a76810bfd','referenceSource':'https://github.com/vector76/gridfinity_openscad/tree/0e7308cd8fc7fb4191aa69d81175a90d10de751c','referenceLicense':'MIT, Copyright (c) 2022 Jamie'}, indent=2))
with (OUT / 'print-list.csv').open('w') as f:
    writer = csv.DictWriter(f, fieldnames=['label','file','quantity','purpose','sha256']);writer.writeheader();writer.writerows(rows)
shutil.copyfile(ROOT / 'vendor/rebuilt/LICENSE', OUT / 'licenses/REBUILT-MIT.txt')
shutil.copyfile(ROOT / 'vendor/reference-vector76/LICENSE', OUT / 'licenses/REFERENCE-MIT.txt')
for report in ['geometry-report.json','native-comparison.json','slicer-report.json']:
    shutil.copyfile(ROOT / 'artifacts' / report, OUT / 'reports' / report)
shutil.copytree(ROOT / 'vendor/reference-vector76', OUT / 'reference/source', dirs_exist_ok=True)
instructions = '''# GridFit Lab external fit test / 外部实物配合测试

This is a test kit, not a statement of certified compatibility. 这是待验证的样件包。

## Print list / 打印数量

Seven parts in total: A × 2, B × 1, C × 2, R1 × 1, R2 × 1. See print-list.csv.
共 7 个零件。A 是自有小盒，B 是跨拼缝分隔盒，C 是自有底板，R1/R2 来自独立参考实现。

Use STL coordinates as millimeters at 100% scale; flat undersides on the bed.
请按毫米、100% 比例导入，底面朝下。不要为了“能够配上”私自缩放模型。

Requested starting conditions: a known working FDM printer, PLA, 0.4 mm nozzle,
0.2 mm layers, 3 perimeters and 15% infill. Use the printer/material's known
profile for temperatures, cooling and speed; record all settings. Preview all
layers before printing. Report any mesh repair, missing walls or unusual support.
建议从已调试正常的 FDM 打印机、PLA、0.4 mm 喷嘴、0.2 mm 层高、3 圈墙和 15% 填充开始。
温度、风扇和速度使用该机器和材料的成熟配置，并记录。先检查切片各层。

## Pass/fail checklist / 验收步骤

1. Measure A and C: expected XY A = 41.5 × 41.5 mm; C = 42 × 42 mm.
   Record actual dimensions; do not assume nominal dimensions are achieved.
   记录实际尺寸，检查翘曲、象脚及底部完整性。
2. Seat A in R2. It should insert and lift out by hand, without tools or forcing.
   自有盒 A 放入参考底板 R2，手动可放入、可取出，无需强压或工具。
3. Seat R1 in C. Repeat the same check. 参考盒 R1 放入自有底板 C，检查同上。
4. Stack A on A, then lift it off. 两个 A 堆叠，检查就位、偏移和取出。
5. Place the two C plates edge to edge, then seat B across the seam.
   Check that neither tile lifts and the bin does not bind or noticeably rock.
   两个 C 并排，B 跨拼缝放置，检查翘起、卡住、明显摇晃和拼缝间距。
6. Assemble a bin and plate, measure total height, then try a real drawer.
   Close gently and check the top clearance and access to contents.
   测量组合后的总高，再放入真实抽屉检查关闭和取物空间。

Photograph each test from above and from the side, including the seam. Retain
failed samples and describe failures; do not silently sand, scale or modify them.
每项测试拍俯视和侧面照片，拼缝额外近拍。保留失败样件，不要未记录就打磨或改比例。

Record printer, nozzle, material/brand, slicer/version, complete profile, changes,
model label, measured dimensions, assembled height, pass/fail and photo names in
test-results.csv. This kit contains NO printer-specific G-code.
填写 test-results.csv；本包不含可直接发给打印机的 G-code。

The independent reference models are generated unchanged from vector76's
OpenSCAD implementation with a 1 × 1 footprint, 2U reference bin, no magnet or
screw holes. Reference source and MIT license are included. These references
have not themselves been physically tested by this project; if you already own
a known-working Gridfinity bin/baseplate, please repeat tests with those too and
record their source.
参考模型同样尚未由本项目实物验证。如已有配合正常的 Gridfinity 零件，请追加交叉测试并记录来源。
'''
(OUT / 'START-HERE.md').write_text(instructions)
fields = ['test_id','model_labels','printer','nozzle_mm','filament','slicer_version','profile','actual_width_mm','actual_depth_mm','actual_height_mm','assembled_height_mm','pass_fail','notes','photo_files']
with (OUT / 'test-results.csv').open('w') as f:
    writer=csv.DictWriter(f,fieldnames=fields);writer.writeheader()
    for i in range(1,7):writer.writerow({'test_id':i,'pass_fail':'NOT RUN'})
(OUT / 'QUOTE-REQUEST.txt').write_text('询价模板（尚未发送）\n\n你好，附件是 Gridfinity 配合测试包，共 7 个 PLA 样件。请按 START-HERE.md 和 print-list.csv 报价，拆分打印、配合测试/测量/照片、运费，注明预计工期、打印机、喷嘴及切片软件。切片需按毫米、100% 原比例导入，不要自动缩放或打磨。请先报价，不要直接生产。收货信息和最终付款将由委托人另行确认。\n\nThis is a quote request, not a production order. Please quote seven PLA parts plus the documented fit tests, measurements, photographs and delivery separately. Confirm lead time, printer, nozzle and slicer. Do not print before the customer approves the quote.\n')
archive = ROOT / 'deliverables/gridfit-fit-test-kit.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
    for p in OUT.rglob('*'):
        if p.is_file():z.write(p,p.relative_to(OUT))
print(archive, archive.stat().st_size)
