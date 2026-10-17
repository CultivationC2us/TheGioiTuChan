/* ---------- TRANG PHỤC: Tử Điện Chiến Giáp (outfit/build_atlas.py) ----------
   Đọc điểm pixel gốc của ảnh GPT (khối ≈9,5 px) → atlas; vẽ theo khung 76×90 của nhân vật (1 pixel nhân vật = 0,5 đơn vị).
   Mặc đồ: đầu thật + chân thật bị che hẳn (gỡ ra là lộ lại nhân vật gốc); thân thật chỉ giữ phần tay. Đầu theo nhịp lắc đầu từng khung, mắt chớp theo khung chớp của nhân vật.
   Tay áo rời (slL/slR) KHÔNG dùng (OF.SLEEVE=false): to bằng cả thân, vung kiếm sẽ lệch — áo đã có tay áo ngắn liền thân. */
const OFM={{OFMETA}},OFHD={{OFHD}};
OFM.head[1]+=5.5;   /* ảnh gốc GPT vẽ đầu & thân rời nhau ~7 pixel → hạ đầu xuống cho khít */
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
    if(cut>mid)c.drawImage(IMG.player,fr*NC.W,row*H+mid,NC.W,cut-mid,0,mid,NC.W,cut-mid);},
  /* tay vung kiếm: dùng ống tay áo (slR) của bộ giáp, đặt đúng chỗ cầm kiếm (gx,gy theo đơn vị game, gốc = chân) */
  hand(gx,gy,th){
    const d=OFM.slR,p=OFM.pos.slR,w=d[2]*PX,h=d[3]*PX;
    ctx.save();ctx.translate(gx,gy);ctx.rotate(th);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    ctx.drawImage(IMG.outfit,p[0],p[1],p[2],p[3],-w*.5,-h*.38,w,h);ctx.restore();},
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
