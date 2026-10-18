"""Bảng 10 quái mới -> atlas 'mon10' (khung tên '<id>_<n>', neo chân/giữa). Chạy từ nw/: python3 lib/extract_mon10.py"""
import sys,json,numpy as np
sys.path.insert(0,'lib')
from extract_all import *
B=3
im,fg,c,lab=seg('lib/src_mon.png',5); R=rows(c,10)
BAND=[0,108,205,292,398,492,586,678,776,893,1024]
def X(r,*ids):
    a=min(R[r][i][0] for i in ids); b=max(R[r][i][2] for i in ids); return (a,b)
# id: (hàng, thân[], đất[], tay_dài[], {tên_khung:[idx...]})  — mọi khung còn lại coi là 'mid'
SP={
 'thachnhan':(0,range(0,6),[14,15,16],[6,8],{}),
 'dalinh':(1,range(0,8),[10,11,12,13],[],{}),
 'nhanhoa':(2,range(0,6),[13,14,15],[6],{}),
 'phapkhi':(3,range(0,7),[10,12,13],[],{}),
 'hoakhuyen':(4,range(0,6),[10,11,12],[],{}),
 'namlinh':(5,range(0,7),[9,10,11,12,13],[],{}),
 'cotxa':(6,range(0,6),[],[],{'d1':([11,12],'bot'),'d2':([13,14],'bot')}),
 'hoamoc':(7,range(0,6),[13,14],[],{'p0':([6,7],'mid'),'p1':([8],'mid'),'p2':([9],'mid')}),
 'bangtinh':(8,range(0,7),[14],[],{'p0':([7,8,9],'mid'),'p1':([10],'mid'),'p2':([11],'bot'),'p3':([12],'bot'),'p4':([13],'bot')}),
 'satrung':(9,range(0,6),[9,10,11],[],{'g':([12,13,14],'bot')}),
}
ALLF={};ANC={}
def anch(f,mode,w0=None):
    h,w=f.shape[:2];a=f[...,3]>0
    if mode=='mid':return w/2.,h/2.
    if mode=='bot':
        ys,xs=np.where(a);return float(xs.mean()),float(h)
    lab_,n=ndi.label(ndi.binary_dilation(a,iterations=1)); best=max(range(1,n+1),key=lambda i:((lab_==i)&a).sum())
    ys,xs=np.where((lab_==best)&a)
    if mode=='L':
        x0=xs.min();return x0+w0/2.,float(ys.max()+1)
    return (xs.min()+xs.max()+1)/2.,float(ys.max()+1)
for mid,(r,body,bot,lng,custom) in SP.items():
    ya,yb=BAND[r],BAND[r+1]; n=len(R[r]); frames={}; modes={}
    done=set()
    def add(name,idxs,mode):
        a,b=X(r,*idxs); f=cutbox(im,fg,(a,ya,b,yb),B)
        if f is not None: frames[name]=f;modes[name]=mode
    for nm,(idxs,md_) in custom.items(): add(nm,idxs,md_);done|=set(idxs)
    for i in range(n):
        if i in done:continue
        mode='body' if i in body else 'bot' if i in bot else 'mid'
        if i in lng: mode='L'
        add(f'f{i}',[i],mode)
    # tay dài / hàng 2: vòng hoa (idx 11) thuộc hàng 2, cột trụ thuộc hàng 3 — cắt theo dải y nên đã tách
    q=quant(frames,56); w0=q['f0'].shape[1]
    for k,f in q.items():
        ALLF[f'{mid}_{k}']=f; ANC[f'{mid}_{k}']=anch(f,modes[k],w0)
# hàng 3 (phapkhi): trụ sáng nằm trong khoảng x của hàng 2 idx 11
ya,yb=BAND[3],BAND[4]; a,b=1020,1095; f=cutbox(im,fg,(a,ya,b,yb),B)
if f is not None:
    q=quant({'p':f},56); ALLF['phapkhi_pil']=q['p']; ANC['phapkhi_pil']=anch(q['p'],'bot')
# hàng 2: vòng hoa
a,b=X(2,11); f=cutbox(im,fg,(a,BAND[2],b,BAND[3]),B)
if f is not None:
    q=quant({'p':f},56); ALLF['nhanhoa_ring']=q['p']; ANC['nhanhoa_ring']=anch(q['p'],'mid')
at,meta=pack(ALLF,'mon10',ANC,AW=420)
print(len(meta),at.shape)
names=list(meta);cols=10;cw,ch=150,130;sheet=Image.new('RGBA',(cols*cw,-(-len(names)//cols)*ch),(36,70,60,255));d=ImageDraw.Draw(sheet);A=Image.fromarray(at,'RGBA')
for i,n in enumerate(names):
    sx,sy,w,h=meta[n][:4];im2=A.crop((sx,sy,sx+w,sy+h));s=min(3,(cw-6)/w,(ch-18)/h);im2=im2.resize((max(1,int(w*s)),max(1,int(h*s))),Image.NEAREST)
    X0,Y0=(i%cols)*cw,(i//cols)*ch;sheet.alpha_composite(im2,(X0+3,Y0+16));d.text((X0+3,Y0+2),n,fill=(255,255,0,255))
sheet.convert('RGB').save('lib/out/contact_mon10.png')
