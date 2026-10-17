"""4 bảng quái (Hỏa/Thổ/Kim/Mộc) -> atlas pixel thật.
Chạy từ nw/:  python3 mon/extract_mon.py [hoa tho kim moc]
Quy trình: tách nền magenta (+ăn viền hồng) -> chia hàng/ô theo vết cắt -> chỉ giữ khung cần dùng
-> về lưới pixel thật (khối BxB, màu trung vị để không lẫn viền hồng) -> alpha cứng -> bảng màu chung mỗi quái -> atlas cắt sát + neo."""
import json, sys, numpy as np
from PIL import Image
from scipy import ndimage as ndi
B = 4
NCOL = 48

# mỗi hàng: (tâm y, [vết cắt x]) ; vết cắt sẽ tự dính vào "thung lũng" gần nhất
SHEETS = {
 'hoa': dict(rows=[
   (120,[0,215,433,641,851,1059,1284,1536]),
   (295,[0,222,442,653,866,1080,1296,1536]),
   (445,[0,225,415,690,823,973,1202,1536]),
   (595,[0,222,437,630,830,1035,1283,1536]),
   (775,[0,205,400,588,830,1045,1278,1536]),
   (927,[0,1536])]),
 'tho': dict(rows=[
   (96,[0,225,426,638,872,1094,1318,1536]),
   (270,[0,231,433,662,880,1100,1316,1536]),
   (430,[0,237,433,612,768,838,985,1075,1148,1230,1335,1536]),
   (600,[0,180,369,560,762,963,1180,1355,1536]),
   (760,[0,182,358,543,707,896,1117,1334,1536]),
   (925,[0,1536])]),
 'kim': dict(rows=[
   (95,[0,235,450,664,869,1080,1296,1536]),
   (262,[0,243,452,664,877,1098,1310,1536]),
   (418,[0,226,442,807,1038,1278,1536]),
   (590,[0,212,432,648,852,1057,1288,1536]),
   (775,[0,218,443,657,869,1073,1292,1536]),
   (925,[0,1536])]),
 'moc': dict(rows=[
   (95,[0,232,430,610,810,995,1178,1357,1536]),
   (270,[0,230,428,620,825,1022,1197,1367,1536]),
   (440,[0,232,478,722,890,1072,1155,1536]),
   (620,[0,239,432,588,722,830,1100,1330,1536]),
   (795,[0,213,397,593,798,1038,1272,1536]),
   (940,[0,1536])]),
}
def rng(r,cs): return [(f'r{r}c{c}',r,c) for c in cs]
# khung cần dùng: (tên, hàng, cột, chế độ neo)  body = thân (thành phần lớn nhất) · bot = đáy giữa · mid = tâm
USE = {
 'hoa': [(n,r,c,'body') for n,r,c in rng(0,range(7))+rng(1,range(7))+rng(2,range(4))+rng(3,range(2))+rng(4,range(3,7))]
        + [(n,r,c,'mid') for n,r,c in rng(2,[4,5])] + [(n,r,c,'bot') for n,r,c in rng(3,[2,3,4])],
 'tho': [(n,r,c,'body') for n,r,c in rng(0,range(7))+rng(1,range(7))+rng(2,range(4))+rng(4,range(2))]
        + [(n,r,c,'mid') for n,r,c in rng(2,range(4,10))] + [(n,r,c,'bot') for n,r,c in rng(4,range(3,7))],
 'kim': [(n,r,c,'body') for n,r,c in rng(0,range(7))+rng(1,range(7))+rng(2,range(2))+rng(3,[1])+rng(4,range(3,7))]
        + [(n,r,c,'body') for n,r,c in rng(2,range(2,6))] + [(n,r,c,'bot') for n,r,c in rng(3,range(2,6))],
 'moc': [(n,r,c,'body') for n,r,c in rng(0,range(8))+rng(1,range(8))+rng(2,range(2))+rng(3,range(2))+rng(4,range(3,7))]
        + [(n,r,c,'mid') for n,r,c in rng(3,[2,3,4])] + [(n,r,c,'bot') for n,r,c in rng(3,range(5,8))],
}
# 'mid' / 'bot' của tho hàng 2: tho r2c4..c9 là hiệu ứng sóng đất; kim r2c2..c5 là khung húc kèm vệt chém (neo body)

