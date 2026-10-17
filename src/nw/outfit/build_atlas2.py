"""Dựng atlas trang phục #2 (Xích Diệm) từ MỘT ảnh GPT o3.png (đầu, thân, tay áo(bỏ), giày). Chạy từ nw/outfit/: python3 build_atlas2.py
-> atlas2.webp + meta2.json. Cùng quy tắc với build_atlas.py (1 điểm ảnh gốc = 1/16 pixel nhân vật; mắt (EYE) -> (37,46); thân neo đỉnh y=54.95)."""
import numpy as np, json
from PIL import Image
from scipy import ndimage as ndi
import native
from extract_o import load, parts
K=1/16.0; UP=6; EYE=(820,452)
def clean(img,minb=14):
    lab,n=ndi.label(ndi.binary_dilation(img[...,3]>0,iterations=1))
    sizes=ndi.sum(img[...,3]>0,lab,range(1,n+1));keep=np.isin(lab,[i+1 for i,s in enumerate(sizes) if s>=minb])
    j=img.copy();j[~(keep&(img[...,3]>0))]=0
    al=j[...,3]>0;ry=np.where(al.any(1))[0];rx=np.where(al.any(0))[0]
    clean.off=(rx[0],ry[0]);return j[ry[0]:ry[-1]+1,rx[0]:rx[-1]+1]
a,fg=load('o3.png');P=parts(fg,1,2500);R={}
native.fitgrid.__defaults__=(9.0,11.2)
for k,(sl,m) in enumerate(P):
    img,(Px,Py),(ax,ay)=native.read_native(a,fg,sl,pad=10)
    lab,n=ndi.label(img[...,3]>0,structure=np.ones((3,3)));sz=ndi.sum(img[...,3]>0,lab,range(1,n+1))
    if k in(0,1):
        big=1+int(np.argmax(sz));ys,xs=np.where(lab==big);bx=(xs.min(),xs.max(),ys.min(),ys.max())
        for i in range(1,n+1):
            if i==big: continue
            yy,xx=np.where(lab==i)
            if k==0 or not (xx.min()>=bx[0] and xx.max()<=bx[1] and yy.min()>=bx[2]+2): img[lab==i]=0
    ci=clean(img);R[k]=(ci,Px,Py,ax+clean.off[0]*Px,ay+clean.off[1]*Py)
    print(k,ci.shape,round(Px,2),round(Py,2))
def rs(img,fx,fy):
    h,w=img.shape[:2];H=max(1,round(h*fy));W=max(1,round(w*fx));ys=np.minimum(h-1,((np.arange(H)+.5)/fy).astype(int));xs=np.minimum(w-1,((np.arange(W)+.5)/fx).astype(int))
    return img[ys][:,xs]
boots={}
for k in (4,5):
    img,Px,Py,_,_=R[k];boots['L' if k==4 else 'R']=(rs(img,Px/9.55,Py/9.55),img.shape[1]*Px,img.shape[0]*Py)
head,hPx,hPy,hax,hay=R[0];torso,tPx,tPy,tax,tay=R[1]
def blocks(x0,x1,y0,y1): return (int((x0-hax)//hPx),int((x1-hax)//hPx)+1,int((y0-hay)//hPy),int((y1-hay)//hPy)+1)
EYES=[blocks(690,790,405,490),blocks(850,950,405,490)]
SKIN=np.array([250,205,175],np.uint8)
def blink(img,mode):
    j=img.copy()
    for (bx0,bx1,by0,by1) in EYES:
        sub=j[max(0,by0):by1,max(0,bx0):bx1];h=sub.shape[0]
        for y in range(h):
            for x in range(sub.shape[1]):
                p=sub[y,x]
                if p[3]==0: continue
                dark=int(p[:3].mean())<60
                top=(mode=='closed') or (mode=='half' and y<h*0.5)
                if top and not dark: sub[y,x]=[*SKIN,255]
        yy=int(h*0.62) if mode=='closed' else int(h*0.5)
        if mode in('closed','half'):
            for x in range(1,sub.shape[1]-1):
                if sub[yy,x,3]>0: sub[yy,x]=[40,18,24,255]
    return j
heads={'open':head,'half':blink(head,'half'),'closed':blink(head,'closed')}
pieces=[('head_open',head),('head_half',heads['half']),('head_closed',heads['closed']),('torso',torso),('bootL',boots['L'][0]),('bootR',boots['R'][0])]
pos={};x=0;y=0;rowh=0;AW=1400
for n,img in pieces:
    w,h=img.shape[1]*UP,img.shape[0]*UP
    if x+w>AW:x=0;y+=rowh+2;rowh=0
    pos[n]=[x,y,w,h];x+=w+2;rowh=max(rowh,h)
atlas=Image.new('RGBA',(AW,y+rowh),(0,0,0,0))
for n,img in pieces:
    atlas.alpha_composite(Image.fromarray(img).resize((img.shape[1]*UP,img.shape[0]*UP),Image.NEAREST),(pos[n][0],pos[n][1]))
atlas.save('atlas2.png');atlas.save('atlas2.webp',lossless=True,quality=100)
# thân: giữ tâm ngang như bộ 1 (35,25) và đỉnh y=54,95
TS=0.92
tw=torso.shape[1]*tPx*K*TS;th=torso.shape[0]*tPy*K*TS
meta={'pos':pos,'head':[37+(hax-EYE[0])*K,46+(hay-EYE[1])*K,head.shape[1]*hPx*K,head.shape[0]*hPy*K],
 'torso':[35.25-tw/2,54.95,tw,th]}
BS=0.88
for n,cx in (('bootL',31.5),('bootR',36.5)):
    r=boots['L' if n=='bootL' else 'R'];w=r[1]*K*BS;h=r[2]*K*BS;meta[n]=[cx-w/2,71-h,w,h]
json.dump(meta,open('meta2.json','w'),indent=1)
print(json.dumps({k:[round(x,1) for x in v] for k,v in meta.items() if k!='pos'}),atlas.size)
