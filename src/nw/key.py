import numpy as np
from PIL import Image
im=np.array(Image.open('/root/.claude/uploads/3557922d-097f-524e-bc43-9c215c1e40de/3cb04104-image.png').convert('RGB')).astype(np.float32)
r,g,b=im[...,0],im[...,1],im[...,2]
m=np.minimum(r,b)-g
a=1-np.clip((m-70)/(170-70),0,1)
a[a<0.04]=0
# khử viền hồng
out=np.zeros(im.shape[:2]+(4,),np.float32)
key=np.array([255,0,255],np.float32)
aa=np.maximum(a,1e-3)[...,None]
col=(im-(1-aa)*key)/aa
col=np.clip(col,0,255)
out[...,:3]=col;out[...,3]=a*255
# khử tint hồng còn lại: nếu r,b > g+30 và alpha<1 kéo r,b về g
spill=(a>0)&(a<1)
for ch in (0,2):
    out[...,ch]=np.where(spill,np.minimum(out[...,ch],out[...,1]+25),out[...,ch])
Image.fromarray(out.astype(np.uint8),'RGBA').save('nw/dr/keyed.png')
A=(out[...,3]>40)
print(A.sum())
# dải hàng
rows=A.sum(1)
inb=False
for y,v in enumerate(rows):
    if v>3 and not inb: s=y;inb=True
    if v<=3 and inb:
        inb=False
        if y-s>20:print('row band',s,y)
