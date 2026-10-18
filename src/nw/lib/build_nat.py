import numpy as np, json
from PIL import Image
c=np.load('nw/lib/nat/comps.npy',allow_pickle=True)
H={}
def S(h,*ids):
    for i in ids:H[i]=h
S(54,137,142,198,199,200,201,202);S(50,203);S(58,135,136,138,139,140,141);S(50,143);S(24,144,145,146,147,148,149,151);S(14,150)
S(42,152);S(44,154);S(46,156);S(20,153);S(12,155);S(14,157);S(40,158);S(12,159);S(24,160);S(50,162)
S(22,164,165,166);S(16,167,169,170);S(9,168);S(8,171);S(12,172,173);S(6,174);S(32,175,176);S(10,177,178,161,163)
S(12,179,180,181,182,183,184,185,186,187);S(13,188,189,190,191);S(16,192);S(10,193);S(12,194,195,196,197)
S(30,204);S(24,205);S(16,206,207);S(8,208);S(6,209);S(5,210);S(36,211);S(34,212);S(36,213);S(8,214)
S(16,215,216);S(20,244);S(12,217,234,235,236,250);S(14,247);S(6,218,219,220);S(8,239,240,241,242,243)
S(16,221,223);S(6,222);S(18,224,226,227);S(8,225,231);S(20,228,229,230);S(22,232,233);S(18,245,246);S(14,248,249);S(5,251)
S(16,252);S(8,253);S(30,254,255,256);S(40,257);S(28,258);S(26,259);S(36,260,262,263,264);S(30,261)
S(24,265,266,267);S(22,268);S(30,269);S(22,270,277,279);S(20,271);S(16,272);S(28,273);S(24,274);S(36,275);S(20,276);S(8,278);S(14,280);S(16,281);S(20,282)
items=[];
for i,h in H.items():
    sid,x,y,w,hh,arr=c[i+1]
    im=Image.fromarray(arr)
    k=2*h/hh   # lưu gấp đôi cỡ hiển thị để vẽ lại nét
    if k>1:k=1
    nw,nh=max(2,round(w*k)),max(2,round(hh*k))
    im=im.resize((nw,nh),Image.LANCZOS)
    items.append((i,im))
items.sort(key=lambda t:-t[1].height)
AW=1500;x=y=rowh=0;meta={};pos=[]
for i,im in items:
    if x+im.width+2>AW:x=0;y+=rowh+2;rowh=0
    pos.append((i,im,x,y));meta['n%d'%i]=[x,y,im.width,im.height,-im.width/2.0,-im.height*0.96];x+=im.width+2;rowh=max(rowh,im.height)
AH=y+rowh+2
at=Image.new('RGBA',(AW,AH),(0,0,0,0))
for i,im,px,py in pos:at.paste(im,(px,py))
at.save('nw/lib/out/nat_atlas.png');at.save('nw/lib/out/nat_atlas.webp',quality=94,method=6)
json.dump(meta,open('nw/lib/out/nat_meta.json','w'))
import os;print(at.size,len(meta),os.path.getsize('nw/lib/out/nat_atlas.webp'))
