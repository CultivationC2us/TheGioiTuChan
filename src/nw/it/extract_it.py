"""Bảng vật phẩm (vũ khí / cuộn / sách / ngọc-bình-túi) -> atlas pixel khối 4x4.
Chạy từ nw/: python3 it/extract_it.py  (đọc it/src.png; ghi it/atlas.png, it/meta.json, it/preview.png)
Ảnh không có lưới pixel thật → hạ mẫu 4x4 bằng trung vị màu các điểm đặc trong khối. Áo/mũ/giày (3 hàng trên) chưa dùng."""
import json, numpy as np
from PIL import Image
from scipy import ndimage as ndi
BLK = 4
im = np.array(Image.open('it/src.png').convert('RGB')).astype(np.float32)
r, g, b = im[..., 0], im[..., 1], im[..., 2]
near = (r > 165) & (b > 165) & (g < 120) & (np.abs(r - b) < 75)
tint = ((np.minimum(r, b) - g) > 38) & (r > 105) & (b > 80)
for _ in range(4):
    grow = ndi.binary_dilation(near, iterations=1) & ~near & tint
    if not grow.any(): break
    near = near | grow
fg = ~near
ROWS = [('w', 495, 730, 3, 12), ('s', 728, 868, 0, 11), ('m', 870, 1024, 1, 13)]
names = {'w': ['w%d' % i for i in range(1, 13)], 's': ['s%d' % i for i in range(1, 12)],
         'm': ['b1', 'b2', 'b3', 'b4', 'b5', 'o1', 'o2', 'o3', 'o4', 'o5', 'bag', 'p1', 'p2']}
frames = {}
for key, ya, yb, d, cnt in ROWS:
    sub = fg[ya:yb]
    lab, n = ndi.label(ndi.binary_dilation(sub, iterations=d) if d else sub, structure=np.ones((3, 3)))
    comps = []
    for i, sl in enumerate(ndi.find_objects(lab)):
        if int((lab[sl] == i + 1).sum()) > 1500: comps.append((sl[1].start, i + 1, sl))
    comps.sort(key=lambda c: c[0]); assert len(comps) == cnt, (key, len(comps))
    for (x0, lid, sl), nm in zip(comps, names[key]):
        mask = (lab == lid) & sub
        ys, xs = np.where(mask); y0, y1, xa, xb = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        rgb = im[ya + y0:ya + y1, xa:xb]; mk = mask[y0:y1, xa:xb]
        h, w = mk.shape; nh, nw = -(-h // BLK), -(-w // BLK)
        pad = ((0, nh * BLK - h), (0, nw * BLK - w))
        m = np.pad(mk, pad).reshape(nh, BLK, nw, BLK).astype(bool)
        c = np.pad(rgb, pad + ((0, 0),)).reshape(nh, BLK, nw, BLK, 3)
        cov = m.mean((1, 3)); cc = np.where(m[..., None], c, np.nan)
        med = np.nanmedian(cc.transpose(0, 2, 1, 3, 4).reshape(nh, nw, BLK * BLK, 3), axis=2)
        out = np.dstack([np.nan_to_num(med), (cov >= 0.5) * 255]).astype(np.uint8)
        ys2, xs2 = np.where(out[..., 3] > 0)
        frames[nm] = out[ys2.min():ys2.max() + 1, xs2.min():xs2.max() + 1]
NCOL = 112
allpx = np.concatenate([f[f[..., 3] > 0][:, :3] for f in frames.values()])
uniq = np.unique(allpx, axis=0)
pal = Image.fromarray(uniq.reshape(-1, 1, 3).astype(np.uint8)).quantize(NCOL, method=Image.MEDIANCUT, dither=Image.NONE)
palette = pal.getpalette()[:NCOL * 3]
pimg = Image.new('P', (1, 1)); pimg.putpalette(palette + [0] * (768 - len(palette)))
for k, f in frames.items():
    rgb = Image.fromarray(f[..., :3], 'RGB').quantize(palette=pimg, dither=Image.NONE).convert('RGB')
    o = np.dstack([np.array(rgb), f[..., 3]]); o[o[..., 3] == 0] = 0; frames[k] = o
items = sorted(frames.items(), key=lambda t: -t[1].shape[0])
AW = 420; x = y = rowh = 0; meta = {}; placed = {}
for k, f in items:
    h, w = f.shape[:2]
    if x + w + 1 > AW: x = 0; y += rowh + 1; rowh = 0
    placed[k] = (x, y); meta[k] = [x, y, w, h]; x += w + 1; rowh = max(rowh, h)
AH = y + rowh + 1
atlas = np.zeros((AH, AW, 4), np.uint8)
for k, f in items:
    sx, sy = placed[k]; atlas[sy:sy + f.shape[0], sx:sx + f.shape[1]] = f
Image.fromarray(atlas, 'RGBA').save('it/atlas.png', optimize=True)
Image.fromarray(atlas, 'RGBA').save('it/atlas.webp', lossless=True, quality=100, method=6)
json.dump(meta, open('it/meta.json', 'w'), separators=(',', ':'))
pv = Image.new('RGBA', (AW * 2, AH * 2), (36, 70, 60, 255)); pv.alpha_composite(Image.fromarray(atlas, 'RGBA').resize((AW * 2, AH * 2), Image.NEAREST)); pv.convert('RGB').save('it/preview.png')
import os; print('atlas', AW, AH, os.path.getsize('it/atlas.webp'))
print({k: (v[2], v[3]) for k, v in meta.items()})
