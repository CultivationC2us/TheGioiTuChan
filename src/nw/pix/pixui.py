"""Khung/nút/biểu tượng UI vẽ bằng code theo phong cách pixel tu tiên (mực xanh · ngọc · vàng · chu sa · giấy da).
Chạy từ nw/pix/: python3 pixui.py -> out/*.png (1 ô = 1 pixel; trong game phóng ×2 css px, image-rendering:pixelated)"""
import os, math
from PIL import Image, ImageDraw
os.makedirs('out',exist_ok=True)
H=lambda s:tuple(int(s[i:i+2],16) for i in (1,3,5))+(255,)
C=dict(k0=H('#070b16'),k1=H('#0d1628'),k2=H('#13213b'),k3=H('#1b3052'),k4=H('#27456f'),
 j0=H('#14524f'),j1=H('#2a9d8c'),j2=H('#7be0c6'),j3=H('#c8fff0'),
 g0=H('#5b3d10'),g1=H('#a8782a'),g2=H('#e8bb48'),g3=H('#fff0a0'),
 r0=H('#6a1418'),r1=H('#c02f2c'),r2=H('#ff7a58'),
 p0=H('#7a6440'),p1=H('#b9a272'),p2=H('#dccb9c'),p3=H('#f3e8c8'),
 w=H('#ffffff'),b0=H('#1b3a8a'),b1=H('#3f7be0'),b2=H('#9ccaff'),c1=H('#1f9be0'),c2=H('#79dcff'),c3=H('#d8f6ff'),
 s1=H('#8a96a8'),s2=H('#c4cedc'),o1=H('#a85a20'),o2=H('#e08a3a'),T=(0,0,0,0))
def img(w,h): return Image.new('RGBA',(w,h),C['T'])
def px(im,x,y,c):
    if 0<=x<im.width and 0<=y<im.height: im.putpixel((x,y),C[c] if isinstance(c,str) else c)
def rect(im,x,y,w,h,c):
    for j in range(h):
        for i in range(w): px(im,x+i,y+j,c)
def save(im,n): im.save('out/'+n+'.png')
def ascii_img(rows,pal):
    w=max(len(r) for r in rows);im=img(w,len(rows))
    for j,r in enumerate(rows):
        for i,ch in enumerate(r):
            if ch in pal: px(im,i,j,pal[ch])
    return im
