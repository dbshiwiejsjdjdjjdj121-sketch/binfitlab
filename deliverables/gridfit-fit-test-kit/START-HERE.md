# GridFit Lab external fit test / 外部实物配合测试

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
