"""5 công pháp (icon + hiệu ứng) -> atlas 'skill' (khung '<id>_<n>'; icon '<id>_ic'). Chạy từ nw/: python3 lib/extract_skill.py"""
import sys,json,numpy as np
sys.path.insert(0,'lib')
from extract_all import *
B=3
im,fg,comps,lab=seg('lib/src_skill.png',1,8)
BAND=[(0,146),(146,287),(287,426),(426,568),(568,724)]
# cắt theo trục x (nguồn 2172 px): [mép trái hiệu ứng, ..., mép phải]
CUT={
 'tho':[150,290,388,535,730,960,1236,1568,1901,2172],
 'thuy':[150,262,388,509,640,776,938,1054,1240,1612,1812,2172],
 'hoa':[150,258,340,462,609,790,956,1240,1574,1849,2172],
 'kim':[150,262,384,507,631,730,830,954,1094,1146,1275,1568,1850,2172],
 'moc':[150,265,356,477,642,811,968,1130,1345,1585,1870,2172]}
ORDER=['tho','thuy','hoa','kim','moc']
frames={};ANC={};ICONS={}
# nhãn gốc (dil=1): dựng bản đồ nhãn -> mặt nạ theo thành phần
for r,id in enumerate(ORDER):
    ya,yb=BAND[r]; cuts=CUT[id]
    # icon
    ic=cutbox(im,fg,(10,ya,150,yb),1)
    ICONS[id]=ic
    for i in range(len(cuts)-1):
        x0,x1=cuts[i],cuts[i+1]
        m=np.zeros(fg.shape,bool)
        for cx0,cy0,cx1,cy1,lid in comps:
            cx=(cx0+cx1)/2;cy=(cy0+cy1)/2
            if cy1-cy0>200:   # thành phần dính dọc nhiều hàng -> chỉ lấy điểm nằm trong dải y của hàng này
                if not(x0<=cx<x1): continue
                sub=(lab[cy0:cy1,cx0:cx1]==lid)&fg[cy0:cy1,cx0:cx1]
                yy=np.arange(cy0,cy1)[:,None]
                sub&=(yy>=ya-4)&(yy<yb+4)
                sub[:, :max(0,x0-cx0)]=False; sub[:, max(0,x1-cx0):]=False
                m[cy0:cy1,cx0:cx1]|=sub
            elif x0<=cx<x1 and ya<=cy<yb: m[cy0:cy1,cx0:cx1]|=(lab[cy0:cy1,cx0:cx1]==lid)&fg[cy0:cy1,cx0:cx1]
        ys,xs=np.where(m)
        if len(xs)<30: print('rỗng',id,i);continue
        bx0=xs.min()-(xs.min()%B);by0=ys.min()-(ys.min()%B)
        f=native(im[by0:ys.max()+1,bx0:xs.max()+1],m[by0:ys.max()+1,bx0:xs.max()+1],B)
        frames[f'{id}_{i+1}']=f

MODE={'tho':lambda i:'mid','thuy':lambda i:'mid' if i<=4 else 'bot','hoa':lambda i:'mid' if i<=7 else 'bot','kim':lambda i:'bot','moc':lambda i:'mid' if i<=5 else 'bot'}
out={}
for id in ORDER:
    sub={k:v for k,v in frames.items() if k.startswith(id+'_')}
    out.update(quant(sub,96))
for k,f in out.items():
    id,i=k.rsplit('_',1);h,w=f.shape[:2];a=f[...,3]>0;ys,xs=np.where(a)
    if MODE[id](int(i))=='mid': ANC[k]=((xs.min()+xs.max()+1)/2.,(ys.min()+ys.max()+1)/2.)
    else: ANC[k]=((xs.min()+xs.max()+1)/2.,h*0.92)
at,meta=pack(out,'skill',ANC,AW=900);print('skill',len(meta),at.shape)
contact(at,meta,'skill',cols=8,cw=170,ch=140,sc=1)
at2,m2=pack({id+'_ic':ICONS[id] for id in ORDER},'skic',AW=700);print('icons',at2.shape)
