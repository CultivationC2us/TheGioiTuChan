"""Bảng linh thảo/khoáng đợt 2 (5 hệ x 4 loại x 4 khung) -> atlas pixel (khối 3x3 giống đợt 1).
Chạy từ nw/: python3 res2/extract2.py   (đọc res2/src.png; ghi res2/atlas.png, res2/meta.json, res2/preview.png)
Ảnh không có lưới pixel thật → hạ mẫu theo khối 3x3, lấy trung vị màu các điểm đặc trong khối."""
import json, numpy as np
from PIL import Image
from scipy import ndimage as ndi
BLK = 3
im = np.array(Image.open('res2/src.png').convert('RGB')).astype(np.float32)
H, W = im.shape[:2]
r, g, b = im[..., 0], im[..., 1], im[..., 2]
near = (r > 165) & (b > 165) & (g < 120) & (np.abs(r - b) < 75)
tint = ((np.minimum(r, b) - g) > 38) & (r > 105) & (b > 80)
for _ in range(4):
    grow = ndi.binary_dilation(near, iterations=1) & ~near & tint
    if not grow.any(): break
    near = near | grow
fg = ~near
BANDS = [12, 212, 411, 614, 817]
COLS = [(104, 462), (492, 834), (864, 1188), (1217, 1536)]
IDS = [['kim_ngan_hoa', 'bach_kim_thao', 'huyen_thiet_thao', 'tinh_kim_thach'],
       ['thanh_tam_thao', 'ngoc_linh_thao', 'cuu_diep_linh_chi', 'thanh_linh_moc'],
       ['tuyet_lien', 'thuy_tinh_thao', 'han_bang_thao', 'thuy_linh_thach'],
       ['hoa_lien', 'hoa_linh_chi', 'huyet_linh_thao', 'hoa_tinh_thach'],
       ['hoang_tinh_thao', 'dia_tam_thao', 'tho_linh_chi', 'hoang_tho_thach']]

def zone(s, a, bx):
    rows = fg[s:s + 190, a:bx].sum(1)
    segs = []; inb = False
    for y, v in enumerate(rows):
        if v > 0 and not inb: st = y; inb = True
        if v == 0 and inb: inb = False; segs.append((st, y))
    segs = [x for x in segs if x[1] - x[0] > 2]
    return s + segs[1][0] - 3, s + segs[1][1] + 1       # đoạn giữa = sprite (đầu = tên, cuối = chú thích)

def frames_of(x0, x1, y0, y1):
    sub = fg[y0:y1, x0:x1]
    lab, n = ndi.label(sub, structure=np.ones((3, 3)))
    comps = []
    for i, sl in enumerate(ndi.find_objects(lab)):
        area = int((lab[sl] == i + 1).sum())
        comps.append(dict(id=i + 1, area=area, x0=sl[1].start, x1=sl[1].stop, y0=sl[0].start, y1=sl[0].stop))
    big = sorted([c for c in comps if c['area'] > 600], key=lambda c: c['x0'])
    small = []
    for c in comps:
        if c['area'] > 600 or c['area'] < 12: continue
        w, h = c['x1'] - c['x0'], c['y1'] - c['y0']
        m = (lab == c['id']) & sub
        px = im[y0:y1, x0:x1][m]
        if px.size and px.min(1).mean() > 200 and 6 <= w <= 24 and h <= 18: continue   # mũi tên trắng giữa các khung
        small.append(c)
    assert len(big) == 4, (len(big), [(c['x0'], c['area']) for c in comps])
    groups = [[c] for c in big]
    for s in small:
        best, bd = None, 1e9
        for k, gp in enumerate(big):
            dx = max(gp['x0'] - s['x1'], s['x0'] - gp['x1'], 0); dy = max(gp['y0'] - s['y1'], s['y0'] - gp['y1'], 0)
            d = (dx * dx + dy * dy) ** .5
            if d < bd: best, bd = k, d
        if bd <= 22: groups[best].append(s)
    out = []
    for gp in groups:
        mask = np.isin(lab, [c['id'] for c in gp]) & sub
        ys, xs = np.where(mask)
        out.append((mask, xs.min(), xs.max() + 1, ys.min(), ys.max() + 1))
    return out

