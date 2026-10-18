/* ---------- LÔI KIẾP · ĐỘT PHÁ TRÚC CƠ ----------
   Bấm "Độ lôi kiếp" (cần ăn đủ TC.need Trúc Cơ Đan) → mây kiếp kéo tới, TC.strikes đạo sét giáng đều trong TC.dur giây,
   tổng đúng TC.total HP sát thương thật (37/38 HP mỗi đạo). Sống sót + qua phép thử may rủi (lần đầu 1%, sau 50%) → lên Trúc Cơ.
   Hình ảnh: mây (hàng 1), sét giật (2), sét lan (3), vòng lôi điện (4) — từ ảnh người dùng, đã xoá nền (kie/extract.py). */
const KIE={on:false,t0:0,fate:false,i:0,dealt:0,fx:[],flash:0,endT:-1e9};
const kieChance=()=>(cult.tka|0)?TD.TC.p:TD.TC.pFirst;
const kieDmg=i=>Math.round(TD.TC.total*(i+1)/TD.TC.strikes)-Math.round(TD.TC.total*i/TD.TC.strikes);   /* tổng các đạo = đúng total */
const kieDom=(()=>{
  const st=document.createElement('style');st.textContent=
   '#kieVeil{position:fixed;inset:0;z-index:18;pointer-events:none;background:radial-gradient(ellipse at 50% 45%,#0a0c2a55,#05061ccc);opacity:0;transition:opacity 1.2s}#kieVeil.on{opacity:1}'+
   '#kieFlash{position:fixed;inset:0;z-index:19;pointer-events:none;background:#dfe8ff;opacity:0;transition:opacity .45s}'+
   '#kieBar{position:fixed;z-index:45;left:50%;top:calc(env(safe-area-inset-top,0px) + 152px);transform:translateX(-50%);min-width:250px;padding:5px 12px 7px;border:2px solid #b9c8ff;border-radius:10px;background:#0b0f33dd;color:#e6edff;font:900 15px/1.2 system-ui,sans-serif;text-align:center;display:none;pointer-events:none;box-shadow:0 0 14px #6c86ff99}'+
   '#kieBar i{display:block;height:7px;margin-top:5px;border-radius:4px;background:#1a2260;overflow:hidden}#kieBar i b{display:block;height:100%;width:0;background:linear-gradient(90deg,#7fa6ff,#fff)}'+
   '#kieBan{position:fixed;z-index:60;left:50%;top:38%;transform:translate(-50%,-50%) scale(.9);max-width:86vw;text-align:center;font:900 28px/1.35 system-ui,sans-serif;color:#fff;text-shadow:0 0 12px #6c86ff,0 2px 3px #000;opacity:0;transition:opacity .6s,transform .6s;pointer-events:none}#kieBan.on{opacity:1;transform:translate(-50%,-50%) scale(1)}#kieBan small{display:block;font-size:15px;font-weight:700;color:#d6defd;margin-top:6px}#kieBan.bad{color:#ffb4b4}';
  document.head.appendChild(st);
  const mk=(id)=>{const d=document.createElement('div');d.id=id;document.body.appendChild(d);return d;};
  return{veil:mk('kieVeil'),flash:mk('kieFlash'),bar:mk('kieBar'),ban:mk('kieBan')};
})();
let kieBanT=0;
function kieBanner(ok,why){
  kieDom.ban.className=ok?'on':'on bad';
  kieDom.ban.innerHTML=ok?T('kie.ok',{name:realmName(),m:(Math.round(TD.TC.mul*100)/100).toString().replace('.',',')}):T(why==='dead'?'kie.fail.dead':'kie.fail.fate');
  clearTimeout(kieBanT);kieBanT=setTimeout(()=>{kieDom.ban.className='';},6500);
}
function kieStart(){
  if(KIE.on||!cult.aw||cult.rl<TD.REALM.max||cult.tc>0||P.dead)return false;
  if((cult.tcn|0)<TD.TC.need){toast(T('toast.tc.need',{n:TD.TC.need,h:cult.tcn|0}));return false;}
  if(AUTO.on){AUTO.on=false;autoLabel();}
  Object.assign(KIE,{on:true,t0:now(),fate:Math.random()<kieChance(),i:0,dealt:0,fx:[],flash:0});
  cult.tka=(cult.tka|0)+1;cult.tcn=0;      /* đan đã dùng cho lần độ kiếp này; đóng trang giữa chừng cũng tính một lần thử */
  kieDom.veil.classList.add('on');kieDom.bar.style.display='block';toast(T('toast.tc.start'));return true;
}
function kieEnd(ok,why){
  KIE.on=false;KIE.endT=now();kieDom.veil.classList.remove('on');kieDom.bar.style.display='none';
  if(ok){cult.tc=1;cult.qi=0;cult.tcn=0;TD.EL.forEach(e=>{cult.r[e.id]=0;});recalc();P.hp=P.maxHp;P.mp=P.maxMp;}
  else if(!P.dead){P.hp=Math.max(1,Math.round(P.maxHp*.3));}
  kieBanner(ok,why);
}
function kieStrike(d){
  const t=now();
  P.hp-=d;KIE.dealt+=d;P.hurtT=t;floaters.push({x:P.x,y:P.y-34,t0:t,s:'⚡-'+d,c:'#cfe0ff'});
  KIE.fx.push({k:'b',x:P.x,y:P.y+4,t0:t,dur:640,sc:.95},{k:'s',x:P.x,y:P.y+6,t0:t,dur:560,sc:.85});
  for(let j=0;j<2;j++){const a=Math.random()*6.283,r=55+Math.random()*70;KIE.fx.push({k:'b',x:P.x+Math.cos(a)*r,y:P.y+Math.sin(a)*r*.55,t0:t+Math.random()*160,dur:600,sc:.55+Math.random()*.3});}
  kieDom.flash.style.transition='none';kieDom.flash.style.opacity=.5;requestAnimationFrame(()=>{kieDom.flash.style.transition='opacity .45s';kieDom.flash.style.opacity=0;});
  if(P.hp<=0){P.hp=1;kieEnd(false,'dead');}
}
function kieUpdate(dt){
  if(!KIE.on)return;
  const t=now(),C=TD.TC,el=t-KIE.t0,iv=C.dur*1000/C.strikes;
  if(P.dead){kieEnd(false,'dead');return;}
  while(KIE.on&&KIE.i<C.strikes&&el>=iv*KIE.i+iv/2){const d=kieDmg(KIE.i);KIE.i++;kieStrike(d);}
  if(!KIE.on)return;
  const left=Math.max(0,C.dur*1000-el),s=Math.ceil(left/1000);
  kieDom.bar.innerHTML=T('kie.bar',{t:Math.floor(s/60)+':'+String(s%60).padStart(2,'0'),d:KIE.dealt,m:C.total})+'<i><b style="width:'+Math.min(100,el/(C.dur*10))+'%"></b></i>';
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
