/* ---------- TRANG PHỤC: Tử Điện Chiến Giáp (outfit/build_atlas.py) ----------
   Đọc điểm pixel gốc của ảnh GPT (khối ≈9,5 px) → atlas; vẽ theo khung 76×90 của nhân vật (1 pixel nhân vật = 0,5 đơn vị).
   Mặc đồ: đầu thật + chân thật bị che hẳn (gỡ ra là lộ lại nhân vật gốc); thân thật chỉ giữ phần tay. Đầu theo nhịp lắc đầu từng khung, mắt chớp theo khung chớp của nhân vật.
   Tay áo rời (slL/slR) KHÔNG dùng (OF.SLEEVE=false): to bằng cả thân, vung kiếm sẽ lệch — áo đã có tay áo ngắn liền thân. */
const OFM={{OFMETA}},OFHD={{OFHD}};
const OF={SLEEVE:false,
  on(){return !!cult.eq.o;},
  piece(n,key){const p=OFM.pos[n],d=OFM[key||n];ctx.drawImage(IMG.outfit,p[0],p[1],p[2],p[3],d[0],d[1],d[2],d[3]);},
  eyes(row,fr){if(row===NC.rows.hit)return 'closed';if(row===NC.rows.idle)return ['open','open','open','half','closed','half'][fr]||'open';return 'open';},
  /* vẽ trong toạ độ khung: gốc (0,0) = góc trên-trái khung 76×90; opts.cut = chỉ vẽ phần y<cut (đang cưỡi); opts.boots = 'both'|'left' */
  draw(row,fr,opts){
    opts=opts||{};const cut=opts.cut||NC.H;
    ctx.save();ctx.translate(-NC.CX*PX,-NC.FEET*PX);ctx.scale(PX,PX);
    ctx.imageSmoothingEnabled=false;
    ctx.beginPath();ctx.rect(0,0,NC.W,cut);ctx.clip();
    ctx.drawImage(IMG.player,fr*NC.W,row*NC.H+56,NC.W,Math.min(cut,NC.H)-56,0,56,NC.W,Math.min(cut,NC.H)-56);   /* thân thật (cánh tay) từ hàng 56 xuống */
    ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    OF.piece('torso');
    if(OF.SLEEVE){OF.piece('slL');OF.piece('slR');}
    const h=(OFHD[row]&&OFHD[row][fr])||[0,0],d=OFM.head,p=OFM.pos['head_'+OF.eyes(row,fr)];
    ctx.drawImage(IMG.outfit,p[0],p[1],p[2],p[3],d[0]+h[0],d[1]+h[1],d[2],d[3]);
    ctx.restore();
  },
  boots(opts){   /* giày (vẽ sau cùng, đè lên váy) */
    opts=opts||{};ctx.save();ctx.translate(-NC.CX*PX,-NC.FEET*PX);ctx.scale(PX,PX);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    OF.piece('bootL');if(opts.boots!=='left')OF.piece('bootR');ctx.restore();
  },
  icon(scale,part){   /* biểu tượng: head | torso | boot */
    const n=part==='torso'?'torso':part==='boot'?'bootL':'head_open',p=OFM.pos[n],k=part==='head'||!part?.7:1,c=document.createElement('canvas');
    c.width=Math.round(p[2]/6*scale*k*.6);c.height=Math.round(p[3]/6*scale*k*.6);
    const x=c.getContext('2d');x.imageSmoothingQuality='high';x.drawImage(IMG.outfit,p[0],p[1],p[2],p[3],0,0,c.width,c.height);return c;},
  portrait(cv,sc,x0,y0,x1,y1){   /* chân dung (idle mở mắt) vào canvas bất kỳ: vùng khung [x0,y0]-[x1,y1] */
    cv.width=Math.round((x1-x0)*sc);cv.height=Math.round((y1-y0)*sc);const c=cv.getContext('2d');c.clearRect(0,0,cv.width,cv.height);
    c.save();c.scale(sc,sc);c.translate(-x0,-y0);c.imageSmoothingEnabled=false;
    c.drawImage(IMG.player,0,56,NC.W,NC.H-56,0,56,NC.W,NC.H-56);
    c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
    const dp=(n,key,dx,dy)=>{const p=OFM.pos[n],d=OFM[key||n];c.drawImage(IMG.outfit,p[0],p[1],p[2],p[3],d[0]+(dx||0),d[1]+(dy||0),d[2],d[3]);};
    dp('torso');dp('bootL');dp('bootR');dp('head_open','head');c.restore();}
};
