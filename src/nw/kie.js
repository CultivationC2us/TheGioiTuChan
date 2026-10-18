/* ---------- LÔI KIẾP · ĐỘT PHÁ TRÚC CƠ ----------
   Bấm "Độ lôi kiếp" (cần ăn đủ TC.need Trúc Cơ Đan) → mây kiếp kéo tới, TC.strikes đạo sét giáng đều trong TC.dur giây,
   tổng đúng TC.total HP sát thương thật (37/38 HP mỗi đạo). Sống sót + qua phép thử may rủi (lần đầu 1%, sau 50%) → lên Trúc Cơ.
   Điều kiện: ăn đủ TC.need đan (tối đa TC.cap) + 5 hệ linh căn đạt TC.root[0]. Thông tin kiếp (thời gian, tổng sát thương) là bí mật thiên đạo — không hiện cho người chơi.
   Sét giáng gây sát thương gấp 10 lần cho quái / NPC / linh thú trong phạm vi quanh người độ kiếp.
   Hình ảnh: mây (hàng 1), sét giật (2), sét lan (3), vòng lôi điện (4) — từ ảnh người dùng, đã xoá nền (kie/extract.py). */
const KIE_R=110;   /* bán kính sét lan (px thế giới) */
const KIE={on:false,t0:0,fate:false,i:0,dealt:0,fx:[],flash:0,endT:-1e9};
const kieChance=()=>(cult.tka|0)?TD.TC.p:TD.TC.pFirst;
const kieDmg=i=>Math.round(TD.TC.total*(i+1)/TD.TC.strikes)-Math.round(TD.TC.total*i/TD.TC.strikes);   /* tổng các đạo = đúng total */
const kieDom=(()=>{
  const st=document.createElement('style');st.textContent=
   '#kieVeil{position:fixed;inset:0;z-index:18;pointer-events:none;background:radial-gradient(ellipse at 50% 45%,#0a0c2a55,#05061ccc);opacity:0;transition:opacity 1.2s}#kieVeil.on{opacity:1}'+
   '#kieFlash{position:fixed;inset:0;z-index:19;pointer-events:none;background:#dfe8ff;opacity:0;transition:opacity .45s}'+
   '#kieBan{position:fixed;z-index:60;left:50%;top:38%;transform:translate(-50%,-50%) scale(.9);max-width:86vw;text-align:center;font:900 28px/1.35 system-ui,sans-serif;color:#fff;text-shadow:0 0 12px #6c86ff,0 2px 3px #000;opacity:0;transition:opacity .6s,transform .6s;pointer-events:none}#kieBan.on{opacity:1;transform:translate(-50%,-50%) scale(1)}#kieBan small{display:block;font-size:15px;font-weight:700;color:#d6defd;margin-top:6px}#kieBan.bad{color:#ffb4b4}';
  document.head.appendChild(st);
  const mk=(id)=>{const d=document.createElement('div');d.id=id;document.body.appendChild(d);return d;};
  return{veil:mk('kieVeil'),flash:mk('kieFlash'),ban:mk('kieBan')};
})();
let kieBanT=0;
function kieBanner(ok,why){
  kieDom.ban.className=ok?'on':'on bad';
  kieDom.ban.innerHTML=ok?T('kie.ok',{name:realmName(),m:(Math.round(TD.TC.mul*100)/100).toString().replace('.',',')}):T(why==='dead'?'kie.fail.dead':'kie.fail.fate');
  clearTimeout(kieBanT);kieBanT=setTimeout(()=>{kieDom.ban.className='';},6500);
}
function kieStart(){
  if(KIE.on||!cult.aw||cult.rl<TD.REALM.max||cult.tc>0||P.dead)return false;
  if((cult.tcd|0)<TD.TC.need){toast(T('toast.tc.need',{n:TD.TC.need,h:cult.tcd|0}));return false;}
  if(!TD.EL.every(e=>cult.r[e.id]>=TD.TC.root[0])){toast(T('toast.tc.root',{n:TD.TC.root[0]}));return false;}
  if(AUTO.on){AUTO.on=false;autoLabel();}
  Object.assign(KIE,{on:true,t0:now(),fate:Math.random()<kieChance(),i:0,dealt:0,fx:[],flash:0});
  cult.tka=(cult.tka|0)+1;      /* đóng trang giữa chừng cũng tính một lần thử */
  kieDom.veil.classList.add('on');toast(T('toast.tc.start'));return true;
}
function kieEnd(ok,why){
  KIE.on=false;KIE.endT=now();kieDom.veil.classList.remove('on');
  if(ok){cult.tc=1;cult.qi=0;
    TD.EL.forEach(e=>{cult.pb[e.id]=(cult.pb[e.id]|0)+cult.pl[e.id].reduce((a,b)=>a+b,0);cult.pl[e.id]=[0,0,0];});   /* châu đã nuốt về 0/20 nhưng chỉ số giữ lại (cộng dồn); linh căn giữ nguyên, trần lên 900 */
    recalc();P.hp=P.maxHp;P.mp=P.maxMp;}
  /* thất bại: KHÔNG phạt thêm (lần đầu gần như chắc chắn thất bại đã là cái giá); phạt nặng để dành cho Kết Đan sau này */
  kieBanner(ok,why);
}
function kieStrike(d){
  const t=now();
  P.hp-=d;KIE.dealt+=d;P.hurtT=t;floaters.push({x:P.x,y:P.y-34,t0:t,s:'⚡-'+d,c:'#cfe0ff'});
  KIE.fx.push({k:'b',x:P.x,y:P.y+4,t0:t,dur:640,sc:.95},{k:'s',x:P.x,y:P.y+6,t0:t,dur:560,sc:.85});
  const d10=d*10,R=KIE_R,hit=(x,y)=>Math.hypot(x-P.x,(y-P.y)*1.4)<R;   /* ai đứng gần chịu gấp 10 lần: quái, NPC, linh thú */
  for(const m of mons2)if(monAlive(m)&&hit(m.x,m.y))monHit(m,d10);
  for(const n of NPCS)if(n.st!=='dead'&&hit(n.x,n.y)){n.hp=Math.max(0,n.hp-d10);n.flash=t;floaters.push({x:n.x,y:n.y-34,t0:t,s:'⚡'+d10,c:'#cfe0ff'});if(n.hp<=0)npcDie(n,'sky');}
  for(const o of petObjs.concat([dog]))if(hit(o.x,o.y)){o.hurtT=t;floaters.push({x:o.x,y:o.y-24,t0:t,s:'⚡'+d10,c:'#e6c8ff'});}
  for(let j=0;j<2;j++){const a=Math.random()*6.283,r=30+Math.random()*70;KIE.fx.push({k:'b',x:P.x+Math.cos(a)*r,y:P.y+Math.sin(a)*r*.55,t0:t+Math.random()*160,dur:600,sc:.55+Math.random()*.3});}
  kieDom.flash.style.transition='none';kieDom.flash.style.opacity=.5;requestAnimationFrame(()=>{kieDom.flash.style.transition='opacity .45s';kieDom.flash.style.opacity=0;});
  if(P.hp<=0){P.hp=1;kieEnd(false,'dead');}
}
function kieUpdate(dt){
  if(!KIE.on)return;
  const t=now(),C=TD.TC,el=t-KIE.t0,iv=C.dur*1000/C.strikes;
  if(P.dead){kieEnd(false,'dead');return;}
  while(KIE.on&&KIE.i<C.strikes&&el>=iv*KIE.i+iv/2){const d=kieDmg(KIE.i);KIE.i++;kieStrike(d);}
  if(!KIE.on)return;
  if(el>=C.dur*1000)kieEnd(KIE.fate,'fate');
}
function drawKie(t){
  const A=IMG.kie;if(!A||!A.complete||(!KIE.on&&!KIE.fx.length&&t-KIE.endT>1400))return;
  const spr=(nm,i,x,y,s,al,bottom)=>{const m=KIEM[nm]&&KIEM[nm][i];if(!m)return;ctx.globalAlpha=al;const w=m[2]*s,h=m[3]*s;ctx.drawImage(A,m[0],m[1],m[2],m[3],x-m[4]*s,y-(bottom?h:h*.5),w,h);};
  ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  const fade=KIE.on?1:Math.max(0,1-(t-KIE.endT)/1400);
  if(fade>0){
    const el=t-KIE.t0,n=KIEM.ring.length;
    if(KIE.on)spr('ring',el<1200?Math.min(5,Math.floor(el/200)):6+Math.floor(((el-1200)/110)%(n-6)),P.x,P.y+8,.95,.9,false);   /* pháp trận dưới chân */
  }
  KIE.fx=KIE.fx.filter(f=>t<f.t0+f.dur);
  for(const f of KIE.fx){if(t<f.t0)continue;const nm=f.k==='b'?'bolt':'spread',n=KIEM[nm].length,i=Math.min(n-1,Math.floor((t-f.t0)/f.dur*n));
    spr(nm,i,f.x,f.y,f.sc,1,f.k==='b');}
  if(fade>0){   /* mây kiếp lớn dần trên đầu, rồi tan khi xong */
    const el=Math.max(0,(KIE.on?t:KIE.endT)-KIE.t0),n=KIEM.cloud.length,i=Math.min(n-1,Math.floor(el/5000));
    spr('cloud',i,P.x,P.y-118+Math.sin(t/400)*3,1,.95*fade,false);
  }
  ctx.restore();
}

/* Bóng dưới chân của người đã Trúc Cơ: vòng pháp trận lam (ảnh người dùng) thay cho bóng đen, mờ nhẹ. Trả true nếu đã vẽ. */
function auraShadow(x,y,rx,al){
  if(!((cult.tc|0)>0))return false;
  const A=IMG.kie,m=KIEM.aura&&KIEM.aura[0];if(!A||!A.complete||!m)return false;
  const w=rx*2*2.8,s=w/m[2],h=m[3]*s;
  ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  ctx.globalAlpha=al*(.92+.08*Math.sin(now()/700));
  ctx.drawImage(A,m[0],m[1],m[2],m[3],x-m[4]*s,y-h*.56,w,h);   /* tâm elip của vòng nằm ở ~56% chiều cao ảnh */
  ctx.restore();return true;
}