YLIM = {('moc','r3c2'):648, ('moc','r3c3'):648, ('moc','r3c4'):648}   # cắt phần đất dưới đạn

def key_and_mask(path):
    im = np.array(Image.open(path).convert('RGB')).astype(np.float32)
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    near = (r > 165) & (b > 165) & (g < 120) & (np.abs(r - b) < 75)
    tint = ((np.minimum(r, b) - g) > 38) & (r > 105) & (b > 80)
    for _ in range(4):
        grow = ndi.binary_dilation(near, iterations=1) & ~near & tint
        if not grow.any(): break
        near |= grow
    return im, ~near

def assign_rows(fg, centers):
    lab, n = ndi.label(ndi.binary_dilation(fg, iterations=2))
    rowmap = np.full(fg.shape, -1, np.int8)
    cy = np.array(centers, np.float32)
    ys = np.arange(fg.shape[0])[:, None] * np.ones((1, fg.shape[1]))
    near_row = np.abs(ys[..., None] - cy[None, None, :]).argmin(2).astype(np.int8)  # theo pixel
    for i, sl in enumerate(ndi.find_objects(lab)):
        m = (lab[sl] == i + 1) & fg[sl]
        if not m.any(): continue
        h = sl[0].stop - sl[0].start
        if h <= 230:
            yy = np.where(m)[0] + sl[0].start
            r = int(np.abs(cy - yy.mean()).argmin())
            rowmap[sl][m] = r
        else:
            rowmap[sl][m] = near_row[sl][m]
    return rowmap

def snap(prof, c, w=16):
    lo, hi = max(1, c - w), min(len(prof) - 1, c + w + 1)
    if c <= 0 or c >= len(prof): return c
    return min(range(lo, hi), key=lambda x: (prof[x], abs(x - c)))

def native(crop_rgb, mask):
    """BxB: màu trung vị của các điểm đặc trong khối; alpha = phủ >= 50%."""
    h, w = mask.shape
    nh, nw = (h + B - 1) // B, (w + B - 1) // B
    pr = np.zeros((nh * B, nw * B, 3), np.float32); pm = np.zeros((nh * B, nw * B), bool)
    pr[:h, :w] = crop_rgb; pm[:h, :w] = mask
    cr = pr.reshape(nh, B, nw, B, 3).transpose(0, 2, 1, 3, 4).reshape(nh, nw, B * B, 3)
    mk = pm.reshape(nh, B, nw, B).transpose(0, 2, 1, 3).reshape(nh, nw, B * B)
    cov = mk.mean(2)
    cr = np.where(mk[..., None], cr, np.nan)
    with np.errstate(all='ignore'):
        med = np.nanmedian(cr, axis=2)
    med = np.nan_to_num(med)
    return np.dstack([med, (cov >= 0.5) * 255]).astype(np.uint8)

def build(k):
    im, fg = key_and_mask(f'mon/src_{k}.png')
    spec = SHEETS[k]; centers = [c for c, _ in spec['rows']]
    rowmap = assign_rows(fg, centers)
    frames = {}
    for (name, r, c, mode) in USE[k]:
        rm = (rowmap == r)
        prof = rm.sum(0); cuts = [snap(prof, x) for x in spec['rows'][r][1]]
        x0, x1 = cuts[c], cuts[c + 1]
        mask = rm.copy(); mask[:, :x0] = False; mask[:, x1:] = False
        if (k, name) in YLIM: mask[YLIM[(k, name)]:, :] = False
        ys, xs = np.where(mask)
        assert len(xs) > 40, (k, name, 'rỗng')
        # bỏ mảnh vụn rất nhỏ
        lab, n = ndi.label(ndi.binary_dilation(mask, iterations=2))
        keep = np.zeros_like(mask)
        for i in range(1, n + 1):
            m = (lab == i) & mask
            if m.sum() >= 25: keep |= m
        mask = keep; ys, xs = np.where(mask)
        bx0 = xs.min() - (xs.min() % B); by0 = ys.min() - (ys.min() % B)
        crop = im[by0:ys.max() + 1, bx0:xs.max() + 1]; cm = mask[by0:ys.max() + 1, bx0:xs.max() + 1]
        nat = native(crop, cm)
        ay_, ax_ = np.where(nat[..., 3] > 0)
        nat = nat[ay_.min():ay_.max() + 1, ax_.min():ax_.max() + 1]
        frames[name] = (nat, mode)
    return frames

