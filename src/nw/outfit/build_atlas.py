"""Dựng atlas trang phục 'Tử Điện Chiến Giáp' từ 2 ảnh GPT (đọc điểm pixel gốc của từng khối).
Chạy từ nw/outfit/: python3 build_atlas.py -> atlas.png|webp + meta.json + preview"""
import numpy as np, json
from PIL import Image
import native
from extract_o import load, parts
K=1/16.0            # 1 điểm ảnh GPT = 1/16 pixel nhân vật (chuẩn lệnh GPT: 1 pixel nhân vật = 16 px ảnh)
UP=6                # phóng mỗi khối ×6 trong atlas (vẽ ra có làm mịn → không rỗ khi co về 0,9 px màn hình)
def clean(img,minb=14):
    from scipy import ndimage as ndi
    lab,n=ndi.label(ndi.binary_dilation(img[...,3]>0,iterations=1))
    sizes=ndi.sum(img[...,3]>0,lab,range(1,n+1));keep=np.isin(lab,[i+1 for i,s in enumerate(sizes) if s>=minb])
    j=img.copy();j[~(keep&(img[...,3]>0))]=0
    al=j[...,3]>0;ry=np.where(al.any(1))[0];rx=np.where(al.any(0))[0]
    clean.off=(rx[0],ry[0]);return j[ry[0]:ry[-1]+1,rx[0]:rx[-1]+1]
a2,f2=load('o2.png');P2=parts(f2,1,2500);R={}
for k,(sl,m) in enumerate(P2):
    img,(Px,Py),(ax,ay)=native.native.read_native(a2,f2,sl) if False else native.read_native(a2,f2,sl)
    if k==0:   # đầu: chỉ giữ khối chính (bỏ cổ áo/tua rời của thân bị cắt dính vào)
        from scipy import ndimage as ndi
        lab,n=ndi.label(img[...,3]>0,structure=np.ones((3,3)));sz=ndi.sum(img[...,3]>0,lab,range(1,n+1));img[lab!=1+int(np.argmax(sz))]=0
    if k==1:   # thân: bỏ mảnh tua rua của đầu lọt vào ô cắt (không nối với thân)
        from scipy import ndimage as ndi
        lab,n=ndi.label(img[...,3]>0,structure=np.ones((3,3)));sz=ndi.sum(img[...,3]>0,lab,range(1,n+1));big=1+int(np.argmax(sz))
        ys,xs=np.where(lab==big);bx=(xs.min(),xs.max(),ys.min(),ys.max())
        for i in range(1,n+1):
            if i==big: continue
            yy,xx=np.where(lab==i)
            if not (xx.min()>=bx[0] and xx.max()<=bx[1] and yy.min()>=bx[2]+2): img[lab==i]=0
    ci=clean(img);R[k]=(ci,Px,Py,ax+clean.off[0]*Px,ay+clean.off[1]*Py)
# giày từ ảnh 1
native.fitgrid.__defaults__=(6.6,7.8)
a1,f1=load('o1.png');P1=parts(f1,1,2500);B={}
for k,(sl,m) in enumerate(P1):
    if k>=4:
        img,(Px,Py),(ax,ay)=native.read_native(a1,f1,sl,pad=8);B[k]=(clean(img),Px,Py,ax,ay)
print({k:(v[0].shape,v[1],v[2]) for k,v in B.items()})
def resample_nearest(img,fx,fy):
    h,w=img.shape[:2];H=max(1,round(h*fy));W=max(1,round(w*fx));ys=np.minimum(h-1,((np.arange(H)+.5)/fy).astype(int));xs=np.minimum(w-1,((np.arange(W)+.5)/fx).astype(int))
    return img[ys][:,xs]
# giày: đưa về cỡ khối của ảnh 2 (9.55 px)
boots={}
for k,(img,Px,Py,ax,ay) in B.items():
    r=resample_nearest(img,Px/9.55,Py/9.55);boots['R' if P1[k][0][1].start>768 else 'L']=(r,img.shape[1]*Px,img.shape[0]*Py)
