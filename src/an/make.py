import numpy as np, json
from PIL import Image, ImageDraw, ImageFont
b=np.array(Image.open('pix/nv13_luoi_that.png').convert('RGBA'))
H,W=b.shape[:2]
# 1) xoá viền xanh lá còn sót
for y in range(H):
    for x in range(W):
        r,g,bb,a=[int(v) for v in b[y,x]]
        if a and g>r+8 and g>bb: b[y,x]=(0,0,0,0)
SKIN=tuple(b[12,20]); OUT=tuple(b[1,20]); 
PW,PH,OX,OY=76,90,14,22           # khung chuẩn, nhân vật đặt tại (OX,OY)
def blank(): return np.zeros((PH,PW,4),np.uint8)
def cut(x0,x1,y0,y1):
    m=np.zeros((H,W),bool); m[y0:y1+1,x0:x1+1]=True; return m&(b[...,3]>0)
head=cut(0,W-1,0,32)
armL=cut(10,13,36,40); armR=cut(25,28,36,40)
legL=cut(15,19,43,48); legR=cut(20,24,43,48)
body=(b[...,3]>0)&~head&~armL&~armR&~legL&~legR
def put(cv,mask,dx=0,dy=0,src=None):
    src=b if src is None else src
    ys,xs=np.nonzero(mask)
    for y,x in zip(ys,xs):
        X,Y=x+OX+dx,y+OY+dy
        if 0<=X<PW and 0<=Y<PH: cv[Y,X]=src[y,x]
LID=(70,36,34,255)
def eyes(mode):
    s=b.copy()
    if mode=='open': return s
    for x0,x1 in((13,19),(28,33)):
        top=19 if mode=='closed' else 23
        for y in range(18,29):
            if mode=='half' and y>=top and y<=28: continue
            for x in range(x0,x1+1):
                if s[y,x,3] and not(y<top and mode=='half'): pass
        for y in range(18,29):
            for x in range(x0,x1+1):
                if not s[y,x,3]: continue
                if mode=='closed' or y<top: s[y,x]=SKIN
        if mode=='half':
            for x in range(x0,x1+1): s[top,x]=LID
        else:
            for x in range(x0+1,x1): s[24,x]=LID
            s[23,x0]=LID; s[23,x1]=LID
    return s
def putsh(cv,mask,off,sh,src):
    ys,xs=np.nonzero(mask); y0=ys.min(); h=ys.max()-y0
    for y,x in zip(ys,xs):
        r=y-y0; dxx=round(sh*r/max(1,h))
        X,Y=x+OX+off[0]+dxx,y+OY+off[1]
        if 0<=X<PW and 0<=Y<PH: cv[Y,X]=src[y,x]
def frame(src=None,hd=(0,0),lL=(0,0),lR=(0,0),aL=(0,0),aR=(0,0),sword=None,shL=0,shR=0):
    cv=blank(); src=b if src is None else src
    if sword: limb(cv,(23,36),sword[0])
    put(cv,body,src=src)
    putsh(cv,legL,lL,shL,src); putsh(cv,legR,lR,shR,src)
    put(cv,head,*hd,src=src)
    if sword: draw_sword(cv,*sword)
    put(cv,armL,*aL,src=src)
    if sword: fist(cv,sword[0])
    else: put(cv,armR,*aR,src=src)
    return cv
BL=(228,236,246,255);BD=(40,36,60,255);GOLD=(235,190,70,255);BRN=(120,70,40,255)
def line(p,q):
    (x0,y0),(x1,y1)=p,q;n=max(abs(x1-x0),abs(y1-y0));return [(round(x0+(x1-x0)*i/n),round(y0+(y1-y0)*i/n)) for i in range(n+1)]
def draw_sword(cv,hand,tip):
    hx,hy=hand[0]+OX,hand[1]+OY; tx,ty=tip[0]+OX,tip[1]+OY
    dx,dy=tx-hx,ty-hy; n=max(abs(dx),abs(dy)); ux,uy=dx/n,dy/n; px,py=-uy,ux
    L=(dx*dx+dy*dy)**.5; allp=set(); light=set(); hi=set(); guard=set()
    import math
    for i in range(int(L*1.2)+1):
        t=i/ (L*1.2) *L
        if t<3.5: continue
        cx,cy=hx+ux*t,hy+uy*t
        for k in(-1,0,1):
            p=(round(cx+px*k),round(cy+py*k)); light.add(p)
            if k==0: hi.add(p)
    for k in range(-4,5):
        for t in(3,2.5):
            guard.add((round(hx+ux*t+px*k),round(hy+uy*t+py*k)))
    allp=light|guard
    for q in list(allp):
        for ox in(-1,0,1):
            for oy in(-1,0,1):
                Q=(q[0]+ox,q[1]+oy)
                if Q not in allp and 0<=Q[0]<PW and 0<=Q[1]<PH: cv[Q[1],Q[0]]=BD
    light={p for p in light if 0<=p[0]<PW and 0<=p[1]<PH};hi={p for p in hi if p in light};guard={p for p in guard if 0<=p[0]<PW and 0<=p[1]<PH}

    for p in light: cv[p[1],p[0]]=(160,176,205,255)
    for p in hi: cv[p[1],p[0]]=(246,250,255,255)
    for p in guard: cv[p[1],p[0]]=GOLD
