/* ---------- TRANG PHỤC: Tử Điện Chiến Giáp (outfit/build_atlas.py) ----------
   Đọc điểm pixel gốc của ảnh GPT (khối ≈9,5 px) → atlas; vẽ theo khung 76×90 của nhân vật (1 pixel nhân vật = 0,5 đơn vị).
   Mặc đồ: đầu thật + chân thật bị che hẳn (gỡ ra là lộ lại nhân vật gốc); thân thật chỉ giữ phần tay. Đầu theo nhịp lắc đầu từng khung, mắt chớp theo khung chớp của nhân vật.
   Tay áo rời (slL/slR) KHÔNG dùng (OF.SLEEVE=false): to bằng cả thân, vung kiếm sẽ lệch — áo đã có tay áo ngắn liền thân. */
const OFM={{OFMETA}},OFHD={{OFHD}};
OFM.head[1]+=3;   /* ảnh gốc GPT vẽ đầu & thân rời nhau ~7 pixel → hạ đầu xuống cho khít */
const OF={SLEEVE:false,
  eq(k){return !!cult.eq[k];},                 /* k: h = mũ, o = giáp, g = giày */
  on(){return !!(cult.eq.h||cult.eq.o||cult.eq.g);},
  sig(){return (cult.eq.h||'')+'|'+(cult.eq.o||'')+'|'+(cult.eq.g||'');},
  piece(n,key){const p=OFM.pos[n],d=OFM[key||n];ctx.drawImage(IMG.outfit,p[0],p[1],p[2],p[3],d[0],d[1],d[2],d[3]);},
  eyes(row,fr){if(row===NC.rows.hit)return 'closed';if(row===NC.rows.idle)return ['open','open','open','half','closed','half'][fr]||'open';return 'open';},
  /* nhân vật thật: đầu (hàng 0-55) chỉ khi chưa đội mũ; thân/tay (56+) — mặc giáp thì bỏ tay trần (chỉ giữ chân từ hàng 64) */
  real(c,row,fr,cut,smooth){
    const H=NC.H,top=cult.eq.h?56:0,mid=cult.eq.o?64:56;
    c.imageSmoothingEnabled=false;
    if(top<56&&cut>0)c.drawImage(IMG.player,fr*NC.W,row*H,NC.W,Math.min(cut,56),0,0,NC.W,Math.min(cut,56));
    if(cut>mid)c.drawImage(IMG.player,fr*NC.W,row*H+mid,NC.W,cut-mid,0,mid,NC.W,cut-mid);
    if(cult.eq.o)OF.fist(c,row,fr,cut);},
  /* nắm đấm / cánh tay trần ngoài thân (x<28 hoặc x>39, hàng 56-69) đổi sang màu áo giáp: đen tím theo độ sáng gốc */
  fist(c,row,fr,cut){
    const key=row+'_'+fr;OF._f=OF._f||{};let t=OF._f[key];
    if(!t){const W=NC.W,Y0=56,Y1=70,cv=document.createElement('canvas');cv.width=W;cv.height=Y1-Y0;const x=cv.getContext('2d');
      x.drawImage(IMG.player,fr*W,row*NC.H+Y0,W,Y1-Y0,0,0,W,Y1-Y0);
      const im=x.getImageData(0,0,W,Y1-Y0),d=im.data,P=[[26,18,44],[52,36,86],[104,78,160]];
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
    if(cult.eq.o){OF.piece('torso');if(OF.SLEEVE){OF.piece('slL');OF.piece('slR');}}
    if(cult.eq.h){const h=(OFHD[row]&&OFHD[row][fr])||[0,0],d=OFM.head,p=OFM.pos['head_'+OF.eyes(row,fr)];
      ctx.drawImage(IMG.outfit,p[0],p[1],p[2],p[3],d[0]+h[0],d[1]+h[1],d[2],d[3]);}
    ctx.restore();
  },
  boots(opts){   /* giày (vẽ sau cùng, đè lên váy) */
    if(!cult.eq.g)return;
    opts=opts||{};ctx.save();ctx.translate(-NC.CX*PX,-NC.FEET*PX);ctx.scale(PX,PX);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    OF.piece('bootL');if(opts.boots!=='left')OF.piece('bootR');ctx.restore();
  },
  icon(scale,part){   /* biểu tượng: head | torso | boot */
    const n=part==='torso'?'torso':part==='boot'?'bootL':'head_open',p=OFM.pos[n],k=part==='head'||!part?.7:1,c=document.createElement('canvas');
    c.width=Math.round(p[2]/6*scale*k*.6);c.height=Math.round(p[3]/6*scale*k*.6);
    const x=c.getContext('2d');x.imageSmoothingQuality='high';x.drawImage(IMG.outfit,p[0],p[1],p[2],p[3],0,0,c.width,c.height);return c;},
  portrait(cv,sc,x0,y0,x1,y1){   /* chân dung (idle mở mắt) vào canvas bất kỳ: vùng khung [x0,y0]-[x1,y1] */
    cv.width=Math.round((x1-x0)*sc);cv.height=Math.round((y1-y0)*sc);const c=cv.getContext('2d');c.clearRect(0,0,cv.width,cv.height);
    c.save();c.scale(sc,sc);c.translate(-x0,-y0);
    OF.real(c,0,0,NC.H);
    c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
    const dp=(n,key)=>{const p=OFM.pos[n],d=OFM[key||n];c.drawImage(IMG.outfit,p[0],p[1],p[2],p[3],d[0],d[1],d[2],d[3]);};
    if(cult.eq.o)dp('torso');if(cult.eq.g){dp('bootL');dp('bootR');}if(cult.eq.h)dp('head_open','head');c.restore();}
};
