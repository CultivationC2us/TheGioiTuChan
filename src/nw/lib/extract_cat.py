"""Hắc Miêu (pet) -> atlas 'cat' (khung walk_1..8, run_1..7, idle_1..2, sleep_1..2, claw_1..3, orb_1..2). Chạy từ nw/: python3 lib/extract_cat.py"""
import sys,json,numpy as np
sys.path.insert(0,'lib')
from extract_all import *
B=3
im,fg,comps,lab=seg('lib/src_cat.png',5,200)
def row_of(c):
    cy=(c[1]+c[3])/2
    return 0 if cy<230 else 1 if cy<400 else 2 if cy<560 else 3 if cy<740 else 4 if cy<890 else 5
def comp_mask(c):
    x0,y0,x1,y1,l=c;m=np.zeros(fg.shape,bool);m[y0:y1,x0:x1]=(lab[y0:y1,x0:x1]==l)&fg[y0:y1,x0:x1];return m
rows={}
for c in sorted(comps,key=lambda c:c[0]):rows.setdefault(row_of(c),[]).append(c)
sel={}
for i,c in enumerate(rows[1]):sel[f'walk_{i+1}']=comp_mask(c)
for i,c in enumerate(rows[2]):sel[f'run_{i+1}']=comp_mask(c)
r5=rows[5]
sel['idle_1']=comp_mask(r5[4]);sel['idle_2']=comp_mask(r5[5])
sel['sleep_1']=comp_mask(r5[0]);sel['sleep_2']=comp_mask(r5[1])
# hàng 4: cắt theo x (có mảnh hiệu ứng rời)
EDGE=[0,225,440,700,905,1150,1340,1536]
for k,name in [(0,'claw_1'),(1,'claw_2'),(2,'claw_3'),(3,'orb_1'),(4,'orb_2')]:
    m=np.zeros(fg.shape,bool);m[575:740,EDGE[k]:EDGE[k+1]]=fg[575:740,EDGE[k]:EDGE[k+1]]
    m[:600,:]&=False if False else True
    sel[name]=m
frames={}
for k,m in sel.items():
    ys,xs=np.where(m);bx0=xs.min()-(xs.min()%B);by0=ys.min()-(ys.min()%B)
    frames[k]=native(im[by0:ys.max()+1,bx0:xs.max()+1],m[by0:ys.max()+1,bx0:xs.max()+1],B)
out=quant(frames,64)
wid=np.mean([out[k].shape[1] for k in out if k.startswith('walk_')])
ANC={}
for k,f in out.items():
    h,w=f.shape[:2];a=f[...,3]>0;ys,xs=np.where(a)
    if k.startswith(('claw','orb')):ax=xs.min()+wid/2.
    else:ax=(xs.min()+xs.max()+1)/2.
    ANC[k]=(float(ax),float(ys.max()+1))
at,meta=pack(out,'cat',ANC,AW=520);print('cat',len(meta),at.shape,'walk w',wid)
contact(at,meta,'cat',cols=8,cw=110,ch=90,sc=1)
