/* ---------- TRANG PHỤC: Tử Điện Chiến Giáp (outfit/build_atlas.py) ----------
   Đọc điểm pixel gốc của ảnh GPT (khối ≈9,5 px) → atlas; vẽ theo khung 76×90 của nhân vật (1 pixel nhân vật = 0,5 đơn vị).
   Mặc đồ: đầu thật + chân thật bị che hẳn (gỡ ra là lộ lại nhân vật gốc); thân thật chỉ giữ phần tay. Đầu theo nhịp lắc đầu từng khung, mắt chớp theo khung chớp của nhân vật.
   Tay áo rời (slL/slR) KHÔNG dùng (OF.SLEEVE=false): to bằng cả thân, vung kiếm sẽ lệch — áo đã có tay áo ngắn liền thân. */
const OFM={{OFMETA}},OFM2={{OFMETA2}},OFHD={{OFHD}};
OFM.head[1]+=3;OFM2.head[1]+=3;   /* ảnh gốc GPT vẽ đầu & thân rời nhau → hạ đầu xuống cho khít (neo theo cằm) */
const OFS={A:{k:'outfit',m:OFM},B:{k:'outfit2',m:OFM2}};
const OF={SLEEVE:false,
  setOf(k){const o=cult.eq[k]&&TD.byOutfit[cult.eq[k]];return OFS[(o&&o.set)||'A'];},
  eq(k){return !!cult.eq[k];},                 /* k: h = mũ, o = giáp, g = giày */
  on(){return !!(cult.eq.h||cult.eq.o||cult.eq.g);},
  sig(){return (cult.eq.h||'')+'|'+(cult.eq.o||'')+'|'+(cult.eq.g||'')+'|'+(cult.eq.l||'');},
  ok(S){return IMG[S.k]&&IMG[S.k].complete&&IMG[S.k].naturalWidth;},
  piece(c,S,n,key){if(!OF.ok(S))return;const p=S.m.pos[n],d=S.m[key||n];c.drawImage(IMG[S.k],p[0],p[1],p[2],p[3],d[0],d[1],d[2],d[3]);},
  eyes(row,fr){if(row===NC.rows.hit)return 'closed';if(row===NC.rows.idle)return ['open','open','open','half','closed','half'][fr]||'open';return 'open';},
  /* nhân vật thật: đầu (hàng 0-55) chỉ khi chưa đội mũ; thân/tay (56+) — mặc giáp thì tay trần đổi màu giáp (chỉ giữ chân từ hàng 64) */
  real(c,row,fr,cut){
    const H=NC.H,top=cult.eq.h?56:0,mid=cult.eq.o?64:56;
    c.imageSmoothingEnabled=false;
    if(top<56&&cut>0)c.drawImage(IMG.player,fr*NC.W,row*H,NC.W,Math.min(cut,56),0,0,NC.W,Math.min(cut,56));
    if(cut>mid)c.drawImage(IMG.player,fr*NC.W,row*H+mid,NC.W,cut-mid,0,mid,NC.W,cut-mid);
    if(cult.eq.o)OF.fist(c,row,fr,cut);},
  /* nắm đấm / cánh tay trần ngoài thân (x<28 hoặc x>39, hàng 56-69) đổi sang màu áo giáp: tông tối theo độ sáng gốc */
  fist(c,row,fr,cut){
    const set=OF.setOf('o'),key=row+'_'+fr+'_'+(set===OFS.B?'B':'A');OF._f=OF._f||{};let t=OF._f[key];
    if(!t){const W=NC.W,Y0=56,Y1=70,cv=document.createElement('canvas');cv.width=W;cv.height=Y1-Y0;const x=cv.getContext('2d');
      x.drawImage(IMG.player,fr*W,row*NC.H+Y0,W,Y1-Y0,0,0,W,Y1-Y0);
      const im=x.getImageData(0,0,W,Y1-Y0),d=im.data,P=set===OFS.B?[[24,16,18],[58,30,34],[130,48,44]]:[[26,18,44],[52,36,86],[104,78,160]];
      for(let yy=0;yy<Y1-Y0;yy++)for(let xx=0;xx<W;xx++){const i=(yy*W+xx)*4;
        if(!d[i+3]||(xx>=28&&xx<=39)){d[i+3]=0;continue;}
        const L=Math.min(1,(d[i]*.3+d[i+1]*.59+d[i+2]*.11)/255),u=L<.5?L/.5:(L-.5)/.5,a=L<.5?P[0]:P[1],b=L<.5?P[1]:P[2];
        d[i]=a[0]+(b[0]-a[0])*u;d[i+1]=a[1]+(b[1]-a[1])*u;d[i+2]=a[2]+(b[2]-a[2])*u;}
      x.putImageData(im,0,0);t=OF._f[key]=cv;}
    c.imageSmoothingEnabled=false;const h=Math.min(14,Math.max(0,cut-56));if(h>0)c.drawImage(t,0,0,NC.W,h,0,56,NC.W,h);},
  /* vẽ trong toạ độ khung: gốc (0,0) = góc trên-trái khung 76×90; opts.cut = chỉ vẽ phần y<cut (đang cưỡi) */
  draw(row,fr,opts){
    opts=opts||{};const cut=opts.cut||NC.H;
    ctx.save();ctx.translate(-NC.CX*PX,-NC.FEET*PX);ctx.scale(PX,PX);
    ctx.beginPath();ctx.rect(0,0,NC.W,cut);ctx.clip();
    OF.real(ctx,row,fr,cut);
    ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    if(cult.eq.o)OF.piece(ctx,OF.setOf('o'),'torso');
    if(cult.eq.h){const S=OF.setOf('h'),h=(OFHD[row]&&OFHD[row][fr])||[0,0],d=S.m.head,p=S.m.pos['head_'+OF.eyes(row,fr)];
      if(OF.ok(S))ctx.drawImage(IMG[S.k],p[0],p[1],p[2],p[3],d[0]+h[0],d[1]+h[1],d[2],d[3]);}
    ctx.restore();
  },
  boots(opts){   /* giày (vẽ sau cùng, đè lên váy) */
    if(!cult.eq.g)return;
    opts=opts||{};const S=OF.setOf('g');ctx.save();ctx.translate(-NC.CX*PX,-NC.FEET*PX);ctx.scale(PX,PX);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    OF.piece(ctx,S,'bootL');if(opts.boots!=='left')OF.piece(ctx,S,'bootR');ctx.restore();
  },
  /* linh quang: hào quang sau lưng, to bằng nhân vật, tâm ở giữa lưng; 5 khung nhấp nháy (qua lại) */
  aura(t,lift){
    const l=cult.eq.l;if(!l||!(loot[l]>0)||!IMG.aura||!IMG.aura.complete||!IMG.aura.naturalWidth)return;
    const fr=[0,1,2,3,4,3,2,1][Math.floor(t/120)%8],W=30,H=W*156/128,cy=-12-(lift||0);
    ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.globalAlpha=.95;
    ctx.drawImage(IMG.aura,fr*128,0,128,156,-W/2,cy-H/2,W,H);
    ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.4;ctx.drawImage(IMG.aura,fr*128,0,128,156,-W/2,cy-H/2,W,H);ctx.restore();},
  /* biểu tượng: o = dữ liệu món (part: head | torso | boot | ring | aura, set, ic) */
  icon(scale,part,o){
    const c=document.createElement('canvas'),S=OFS[(o&&o.set)||'A'];
    if(part==='ring'){const im=IMG.rings;c.width=c.height=Math.round(16*scale);if(im&&im.complete&&im.naturalWidth){const x=c.getContext('2d');x.imageSmoothingQuality='high';x.drawImage(im,((o&&o.ic)||0)*64,0,64,64,0,0,c.width,c.height);}return c;}
    if(part==='aura'){const im=IMG.aura;c.height=Math.round(16*scale);c.width=Math.round(c.height*128/156);if(im&&im.complete&&im.naturalWidth){const x=c.getContext('2d');x.imageSmoothingQuality='high';x.drawImage(im,256,0,128,156,0,0,c.width,c.height);}return c;}
    const n=part==='torso'?'torso':part==='boot'?'bootL':'head_open',p=S.m.pos[n],k=part==='head'||!part?.7:1;
    c.width=Math.max(1,Math.round(p[2]/6*scale*k*.6));c.height=Math.max(1,Math.round(p[3]/6*scale*k*.6));
    if(OF.ok(S)){const x=c.getContext('2d');x.imageSmoothingQuality='high';x.drawImage(IMG[S.k],p[0],p[1],p[2],p[3],0,0,c.width,c.height);}return c;},
  portrait(cv,sc,x0,y0,x1,y1){   /* chân dung (idle mở mắt) vào canvas bất kỳ: vùng khung [x0,y0]-[x1,y1] */
    cv.width=Math.round((x1-x0)*sc);cv.height=Math.round((y1-y0)*sc);const c=cv.getContext('2d');c.clearRect(0,0,cv.width,cv.height);
    c.save();c.scale(sc,sc);c.translate(-x0,-y0);
    OF.real(c,0,0,NC.H);
    c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
    if(cult.eq.o)OF.piece(c,OF.setOf('o'),'torso');
    if(cult.eq.g){const S=OF.setOf('g');OF.piece(c,S,'bootL');OF.piece(c,S,'bootR');}
    if(cult.eq.h)OF.piece(c,OF.setOf('h'),'head_open','head');c.restore();}
};