def quantize_all(frames):
    allpx = np.concatenate([f[f[..., 3] > 0][:, :3] for f, _ in frames.values()])
    uniq = np.unique(allpx, axis=0)
    pal = Image.fromarray(uniq.reshape(-1, 1, 3).astype(np.uint8)).quantize(NCOL, method=Image.MEDIANCUT, dither=Image.NONE)
    palette = pal.getpalette()[:NCOL * 3]
    pimg = Image.new('P', (1, 1)); pimg.putpalette(palette + [0] * (768 - len(palette)))
    out = {}
    for n, (f, mode) in frames.items():
        rgb = Image.fromarray(f[..., :3], 'RGB').quantize(palette=pimg, dither=Image.NONE).convert('RGB')
        o = np.dstack([np.array(rgb), f[..., 3]]); o[o[..., 3] == 0] = 0
        out[n] = (o, mode)
    return out, len(uniq)

def anchor(f, mode):
    h, w = f.shape[:2]; a = f[..., 3] > 0
    if mode == 'mid': return w / 2.0, h / 2.0
    if mode == 'bot':
        ys, xs = np.where(a); return float(xs.mean()), float(h)
    lab, n = ndi.label(ndi.binary_dilation(a, iterations=1))
    best = max(range(1, n + 1), key=lambda i: ((lab == i) & a).sum())
    ys, xs = np.where((lab == best) & a)
    return (xs.min() + xs.max() + 1) / 2.0, float(ys.max() + 1)

def pack(k, frames):
    items = []
    for n, (f, mode) in frames.items():
        cx, cy = anchor(f, mode); items.append((n, f, cx, cy))
    items.sort(key=lambda t: -t[1].shape[0])
    AW = 320; x = y = rowh = 0; placed = {}
    for n, f, cx, cy in items:
        h, w = f.shape[:2]
        if x + w + 1 > AW: x = 0; y += rowh + 1; rowh = 0
        placed[n] = (x, y, w, h, cx, cy); x += w + 1; rowh = max(rowh, h)
    AH = y + rowh + 1; atlas = np.zeros((AH, AW, 4), np.uint8); meta = {}
    for n, f, cx, cy in items:
        sx, sy, w, h, cx_, cy_ = placed[n]
        atlas[sy:sy + h, sx:sx + w] = f
        meta[n] = [int(sx), int(sy), int(w), int(h), round(float(-cx_), 1), round(float(-cy_), 1)]
    Image.fromarray(atlas, 'RGBA').save(f'mon/atlas_{k}.png', optimize=True)
    Image.fromarray(atlas, 'RGBA').save(f'mon/atlas_{k}.webp', lossless=True, quality=100, method=6)
    json.dump(meta, open(f'mon/meta_{k}.json', 'w'), separators=(',', ':'))
    return atlas, meta

if __name__ == '__main__':
    import os
    for k in (sys.argv[1:] or list(SHEETS)):
        fr = build(k); fr, nu = quantize_all(fr); atlas, meta = pack(k, fr)
        print(k, 'khung', len(fr), 'màu duy nhất', nu, 'atlas', atlas.shape[1], atlas.shape[0], 'webp', os.path.getsize(f'mon/atlas_{k}.webp'), 'B')
        # xem trước: lưới tên khung, phóng 2x, nền xanh
        from PIL import ImageDraw
        names = list(meta); cols = 8; cw, ch = 130, 120
        sheet = Image.new('RGBA', (cols * cw, ((len(names) + cols - 1) // cols) * ch), (36, 70, 60, 255)); d = ImageDraw.Draw(sheet)
        A = Image.fromarray(atlas, 'RGBA')
        for i, n in enumerate(names):
            sx, sy, w, h, ox, oy = meta[n]; im2 = A.crop((sx, sy, sx + w, sy + h))
            s = min(2, (cw - 6) / w, (ch - 18) / h); im2 = im2.resize((max(1, int(w * s)), max(1, int(h * s))), Image.NEAREST)
            X, Y = (i % cols) * cw, (i // cols) * ch
            sheet.alpha_composite(im2, (X + 3, Y + 16)); d.text((X + 3, Y + 2), n, fill=(255, 255, 0, 255))
        sheet.convert('RGB').save(f'mon/contact_{k}.png')
