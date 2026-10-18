/* ============================================================
   CÔNG PHÁP (5 hệ) — học từ Sách Kỹ Năng, thi triển tốn LINH LỰC, có hồi chiêu
   Sát thương = công kích cơ bản × hệ số (2.2–2.8, luôn hơn đòn đánh thường) và có thể CHÍ MẠNG.
   Dạng: 'proj' = bay tới mục tiêu rồi nổ vùng (Hỏa/Thủy/Thổ/Mộc) · 'zone' = mưa kiếm giáng xuống vùng trước mặt (Kim)
   Sprite: lib/extract_skill.py → atlas 'sk' (SKM, tên '<hệ>_<số>').
   ============================================================ */
const SKCFG={
  hoa:{type:'proj',fly:[1,2,3,4,5,6,7],burst:[8,9,10],bms:170,sc:1.232,fsc:.98,r:64,hits:[0],hold:200,yoff:0},
  thuy:{type:'proj',fly:[1,2,3,4],burst:[5,6,7,8,9,10,11],bms:95,sc:1.232,fsc:.98,r:67,hits:[120],hold:200,yoff:0},
  tho:{type:'proj',fly:[3,4,5,6],burst:[7,8,9],bms:190,sc:1.232,fsc:.98,r:64,hits:[150],hold:200,yoff:-22},
  moc:{type:'proj',fly:[1,2,3,4,5],burst:[6,7,8,9,10,11],bms:130,sc:1.232,fsc:.98,r:67,hits:[0,430],hold:250,yoff:0},
  kim:{type:'zone',burst:[1,2,3,4,5,6,7,8,9,10,11,12,13],bms:85,sc:1.428,r:81,hits:[840],hold:250,yoff:0}
};
const skCd={},skFx=[];
cult.sk=[];P.mp=60;P.maxMp=60;
const skLearned=id=>cult.sk.indexOf(id)>=0;
function skHitArea(f){
  const cfg=SKCFG[f.id],sk=TD.bySkill[f.id];let any=false;
  for(const m of mons2){if(!monAlive(m))continue;
    if(Math.hypot(m.x-f.x,(m.y-f.y)*1.4)<f.r+m.sc*8){monHit(m,dmgRoll(sk.mult));any=true;}}
  for(const d of DRG){withDr(d,()=>{if(mTargetable()&&M.st!=='die'&&Math.hypot(M.x-f.x,(M.y-f.y)*1.4)<f.r+22){mHit(dmgRoll(sk.mult));any=true;}});}
  for(const n of NPCS){if(n.st==='dead')continue;if(Math.hypot(n.x-f.x,(n.y-f.y)*1.4)<f.r+10){npcHurt(n,dmgRoll(sk.mult),'player');any=true;}}
  f.n++;return any;
}
function skTarget(){
  let best=null,bd=1e9;const R=300;
  for(const m of mons2){if(!monAlive(m))continue;const dx=(m.x-P.x)*P.f,d=Math.hypot(m.x-P.x,m.y-P.y);if(dx>-24&&d<R&&d<bd){best={x:m.x,y:m.y,o:m};bd=d;}}
  for(const d of DRG){withDr(d,()=>{if(mTargetable()&&M.st!=='die'){const dx=(M.x-P.x)*P.f,q=Math.hypot(M.x-P.x,M.y-P.y);if(dx>-24&&q<R&&q<bd){best={x:M.x,y:M.y,o:d};bd=q;}}});}
  return best;
}
function castSkill(id,auto,ft){
  const sk=TD.bySkill[id],cfg=SKCFG[id];if(!sk||!skLearned(id)||P.dead||P.fly)return false;
  const t=now();if(t<(skCd[id]|0))return false;
  if(P.mp<sk.mp){if(!auto)toast(T('skill.nomp'));return false;}
  P.mp-=sk.mp;skCd[id]=t+sk.cd;
  const tg=ft||skTarget();let tx,ty;
  if(tg){tx=tg.x;ty=tg.y;}else{tx=P.x+P.f*(cfg.type==='zone'?150:170);ty=P.y+4;}
  if(Math.abs(tx-P.x)>4)P.f=tx>P.x?1:-1;
  P.atkT=t;P.hitDone=true;P.fxDone=true;
  const ox=P.x+P.f*12,oy=P.y-16;
  if(cfg.type==='zone')skFx.push({id,k:'zone',x:tx,y:ty,r:cfg.r,t0:t,n:0,hits:cfg.hits.slice(),done:[]});
  else{const dist=Math.hypot(tx-ox,ty-10-oy),fl=Math.max(260,dist/320*1000);
    skFx.push({id,k:'proj',o:tg&&tg.o,ox,oy,x:tx,y:ty,tx,ty,r:cfg.r,t0:t,fl,n:0,hits:cfg.hits.slice(),done:[],bt:0});}
  return true;
}
function skUpdate(dt){
  const t=now();
  if(!P.dead)P.mp=Math.min(P.maxMp,P.mp+(2+P.maxMp*.025)*dt);
  for(let i=skFx.length-1;i>=0;i--){const f=skFx[i],cfg=SKCFG[f.id];
    let bs=f.k==='zone'?f.t0:f.t0+f.fl;
    if(f.k==='proj'){if(t<bs){
      /* đang bay: kiểm tra va chạm quái / NPC / rồng → nổ sớm tại vị trí hiện tại */
      const k0=(t-f.t0)/f.fl,k=Math.pow(k0,1.3);
      const cx=f.ox+(f.tx-f.ox)*k, cy=f.oy+(f.ty-10-f.oy)*k;
      let hit=null;
      for(const m of mons2){if(!monAlive(m))continue;if(Math.hypot(m.x-cx,(m.y-cy)*1.4)<18+m.sc*6){hit={x:m.x,y:m.y};break;}}
      if(!hit)for(const d of DRG){withDr(d,()=>{if(mTargetable()&&M.st!=='die'&&Math.hypot(M.x-cx,(M.y-cy)*1.4)<28)hit={x:M.x,y:M.y};});if(hit)break;}
      if(!hit)for(const n of NPCS){if(n.st==='dead')continue;if(Math.hypot(n.x-cx,(n.y-cy)*1.4)<16){hit={x:n.x,y:n.y};break;}}
      if(hit){f.tx=hit.x;f.ty=hit.y;f.fl=t-f.t0;f.fz=1;f.x=hit.x;f.y=hit.y; /* chuyển sang phase nổ ngay */}
      else {if(f.o&&f.o.hp>0){f.tx=f.o.x;f.ty=f.o.y;}continue;}
    }if(!f.fz){f.fz=1;f.x=f.tx;f.y=f.ty;}}
    const e=t-bs;
    for(let h=0;h<f.hits.length;h++)if(!f.done[h]&&e>=f.hits[h]){f.done[h]=1;skHitArea(f);}
    if(e>cfg.burst.length*cfg.bms+cfg.hold)skFx.splice(i,1);}
  if(AUTO&&AUTO.on&&!P.dead&&!P.fly){   /* tự tung công pháp vào mục tiêu của Tự Động (người đang đánh mình hoặc quái) */
    const g=AUTO.tgt&&(AUTO.tgt.k==='npc'||AUTO.tgt.k==='mon')?AUTO.tgt:null;
    const tg=g?{x:g.ref.x,y:g.ref.y,o:g.ref}:skTarget();
    if(tg&&Math.hypot(tg.x-P.x,tg.y-P.y)<(g?190:130))for(const id of cult.sk){if(castSkill(id,true,g?tg:undefined))break;}}
  skBtnTick(t);
}
const SKS=4; /* atlas HD: sprite gốc phóng ×4 (nearest) rồi vẽ có làm mượt -> nét, không răng cưa khi zoom lẻ */
function skDraw(nm,x,y,s,al,rot,sg){
  const fr=SKM[nm];if(!fr||al<=0)return;
  ctx.globalAlpha=al;
  if(rot!==undefined){ctx.save();ctx.translate(x,y);ctx.scale(sg,1);ctx.rotate(rot);ctx.drawImage(IMG.sk,fr[0]*SKS,fr[1]*SKS,fr[2]*SKS,fr[3]*SKS,fr[4]*s,fr[5]*s,fr[2]*s,fr[3]*s);ctx.restore();}
  else ctx.drawImage(IMG.sk,fr[0]*SKS,fr[1]*SKS,fr[2]*SKS,fr[3]*SKS,x+fr[4]*s,y+fr[5]*s,fr[2]*s,fr[3]*s);
}
function drawSkFx(t){
  if(!IMG.sk||!IMG.sk.complete)return;
  drawSkAim();
  ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  for(const f of skFx){const cfg=SKCFG[f.id];
    if(f.k==='proj'&&t<f.t0+f.fl){const k0=(t-f.t0)/f.fl,k=Math.pow(k0,1.3),x=f.ox+(f.tx-f.ox)*k,y=f.oy+(f.ty-10-f.oy)*k,dx=f.tx-f.ox,dy=f.ty-10-f.oy,sg=dx<0?-1:1,ang=Math.atan2(dy,Math.abs(dx)||1);
      const n=cfg.fly.length,u=(t-f.t0)/70,i=Math.floor(u),fr=u-i,s=cfg.fsc*(.6+.4*Math.min(1,(t-f.t0)/110));
      skDraw(f.id+'_'+cfg.fly[i%n],x,y,s,1,ang,sg);
      if(n>1)skDraw(f.id+'_'+cfg.fly[(i+1)%n],x,y,s,fr,ang,sg);continue;}
    const bs=f.k==='zone'?f.t0:f.t0+f.fl,e=t-bs;if(e<0)continue;
    const N=cfg.burst.length,tail=N*cfg.bms,al=e>tail?Math.max(0,1-(e-tail)/cfg.hold):1,u=Math.min(N-1,e/cfg.bms),i=Math.floor(u),fr=u-i;
    const s=cfg.sc*(.82+.18*Math.min(1,e/90)); /* nở nhẹ lúc bung */
    skDraw(f.id+'_'+cfg.burst[i],f.x,f.y+cfg.yoff,s,al,undefined);
    if(i<N-1)skDraw(f.id+'_'+cfg.burst[i+1],f.x,f.y+cfg.yoff,s,al*fr);}
  ctx.restore();
}
/* ----- nút kỹ năng: xếp vòng cung quanh nút ĐÁNH (trái + trên) như game MOBA; kéo để NGẮM HƯỚNG, chạm nhanh = tự nhắm ----- */
const SK_AR=140,SK_SZ=44,SK_RANGE={proj:290,zone:200},SK_MAXPX=64,SK_DEAD=14;   /* bán kính cung · cỡ nút · tầm ngắm tối đa (px thế giới) · kéo tối đa (px màn hình) */
const SKAIM={on:false,id:null,dx:0,dy:0,len:0,moved:false,pid:null,ox:0,oy:0};
const skBar=document.createElement('div');skBar.id='skBar';
{const st=document.createElement('style');st.textContent=
 '#skBar{position:fixed;z-index:40;right:0;bottom:0;width:0;height:0;display:none;pointer-events:none}'+
 '#skBar .skb{position:absolute;width:'+SK_SZ+'px;height:'+SK_SZ+'px;border-radius:50%;pointer-events:auto;touch-action:none;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none;box-shadow:0 0 0 2px #e8bb48,0 0 0 3px #1a1206,0 3px 6px #000b;background:#10161f;overflow:hidden}'+
 '#skBar .skb canvas{position:absolute;inset:0;width:100%;height:100%;image-rendering:auto;pointer-events:none}'+
 '#skBar .skb i{position:absolute;inset:0;background:#000b;transform-origin:bottom;transform:scaleY(0);pointer-events:none}'+
 '#skBar .skb b{position:absolute;left:0;right:0;bottom:0;text-align:center;font-size:9px;line-height:11px;font-weight:900;color:#d8c8ff;background:#1a0f3acc;text-shadow:0 1px 1px #000;pointer-events:none}'+
 '#skBar .skb.no b{color:#ff8a8a}#skBar .skb.aim{box-shadow:0 0 0 3px #fff,0 0 14px 3px #ffd54a;transform:scale(1.12)}'+
 '#skBar .skb u{position:absolute;left:3px;top:1px;font-size:9px;font-weight:900;color:#fff;text-decoration:none;text-shadow:0 0 2px #000,0 0 2px #000;pointer-events:none}'+
 /* nút cưỡi/bay/lướt dời lên cột bên phải để nhường chỗ cho vòng cung kỹ năng */
 /* cột bên phải phía trên vòng cung: TỰ ĐỘNG đứng đúng chỗ cũ của nút CƯỠI (cùng cỡ 54px), các nút thú cưỡi dời lên trên */
 'body #autoBtn{right:calc(env(safe-area-inset-right,0px) + 14px)!important;bottom:calc(env(safe-area-inset-bottom,0px) + 246px)!important;width:54px!important;height:54px!important}'+
 'body #mtRide{right:calc(env(safe-area-inset-right,0px) + 14px)!important;bottom:calc(env(safe-area-inset-bottom,0px) + 308px)!important}'+
 'body #mtFly{right:calc(env(safe-area-inset-right,0px) + 14px)!important;bottom:calc(env(safe-area-inset-bottom,0px) + 370px)!important}'+
 'body #mtDash{right:calc(env(safe-area-inset-right,0px) + 14px)!important;bottom:calc(env(safe-area-inset-bottom,0px) + 432px)!important}';
 document.head.appendChild(st);document.body.appendChild(skBar);}