def to_native(crop_rgb, mask):
    h, w = mask.shape
    nh, nw = -(-h // BLK), -(-w // BLK)
    pad = ((0, nh * BLK - h), (0, nw * BLK - w))
    m = np.pad(mask, pad).reshape(nh, BLK, nw, BLK).astype(bool)
    c = np.pad(crop_rgb, pad + ((0, 0),)).reshape(nh, BLK, nw, BLK, 3)
    cov = m.mean((1, 3))
    cc = np.where(m[..., None], c, np.nan)
    med = np.nanmedian(cc.transpose(0, 2, 1, 3, 4).reshape(nh, nw, BLK * BLK, 3), axis=2)
    out = np.dstack([np.nan_to_num(med), (cov >= 0.5) * 255]).astype(np.uint8)
    return out

frames = {}
for ri, s in enumerate(BANDS):
    for ci, (a, bx) in enumerate(COLS):
        y0, y1 = zone(s, a, bx)
        for i, (mask, fx0, fx1, fy0, fy1) in enumerate(frames_of(a, bx, y0, y1)):
            crop = im[y0 + fy0:y0 + fy1, a + fx0:a + fx1]
            nat = to_native(crop, mask[fy0:fy1, fx0:fx1])
            ys, xs = np.where(nat[..., 3] > 0)
            frames[(IDS[ri][ci], i)] = nat[ys.min():ys.max() + 1, xs.min():xs.max() + 1]

NCOL = 96
allpx = np.concatenate([f[f[..., 3] > 0][:, :3] for f in frames.values()])
uniq = np.unique(allpx, axis=0)
pal = Image.fromarray(uniq.reshape(-1, 1, 3).astype(np.uint8)).quantize(NCOL, method=Image.MEDIANCUT, dither=Image.NONE)
palette = pal.getpalette()[:NCOL * 3]
pimg = Image.new('P', (1, 1)); pimg.putpalette(palette + [0] * (768 - len(palette)))
def quant(f):
    rgb = Image.fromarray(f[..., :3], 'RGB').quantize(palette=pimg, dither=Image.NONE).convert('RGB')
    o = np.dstack([np.array(rgb), f[..., 3]]); o[o[..., 3] == 0] = 0
    return o
for k in frames: frames[k] = quant(frames[k])

def base_anchor(f):
    ys, xs = np.where(f[..., 3] > 0); bot = ys.max(); sel = xs[ys >= bot - 3]
    return float(sel.mean()), bot + 1
items = []
for (name, i), f in frames.items():
    h, w = f.shape[:2]; cx, by = base_anchor(f)
    if i == 3: cx = w / 2.0
    items.append(((name, i), f, cx, by))
items.sort(key=lambda t: -t[1].shape[0])
AW = 360; x = y = rowh = 0; placed = {}
for key_, f, cx, by in items:
    h, w = f.shape[:2]
    if x + w + 1 > AW: x = 0; y += rowh + 1; rowh = 0
    placed[key_] = (x, y, w, h, cx, by); x += w + 1; rowh = max(rowh, h)
AH = y + rowh + 1
atlas = np.zeros((AH, AW, 4), np.uint8); meta = {}
for key_, f, cx, by in items:
    sx, sy, w, h, cx_, by_ = placed[key_]
    atlas[sy:sy + h, sx:sx + w] = f
    meta.setdefault(key_[0], [None] * 4)[key_[1]] = [int(sx), int(sy), int(w), int(h), round(float(-cx_), 1), int(-by_)]
Image.fromarray(atlas, 'RGBA').save('res2/atlas.png', optimize=True)
json.dump(meta, open('res2/meta.json', 'w'), ensure_ascii=False, separators=(',', ':'))
pv = Image.new('RGBA', (AW * 3, AH * 3), (36, 70, 60, 255))
pv.alpha_composite(Image.fromarray(atlas, 'RGBA').resize((AW * 3, AH * 3), Image.NEAREST)); pv.convert('RGB').save('res2/preview.png')
print('atlas', AW, AH, len(frames))
for k, v in meta.items(): print(k, [(f[2], f[3]) for f in v])
