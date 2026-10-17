"""Linh thú cưỡi #1 (Tuyết Vân Kỳ Lân) -> atlas pixel khối BLK.
Chạy từ nw/: python3 mnt/extract_m.py (đọc mnt/src.png; ghi mnt/atlas.png|webp, mnt/meta.json, mnt/preview.png)
Mỗi khung: [x,y,w,h, ax,ay, gy] — (ax,ay)= điểm ngồi (giữa yên, mặt đệm) ; gy = đường chân đất, đều tính trong khung."""
import json, os, numpy as np
from PIL import Image
from scipy import ndimage as ndi
BLK = 2
im = np.array(Image.open('mnt/src.png').convert('RGB')).astype(np.float32)
r, g, b = im[..., 0], im[..., 1], im[..., 2]
near = (r > 170) & (b > 170) & (g < 130)
tint = ((np.minimum(r, b) - g) > 38) & (r > 105) & (b > 80)
for _ in range(3):
    grow = ndi.binary_dilation(near) & ~near & tint
    if not grow.any(): break
    near |= grow
fg = ~near
fg = ndi.binary_opening(fg, structure=np.ones((2, 2))) | (fg & ndi.binary_dilation(ndi.binary_opening(fg, structure=np.ones((2, 2))), iterations=2))
BANDS = {'idle': (30, 205), 'run': (240, 405), 'fly': (452, 632), 'dash': (672, 828), 'fx': (860, 980)}
def clusters(y0, y1, gap=14):
    sub = fg[y0:y1]; lab, n = ndi.label(sub, structure=np.ones((3, 3)))
    iv = []
    for i, sl in enumerate(ndi.find_objects(lab)):
        if (lab[sl] == i + 1).sum() >= 25: iv.append([sl[1].start, sl[1].stop])
    iv.sort(); out = []
    for a, bb in iv:
        if out and a <= out[-1][1] + gap: out[-1][1] = max(out[-1][1], bb)
        else: out.append([a, bb])
    return out
def saddle(x0, x1, y0, y1):
    rr, gg, bb = r[y0:y1, x0:x1], g[y0:y1, x0:x1], b[y0:y1, x0:x1]
    m = (rr > 105) & (gg < 75) & (bb < 80) & (rr - gg > 55)
    lab, n = ndi.label(m, structure=np.ones((3, 3)))
    if n == 0: return None
    sz = ndi.sum(m, lab, range(1, n + 1)); k = int(np.argmax(sz)) + 1
    ys, xs = np.where(lab == k); return (x0 + (xs.min() + xs.max()) / 2.0, y0 + ys.min())
raw = {}   # name -> (rgb, mask, anchor info)
for band, cnt in (('idle', 6), ('run', 6), ('fly', 5), ('dash', 4)):
    y0, y1 = BANDS[band]; cl = clusters(y0, y1); assert len(cl) == cnt, (band, cl)
    raw[band] = []
    for xa, xb in cl:
        lab, n = ndi.label(fg[y0:y1, xa:xb], structure=np.ones((3, 3)))
        ys, xs = np.where(fg[y0:y1, xa:xb]); top, bot = y0 + ys.min(), y0 + ys.max() + 1
        left, right = xa + xs.min(), xa + xs.max() + 1
        sd = saddle(left, right, top, bot)
        raw[band].append(dict(box=(left, top, right, bot), sd=sd))
# chân đất theo hàng (trung vị đáy) cho idle/run ; fly/dash: seat + hằng số
seatH = []
for band in ('idle', 'run'):
    bs = [f['box'][3] for f in raw[band]]
    base = int(np.median(bs))
    for f in raw[band]: f['gy'] = base if band == 'run' else base
    for f in raw[band]: seatH.append(f['gy'] - f['sd'][1])
SH = float(np.mean(seatH))
for band in ('fly', 'dash'):
    for f in raw[band]: f['gy'] = f['sd'][1] + SH
