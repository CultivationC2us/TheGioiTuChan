/* ---------- THÚ CƯỠI: Tuyết Vân Kỳ Lân (mnt/extract_m.py) ----------
   Luật cưỡi: bụng người chạm lưng thú · chỉ thấy MỘT chân · từ trước yên đến đầu thú vẽ ĐÈ lên người, từ thân đến đuôi người đè lên thú.
   Linh thú bay được (nút BAY): nhanh hơn, bỏ qua địa hình; bay thì không đánh được / không bị đánh (mặt đất ↔ bay không chạm nhau). */
const MTM={{MNTMETA}};
Object.assign(P,{mt:null,fly:false,flyH:0,dashT:-9999,dashCd:0,mtFx:-9999,mtFxK:'up',mtNoT:0});
const MTP=[];   /* mây bay theo sau */
const mountDef=()=>P.mt?TD.byMount[P.mt]:null;
const dashing=t=>!!P.mt&&t-P.dashT<450;
function mtSpeed(t){const d=mountDef();if(!d)return 1;let k=P.fly?d.fspd:d.spd;if(dashing(t))k*=2.2;return k;}
function mtRefresh(){mtUi();}
function rideToggle(id){
  if(P.dead)return false;const t=now();
  if(P.mt&&(!id||P.mt===id))return dismount();
  const d=TD.byMount[id];if(!d||!(loot[id]>0))return false;
  if(P.mt)dismount(true);
  P.mt=id;P.fly=false;P.flyH=0;P.mtFx=t;P.mtFxK='up';toast(T('toast.mt.up',{name:I18N.itemName(id)}));mtUi();return true;
}
function dismount(silent){
  if(!P.mt)return false;P.mt=null;P.fly=false;P.flyH=0;P.mtFx=now();P.mtFxK='down';
  if(!silent)toast(T('toast.mt.down'));mtUi();return true;
}
function flyToggle(){
  const d=mountDef();if(!d)return false;if(!d.fly){toast(T('toast.mt.nofly'));return false;}
  P.fly=!P.fly;P.mtFx=now();P.mtFxK=P.fly?'fly':'land';if(P.fly)setAuto(false);
  toast(T(P.fly?'toast.mt.fly':'toast.mt.land'));mtUi();return true;
}
function dashGo(){const t=now();if(!P.mt||P.dead||t<P.dashCd)return false;P.dashT=t;P.dashCd=t+3200;return true;}
function mtNoAtk(){const t=now();if(t-P.mtNoT>2500){P.mtNoT=t;toast(T('toast.mt.noatk'));}}
function mtTick(dt,t){
  if(P.dead&&P.mt)dismount(true);
  if(P.mt&&!(loot[P.mt]>0))dismount();
  P.flyH+=((P.fly?13:0)-P.flyH)*Math.min(1,dt*6);if(!P.fly&&P.flyH<.05)P.flyH=0;
  if(P.mt&&((P.fly&&P.mv)||dashing(t))&&(!MTP.length||t-MTP[MTP.length-1].t0>110))
    MTP.push({x:P.x-P.f*16+(Math.random()-.5)*4,y:P.y-P.flyH+(Math.random()-.5)*3,t0:t,k:Math.random()<.5?'cloud1':'cloud2'});
  while(MTP.length&&t-MTP[0].t0>800)MTP.shift();
}
function mtFrame(t){
  if(dashing(t))return 'dash'+Math.min(3,Math.floor((t-P.dashT)/112));
  if(P.fly)return 'fly'+(Math.floor(t/120)%5);
  if(P.mv)return 'run'+(Math.floor(t/85)%6);
  return 'idle'+(Math.floor(t/230)%6);
}
function mDraw(name,x,y,sc,al){const F=MTM[name];if(!F)return;if(al!==undefined)ctx.globalAlpha=al;ctx.drawImage(IMG.mnt,F[0],F[1],F[2],F[3],x,y,F[2]*PX*sc,F[3]*PX*sc);ctx.globalAlpha=1;}
const MT_SEAT_DY=1.5, MT_FRONT=6, MT_CHIN=9;   /* hông lún nhẹ vào đệm yên (px) · phần thú đè lên người bắt đầu từ trước tâm yên (px) */
function drawMounted(t){
  const fm=mtFrame(t),F=MTM[fm];if(!F||!IMG.mnt.complete)return;
  const hv=P.flyH+(P.fly?Math.sin(t/240)*1.2:0),ax=F[4],ay=F[5],gy=F[6];
  ctx.save();ctx.imageSmoothingEnabled=false;
  /* bóng trên đất */
  ctx.fillStyle='rgba(0,0,0,'+(P.fly?.18:.28)+')';ctx.beginPath();ctx.ellipse(P.x,P.y+1,(P.fly?10:13)-hv*.12,(P.fly?2.2:3),0,0,7);ctx.fill();
  /* mây theo sau */
  for(const c of MTP){const e=(t-c.t0)/800;mDraw(c.k,c.x-(MTM[c.k][2]*PX*(.6+e*.5))/2,c.y-MTM[c.k][3]*PX*(.6+e*.5)/2,.6+e*.5,Math.max(0,.9*(1-e)));}
  ctx.translate(P.x,P.y-hv);ctx.scale(P.f,1);
  const mx=-ax*PX,my=-gy*PX,seatY=-(gy-ay)*PX+MT_SEAT_DY*PX;
  mDraw(fm,mx,my,1);
  /* người ngồi: tâm ngang ở giữa yên, vạch yên (hàng 43/44 = y65 trong khung) đặt đúng mặt đệm */
  const atking=t-P.atkT<430;let row,fr;
  if(P.dead){row=NC.rows.hit;fr=1;}else if(atking){row=NC.rows.atk;fr=Math.min(7,Math.floor((t-P.atkT)/430*8));}
  else if(t-P.hurtT<260){row=NC.rows.hit;fr=(t-P.hurtT)<130?0:1;}else{row=NC.rows.idle;fr=ncIdle(t);}
  ctx.save();ctx.translate(0,seatY+(NC.FEET-65)*PX);
  const sw=NC.W,sh=NC.H,sx=fr*sw,sy=row*sh,CUT=65,LX=34,RX=39;   /* bỏ chân phải ảnh (cột 21-25 = x34..38) */
  ctx.drawImage(IMG.player,sx,sy,sw,CUT,-NC.CX*PX,-NC.FEET*PX,sw*PX,CUT*PX);
  ctx.drawImage(IMG.player,sx,sy+CUT,LX,sh-CUT,-NC.CX*PX,(CUT-NC.FEET)*PX,LX*PX,(sh-CUT)*PX);
  ctx.drawImage(IMG.player,sx+RX,sy+CUT,sw-RX,sh-CUT,(RX-NC.CX)*PX,(CUT-NC.FEET)*PX,(sw-RX)*PX,(sh-CUT)*PX);
  drawHeld(t,atking,row,fr);ctx.restore();
  /* từ trước yên đến đầu: thú đè lên người */
  ctx.save();ctx.beginPath();ctx.rect(MT_FRONT*PX,seatY-(MT_CHIN)*PX,800,800);ctx.clip();mDraw(fm,mx,my,1);ctx.restore();   /* mặt người (trên cằm) không bị bờm che */
  ctx.restore();
  /* hiệu ứng lên/xuống thú, bắt đầu/ngừng bay */
  const e=t-P.mtFx;
  if(e<750){const k=P.mtFxK;ctx.save();ctx.imageSmoothingEnabled=false;
    const u=e/750,ring=MTM.ring,rs=.5+u*1.1;
    mDraw('ring',P.x-ring[2]*PX*rs/2,P.y-ring[3]*PX*rs*.5-1,rs,Math.max(0,1-u));
    if(k==='up'||k==='fly'){const s=MTM.spark;mDraw('spark',P.x-s[2]*PX/2,P.y-hv-34*PX-u*12,1,Math.max(0,1-u*1.2));}
    if(k==='down'||k==='land'){const s=MTM.spike;mDraw('spike',P.x-s[2]*PX/2,P.y-s[3]*PX+2,1,Math.max(0,1-u*1.3));}
    ctx.restore();}
  ctx.restore();
}
/* ---------- nút CƯỠI · BAY · LƯỚT ---------- */
(function(){
  const st=document.createElement('style');
  st.textContent='.mtb{position:fixed;width:54px;height:54px;border-radius:50%;border:2px solid #9fe3ff99;background:radial-gradient(circle at 40% 35%,#2e6a96cc,#0c2036dd);color:#e6f6ff;font-size:12px;font-weight:800;display:none;align-items:center;justify-content:center;text-shadow:0 1px 3px #000;touch-action:none;box-shadow:0 0 10px #4fb8ff55;padding:0;line-height:1.05;text-align:center;z-index:31}.mtb.on{background:radial-gradient(circle at 40% 35%,#8fe3ffcc,#2a7ab5dd);box-shadow:0 0 14px #9fe3ffcc}.mtb:active{transform:scale(.94)}'+
   '#mtRide{right:calc(env(safe-area-inset-right,0px) + 118px);bottom:calc(env(safe-area-inset-bottom,0px) + 30px)}'+
   '#mtFly{right:calc(env(safe-area-inset-right,0px) + 118px);bottom:calc(env(safe-area-inset-bottom,0px) + 94px)}'+
   '#mtDash{right:calc(env(safe-area-inset-right,0px) + 178px);bottom:calc(env(safe-area-inset-bottom,0px) + 62px)}';
  document.head.appendChild(st);
  function mk(id,fn){const b=document.createElement('button');b.id=id;b.type='button';b.className='mtb';
    b.addEventListener('pointerdown',e=>{fn();e.preventDefault();e.stopPropagation();});b.addEventListener('click',e=>e.stopPropagation());document.body.appendChild(b);return b;}
  const bR=mk('mtRide',()=>{if(P.mt)dismount();else{const id=cult.mtSel&&loot[cult.mtSel]>0?cult.mtSel:Object.keys(loot).find(k=>TD.byMount[k]&&loot[k]>0);if(id){cult.mtSel=id;rideToggle(id);}}});
  const bF=mk('mtFly',flyToggle),bD=mk('mtDash',dashGo);
  window.mtUi=function(){
    const hud=document.getElementById('hud'),on=hud&&hud.style.display==='block',own=Object.keys(loot).some(k=>TD.byMount[k]&&loot[k]>0),d=mountDef();
    bR.style.display=on&&(own||P.mt)?'flex':'none';bR.textContent=T(P.mt?'mt.down':'mt.ride');bR.classList.toggle('on',!!P.mt);
    bF.style.display=on&&d&&d.fly?'flex':'none';bF.textContent=T(P.fly?'mt.land':'mt.fly');bF.classList.toggle('on',P.fly);
    bD.style.display=on&&d?'flex':'none';bD.textContent=T('mt.dash');bD.style.opacity=now()<P.dashCd?.45:1;
  };
  setInterval(()=>window.mtUi(),150);
})();
