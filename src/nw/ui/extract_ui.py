"""Cắt khung giao diện từ ảnh mẫu (ui/mock.png, 1536x1024) -> các mảnh PNG/WEBP có alpha.
Chạy từ nw/: python3 ui/extract_ui.py  (ghi ui/out/*.webp, ui/out/meta.json, ui/out/preview.png)
Mọi chữ/số/thanh đầy 'đóng băng' trong ảnh mẫu đều được xoá bằng cách chép cột sạch bên cạnh; chữ thật vẽ bằng DOM."""
import json, os
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
M = np.array(Image.open('ui/mock.png').convert('RGB')).astype(np.uint8)
os.makedirs('ui/out', exist_ok=True)
meta = {}

def crop(x0, y0, x1, y1): return M[y0:y1, x0:x1].copy()

def bg_alpha(rgb, extra=None):
    """flood-fill từ mép qua pixel 'nền thế giới' (xanh lá tối) -> trong suốt."""
    r, g, b = [rgb[..., i].astype(int) for i in range(3)]
    bg = (g >= b + 6) & (np.maximum(np.maximum(r, g), b) < 90) & (g >= r - 4)
    if extra is not None: bg |= extra
    h, w = bg.shape
    seed = np.zeros_like(bg); seed[0, :] = seed[-1, :] = True; seed[:, 0] = seed[:, -1] = True
    lab, n = ndi.label(bg, structure=np.ones((3, 3)))
    ids = np.unique(lab[seed & bg]); ids = ids[ids > 0]
    out = np.isin(lab, ids)
    a = np.where(out, 0, 255).astype(np.uint8)
    # làm mềm 1px biên
    a = np.minimum(a, 255 - (ndi.binary_dilation(out, iterations=1) & ~out) * 90).astype(np.uint8)
    return a

def save(name, rgb, alpha=None, lossless=None, q=86):
    if lossless is None: lossless = name.startswith(('st_', 'sl_', 'p_mid', 'p_tassel'))
    im = Image.fromarray(rgb, 'RGB')
    if alpha is not None: im.putalpha(Image.fromarray(alpha, 'L'))
    p = 'ui/out/%s.webp' % name
    im.save(p, lossless=lossless, quality=q, method=6)
    meta[name] = [im.width, im.height, os.path.getsize(p)]
    return im

def fill_cols(rgb, x0, x1, srcx, y0, y1):
    """xoá vùng [x0,x1) hàng [y0,y1) bằng cột sạch srcx (tọa độ trong rgb)."""
    for x in range(x0, x1): rgb[y0:y1, x] = rgb[y0:y1, srcx]

# ---------------- HUD ----------------
def strip_alpha(rgb, y0, y1, solid_left=0):
    """alpha theo cột: từ dòng viền vàng/kem đầu tiên tới cuối cùng (làm mượt theo trục x); cột hết viền vàng -> trong suốt."""
    r, g, b = [rgb[..., i].astype(int) for i in range(3)]
    h, w = r.shape
    gold = ((r > 115) & (r > b + 14) & (g > 80)) | ((r > 190) & (g < 120) & (b < 130))
    T = np.full(w, np.nan); B = np.full(w, np.nan)
    for x in range(w):
        rows = np.where(gold[y0:y1, x])[0]
        if len(rows) >= 2 and rows.max() - rows.min() >= 8: T[x] = rows.min() + y0; B[x] = rows.max() + y0
    ok = ~np.isnan(T)
    last = np.where(ok)[0].max()
    xs = np.arange(w)
    T = np.interp(xs, xs[ok], T[ok]); B = np.interp(xs, xs[ok], B[ok])
    T = ndi.median_filter(T, 9); B = ndi.median_filter(B, 9)
    a = np.zeros((h, w), np.uint8)
    for x in range(min(w, last + 2)):
        t, bb = (y0, y1 - 1) if x < solid_left else (T[x], B[x])
        a[int(max(0, t - 2)):int(min(h, bb + 3)), x] = 255
    return ndi.gaussian_filter(a.astype(float), .6).clip(0, 255).astype(np.uint8)
def circle_alpha(h, w, cx, cy, rad):
    yy, xx = np.mgrid[0:h, 0:w]; d = np.hypot(xx - cx, yy - cy)
    return (np.clip(rad + .8 - d, 0, 1.6) / 1.6 * 255).astype(np.uint8)
