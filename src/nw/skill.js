/* ============================================================
   CÔNG PHÁP (5 hệ) — học từ Sách Kỹ Năng, thi triển tốn LINH LỰC, có hồi chiêu
   Sát thương = công kích cơ bản × hệ số (2.2–2.8, luôn hơn đòn đánh thường) và có thể CHÍ MẠNG.
   Dạng: 'proj' = bay tới mục tiêu rồi nổ vùng (Hỏa/Thủy/Thổ/Mộc) · 'zone' = mưa kiếm giáng xuống vùng trước mặt (Kim)
   Sprite: lib/extract_skill.py → atlas 'sk' (SKM, tên '<hệ>_<số>').
   ============================================================ */
const SKCFG={
  hoa:{type:'proj',fly:[1,2,3,4,5,6,7],burst:[8,9,10],bms:170,sc:3.52,fsc:2.8,r:184,hits:[0],hold:200,yoff:0},
  thuy:{type:'proj',fly:[1,2,3,4],burst:[5,6,7,8,9,10,11],bms:95,sc:3.52,fsc:2.8,r:192,hits:[120],hold:200,yoff:0},
  tho:{type:'proj',fly:[3,4,5,6],burst:[7,8,9],bms:190,sc:3.52,fsc:2.8,r:184,hits:[150],hold:200,yoff:-64},
  moc:{type:'proj',fly:[1,2,3,4,5],burst:[6,7,8,9,10,11],bms:130,sc:3.52,fsc:2.8,r:192,hits:[0,430],hold:250,yoff:0},
  kim:{type:'zone',burst:[1,2,3,4,5,6,7,8,9,10,11,12,13],bms:85,sc:4.08,r:232,hits:[840],hold:250,yoff:0}
};
const skCd={},skFx=[];
cult.sk=[];P.mp=60;P.maxMp=60;
const skLearned=id=>cult.sk.indexOf(id)>=0;
function skHitArea(f){
  const cfg=SKCFG[f.id],sk=TD.bySkill[f.id];let any=false;
  for(const m of mons2){if(!monAlive(m))continue;
    if(Math.hypot(m.x-f.x,(m.y-f.y)*1.4)<f.r+m.d.sc*8){monHit(m,dmgRoll(sk.mult));any=true;}}
  for(const d of DRG){withDr(d,()=>{if(mTargetable()&&M.st!=='die'&&Math.hypot(M.x-f.x,(M.y-f.y)*1.4)<f.r+22){mHit(dmgRoll(sk.mult));any=true;}});}
  f.n++;return any;
}
function skTarget(){
  let best=null,bd=1e9;const R=300;
  for(const m of mons2){if(!monAlive(m))continue;const dx=(m.x-P.x)*P.f,d=Math.hypot(m.x-P.x,m.y-P.y);if(dx>-24&&d<R&&d<bd){best={x:m.x,y:m.y,o:m};bd=d;}}
  for(const d of DRG){withDr(d,()=>{if(mTargetable()&&M.st!=='die'){const dx=(M.x-P.x)*P.f,q=Math.hypot(M.x-P.x,M.y-P.y);if(dx>-24&&q<R&&q<bd){best={x:M.x,y:M.y,o:d};bd=q;}}});}
  return best;
}
function castSkill(id,auto){
  const sk=TD.bySkill[id],cfg=SKCFG[id];if(!sk||!skLearned(id)||P.dead||P.fly)return false;
  const t=now();if(t<(skCd[id]|0))return false;
  if(P.mp<sk.mp){if(!auto)toast(T('skill.nomp'));return false;}
  P.mp-=sk.mp;skCd[id]=t+sk.cd;
  const tg=skTarget();let tx,ty;
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
    if(f.k==='proj'){if(t<bs){if(f.o&&f.o.hp>0){f.tx=f.o.x;f.ty=f.o.y;}continue;}if(!f.fz){f.fz=1;f.x=f.tx;f.y=f.ty;}}
    const e=t-bs;
    for(let h=0;h<f.hits.length;h++)if(!f.done[h]&&e>=f.hits[h]){f.done[h]=1;skHitArea(f);}
    if(e>cfg.burst.length*cfg.bms+cfg.hold)skFx.splice(i,1);}
  if(AUTO&&AUTO.on&&!P.dead&&!P.fly){const tg=skTarget();
    if(tg&&Math.hypot(tg.x-P.x,tg.y-P.y)<130)for(const id of cult.sk){if(castSkill(id,true))break;}}
  skBtnTick(t);
}
function drawSkFx(t){
  if(!IMG.sk||!IMG.sk.complete)return;
  for(const f of skFx){const cfg=SKCFG[f.id];
    if(f.k==='proj'&&t<f.t0+f.fl){const k=(t-f.t0)/f.fl,x=f.ox+(f.tx-f.ox)*k,y=f.oy+(f.ty-10-f.oy)*k,dx=f.tx-f.ox,dy=f.ty-10-f.oy,sg=dx<0?-1:1,ang=Math.atan2(dy,Math.abs(dx)||1);
      const nm=f.id+'_'+cfg.fly[Math.floor((t-f.t0)/70)%cfg.fly.length],fr=SKM[nm];if(!fr)continue;
      ctx.save();ctx.translate(x,y);ctx.scale(sg,1);ctx.rotate(ang);ctx.drawImage(IMG.sk,fr[0],fr[1],fr[2],fr[3],fr[4]*cfg.fsc,fr[5]*cfg.fsc,fr[2]*cfg.fsc,fr[3]*cfg.fsc);ctx.restore();continue;}
    const bs=f.k==='zone'?f.t0:f.t0+f.fl,e=t-bs,i=Math.min(cfg.burst.length-1,Math.floor(e/cfg.bms)),fr=SKM[f.id+'_'+cfg.burst[i]];if(!fr||e<0)continue;
    const tail=cfg.burst.length*cfg.bms,al=e>tail?Math.max(0,1-(e-tail)/cfg.hold):1,s=cfg.sc;
    ctx.save();ctx.globalAlpha=al;ctx.drawImage(IMG.sk,fr[0],fr[1],fr[2],fr[3],f.x+fr[4]*s,f.y+cfg.yoff+fr[5]*s,fr[2]*s,fr[3]*s);ctx.restore();}
}
/* ----- nút kỹ năng ----- */
const skBar=document.createElement('div');skBar.id='skBar';
{const st=document.createElement('style');st.textContent=
 '#skBar{position:fixed;z-index:40;right:calc(env(safe-area-inset-right,0px) + 16px);bottom:calc(env(safe-area-inset-bottom,0px) + 196px);display:none;flex-direction:column-reverse;flex-wrap:wrap-reverse;gap:7px;max-height:calc(100vh - 330px);pointer-events:none}'+
 '#skBar .skb{position:relative;width:46px;height:46px;border-radius:9px;pointer-events:auto;touch-action:none;-webkit-tap-highlight-color:transparent;box-shadow:0 0 0 2px #e8bb48,0 0 0 3px #1a1206,0 3px 6px #000b;background:#10161f;overflow:hidden}'+
 '#skBar .skb canvas{position:absolute;inset:0;width:100%;height:100%;image-rendering:auto}'+
 '#skBar .skb i{position:absolute;inset:0;background:#000b;transform-origin:bottom;transform:scaleY(0)}'+
 '#skBar .skb b{position:absolute;left:0;right:0;bottom:0;text-align:center;font-size:9px;line-height:11px;font-weight:900;color:#d8c8ff;background:#1a0f3acc;text-shadow:0 1px 1px #000}'+
 '#skBar .skb.no b{color:#ff8a8a}#skBar .skb:active{transform:scale(.93)}'+
 '#skBar .skb u{position:absolute;left:1px;top:0;font-size:9px;font-weight:900;color:#fff;text-decoration:none;text-shadow:0 0 2px #000,0 0 2px #000}';
 document.head.appendChild(st);document.body.appendChild(skBar);}
