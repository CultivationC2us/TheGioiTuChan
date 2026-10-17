import numpy as np
from PIL import Image
from extract_o import load, parts
def fitgrid(e,lo=9.2,hi=10.1):
    best=(-1,0,0);n=len(e)
    for P in np.arange(lo,hi,0.05):
        for ph in np.arange(0,P,0.5):
            idx=np.round(np.arange(ph,n,P)).astype(int);idx=idx[idx<n-1]
            sc=(e[idx]+0.5*e[np.clip(idx-1,0,n-1)]+0.5*e[np.clip(idx+1,0,n-1)]).sum()/len(idx)
            if sc>best[0]: best=(sc,P,ph)
    return best
def read_native(a,fg,sl,pad=12):
    y0=max(0,sl[0].start-pad);y1=sl[0].stop+pad;x0=max(0,sl[1].start-pad);x1=sl[1].stop+pad
    c=a[y0:y1,x0:x1];f=fg[y0:y1,x0:x1]
    ex=(np.abs(np.diff(c,axis=1)).sum(2)*(f[:,1:]&f[:,:-1])).sum(0);ey=(np.abs(np.diff(c,axis=0)).sum(2)*(f[1:]&f[:-1])).sum(1)
    _,Px,phx=fitgrid(ex);_,Py,phy=fitgrid(ey)
    xs=np.arange(phx+Px/2,c.shape[1],Px);ys=np.arange(phy+Py/2,c.shape[0],Py)
    h,w=len(ys),len(xs);out=np.zeros((h,w,4),np.uint8)
    for j,yy in enumerate(ys):
        for i,xx in enumerate(xs):
            yy0,xx0=int(yy),int(xx);win=(slice(max(0,yy0-2),yy0+3),slice(max(0,xx0-2),xx0+3))
            ff=f[win]
            if ff.mean()<.6: continue
            out[j,i]=[*np.median(c[win][ff],axis=0).astype(np.uint8),255]
    # cắt viền trống
    al=out[...,3]>0;ry=np.where(al.any(1))[0];rx=np.where(al.any(0))[0]
    ax=x0+phx+rx[0]*Px;ay=y0+phy+ry[0]*Py
    out=out[ry[0]:ry[-1]+1,rx[0]:rx[-1]+1]
    return out,(Px,Py),(ax,ay)
if __name__=='__main__':
    import json
    a,fg=load('o2.png');res={}
    for k,(sl,m) in enumerate(parts(fg,1,2500)):
        img,(Px,Py),_=read_native(a,fg,sl);Image.fromarray(img).save(f'nat_o2_{k}.png');res[k]=[img.shape[1],img.shape[0],round(Px,2),round(Py,2)];print(k,res[k])