hp = crop(200, 50, 570, 96); fill_cols(hp, 42, 330, 335, 9, 36)
save('bar_hp', hp, strip_alpha(hp, 0, 46, solid_left=44))
qi = crop(200, 90, 570, 136); fill_cols(qi, 12, 330, 335, 8, 36)
save('bar_qi', qi, strip_alpha(qi, 0, 46, solid_left=10))
pill = crop(200, 136, 512, 184); fill_cols(pill, 118, 246, 104, 12, 36)
save('pill', pill, strip_alpha(pill, 0, 48, solid_left=56))
arrow = crop(512, 132, 570, 188); save('btn_up', arrow, circle_alpha(56, 58, 27, 28, 25.5))
# vòng avatar: lỗ tròn trong suốt (chân dung vẽ bằng canvas phía sau) + xoá số "14" ở huy hiệu
ring = crop(10, 8, 200, 200); H, W = ring.shape[:2]
yy, xx = np.mgrid[0:H, 0:W]
bd = np.hypot(xx - 159, yy - 151) < 13.5; ring[bd] = (10, 22, 38)
hole = np.hypot(xx - 108, yy - 104) < 63
dist = np.hypot(xx - 105, yy - 105)
rr, gg, bb = [ring[..., i].astype(int) for i in range(3)]
orn = ((rr > 95) | (bb > 110)) & (dist <= 96)           # trang sức nhô ra ngoài vòng tròn
al = np.where((dist <= 79.5) | orn, 255, 0).astype(np.uint8); al[hole] = 0
keep_ring = (rr > 100) & (rr > bb + 10)
al[(np.hypot(xx - 108, yy - 104) <= 70) & ~keep_ring] = 0
al[np.hypot(xx - 159, yy - 151) < 22] = 255
al = ndi.gaussian_filter(al.astype(float), .7).clip(0, 255).astype(np.uint8)
save('av_ring', ring, al)
meta['ring'] = {'cx': 108, 'cy': 104, 'r': 66, 'badge': [159, 151]}

# ---------------- PANEL TÚI (khung chuẩn cho cả 3 bảng) ----------------
OX, OY = 960 + 7, 225 + 7           # gốc khung trong ảnh mẫu
PW, PH = 548, 725
top = crop(OX, OY, OX + PW, OY + 86)
# xoá tiêu đề + dung lượng bằng mảnh sạch x 285..385 (toạ độ gốc khung = 285-7)
src = top[18:80, 285 - 7 + 4:385 - 7 - 4].copy()   # ~92 px rộng, đúng chiều cao vùng xoá
def tile_over(img, x0, x1, y0, y1, patch):
    w = patch.shape[1]
    for i, x in enumerate(range(x0, x1)):
        j = i % (2 * w); j = j if j < w else 2 * w - 1 - j
        img[y0:y1, x] = patch[:, j]
tile_over(top, 96, 285 - 7, 18, 80, src)       # tiêu đề
tile_over(top, 395 - 7, 490 - 7, 18, 80, src)  # dung lượng
a_top = bg_alpha(top)
save('p_top', top, a_top)
tassel = crop(OX, OY + 86, OX + 30, OY + 178 - 0); save('p_tassel', tassel, bg_alpha(tassel))
# mid: viền trái / phải sạch + nền giữa
lt = M[225 + 420:225 + 440, 960 + 7:960 + 45].copy(); rt = M[225 + 420:225 + 440, 960 + 520:960 + 555].copy()
cenc = M[225 + 520:225 + 580, 960 + 260:960 + 500].reshape(-1, 3).mean(0).astype(np.uint8)
mid = np.zeros((20, PW, 3), np.uint8); mid[:] = cenc
mid[:, :38] = lt; mid[:, PW - 35:] = rt
save('p_mid', mid, None)
bot = crop(OX, 225 + 590, OX + PW, OY + PH); save('p_bot', bot, bg_alpha(bot))
meta['panel'] = {'w': PW, 'top': 86, 'bot': int(bot.shape[0]), 'mid': [int(c) for c in cenc]}


# ---------------- icon chỉ số / ô trang bị / cảnh tu luyện ----------------
def icon_alpha(rgb, th=22, span=42):
    border = np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]]).astype(float)
    bgc = np.median(border, axis=0)
    d = np.linalg.norm(rgb.astype(float) - bgc, axis=2)
    a = np.clip((d - th) / span, 0, 1)
    a = ndi.gaussian_filter(a, .5)
    return (a * 255).astype(np.uint8)
def stat_icon(name, cx, cy, h=22):
    im = crop(cx - h, cy - h, cx + h, cy + h); save(name, im, icon_alpha(im))
for nm, cy in [('st_hp', 678), ('st_qi', 723), ('st_atk', 771), ('st_def', 820), ('st_spd', 867), ('st_rng', 915)]:
    stat_icon(nm, 93, cy)
for nm, cx, cy in [('sl_wp', 120, 367), ('sl_ring', 120, 455), ('sl_boot', 120, 541), ('sl_head', 428, 367), ('sl_body', 428, 455), ('sl_belt', 428, 541)]:
    stat_icon(nm, cx, cy, 27)
flame = crop(531, 308, 945, 585); save('tu_scene', flame, None, lossless=False, q=84)

json.dump(meta, open('ui/out/meta.json', 'w'), separators=(',', ':'))
# preview
chk = Image.new('RGBA', (1900, 760), (70, 110, 70, 255))
y = 4
for n in ['bar_hp', 'bar_qi', 'pill', 'btn_up', 'av_ring']:
    im = Image.open('ui/out/%s.webp' % n).convert('RGBA'); chk.alpha_composite(im, (4, y)); y += im.height + 4
x = 420; yy = 4
for n in ['p_top', 'p_tassel', 'p_mid', 'p_bot', 'st_hp','st_qi','st_atk','st_def','st_spd','st_rng','sl_wp','sl_ring','sl_boot','sl_head','sl_body','sl_belt']:
    im = Image.open('ui/out/%s.webp' % n).convert('RGBA'); chk.alpha_composite(im, (x, yy)); yy += im.height + 6
    if yy > 700: x += 560; yy = 4
chk.convert('RGB').save('ui/out/preview.png'); print(meta)
