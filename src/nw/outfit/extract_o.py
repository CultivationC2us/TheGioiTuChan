"""Tách trang phục GPT -> mảnh pixel theo lưới nhân vật (1 ô = 1 pixel nhân vật).
Chạy từ nw/outfit/: python3 extract_o.py  -> parts_*.png (nhỏ, 1px=1ô) + parts.json"""
import numpy as np, json
from PIL import Image
from scipy import ndimage as ndi
def load(n):
    a=np.array(Image.open(n).convert('RGB')).astype(np.float32)
    d=np.sqrt(((a-np.array([255,0,255],np.float32))**2).sum(2))
    near=d<75
    lab,k=ndi.label(near)
    border=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0}
    bg=np.isin(lab,list(border))      # chỉ nền nối với mép ảnh (mắt tím nằm trong đầu được giữ)
    halo=ndi.binary_dilation(bg,iterations=2)&(d<135)&((np.minimum(a[...,0],a[...,2])-a[...,1])>95)
    bg=bg|halo
    return a,~bg
def parts(fg,cut_dil=2,minarea=2500):
    lab,n=ndi.label(ndi.binary_dilation(fg,iterations=cut_dil))
    out=[]
    for i,sl in enumerate(ndi.find_objects(lab)):
        m=(lab[sl]==i+1)&fg[sl]
        if m.sum()>=minarea: out.append((sl,m))
    return out
def quant(a,fg,sl,cell,phase=None):
    """Chia thành ô cell×cell, chọn pha (ox,oy) ít phương sai nhất; trả (rgba nhỏ, pha)."""
    y0,y1,x0,x1=sl[0].start,sl[0].stop,sl[1].start,sl[1].stop
    best=None
    for oy in range(0,int(cell),2):
        for ox in range(0,int(cell),2):
            if phase and (ox,oy)!=phase: continue
            X0=x0-ox;Y0=y0-oy
            w=int(np.ceil((x1-X0)/cell));h=int(np.ceil((y1-Y0)/cell))
            v=0;cnt=0
            for j in range(h):
                for i in range(w):
                    ys=slice(max(0,int(Y0+j*cell)),int(Y0+(j+1)*cell));xs=slice(max(0,int(X0+i*cell)),int(X0+(i+1)*cell))
                    f=fg[ys,xs];
                    if f.sum()<8: continue
                    c=a[ys,xs][f];v+=c.var(axis=0).sum()*f.sum();cnt+=f.sum()
            sc=v/max(cnt,1)
            if best is None or sc<best[0]: best=(sc,ox,oy)
    _,ox,oy=best;X0=x0-ox;Y0=y0-oy
    w=int(np.ceil((x1-X0)/cell));h=int(np.ceil((y1-Y0)/cell))
    out=np.zeros((h,w,4),np.uint8)
    for j in range(h):
        for i in range(w):
            ys=slice(max(0,int(round(Y0+j*cell))),int(round(Y0+(j+1)*cell)));xs=slice(max(0,int(round(X0+i*cell))),int(round(X0+(i+1)*cell)))
            f=fg[ys,xs]
            if f.size and f.mean()>=.5:
                px=a[ys,xs][f];lum=px.mean(axis=1);dk=lum<70
                if dk.mean()>.42: px=px[dk]
                else:
                    gd=(px[:,0]>200)&(px[:,1]>140)&(px[:,2]<130)   # nét vàng mảnh: ưu tiên nếu đủ nhiều
                    if gd.mean()>.30: px=px[gd]
                    elif (~dk).sum()>=6: px=px[~dk]
                q=(px//24).astype(int);key=q[:,0]*100+q[:,1]*10+q[:,2];vals,inv=np.unique(key,return_inverse=True)
                top=np.argmax(np.bincount(inv));c=px[inv==top].mean(axis=0);out[j,i]=[*c.astype(np.uint8),255]
    return out,(ox,oy,X0,Y0)
if __name__=='__main__':
    res={}
    for tag,fn,cell in [('o2','o2.png',19.0),('o1','o1.png',17.0)]:
        a,fg=load(fn)
        for k,(sl,m) in enumerate(parts(fg,1,2500)):
            img,info=quant(a,fg,sl,cell)
            Image.fromarray(img).save(f'part_{tag}_{k}.png')
            res[f'{tag}_{k}']={'box':[sl[1].start,sl[0].start,sl[1].stop,sl[0].stop],'cell':cell,'size':[img.shape[1],img.shape[0]],'origin':[info[2],info[3]]}
            print(tag,k,res[f'{tag}_{k}'])
    json.dump(res,open('parts.json','w'))
