import numpy as np, json, sys
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
OUT='nw/lib/nat/'
def comps(path,sid):
    im=np.array(Image.open(path).convert('RGB')).astype(int)
    R,G,B=im[...,0],im[...,1],im[...,2]
    bg=(R>200)&(B>200)&(G<95)
    fg=~bg
    fg=ndi.binary_opening(fg,iterations=1)
    fg=ndi.binary_erosion(fg,iterations=1)|(ndi.binary_erosion(fg,iterations=1)&False)
    lab,n=ndi.label(ndi.binary_dilation(fg,iterations=2))
    res=[]
    for i,sl in enumerate(ndi.find_objects(lab),1):
        h=sl[0].stop-sl[0].start;w=sl[1].stop-sl[1].start
        m=(lab[sl]==i)&fg[sl]
        if m.sum()<260 or max(h,w)<14: continue
        rgb=im[sl].astype(np.uint8);a=(m*255).astype(np.uint8)
        # khử viền hồng: pixel biên có R,B cao hơn G nhiều -> kéo về trung tính
        edge=m&~ndi.binary_erosion(m,iterations=1)
        px=rgb.copy()
        tint=np.clip(np.minimum(px[...,0].astype(int),px[...,2].astype(int))-px[...,1].astype(int),0,255)
        k=(edge&(tint>60))
        px[k]=(px[k]*0.5).astype(np.uint8)
        res.append((sid,sl[1].start,sl[0].start,w,h,np.dstack([px,a])))
    return res
allc=[]
for sid,f in enumerate(['s1','s2','s3']):
    c=comps(OUT+f+'.png',sid);c.sort(key=lambda t:(t[2]//90,t[1]));allc+=c;print(f,len(c))
np.save(OUT+'comps.npy',np.array([None]+allc,dtype=object),allow_pickle=True)
# contact sheets
CW=110
for sid in range(3):
    sel=[(i,c) for i,c in enumerate(allc) if c[0]==sid]
    cols=13;rows=(len(sel)+cols-1)//cols
    sh=Image.new('RGB',(cols*CW,rows*CW),(60,40,70));d=ImageDraw.Draw(sh)
    for k,(i,c) in enumerate(sel):
        t=Image.fromarray(c[5]);t.thumbnail((CW-14,CW-24));x=(k%cols)*CW+5;y=(k//cols)*CW+14
        sh.paste(t,(x,y+(CW-24-t.height)),t);d.text((x,y-12),str(i),fill=(255,255,0))
    sh.save(OUT+f'contact{sid}.png');print(sid,len(sel),sh.size)