def limb(cv,sh,hand):
    p0=(sh[0]+OX,sh[1]+OY);p1=(hand[0]+OX,hand[1]+OY);pts=line(p0,p1)
    steep=abs(p1[1]-p0[1])>abs(p1[0]-p0[0])
    off=[(-1,0),(0,0),(1,0)] if steep else [(0,-1),(0,0),(0,1)]
    inner=set()
    for (x,y) in pts:
        for ox,oy in off: inner.add((x+ox,y+oy))
    S=set()
    for (x,y) in inner:
        for ox in(-1,0,1):
            for oy in(-1,0,1): S.add((x+ox,y+oy))
    for q in S-inner: cv[q[1],q[0]]=OUT
    for q in inner: cv[q[1],q[0]]=SKIN
def fist(cv,hand):
    hx,hy=hand[0]+OX,hand[1]+OY
    for y in range(-2,3):
        for x in range(-2,3):
            if abs(x)==2 and abs(y)==2: continue
            cv[hy+y,hx+x]=OUT if max(abs(x),abs(y))==2 else SKIN
    cv[hy,hx-1]=(230,150,120,255)
F={}
op,hf,cl=eyes('open'),eyes('half'),eyes('closed')
F['idle']=[frame(op),frame(op,hd=(0,1)),frame(op,hd=(0,1)),frame(hf,hd=(0,1)),frame(cl,hd=(0,0)),frame(hf,hd=(0,0))]
SR=[-2,-1,0,1,2,1,0,-1]            # độ vung gót chân phải: sau -> trước -> sau
SLg=[SR[(i+4)%8] for i in range(8)]  # chân trái lệch pha nửa chu kỳ
LIFT=[0,1,1,1,0,0,0,0]               # chân đang đưa ra trước thì nhấc 1px
AL=[(0,1)]*3+[(0,0)]+[(0,-1)]*3+[(0,0)]
AR=[(0,-1)]*3+[(0,0)]+[(0,1)]*3+[(0,0)]
HD=[(0,0),(-1,0),(-1,0),(0,1),(0,0),(1,0),(1,0),(0,1)]
F['walk']=[frame(shR=SR[i],lR=(0,-LIFT[i]),shL=SLg[i],lL=(0,-LIFT[(i+4)%8]),aL=AL[i],aR=AR[i],hd=HD[i]) for i in range(8)]
SW=[((27,39),(38,46),(0,0)),((29,35),(47,30),(0,0)),((30,34),(44,12),(0,0)),((30,32),(38,8),(-1,0)),
    ((30,35),(50,22),(0,0)),((29,38),(53,34),(1,0)),((29,41),(46,58),(1,1)),((28,40),(38,56),(0,1))]
import math
def fixlen(h,t,L=24):
    a=math.atan2(t[1]-h[1],t[0]-h[0]);return (round(h[0]+L*math.cos(a)),round(h[1]+L*math.sin(a)))
SW=[(h,fixlen(h,t),hd) for h,t,hd in SW]
F['atk']=[frame(sword=(h,t),hd=hd) for h,t,hd in SW]
F['hit']=[frame(cl,hd=(-2,1),lL=(0,0)),frame(cl,hd=(-1,0))]
json.dump({'frame':[PW,PH],'origin':[OX,OY],'seat_line_y':43+OY,'center_x':20+OX,'feet_y':49+OY,
 'idle':{'frames':6,'ms':[1200,350,350,70,110,70]},'walk':{'frames':8,'ms':90},'atk':{'frames':8,'ms':[110,70,70,120,60,60,90,140]},'hit':{'frames':2,'ms':[150,150]}},open('an/anim.json','w'),indent=1)
MS={'idle':[1200,350,350,70,110,70],'walk':[90]*8,'atk':[110,70,70,120,60,60,90,140],'hit':[150,150]}
S=3;cw,ch=PW*S,PH*S+16
cs=Image.new('RGBA',(cw*8,ch*4),(70,70,80,255));d=ImageDraw.Draw(cs)
for r,(k,v) in enumerate(F.items()):
    Image.fromarray(np.concatenate(v,1)).save(f'an/{k}_strip.png')
    for i,f in enumerate(v):
        im=Image.fromarray(f).resize((cw,PH*S),Image.NEAREST); x,y=i*cw,r*ch+16
        cs.alpha_composite(im,(x,y)); d.text((x+4,y-14),f'{k} {i}',fill=(255,255,255,255))
        yy=y+(43+OY)*S; d.line([(x,yy),(x+cw,yy)],fill=(0,255,255,255))
    ims=[]
    for f in v:
        bg=Image.new('RGBA',(PW,PH),(70,70,80,255)); bg.alpha_composite(Image.fromarray(f))
        ims.append(bg.resize((PW*5,PH*5),Image.NEAREST).convert('P',palette=Image.ADAPTIVE))
    ims[0].save(f'an/{k}.gif',save_all=True,append_images=ims[1:],duration=MS[k],loop=0,disposal=2)
cs.save('an/contact.png')