def pad(im,w,h):
    o=img(w,h);o.alpha_composite(im,((w-im.width)//2,(h-im.height)//2));return o
# ---------------- khung 9-slice tổng quát ----------------
def frame(w,h,layers,fill,corner=None):
    """layers: danh sách màu từ ngoài vào (mỗi lớp 1 px); fill: màu nền trong (None = trong suốt)"""
    im=img(w,h)
    n=len(layers)
    if fill: rect(im,0,0,w,h,fill)
    for i,c in enumerate(layers):
        # bo góc: bỏ pixel góc ở lớp ngoài cùng
        for x in range(i,w-i): px(im,x,i,c);px(im,x,h-1-i,c)
        for y in range(i,h-i): px(im,i,y,c);px(im,w-1-i,y,c)
    # bo tròn góc 1px ngoài cùng
    for (x,y) in((0,0),(w-1,0),(0,h-1),(w-1,h-1)): px(im,x,y,'T')
    return im
def gem(im,cx,cy):
    for dx,dy,c in [(0,-2,'k0'),(-1,-1,'k0'),(0,-1,'j2'),(1,-1,'k0'),(-2,0,'k0'),(-1,0,'j2'),(0,0,'j3'),(1,0,'j1'),(2,0,'k0'),(-1,1,'k0'),(0,1,'j1'),(1,1,'k0'),(0,2,'k0')]: px(im,cx+dx,cy+dy,c)
    for dx,dy in((0,-3),(-3,0),(3,0),(0,3)): px(im,cx+dx,cy+dy,'g2')
# ---- KHUNG BẢNG (panel): 36×36, cắt 14 ----
def panel9():
    S=36;im=frame(S,S,['k0','g0','g2','g1','k0','j0','j1','k1'],'k1')
    # ngọc ở 4 góc + chấm vàng giữa cạnh
    for (cx,cy) in((6,6),(S-7,6),(6,S-7),(S-7,S-7)): gem(im,cx,cy)
    for i in (9,10):
        pass
    # hoa văn mây góc: vài pixel vàng
    for (x,y) in((11,3),(12,3),(13,2),(3,11),(3,12),(2,13),(S-12,3),(S-13,3),(S-14,2),(S-4,11),(S-4,12),(S-3,13),(11,S-4),(12,S-4),(13,S-3),(3,S-12),(3,S-13),(2,S-14),(S-12,S-4),(S-13,S-4),(S-14,S-3),(S-4,S-12),(S-4,S-13),(S-3,S-14)): px(im,x,y,'g2')
    return im
save(panel9(),'panel9')
# nền hoa văn (tile 12×12): lưới thoi mờ
bg=img(12,12);rect(bg,0,0,12,12,'k1')
for i in range(12):
    px(bg,i,i,'k2');px(bg,11-i,i,'k2')
for (x,y) in((6,6),(0,0)): px(bg,x,y,'k3')
save(bg,'bgtile')
# thẻ / khung phụ: 12×12 cắt 4
save(frame(12,12,['k0','k4','k2'],'k1'),'card')
save(frame(12,12,['k0','j0','j1'],'k2'),'cell')
save(frame(12,12,['k0','g1','g2'],'k3'),'cell_sel')
save(frame(12,12,['k0','p0','p1','p3'],'p2'),'parch')
save(frame(12,12,['k0','g0','g2'],'k2'),'slot')
save(frame(12,12,['k0','g0','g2'],'k1'),'minimap')
# nút vàng / đỏ / xanh / tab
def btn(name,top,mid,low,edge):
    im=frame(12,12,['k0',edge,top],mid)
    for x in range(2,10): px(im,x,9,low);px(im,x,10,low) if False else 0
    for x in range(3,9): px(im,x,8,low)
    save(im,name)
btn('btn_gold','g3','g2','g1','g0');btn('btn_red','r2','r1','r0','k0');btn('btn_blue','b2','b1','b0','k0')
save(frame(12,12,['k0','k4','k3'],'k2'),'tab')
t=frame(12,12,['k0','g0','g3'],'g2')
for x in range(3,9): px(t,x,8,'g1')
save(t,'tab_on')
save(frame(12,12,['k0','k4'],'k0'),'track')
# thanh HP/Tu vi: khung ngang 24×9 cắt 5
def bar():
    im=frame(24,11,['k0','g1','g0'],'k0')
    for x in range(3,21): px(im,x,2,'g2')
    for (x,y) in((0,0),(23,0),(0,10),(23,10)):px(im,x,y,'T')
    px(im,1,5,'g2');px(im,22,5,'g2')
    return im
save(bar(),'hbar')
plate=frame(24,11,['k0','g1','g3','g2'],'p2')
for x in range(3,21): px(plate,x,9,'p1')
save(plate,'plate')
# vòng chân dung 36×36
def ring():
    S=36;im=img(S,S);c=(S-1)/2
    for y in range(S):
        for x in range(S):
            d=math.hypot(x-c,y-c)
            if 13.5<=d<14.5: col='k0'
            elif d<15.5 and d>=14.5: col='j1'
            elif d<16.5 and d>=15.5: col='j0'
            elif d<17.5 and d>=16.5: col='g3'
            elif d<18.5 and d>=17.5: col='g2'
            elif d<19.5 and d>=18.5: col='g1'
            elif d<20.5 and d>=19.5: col='k0'
            else: continue
            px(im,x,y,col)
    for (cx,cy) in((17,1),(1,17),(34,17),(17,34)):
        for dx,dy,cc in [(0,-2,'k0'),(-1,-1,'k0'),(0,-1,'j2'),(1,-1,'k0'),(-2,0,'k0'),(-1,0,'j2'),(0,0,'j3'),(1,0,'j1'),(2,0,'k0'),(-1,1,'k0'),(0,1,'j1'),(1,1,'k0'),(0,2,'k0')]:
            if 0<=cx+dx<S and 0<=cy+dy<S: px(im,cx+dx,cy+dy,cc)
    # hốc cấp độ (góc dưới phải)
    for y in range(S):
        for x in range(S):
            d=math.hypot(x-29,y-29)
            if d<6.5 and d>=5.5: px(im,x,y,'k0')
            elif d<5.5 and d>=4.5: px(im,x,y,'g2')
            elif d<4.5: px(im,x,y,'k1')
    return im
save(ring(),'ring')
# nút ↑ tu luyện 12×12
up=img(12,12)
for y in range(12):
    for x in range(12):
        d=math.hypot(x-5.5,y-5.5)
        if d<6: px(up,x,y,'k0' if d>=5 else ('g2' if d>=4 else 'k2'))
for (x,y) in((5,3),(6,3),(4,4),(7,4),(3,5),(8,5),(5,4),(6,4),(5,5),(6,5),(5,6),(6,6),(5,7),(6,7),(5,8),(6,8)): px(up,x,y,'g3')
for (x,y) in((4,4),(7,4)): px(up,x,y,'g3')
save(up,'btn_up')
# nút đóng ×  14×14
x_=frame(14,14,['k0','g0','g2','g1'],'k2')
for i in range(4,10): px(x_,i,i,'w');px(x_,13-i,i,'w')
for i in range(4,10): px(x_,i+1,i,'p2') if False else 0
save(x_,'xbtn')
# nút menu HUD 20×20 cắt 5
mb=frame(20,20,['k0','g2'],'k2')
save(mb,'mbtn')
# ---- biểu tượng ----
def icon_heart():
    return pad(ascii_img(["..kkk..kkk..","kRRRkkRRRk.","kRpRRRRRRk.","kRpRRRRRRk.","kRRRRRRRRk.",".kRRRRRRk..","..kRRRRk...","...kRRk....","....kk....."],{'k':'k0','R':'r1','p':'r2'}),12,12)
def icon_flame():
    return pad(ascii_img(["....k.....",
 "...kck....","...kCck...","..kCCck...","..kCCwCk..",".kCCwwCCk.",".kCCwwCCk.",".kCCCwCCk.",".kCCCCCCk.","..kCCCCk..","...kkkk..."],{'k':'k0','c':'c2','C':'c1','w':'c3'}),12,12)
def icon_sword():
    return pad(ascii_img(["........kk.",".......kWk.","......kWWk.",".....kWWk..","..k.kWWk...","..kkWWk....","...kbk.....","..kbbk.....",".kbk.kk....","..k........"],{'k':'k0','W':'s2','b':'o2'}),12,12)
def icon_shield():
    return pad(ascii_img(["kkkkkkkkkk","kBBBBwwwwk","kBBBBwwwwk","kBBBBwwwwk","kBBBBwwwwk",".kBBBwwwk.","..kBBwwk..","...kBwk...","....kk...."],{'k':'k0','B':'b1','w':'b2'}),12,12)
def icon_boot():
    return pad(ascii_img([".kkkk.....",".kBBk.....",".kBBk.....",".kBBk.....",".kBBBkkk..",".kBBBBBBk.","kBBBBBBBBk","kbbbbbbbbk",".kkkkkkkk."],{'k':'k0','B':'o2','b':'o1'}),12,12)
def icon_target():
    im=img(12,12)
    for y in range(12):
        for x in range(12):
            d=math.hypot(x-5.5,y-5.5)
            if d<1.6: px(im,x,y,'r1')
            elif d<2.6: px(im,x,y,'w')
            elif d<3.8: px(im,x,y,'r1')
            elif d<4.8: px(im,x,y,'w')
            elif d<5.8: px(im,x,y,'k0')
    return im
for n,f in [('st_hp',icon_heart),('st_qi',icon_flame),('st_atk',icon_sword),('st_def',icon_shield),('st_spd',icon_boot),('st_rng',icon_target)]: save(f(),n)
# biểu tượng ô trang bị (mờ, báo ô trống)
def ghost(f):
    im=f();o=img(im.width,im.height)
    for y in range(im.height):
        for x in range(im.width):
            p=im.getpixel((x,y))
            if p[3]: o.putpixel((x,y),(60,100,150,255) if sum(p[:3])>150 else (22,40,70,255))
    return o
def ic_ring():
    im=img(12,12)
    for y in range(12):
        for x in range(12):
            d=math.hypot(x-5.5,y-6.5)
            if 3<=d<4.6: px(im,x,y,'w')
            elif 2<=d<3: px(im,x,y,'k0') if False else 0
    for (x,y) in((4,0),(5,0),(6,0),(7,0),(5,1),(6,1)): px(im,x,y,'w')
    return im
def ic_crown():
    return pad(ascii_img(["w..w..w..w","ww.ww.ww.w","wwwwwwwwww","wwwwwwwwww","wwwwwwwwww"],{'w':'w'}),12,12)
def ic_robe():
    return pad(ascii_img([".www..www.","wwwwwwwwww","wwwwwwwwww","wwwwwwwwww",".ww.ww.ww.",".ww.ww.ww.",".www..www."],{'w':'w'}),12,12)
def ic_belt():
    return pad(ascii_img(["wwwwwwwwww","wwwwwwwwww",".....ww...","....wwww..","....wwww.."][:3],{'w':'w'}),12,12)
for n,f in [('sl_wp',icon_sword),('sl_ring',ic_ring),('sl_boot',icon_boot),('sl_head',ic_crown),('sl_body',ic_robe),('sl_belt',ic_belt)]: save(ghost(f),n)
def ic_aura():
    return pad(ascii_img([".....ww.....","....wwww....","..w..ww..w..",".w..wwww..w.","w..w....w..w","w.w......w.w","w.w......w.w","ww........ww",".w........w."],{'w':'w'}),12,12)
def ic_paw():
    return pad(ascii_img(["..w....w..",".www..www.",".www..www.","..w.ww.w..","....ww....","..wwwwww..",".wwwwwwww.",".www..www.","..w....w.."],{'w':'w'}),12,12)
def ic_mount():
    return pad(ascii_img(["....w.ww..","...wwwww..","..wwwwwww.","..wwwwwwww",".wwwwwwwww","wwwwww.www","www.ww.ww.",".w..w..w..","....w..w.."][:9],{'w':'w'}),12,12)
for n,f in [('sl_aura',ic_aura),('sl_pet',ic_paw),('sl_mount',ic_mount)]: save(ghost(f),n)

# ---- biểu tượng menu 16×16 ----
def m_pouch():
    PAL={'o':'k0','P':'b0','L':'b1','d':'b0','g':'g1','G':'g3','r':'r1'}
    MAP=['................','....oo....oo....','...oPPo..oPPo...','...oPPPooPPPo...','....oPPPPPPo....','...ogGgrrgGgo...','..ooooooooooo...','.oPPPPPPPPPPPo..','oLLPPPPPPPPPPPo.','oLPPPPPGGPPPPPo.','oPPPPPGGGGPPPPo.','oPPPPPPGGPPPPPo.','oPPPPPPPPPPPPPo.','.oddPPPPPPPddo..','..ooddddddddoo..','....oooooooo....']
    return ascii_img(MAP,PAL)
def m_map():
    im=img(16,16)
    rect(im,2,3,12,11,'k0');rect(im,3,4,10,9,'p3')
    rect(im,1,2,2,13,'g1');rect(im,13,2,2,13,'g1');rect(im,1,2,2,1,'g3');rect(im,13,2,2,1,'g3')
    for (x,y) in((4,7),(5,8),(6,9),(7,9),(8,8),(9,7),(10,6)): px(im,x,y,'p0')
    rect(im,10,9,3,3,'r1');px(im,11,10,'r2')
    for x in range(4,8): px(im,x,5,'p1')
    return im
def m_book():
    im=img(16,16)
    rect(im,2,2,12,13,'k0');rect(im,3,3,10,11,'r1');rect(im,3,3,10,1,'r2');rect(im,3,3,2,11,'r0')
    rect(im,6,5,6,1,'g2');rect(im,6,7,6,1,'g2');rect(im,6,9,4,1,'g2')
    rect(im,12,3,1,11,'p3');rect(im,12,13,1,1,'p1')
    return im
def m_pagoda():
    im=img(16,16)
    def roof(y,w,c):
        x0=8-w//2
        rect(im,x0,y,w,1,'k0');rect(im,x0+1,y,w-2,1,c)
        rect(im,x0-1,y+1,w+2,1,'k0');rect(im,x0,y+1,w,1,'r1' if c=='g2' else 'g2')
    roof(2,6,'g2');rect(im,6,4,4,3,'p2');rect(im,7,5,2,2,'k1')
    roof(7,10,'g2');rect(im,5,9,6,3,'p2');rect(im,7,10,2,2,'k1')
    roof(12,14,'g2');rect(im,4,14,8,1,'g1')
    rect(im,7,0,2,2,'g3')
    return im
def m_lotus():
    im=img(16,16)
    for (x,y,c) in [(7,3,'w'),(8,3,'w'),(6,4,'p3'),(7,4,'w'),(8,4,'w'),(9,4,'p3'),(4,6,'p3'),(5,5,'p3'),(10,5,'p3'),(11,6,'p3'),(7,5,'w'),(8,5,'w')]: px(im,x,y,c)
    rect(im,5,6,6,3,'p3');rect(im,3,7,2,2,'p3');rect(im,11,7,2,2,'p3');rect(im,6,5,4,1,'w')
    for x in range(3,13): px(im,x,9,'j2')
    rect(im,4,10,8,2,'j1');rect(im,6,12,4,1,'j0')
    # viền tối
    out=img(16,16);out.alpha_composite(im)
    for y in range(16):
        for x in range(16):
            if im.getpixel((x,y))[3]==0 and any(0<=x+dx<16 and 0<=y+dy<16 and im.getpixel((x+dx,y+dy))[3] for dx,dy in((1,0),(-1,0),(0,1),(0,-1))): px(out,x,y,'k0')
    return out
def m_gear():
    im=img(16,16)
    for y in range(16):
        for x in range(16):
            d=math.hypot(x-7.5,y-7.5);a=math.atan2(y-7.5,x-7.5)
            tooth=(abs(math.sin(a*4))>.55)
            if d<5.2 and d>=2.6: px(im,x,y,'s2' if d<4.2 else 's1')
            elif d<7 and d>=5.2 and tooth: px(im,x,y,'s1')
    out=img(16,16);out.alpha_composite(im)
    for y in range(16):
        for x in range(16):
            if im.getpixel((x,y))[3]==0 and any(0<=x+dx<16 and 0<=y+dy<16 and im.getpixel((x+dx,y+dy))[3] for dx,dy in((1,0),(-1,0),(0,1),(0,-1))): px(out,x,y,'k0')
    return out
for n,f in [('m_bag',m_pouch),('m_map',m_map),('m_quest',m_book),('m_sect',m_pagoda),('m_char',m_lotus),('m_set',m_gear)]: save(f(),n)
# huy hiệu tu luyện (mề đay ngọc) 22×22
med=img(24,24)
for y in range(24):
    for x in range(24):
        d=math.hypot(x-11.5,y-11.5)
        if d<12 and d>=11: px(med,x,y,'k0')
        elif d<11 and d>=10: px(med,x,y,'g2')
        elif d<10 and d>=9: px(med,x,y,'g0')
        elif d<9: px(med,x,y,'j0' if d>6 else 'k2')
# cánh sen / thái cực nhỏ ở giữa
for (x,y,c) in [(11,6,'j3'),(12,6,'j3'),(10,7,'j2'),(13,7,'j2'),(9,9,'j2'),(14,9,'j2'),(10,11,'j3'),(13,11,'j3'),(11,11,'w'),(12,11,'w'),(11,12,'j2'),(12,12,'j2'),(9,14,'j1'),(14,14,'j1'),(10,15,'j2'),(13,15,'j2'),(11,16,'j3'),(12,16,'j3')]: px(med,x,y,c)
save(med,'medal')
# dây tua đỏ 8×22
ts=img(8,22)
rect(ts,3,0,2,6,'g2');rect(ts,2,6,4,3,'r1');rect(ts,2,6,1,3,'r2');rect(ts,1,9,6,10,'r1');rect(ts,1,9,2,10,'r2');rect(ts,5,9,2,10,'r0');rect(ts,2,19,4,3,'r0')
for x in (1,6): px(ts,x,9,'k0')
save(ts,'tassel')
# cảnh Tu Luyện 100×40: trời đêm, núi xa, bệ đá + ngọn linh hỏa xanh
sc=img(100,40)
import random
random.seed(7)
for y in range(40):
    for x in range(100):
        t=y/40;c='k1' if t<.35 else 'k2' if t<.6 else 'k3'
        if (x+y)%2==0 and abs(t-.35)<.04 or (x+y)%2==0 and abs(t-.6)<.04: c={'k1':'k2','k2':'k3','k3':'k4'}[c]
        px(sc,x,y,c)
for _ in range(26): px(sc,random.randrange(100),random.randrange(18),'j3' if random.random()<.3 else 'p3')
for x in range(100):
    h=int(14+5*math.sin(x/9)+3*math.sin(x/3.3));
    for y in range(40-h,40): px(sc,x,y,'k0' if y<40-h+1 else 'k1')
for x in range(100):
    h=int(7+3*math.sin(x/6+1));
    for y in range(40-h,40): px(sc,x,y,'k0' if y==40-h else 'j0' if y<40-h+2 else 'k2')
rect(sc,36,30,28,4,'s1');rect(sc,34,33,32,3,'p0');rect(sc,34,33,32,1,'p1');rect(sc,38,29,24,1,'s2')
fl=[(50,10),(49,11),(51,11),(48,13),(52,13),(47,15),(53,15)]
for dy in range(20):
    wdt=int(6*math.sin(min(1,(dy+2)/12)*math.pi*.9)+1) if dy<18 else 3
    for dx in range(-wdt,wdt+1):
        d=abs(dx)/(wdt+.1);c='c3' if d<.25 and dy>5 else 'c2' if d<.55 else 'c1'
        if dy<3: c='c2'
        px(sc,50+dx,9+dy,c)
for (x,y) in((44,22),(45,18),(55,20),(57,14),(43,12),(50,6),(54,9)): px(sc,x,y,'c2')
save(sc,'tu_scene')
# xem trước
names=sorted(f[:-4] for f in os.listdir('out'))
S=4;cols=8;cells=[];W=0
sheet=Image.new('RGBA',(1400,700),(40,70,60,255));x=y=0;rh=0
for n in names:
    im=Image.open('out/'+n+'.png');im2=im.resize((im.width*S,im.height*S),Image.NEAREST)
    if x+im2.width>1380: x=0;y+=rh+14;rh=0
    sheet.alpha_composite(im2,(x,y));x+=im2.width+10;rh=max(rh,im2.height)
sheet.convert('RGB').save('preview.png');print(len(names),'pieces')
