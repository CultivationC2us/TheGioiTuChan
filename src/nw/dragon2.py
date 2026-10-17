import json,numpy as np
from PIL import Image
K=Image.open('nw/dr/keyed.png');B=json.load(open('nw/dr/boxes.json'))
SC=0.36
def crop(r,i,x1=None):
    b=B[r][i]; x1=b[2] if x1 is None else x1
    return K.crop((b[0],b[1],x1+1,b[3]+1))
def scale_pm(im,s):
    a=np.array(im).astype(np.float32);al=a[...,3:4]/255
    pm=np.concatenate([a[...,:3]*al,a[...,3:4]],2)
    w,h=max(1,round(im.width*s)),max(1,round(im.height*s))
    t=Image.fromarray(pm.astype(np.uint8),'RGBA')  # premult stored in rgba (alpha plain)
    # BOX downscale on premultiplied floats
    out=np.zeros((h,w,4),np.float32)
    # area average via PIL on each channel (float 'F')
    chs=[np.array(Image.fromarray(pm[...,c]).resize((w,h),Image.BOX)) for c in range(4)]
    out=np.stack(chs,2).astype(np.float32)
    A=out[...,3:4]
    rgb=np.where(A>0,out[...,:3]/np.maximum(A/255,1e-3),0)
    res=np.concatenate([np.clip(rgb,0,255),A],2)
    return Image.fromarray(res.astype(np.uint8),'RGBA')
def harden(im,th=110):
    a=np.array(im);a[...,3]=np.where(a[...,3]>=th,255,0);return Image.fromarray(a,'RGBA')   # alpha cứng như pixel art
frames={}   # name -> (RGBA image)
def add(name,img): frames[name]=harden(scale_pm(img,SC),128)
for i in range(8): add(f'idle{i}',crop(0,i)); add(f'walk{i}',crop(1,i))
for i in range(3): add(f'atk{i}',crop(2,i))
b23=B[2][3]; SPLIT=567+150
add('atk3',crop(2,3,x1=SPLIT))
beamA=K.crop((SPLIT+1,b23[1],b23[2]+1,b23[3]+1));beamB=crop(2,4)
add('atk5',crop(2,5))
for i in range(7): add(f'dive{i}',crop(3,i))
for i in range(7): add(f'hurt{i}',crop(4,i))
for i in range(7): add(f'die{i}',crop(5,i))
beams={'beamA':harden(scale_pm(beamA,SC)),'beamB':harden(scale_pm(beamB,SC))}
# ---- căn khung ----
CW,CH=90,77
ref=frames['idle0'];rw,rh=ref.size
RX=CW-8-rw; RY=CH-5-rh     # đặt idle0 sát đáy
def mask(im):return np.array(im)[...,3]>0
def place(im,x,y):
    c=Image.new('RGBA',(CW,CH),(0,0,0,0));c.alpha_composite(im,(x,y));return c
refm=mask(place(ref,RX,RY))
cx0=RX+rw//2
standing=[f'idle{i}' for i in range(8)]+[f'walk{i}' for i in range(8)]+['atk0','atk1','atk2','atk3','atk5','dive0','dive6','hurt0','hurt1','hurt2','hurt6']
out={};meta={}
for name,im in frames.items():
    w,h=im.size
    if name in standing:
        x0=CW-8-w; y0=CH-5-h
        best=None
        for dx in range(-5,6):
            for dy in range(-4,5):
                m=mask(place(im,x0+dx,y0+dy))
                # bỏ vùng đuôi (30% trái) khi so
                sel=np.zeros_like(m);sel[:,RX+int(rw*.3):]=True
                inter=(m&refm&sel).sum();uni=((m|refm)&sel).sum();s=inter/uni
                if best is None or s>best[0]:best=(s,dx,dy)
        x,y=x0+best[1],y0+best[2]
    else:
        # nằm/hiệu ứng: căn đáy + tâm ngang theo tâm idle
        x=cx0-w//2; y=CH-5-h
        if name.startswith('hurt') or name.startswith('die') and name!='die0':
            x=CW-8-w   # đầu bên phải
        if name in('dive1',): x=CW-8-w
    out[name]=place(im,x,y)
names=list(out.keys())
cols=10;rows=(len(names)+cols-1)//cols
at=Image.new('RGBA',(CW*cols,CH*rows),(0,0,0,0))
for i,n in enumerate(names): at.paste(out[n],((i%cols)*CW,(i//cols)*CH));meta[n]=i
at.save('nw/dr2/atlas.png')
for k,v in beams.items(): v.save(f'nw/dr2/{k}.png');print(k,v.size)
json.dump({'CW':CW,'CH':CH,'cols':cols,'idx':meta,'ax':cx0,'ay':CH-5},open('nw/dr2/meta.json','w'))
print(len(names),at.size,cx0)
# xem
pv=Image.new('RGBA',at.size,(40,70,90,255));pv.alpha_composite(at);pv.save('nw/dr2/atlas_pv.png')
