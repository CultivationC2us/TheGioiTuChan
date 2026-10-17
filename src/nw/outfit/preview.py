import json,sys
from PIL import Image
import numpy as np
M=json.load(open('meta.json'));A=Image.open('atlas.png');B=Image.open('../assets/player.png').convert('RGBA')
S=8;W,H=76,90
HD=json.load(open('headoff.json')) if __import__('os').path.exists('headoff.json') else None
def piece(n,key=None,flip=False):
    p=M['pos'][n];im=A.crop((p[0],p[1],p[0]+p[2],p[1]+p[3]));d=M[key or n]
    return im.resize((max(1,round(d[2]*S)),max(1,round(d[3]*S))),Image.BILINEAR),d
def frame(row,fr,sleeves=False,hdx=0,hdy=0,var='open'):
    c=Image.new('RGBA',(W*S,H*S),(0,0,0,0))
    base=B.crop((fr*W,row*H,fr*W+W,row*H+H)).resize((W*S,H*S),Image.NEAREST)
    # chỉ giữ thân (từ y>=56)
    base=base.crop((0,0,W*S,H*S));arr=np.array(base);arr[:56*S]=0;c.alpha_composite(Image.fromarray(arr))
    im,d=piece('torso');c.alpha_composite(im,(round(d[0]*S),round(d[1]*S)))
    for n in('bootL','bootR'):
        im,d=piece(n);c.alpha_composite(im,(round(d[0]*S),round(d[1]*S)))
    if sleeves:
        for n in('slL','slR'):
            im,d=piece(n);c.alpha_composite(im,(round(d[0]*S),round(d[1]*S)))
    im,d=piece('head_'+var,'head');c.alpha_composite(im,(round((d[0]+hdx)*S),round((d[1]+hdy)*S)))
    return c
sel=[(0,0,'open'),(0,4,'closed'),(0,3,'half'),(1,2,'open'),(1,5,'open'),(2,1,'open'),(2,3,'open'),(2,5,'open'),(2,7,'open'),(3,0,'closed')]
sheet=Image.new('RGBA',(len(sel)*W*S//2,H*S//2),(70,110,70,255))
for i,(r,f,v) in enumerate(sel):
    c=frame(r,f,sleeves=('sl' in sys.argv),var=v);sheet.alpha_composite(c.resize((W*S//2,H*S//2),Image.LANCZOS),(i*W*S//2,0))
sheet.convert('RGB').save('preview_sheet.png');print(sheet.size)
