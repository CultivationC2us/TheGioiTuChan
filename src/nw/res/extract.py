"""Bảng tài nguyên (14 nhóm x 4 khung) -> atlas pixel thật.
Chạy: python3 res/extract.py   (đọc res/src.png, ghi res/atlas.png, res/meta.json, res/preview.png)
Quy trình giống Thủy Long: tách nền magenta -> loại nhãn/chú thích -> tìm lưới 3x3 gốc -> về pixel thật
-> alpha cứng -> quantize chung -> atlas cắt sát (trimmed)."""
import json, numpy as np
from PIL import Image
from scipy import ndimage as ndi

SRC = 'res/src.png'
BLK = 3                      # khối pixel gốc 3x3 (đo được: chu kỳ 3.0)
im = np.array(Image.open(SRC).convert('RGB')).astype(np.float32)
H, W = im.shape[:2]
r, g, b = im[..., 0], im[..., 1], im[..., 2]

# ---------- 1) tách nền magenta: chỉ magenta thuần (r,b cao, g thấp, r~b) — tím/hồng của sprite không bị nhầm ----------
near = (r > 165) & (b > 165) & (g < 120) & (np.abs(r - b) < 75)
# ăn dần viền hồng (điểm pha magenta + viền tối): chỉ lấn vào điểm còn ngả hồng, dừng ở viền tối thật
tint = ((np.minimum(r, b) - g) > 38) & (r > 105) & (b > 80)
for _ in range(4):
    grow = ndi.binary_dilation(near, iterations=1) & ~near & tint
    if not grow.any(): break
    near = near | grow
alpha = (~near).astype(np.float32)
col = im.copy()
RGBA = np.dstack([col, alpha * 255])

fg = alpha > 0.5
# ---------- 2) nhóm: (id, x0, x1, y0, y1) — vùng chỉ chứa sprite (không nhãn, không chú thích) ----------
A, B_, C = (0, 548), (548, 1086), (1088, 1536)
R1, R2, R3, R4 = (52, 223), (306, 414), (493, 604), (679, 792)
GROUPS = [
    ('cay_coi', *A, *R1), ('cay_cao', *B_, *R1), ('tre', *C, *R1),
    ('da', *A, *R2), ('quang_kim', *B_, *R2), ('linh_thach', *C, *R2),
    ('thao_duoc', *A, *R3), ('thao_quy', *B_, *R3), ('nam_linh_chi', *C, *R3),
    ('hoa_linh', *A, *R4), ('co_linh_chi', *B_, *R4), ('thuoc_hiem', *C, *R4),
    ('go_dac_biet', 0, 548, 852, 988), ('da_linh', 548, 1062, 858, 988),
]

def frames_of(x0, x1, y0, y1):
    """4 khung của một nhóm: thành phần lớn + tia sáng nhỏ gần nhất."""
    sub = fg[y0:y1, x0:x1]
    lab, n = ndi.label(ndi.binary_dilation(sub, iterations=2))
    objs = ndi.find_objects(lab)
    comps = []
    for i, sl in enumerate(objs):
        area = int((lab[sl] == i + 1).sum())
        comps.append(dict(id=i + 1, area=area, x0=sl[1].start, x1=sl[1].stop, y0=sl[0].start, y1=sl[0].stop))
    big = sorted([c for c in comps if c['area'] > 1200], key=lambda c: c['x0'])
    small = [c for c in comps if c['area'] <= 1200 and c['area'] >= 25]
    assert len(big) == 4, (len(big), [(c['x0'], c['area']) for c in comps])
    groups = [[c] for c in big]
    for s in small:  # gán tia sáng cho khung gần nhất (theo khoảng cách hộp)
        best, bd = None, 1e9
        for k, gp in enumerate(big):
            dx = max(gp['x0'] - s['x1'], s['x0'] - gp['x1'], 0)
            dy = max(gp['y0'] - s['y1'], s['y0'] - gp['y1'], 0)
            d = (dx * dx + dy * dy) ** .5
            if d < bd: best, bd = k, d
        if bd <= 22: groups[best].append(s)
    out = []
    for gp in groups:
        mask = np.isin(lab, [c["id"] for c in gp]) & sub
        ys, xs = np.where(mask)
        out.append((mask, xs.min(), xs.max() + 1, ys.min(), ys.max() + 1))
    return out

