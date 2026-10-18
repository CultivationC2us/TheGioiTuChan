import numpy as np, json
from PIL import Image
from scipy import ndimage as ndi
im=Image.open('/root/.claude/uploads/3557922d-097f-524e-bc43-9c215c1e40de/62126160-image.png').convert('RGB')
a=np.asarray(im).astype(float);R,G,B=a[...,0],a[...,1],a[...,2]
m=np.clip((np.minimum(R,B)-G)/255,0,1)
al=1-m
al=np.where(al<.07,0,al)
al=np.clip((al-.07)/.93,0,1)
al=np.where(m>.93,0,al)
M=np.array([255,0,255.])
with np.errstate(divide='ignore',invalid='ignore'):
    C=(a-(1-al[...,None])*M)/np.maximum(al[...,None],.02)
C=np.clip(C,0,255)
rgba=np.dstack([C,al*255]).astype(np.uint8)
bands=[(0,159,'cloud','c'),(167,322,'bolt','b'),(329,450,'spread','g'),(457,586,'ring','g')]
out={};frames=[]
for (y0,y1,name,anc) in bands:
    sub=(al[y0:y1+1]>.25)
    lab,n=ndi.label(sub,structure=np.ones((3,3)))
    objs=ndi.find_objects(lab)
    # label digits: small comps (h<=13,w<=26) near the bottom of band; title box: touches x<400,y<34 and dark/white
    info=[]
    for i,sl in enumerate(objs):
        h=sl[0].stop-sl[0].start;w=sl[1].stop-sl[1].start;cnt=(lab[sl]==i+1).sum()
        info.append((i+1,sl,h,w,cnt))
    def white(o):
        sl=o[1];mk=(lab[sl]==o[0]);px=a[y0+sl[0].start:y0+sl[0].stop,sl[1].start:sl[1].stop][mk];return 255*(px.min(1)>200).mean()+0
    digits=[o for o in info if 12<=o[2]<=19 and 11<=o[3]<=34 and o[1][0].start>(y1-y0)-28 and white(o)>15]
    title=[o for o in info if o[1][0].start<16 and o[1][1].start<24 and o[3]>60 and o[2]<40]
    skip={o[0] for o in digits}|{o[0] for o in title}
    dx=sorted([(o[1][1].start+o[1][1].stop)/2 for o in digits])
    # merge digit pairs (2-digit numbers) closer than 24px
    cx=[]
    for x in dx:
        if cx and x-cx[-1][-1]<24:cx[-1].append(x)
        else:cx.append([x])
    cx=[sum(c)/len(c) for c in cx]
    bounds=[0]+[(cx[i]+cx[i+1])/2 for i in range(len(cx)-1)]+[1e9]
    mask=np.isin(lab,list(skip));
    keep=(lab>0)&~mask
    # also pull in faint halo: use al>0 inside same band but only where near keep (dilate)
    near=ndi.binary_dilation(keep,iterations=6)
    full=(al[y0:y1+1]>0)&near
    # remove title-box zone and digits zone pixels explicitly
    for o in digits+title:
        sl=o[1];full[max(0,sl[0].start-2):sl[0].stop+2,max(0,sl[1].start-2):sl[1].stop+2]&=False
    fr=[]
    if name=='cloud':
        areas={o[0]:o[4] for o in info if o[0] not in skip}
        mains=[o for o in info if o[0] not in skip and o[4]>=1200]
        mains.sort(key=lambda o:o[1][1].start)
        groups={o[0]:[o[0]] for o in mains}
        for o in info:
            if o[0] in skip or o[4]>=1200 or o[4]<12:continue
            ccx=(o[1][1].start+o[1][1].stop)/2;ccy=(o[1][0].start+o[1][0].stop)/2
            best=None
            for q in mains:
                sl=q[1]
                if sl[1].start-35<=ccx<=sl[1].stop+35 and sl[0].start-35<=ccy<=sl[0].stop+35:
                    d=abs(ccx-(sl[1].start+sl[1].stop)/2)
                    if best is None or d<best[0]:best=(d,q[0])
            if best:groups[best[1]].append(o[0])
        for o in mains:
            part=np.isin(lab,groups[o[0]])&(al[y0:y1+1]>0)
            part=ndi.binary_dilation(part,iterations=5)&(al[y0:y1+1]>0)&~np.isin(lab,[q for q in skip])
            ys,xx=np.where(part);t,b,l,r=ys.min(),ys.max()+1,xx.min(),xx.max()+1
            crop=rgba[y0+t:y0+b,l:r].copy();crop[~part[t:b,l:r]]=0
            fr.append((crop,(r-l)/2,b))
        out[name]=fr;print(name,len(fr),[c[0].shape[:2] for c in fr]);continue
    for k in range(len(cx)):
        xs,xe=int(bounds[k]),int(min(bounds[k+1],1536))
        part=np.zeros_like(full);part[:,xs:xe]=full[:,xs:xe]
        ys,xx=np.where(part)
        if len(ys)<30:continue
        t,b,l,r=ys.min(),ys.max()+1,xx.min(),xx.max()+1
        crop=rgba[y0+t:y0+b,l:r].copy();crop[~part[t:b,l:r]]=0
        fr.append((crop,cx[k]-l,b,)) # anchor x (rel), bottom
    out[name]=fr;print(name,len(cx),len(fr),[c[0].shape[:2] for c in fr][:3])
# pack
import math
W=1536;x=y=rowh=0;meta={};pad=2;placed=[]
for name,fr in out.items():
    for i,(c,ax,bt) in enumerate(fr):
        h,w=c.shape[:2]
        if x+w+pad>W:x=0;y+=rowh+pad;rowh=0
        placed.append((name,i,x,y,c,ax,h));x+=w+pad;rowh=max(rowh,h)
H=y+rowh+pad
atl=np.zeros((H,W,4),np.uint8)
for name,i,px,py,c,ax,h in placed:
    atl[py:py+c.shape[0],px:px+c.shape[1]]=c
    meta.setdefault(name,[]).append([px,py,c.shape[1],c.shape[0],round(ax,1)])
Image.fromarray(atl).save('kie/kie.png');Image.fromarray(atl).save('kie/kie.webp',quality=88,method=6)
json.dump(meta,open('kie/meta.json','w'))
import os;print(atl.shape,os.path.getsize('kie/kie.webp'))