let skSig='';
function skSlot(n){   /* tâm nút n (0..4) trên cung: φ=0 là ngay bên trái nút ĐÁNH, φ=90 là ngay phía trên */
  const phi=n*(Math.PI/2)/4,cxr=22+42,cyb=28+42;
  return{r:cxr+SK_AR*Math.cos(phi),b:cyb+SK_AR*Math.sin(phi)};}
function skBuild(){
  const sig=cult.sk.join(',')+'|'+(IMG.gl&&IMG.gl.complete?1:0);if(sig===skSig)return;skSig=sig;skBar.innerHTML='';
  cult.sk.forEach((id,n)=>{const sk=TD.bySkill[id],fr=GLM['sk_'+id];if(!sk||!fr||n>4)return;
    const b=document.createElement('div');b.className='skb';b.dataset.id=id;b.setAttribute('aria-label',I18N.t('skill.'+id));
    const sl=skSlot(n);b.style.right='calc(env(safe-area-inset-right,0px) + '+(sl.r-SK_SZ/2)+'px)';b.style.bottom='calc(env(safe-area-inset-bottom,0px) + '+(sl.b-SK_SZ/2)+'px)';
    const c=document.createElement('canvas');c.width=64;c.height=64;const x=c.getContext('2d');x.imageSmoothingEnabled=true;x.drawImage(IMG.gl,fr[0],fr[1],fr[2],fr[3],0,0,64,64);
    b.appendChild(c);b.insertAdjacentHTML('beforeend','<i></i><u>'+(n+1)+'</u><b>'+sk.mp+'</b>');
    b.addEventListener('pointerdown',e=>skDown(e,id,b));b.addEventListener('pointermove',e=>skMove(e,b));
    b.addEventListener('pointerup',e=>skUp(e,id,b,false));b.addEventListener('pointercancel',e=>skUp(e,id,b,true));
    skBar.appendChild(b);});
}
function skDown(e,id,b){
  e.preventDefault();e.stopPropagation();
  const sk=TD.bySkill[id];if(!sk)return;
  if(sk.passive)return;                                  /* kỹ năng bị động: không ngắm, không bấm */
  const r=b.getBoundingClientRect();
  Object.assign(SKAIM,{on:true,id,dx:0,dy:0,len:0,moved:false,pid:e.pointerId,ox:r.left+r.width/2,oy:r.top+r.height/2});
  try{b.setPointerCapture(e.pointerId);}catch(_){}
  b.classList.add('aim');
}
function skMove(e,b){
  if(!SKAIM.on||e.pointerId!==SKAIM.pid)return;
  const dx=e.clientX-SKAIM.ox,dy=e.clientY-SKAIM.oy,l=Math.hypot(dx,dy);
  if(l>SK_DEAD)SKAIM.moved=true;
  SKAIM.len=Math.min(l,SK_MAXPX);if(l>1){SKAIM.dx=dx/l;SKAIM.dy=dy/l;}
}
function skUp(e,id,b,cancel){
  if(!SKAIM.on||e.pointerId!==SKAIM.pid)return;
  const was={...SKAIM};SKAIM.on=false;b.classList.remove('aim');try{b.releasePointerCapture(e.pointerId);}catch(_){}
  if(cancel)return;
  const dx=e.clientX-was.ox,dy=e.clientY-was.oy,l=Math.hypot(dx,dy);
  if(!was.moved){castSkill(id);return;}                  /* chạm nhanh: tự nhắm mục tiêu gần nhất (không có thì bắn về phía đang nhìn) */
  if(l<SK_DEAD)return;                                   /* kéo ra rồi kéo về giữa nút: huỷ */
  const cfg=SKCFG[id],R=SK_RANGE[cfg.type]||250,d=cfg.type==='zone'?Math.max(70,Math.min(1,l/SK_MAXPX)*R):R;   /* đạn: luôn bay hết tầm theo hướng kéo, gặp địch giữa đường thì nổ; vùng (kim): đặt tại điểm kéo */
  castSkill(id,false,{x:P.x+dx/l*d,y:P.y+dy/l*d+4});    /* bắn theo hướng đã ngắm, không tự bám mục tiêu */
}
function skBtnTick(t){
  const on=document.getElementById('bagBtn')&&document.getElementById('bagBtn').style.display!=='none';
  skBuild();skBar.style.display=(on&&cult.sk.length)?'block':'none';
  for(const b of skBar.children){const id=b.dataset.id,sk=TD.bySkill[id],rem=Math.max(0,(skCd[id]|0)-t);
    b.firstElementChild.nextElementSibling.style.transform='scaleY('+Math.min(1,rem/sk.cd)+')';b.classList.toggle('no',P.mp<sk.mp);}
}
/* vạch ngắm đã tắt theo yêu cầu: kéo hướng vẫn hoạt động, không hiện mũi tên / vòng đích */
function drawSkAim(){ /* no-op */ }
addEventListener('keydown',e=>{if(e.target&&e.target.tagName==='INPUT')return;const n=parseInt(e.key,10);if(n>=1&&n<=5&&cult.sk[n-1])castSkill(cult.sk[n-1]);});
function learnBook(n){
  const k=TD.bookOf[n];if(!k||!(loot[n]>0))return false;
  if(skLearned(k.id)){toast(T('skill.known'));return false;}
  lootDec(n);cult.sk.push(k.id);lootUI();toast(T('skill.learn',{name:T('skill.'+k.id)}));skSig='';return true;
}