def to_native(rgba_crop, mask_crop):
    """Về lưới pixel thật: dò pha (0..2) cho từng trục rồi lấy trung bình premultiplied mỗi khối 3x3."""
    h, w = mask_crop.shape
    a = rgba_crop[..., 3:4] / 255.0 * mask_crop[..., None]
    pm = np.dstack([rgba_crop[..., :3] * a, a[..., 0]])
    edge = np.abs(np.diff(rgba_crop[..., :3], axis=1)).sum(2) * (mask_crop[:, 1:] > 0)
    edgey = np.abs(np.diff(rgba_crop[..., :3], axis=0)).sum(2) * (mask_crop[1:, :] > 0)
    px = max(range(BLK), key=lambda p: sum(edge[:, k].sum() for k in range(w - 1) if (k + 1 - p) % BLK == 0))
    py = max(range(BLK), key=lambda p: sum(edgey[k, :].sum() for k in range(h - 1) if (k + 1 - p) % BLK == 0))
    # pha: biên khối nằm ở cột (px + 3k)
    x0 = px if px > 0 else 0
    y0 = py if py > 0 else 0
    nw, nh = (w - x0) // BLK, (h - y0) // BLK
    # khối bắt đầu sớm một khối nếu còn dư phía trước
    pre_x = 1 if x0 >= 1 and BLK - x0 <= 0 else 0
    nh = max(nh, 1); nw = max(nw, 1)
    cr = rgba_crop[y0:y0 + nh * BLK, x0:x0 + nw * BLK, :3].reshape(nh, BLK, nw, BLK, 3)
    mk = mask_crop[y0:y0 + nh * BLK, x0:x0 + nw * BLK].reshape(nh, BLK, nw, BLK)
    cov = mk.mean((1, 3))
    center = cr[:, BLK // 2, :, BLK // 2, :]                       # pixel giữa khối
    cen_ok = mk[:, BLK // 2, :, BLK // 2] > 0
    # nếu pixel giữa trong suốt (biên): lấy trung bình các pixel đặc của khối
    wsum = np.maximum(mk.sum((1, 3)), 1)[..., None]
    avg = (cr * mk[..., None]).sum((1, 3)) / wsum
    rgb = np.where(cen_ok[..., None], center, avg)
    out = np.dstack([rgb, (cov >= 0.5) * 255]).astype(np.uint8)
    return out, (px, py)

frames = {}   # (group, i) -> ndarray RGBA (native)
for name, x0, x1, y0, y1 in GROUPS:
    for i, (mask, fx0, fx1, fy0, fy1) in enumerate(frames_of(x0, x1, y0, y1)):
        crop = RGBA[y0 + fy0:y0 + fy1, x0 + fx0:x0 + fx1]
        mk = mask[fy0:fy1, fx0:fx1].astype(np.float32)
        nat, ph = to_native(crop, mk)
        # cắt sát
        ys, xs = np.where(nat[..., 3] > 0)
        nat = nat[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
        frames[(name, i)] = nat

# ---------- 3) quantize chung (median cut), alpha cứng ----------
NCOL = 64
allpx = np.concatenate([f[f[..., 3] > 0][:, :3] for f in frames.values()])
uniq = np.unique(allpx, axis=0)                 # mỗi màu một phiếu → màu hiếm (vàng, tím) không bị nuốt
print('màu duy nhất:', len(uniq))
pal_img = Image.fromarray(uniq.reshape(-1, 1, 3).astype(np.uint8))
pal = pal_img.quantize(NCOL, method=Image.MEDIANCUT, dither=Image.NONE)
palette = pal.getpalette()[:NCOL * 3]
pimg = Image.new('P', (1, 1)); pimg.putpalette(palette + [0] * (768 - len(palette)))
def quant(f):
    rgb = Image.fromarray(f[..., :3], 'RGB').quantize(palette=pimg, dither=Image.NONE).convert('RGB')
    o = np.dstack([np.array(rgb), f[..., 3]])
    o[o[..., 3] == 0] = 0
    return o
for k in frames: frames[k] = quant(frames[k])

# ---------- 4) neo + packing (shelf) ----------
def base_anchor(f):
    """tâm ngang = trung bình x của 4 hàng pixel dưới cùng; đáy = hàng cuối."""
    ys, xs = np.where(f[..., 3] > 0)
    bot = ys.max()
    sel = xs[ys >= bot - 3]
    return float(sel.mean()), bot + 1

items = []
for (name, i), f in frames.items():
    h, w = f.shape[:2]
    cx, by = base_anchor(f)
    if i == 3:       # icon vật phẩm: neo giữa-đáy
        cx = w / 2.0
    items.append(((name, i), f, cx, by))
items.sort(key=lambda t: -t[1].shape[0])
AW = 360
x = y = rowh = 0
placed = {}
for key_, f, cx, by in items:
    h, w = f.shape[:2]
    if x + w + 1 > AW: x = 0; y += rowh + 1; rowh = 0
    placed[key_] = (x, y, w, h, cx, by)
    x += w + 1; rowh = max(rowh, h)
AH = y + rowh + 1
atlas = np.zeros((AH, AW, 4), np.uint8)
meta = {}
for key_, f, cx, by in items:
    sx, sy, w, h, cx_, by_ = placed[key_]
    atlas[sy:sy + h, sx:sx + w] = f
    # ox, oy: vị trí góc trái-trên của sprite so với điểm neo (đáy-giữa), đơn vị pixel gốc
    meta.setdefault(key_[0], [None] * 4)[key_[1]] = [int(sx), int(sy), int(w), int(h), round(float(-cx_), 1), int(-by_)]
Image.fromarray(atlas, 'RGBA').save('res/atlas.png', optimize=True)
json.dump(meta, open('res/meta.json', 'w'), ensure_ascii=False, separators=(',', ':'))

# xem trước (nền xanh, phóng 3x, lưới theo nhóm)
pv = Image.new('RGBA', (AW * 3, AH * 3), (36, 70, 60, 255))
pv.alpha_composite(Image.fromarray(atlas, 'RGBA').resize((AW * 3, AH * 3), Image.NEAREST))
pv.convert('RGB').save('res/preview.png')
print('atlas', AW, AH, 'frames', len(frames), 'colors', NCOL)
for k, v in meta.items(): print(k, [(f[2], f[3]) for f in v])
