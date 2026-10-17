import numpy as np, json
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
def comps(k,dil=5,minarea=150):
    im=np.array(Image.open(f'mon/src_{k}.png').convert('RGB')).astype(np.float32)
    r,g,b=im[...,0],im[...,1],im[...,2]
    near=(r>165)&(b>165)&(g<120)&(np.abs(r-b)<75)
    fg=~near
    lab,n=ndi.label(ndi.binary_dilation(fg,iterations=dil))
    out=[]
    for i,sl in enumerate(ndi.find_objects(lab)):
        m=(lab[sl]==i+1)&fg[sl]; a=int(m.sum())
        if a<minarea: continue
        out.append(dict(x0=sl[1].start,x1=sl[1].stop,y0=sl[0].start,y1=sl[0].stop,area=a))
    # sắp xếp: nhóm hàng theo tâm y (dung sai 70) rồi x
    out.sort(key=lambda c:((c['y0']+c['y1'])//2,c['x0']))
    rows=[];
    for c in sorted(out,key=lambda c:(c['y0']+c['y1'])/2):
        cy=(c['y0']+c['y1'])/2
        for rw in rows:
            if abs(rw['cy']-cy)<75: rw['c'].append(c);rw['cy']=np.mean([ (q['y0']+q['y1'])/2 for q in rw['c']]);break
        else: rows.append(dict(cy=cy,c=[c]))
    res=[]
    for ri,rw in enumerate(rows):
        for ci,c in enumerate(sorted(rw['c'],key=lambda c:c['x0'])):
            c['row']=ri;c['col']=ci;res.append(c)
    return res,im
if __name__=='__main__':
    for k in ('hoa','tho','kim','moc'):
        cs,im=comps(k)
        pil=Image.fromarray(im.astype(np.uint8));d=ImageDraw.Draw(pil)
        for c in cs:
            d.rectangle([c['x0'],c['y0'],c['x1'],c['y1']],outline=(255,255,0))
            d.text((c['x0']+2,c['y0']+1),f"{c['row']}.{c['col']}",fill=(255,255,255))
        pil.save(f'mon/idx_{k}.png'); print(k,len(cs),'comps; per row:',[sum(1 for c in cs if c['row']==r) for r in range(max(c['row'] for c in cs)+1)])