frames = {}; anch = {}
def grab(name, left, top, right, bot, sd=None, gy=None):
    if sd is not None:   # lưới khối canh theo điểm ngồi
        x0 = int(round(sd[0])) - -(-(int(round(sd[0])) - left) // BLK) * BLK
        y0 = int(round(gy)) - -(-(int(round(gy)) - top) // BLK) * BLK
    else: x0, y0 = left, top
    w = right - x0; h = bot - y0
    nh, nw = -(-h // BLK), -(-w // BLK)
    mk = np.zeros((nh * BLK, nw * BLK), bool); rgb = np.zeros((nh * BLK, nw * BLK, 3), np.float32)
    ys0, xs0 = max(0, y0), max(0, x0)
    sub = fg[ys0:bot, xs0:right]; mk[ys0 - y0:ys0 - y0 + sub.shape[0], xs0 - x0:xs0 - x0 + sub.shape[1]] = sub
    rgb[ys0 - y0:ys0 - y0 + sub.shape[0], xs0 - x0:xs0 - x0 + sub.shape[1]] = im[ys0:bot, xs0:right]
    m = mk.reshape(nh, BLK, nw, BLK); c = rgb.reshape(nh, BLK, nw, BLK, 3)
    cov = m.mean((1, 3)); cc = np.where(m[..., None], c, np.nan)
    with np.errstate(all='ignore'):
        med = np.nanmedian(cc.transpose(0, 2, 1, 3, 4).reshape(nh, nw, BLK * BLK, 3), axis=2)
    out = np.dstack([np.nan_to_num(med), (cov >= 0.5) * 255]).astype(np.uint8)
    ys2, xs2 = np.where(out[..., 3] > 0)
    cy0, cx0 = ys2.min(), xs2.min()
    frames[name] = out[cy0:ys2.max() + 1, cx0:xs2.max() + 1]
    if sd is not None:
        anch[name] = [round((sd[0] - x0) / BLK - cx0, 1), round((sd[1] - y0) / BLK - cy0, 1), round((gy - y0) / BLK - cy0, 1)]
for band in ('idle', 'run', 'fly', 'dash'):
    for i, f in enumerate(raw[band]):
        l, t, rr_, bb_ = f['box']; grab('%s%d' % (band, i), l - 2, t - 2, rr_ + 2, bb_ + 2, f['sd'], f['gy'])
# hiệu ứng rời
y0, y1 = BANDS['fx']; cl = clusters(y0, y1, gap=6)
names = ['cloud1', 'cloud2', 'cres1', 'cres2', 'cres3', 'cres4', 'spark', 'ring', 'spike']
print('fx clusters', len(cl))
assert len(cl) == len(names), cl
for nm, (xa, xb) in zip(names, cl):
    ys, xs = np.where(fg[y0:y1, xa:xb]); grab(nm, xa + xs.min() - 1, y0 + ys.min() - 1, xa + xs.max() + 2, y0 + ys.max() + 2)
NCOL = 64
allpx = np.concatenate([f[f[..., 3] > 0][:, :3] for f in frames.values()])
uniq = np.unique(allpx, axis=0)
pal = Image.fromarray(uniq.reshape(-1, 1, 3).astype(np.uint8)).quantize(NCOL, method=Image.MEDIANCUT, dither=Image.NONE)
palette = pal.getpalette()[:NCOL * 3]
pimg = Image.new('P', (1, 1)); pimg.putpalette(palette + [0] * (768 - len(palette)))
for k, f in frames.items():
    rgb = Image.fromarray(f[..., :3], 'RGB').quantize(palette=pimg, dither=Image.NONE).convert('RGB')
    o = np.dstack([np.array(rgb), f[..., 3]]); o[o[..., 3] == 0] = 0; frames[k] = o
items = sorted(frames.items(), key=lambda t: -t[1].shape[0])
AW = 400; x = y = rowh = 0; meta = {}; placed = {}
for k, f in items:
    h, w = f.shape[:2]
    if x + w + 1 > AW: x = 0; y += rowh + 1; rowh = 0
    placed[k] = (x, y); meta[k] = [x, y, w, h] + (anch[k] if k in anch else []); x += w + 1; rowh = max(rowh, h)
AH = y + rowh + 1
atlas = np.zeros((AH, AW, 4), np.uint8)
for k, f in items:
    sx, sy = placed[k]; atlas[sy:sy + f.shape[0], sx:sx + f.shape[1]] = f
A = Image.fromarray(atlas, 'RGBA'); A.save('mnt/atlas.png', optimize=True); A.save('mnt/atlas.webp', lossless=True, quality=100, method=6)
json.dump(meta, open('mnt/meta.json', 'w'), separators=(',', ':'))
pv = Image.new('RGBA', (AW * 3, AH * 3), (70, 110, 70, 255)); pv.alpha_composite(A.resize((AW * 3, AH * 3), Image.NEAREST)); pv.convert('RGB').save('mnt/preview.png')
print('atlas', AW, AH, os.path.getsize('mnt/atlas.webp'), 'seatH(src px)', SH)
print({k: v for k, v in meta.items() if k[:4] in ('idle', 'run0', 'fly0', 'dash')})