for kk,v in boots.items():print(kk,v[0].shape,v[1:])
head,hPx,hPy,hax,hay=R[0];torso,tPx,tPy,tax,tay=R[1];slL,sPx,sPy,slx,sly=R[2];slR,_,_,srx,sry=R[3]
Image.fromarray(head).save('head_open.png')
# --- mắt: vùng (toạ độ ảnh gốc) quanh 2 mắt ---
def blocks(x0,x1,y0,y1):
    return (int((x0-hax)//hPx),int((x1-hax)//hPx)+1,int((y0-hay)//hPy),int((y1-hay)//hPy)+1)
EYES=[blocks(664,770,395,482),blocks(858,935,395,482)]
SKIN=np.array([250,205,175],np.uint8)
def blink(img,mode):
    j=img.copy()
    for (bx0,bx1,by0,by1) in EYES:
        sub=j[by0:by1,bx0:bx1]
        h=sub.shape[0]
        for y in range(h):
            for x in range(sub.shape[1]):
                p=sub[y,x]
                if p[3]==0: continue
                lum=int(p[:3].mean());dark=lum<75
                top=(mode=='closed') or (mode=='half' and y<h*0.5)
                if top and not dark: sub[y,x]=[*SKIN,255]
        # mí mắt: hàng tối ở ranh giới
        yy=int(h*0.62) if mode=='closed' else int(h*0.5)
        if mode in('closed','half'):
            for x in range(1,sub.shape[1]-1):
                if sub[yy,x,3]>0: sub[yy,x]=[70,28,110,255]
    return j
heads={'open':head,'half':blink(head,'half'),'closed':blink(head,'closed')}
for k,v in heads.items():Image.fromarray(v).save(f'head_{k}.png')
# --- đóng gói atlas (mỗi khối ×UP) ---
pieces=[('head_open',head),('head_half',heads['half']),('head_closed',heads['closed']),('torso',torso),('slL',slL),('slR',slR),('bootL',boots['L'][0]),('bootR',boots['R'][0])]
W=0;H=0;pos={}
x=0;y=0;rowh=0;AW=1400
for n,img in pieces:
    w,h=img.shape[1]*UP,img.shape[0]*UP
    if x+w>AW:x=0;y+=rowh+2;rowh=0
    pos[n]=[x,y,w,h];x+=w+2;rowh=max(rowh,h)
AH=y+rowh
atlas=Image.new('RGBA',(AW,AH),(0,0,0,0))
for n,img in pieces:
    im=Image.fromarray(img).resize((img.shape[1]*UP,img.shape[0]*UP),Image.NEAREST);atlas.alpha_composite(im,(pos[n][0],pos[n][1]))
atlas.save('atlas.png');atlas.save('atlas.webp',lossless=True,quality=100)
# --- vị trí (khung nhân vật 76x90, đơn vị = pixel nhân vật) ---
def head_pl(img,Px,Py):  # tâm 2 mắt (806,444) -> (37,46)
    return [37+(hax-806)*K,46+(hay-444)*K,img.shape[1]*Px*K,img.shape[0]*Py*K]
meta={'pos':pos,'head':head_pl(head,hPx,hPy),
 'torso':[35+(tax-768)*K,55+(tay-586)*K,torso.shape[1]*tPx*K,torso.shape[0]*tPy*K],
 'slL':[slx*K,sly*K,slL.shape[1]*sPx*K,slL.shape[0]*sPy*K],'slR':[srx*K,sry*K,slR.shape[1]*sPx*K,slR.shape[0]*sPy*K]}
BS=0.88
for n,cx in (('bootL',31.5),('bootR',36.5)):
    r=boots['L' if n=='bootL' else 'R'];w=r[1]*K*BS;h=r[2]*K*BS;meta[n]=[cx-w/2,71-h,w,h]
json.dump(meta,open('meta.json','w'),indent=1)
print(json.dumps({k:[round(x,1) for x in v] for k,v in meta.items() if k!='pos'}),atlas.size)
