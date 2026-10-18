"""4 ảnh mới -> thư viện pixel (khối BxB, bảng màu rút gọn, alpha cứng).
Chạy từ nw/:  python3 lib/extract_all.py   -> lib/out/{ui,stone,book,mon}_atlas.png|webp + *_meta.json + contact_*.png"""
import sys, json, numpy as np
sys.path.insert(0,'lib')
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
from seg import key, seg
from rows import rows

def native(crop, mask, B):
    h,w=mask.shape; nh,nw=-(-h//B),-(-w//B)
    pr=np.zeros((nh*B,nw*B,3),np.float32); pm=np.zeros((nh*B,nw*B),bool)
    pr[:h,:w]=crop; pm[:h,:w]=mask
    cr=pr.reshape(nh,B,nw,B,3).transpose(0,2,1,3,4).reshape(nh,nw,B*B,3)
    mk=pm.reshape(nh,B,nw,B).transpose(0,2,1,3).reshape(nh,nw,B*B)
    cov=mk.mean(2); cr=np.where(mk[...,None],cr,np.nan)
    with np.errstate(all='ignore'): med=np.nanmedian(cr,axis=2)
    out=np.dstack([np.nan_to_num(med),(cov>=.5)*255]).astype(np.uint8)
    ys,xs=np.where(out[...,3]>0)
    return out[ys.min():ys.max()+1,xs.min():xs.max()+1]

def cutbox(im,fg,box,B,minpx=18):
    x0,y0,x1,y1=box
    m=np.zeros(fg.shape,bool); m[y0:y1,x0:x1]=fg[y0:y1,x0:x1]
    lab,n=ndi.label(ndi.binary_dilation(m,iterations=2),structure=np.ones((3,3)))
    keep=np.zeros_like(m)
    for i in range(1,n+1):
        mm=(lab==i)&m
        if mm.sum()>=minpx: keep|=mm
    ys,xs=np.where(keep)
    if len(xs)<minpx: return None
    bx0=xs.min()-(xs.min()%B); by0=ys.min()-(ys.min()%B)
    return native(im[by0:ys.max()+1,bx0:xs.max()+1],keep[by0:ys.max()+1,bx0:xs.max()+1],B)

def quant(frames,ncol):
    allpx=np.concatenate([f[f[...,3]>0][:,:3] for f in frames.values()]); uniq=np.unique(allpx,axis=0)
    pal=Image.fromarray(uniq.reshape(-1,1,3).astype(np.uint8)).quantize(ncol,method=Image.MEDIANCUT,dither=Image.NONE)
    pp=pal.getpalette()[:ncol*3]; pimg=Image.new('P',(1,1)); pimg.putpalette(pp+[0]*(768-len(pp)))
    out={}
    for k,f in frames.items():
        rgb=Image.fromarray(f[...,:3],'RGB').quantize(palette=pimg,dither=Image.NONE).convert('RGB')
        o=np.dstack([np.array(rgb),f[...,3]]); o[o[...,3]==0]=0; out[k]=o
    return out

def pack(frames,name,anchors=None,AW=420):
    items=sorted(frames.items(),key=lambda t:-t[1].shape[0]); x=y=rh=0; placed={}
    for k,f in items:
        h,w=f.shape[:2]
        if x+w+1>AW: x=0;y+=rh+1;rh=0
        placed[k]=(x,y);x+=w+1;rh=max(rh,h)
    AH=y+rh+1; at=np.zeros((AH,AW,4),np.uint8); meta={}
    for k,f in items:
        sx,sy=placed[k]; h,w=f.shape[:2]; at[sy:sy+h,sx:sx+w]=f
        meta[k]=[sx,sy,w,h]+([round(-anchors[k][0],1),round(-anchors[k][1],1)] if anchors else [])
    Image.fromarray(at,'RGBA').save(f'lib/out/{name}_atlas.png',optimize=True)
    Image.fromarray(at,'RGBA').save(f'lib/out/{name}_atlas.webp',lossless=True,quality=100,method=6)
    json.dump(meta,open(f'lib/out/{name}_meta.json','w'),separators=(',',':'))
    return at,meta

def contact(at,meta,name,cols=10,cw=150,ch=130,sc=2):
    names=list(meta); sheet=Image.new('RGBA',(cols*cw,-(-len(names)//cols)*ch),(36,70,60,255)); d=ImageDraw.Draw(sheet); A=Image.fromarray(at,'RGBA')
    for i,n in enumerate(names):
        sx,sy,w,h=meta[n][:4]; im2=A.crop((sx,sy,sx+w,sy+h)); s=min(sc,(cw-6)/w,(ch-18)/h); im2=im2.resize((max(1,int(w*s)),max(1,int(h*s))),Image.NEAREST)
        X,Y=(i%cols)*cw,(i//cols)*ch; sheet.alpha_composite(im2,(X+3,Y+16)); d.text((X+3,Y+2),n,fill=(255,255,0,255))
    sheet.convert('RGB').save(f'lib/out/contact_{name}.png')

def simple(path,dil,B,ncol,name,order,split=None):
    im,fg,c,lab=seg(path,dil)
    c.sort(key=order); frames={}
    for i,(x0,y0,x1,y1,lid) in enumerate(c):
        parts=[(x0,x1)]
        if split and i in split:
            n=split[i]; w=(x1-x0)/n; parts=[(int(x0+k*w),int(x0+(k+1)*w)) for k in range(n)]
        for j,(a,b) in enumerate(parts):
            f=cutbox(im,fg,(a,y0,b,y1),B)
            if f is not None: frames[f'{name[0]}{i}'+('abc'[j] if len(parts)>1 else '')]=f
    return frames

BU,BS,BK,BM=3,3,3,3
ui_order=lambda t:(round((t[1]+t[3])/2/40),t[0])
def main():
    # ---------- UI ----------
    ui_order=lambda t:(round((t[1]+t[3])/2/40),t[0])
    f=simple('lib/src_ui.png',3,BU,128,'u',ui_order,split={35:2,36:3})
    f=quant(f,128); at,m=pack(f,'ui',AW=640); contact(at,m,'ui',cols=12,cw=130,ch=120,sc=1)
    print('ui',len(m),at.shape)
    # ---------- đá ----------
    im,fg,c,lab=seg('lib/src_stone.png',3); R=rows(c,5); fr={}
    for r,row in enumerate(R):
        for k,(x0,y0,x1,y1,_) in enumerate(row): fr[f's{r}{k}']=cutbox(im,fg,(x0,y0,x1,y1),BS)
    fr=quant(fr,96); at,m=pack(fr,'stone',AW=400); contact(at,m,'stone',cols=8,cw=110,ch=100,sc=2); print('stone',len(m),at.shape)
    # ---------- sách / cuộn ----------
    im,fg,c,lab=seg('lib/src_book.png',3); R=rows(c,5); fr={}
    for r,row in enumerate(R):
        for k,(x0,y0,x1,y1,_) in enumerate(row): fr[f'k{r}{k}']=cutbox(im,fg,(x0,y0,x1,y1),BK)
    fr=quant(fr,128); at,m=pack(fr,'book',AW=480); contact(at,m,'book',cols=9,cw=120,ch=110,sc=2); print('book',len(m),at.shape)

if __name__=='__main__': main()