let skSig='';
function skBuild(){
  const sig=cult.sk.join(',')+'|'+(IMG.gl&&IMG.gl.complete?1:0);if(sig===skSig)return;skSig=sig;skBar.innerHTML='';
  cult.sk.forEach((id,n)=>{const sk=TD.bySkill[id],fr=GLM['sk_'+id];if(!sk||!fr)return;
    const b=document.createElement('div');b.className='skb';b.dataset.id=id;b.setAttribute('aria-label',I18N.t('skill.'+id));
    const c=document.createElement('canvas');c.width=64;c.height=64;const x=c.getContext('2d');x.imageSmoothingEnabled=true;x.drawImage(IMG.gl,fr[0],fr[1],fr[2],fr[3],0,0,64,64);
    b.appendChild(c);b.insertAdjacentHTML('beforeend','<i></i><u>'+(n+1)+'</u><b>'+sk.mp+'</b>');
    b.addEventListener('pointerdown',e=>{castSkill(id);e.preventDefault();e.stopPropagation();});
    skBar.appendChild(b);});
}
function skBtnTick(t){
  const on=document.getElementById('bagBtn')&&document.getElementById('bagBtn').style.display!=='none';
  skBuild();skBar.style.display=(on&&cult.sk.length)?'flex':'none';
  for(const b of skBar.children){const id=b.dataset.id,sk=TD.bySkill[id],rem=Math.max(0,(skCd[id]|0)-t);
    b.firstElementChild.nextElementSibling.style.transform='scaleY('+Math.min(1,rem/sk.cd)+')';b.classList.toggle('no',P.mp<sk.mp);}
}
addEventListener('keydown',e=>{if(e.target&&e.target.tagName==='INPUT')return;const n=parseInt(e.key,10);if(n>=1&&n<=5&&cult.sk[n-1])castSkill(cult.sk[n-1]);});
function learnBook(n){
  const k=TD.bookOf[n];if(!k||!(loot[n]>0))return false;
  if(skLearned(k.id)){toast(T('skill.known'));return false;}
  lootDec(n);cult.sk.push(k.id);lootUI();toast(T('skill.learn',{name:T('skill.'+k.id)}));skSig='';return true;
}
