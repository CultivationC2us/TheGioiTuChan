/* ============================================================
   QUÁI NGŨ HÀNH · NGỌC · CHỈ SỐ · THUẦN HÓA · TỰ ĐỘNG SĂN
   File này được chèn NGUYÊN VĂN vào bên trong vòng đời game (game_tpl.html), dùng chung biến P, tiles, ctx, drops...
   - 4 quái mới (Hỏa/Thổ/Kim/Mộc) vẽ từ atlas pixel thật (mon/extract_mon.py). Mỗi quái 2 chiêu; xem MD.
   - Hạ quái: rơi 1 ngọc bậc 1 của hệ đó; 1% thuần hóa → thành linh thú đi theo và hỗ trợ khi bật tự động.
   - Ngọc: nuốt tăng chỉ số vĩnh viễn (trần 10/bậc); 10 viên → 1 viên bậc cao hơn (tên mới).
   - Mọi con số cân bằng nằm ở MD (quái), TD.PEARL (res.js) và hằng số bên dưới.
   ============================================================ */
const MB64={hoa:'{{MON_HOA}}',tho:'{{MON_THO}}',kim:'{{MON_KIM}}',moc:'{{MON_MOC}}'};
const MMETA={hoa:{{MONMETA_HOA}},tho:{{MONMETA_THO}},kim:{{MONMETA_KIM}},moc:{{MONMETA_MOC}}};
const MIMG={};for(const k in MB64){const i=new Image();i.src='data:image/webp;base64,'+MB64[k];MIMG[k]=i;}
let TAME_P=0.01;                 /* tỉ lệ thuần hóa mỗi lần hạ quái */
const MON_RESPAWN=45000;         /* quái hồi sinh sau 45 giây */

/* ---------- CHỈ SỐ NHÂN VẬT ---------- */
const STT={dmg:0,hp:0,red:0,spd:0,qi:0};
/* ---------- TU VI · CẢNH GIỚI (Luyện Khí 1-10) ----------
   Tu vi cần để qua tầng n = base·2^(n-1) (gấp đôi mỗi tầng). Mỗi lần đột phá, máu & sát thương nhân thêm ×1,2 (cộng dồn).
   Tu luyện thường chậm (REALM.rate + Thủy châu); thảo dược thô không cho tu vi — phải luyện thành đan (đan phương). */
const realmNeed=l=>l>=TD.REALM.max?Infinity:TD.REALM.base*Math.pow(2,l-1);
const realmMul=l=>Math.pow(TD.REALM.mul,(l||cult.rl)-1);
const qiRate=()=>TD.REALM.rate+STT.qi;
function qiTick(dt){
  if(!cult.dpg&&!(loot['dp.tukhi']>0)){loot['dp.tukhi']=1;cult.dpg=true;lootUI();}   /* tặng đan phương đầu tiên (1 lần) */
  if(!cult.aw||cult.rl>=TD.REALM.max)return;const nd=realmNeed(cult.rl);if(cult.qi<nd)cult.qi=Math.min(nd,cult.qi+dt*qiRate());
}
function breakthrough(){
  if(!cult.aw||cult.rl>=TD.REALM.max||cult.qi<realmNeed(cult.rl)){toast(T('toast.nobreak'));return false;}
  cult.qi-=realmNeed(cult.rl);cult.rl++;recalc();P.hp=P.maxHp;
  toast(T('toast.break',{n:cult.rl,m:(Math.round(TD.REALM.mul*100)/100).toString().replace('.',',')}));return true;
}
function eatDan(n){
  const d=TD.DAN[n];if(!d||!(loot[n]>0))return false;
  if(!cult.aw){toast(T('toast.dan.asleep'));return false;}
  if(cult.rl>=TD.REALM.max){toast(T('toast.dan.max'));return false;}
  if(cult.qi>=realmNeed(cult.rl)){toast(T('toast.dan.full'));return false;}
  lootDec(n);cult.qi+=d.qi;lootUI();toast(T('toast.dan',{name:I18N.itemName(n),n:d.qi}));return true;
}
const ingKeys=k=>k==='@herb1'?TD.RES.filter(g=>g.kind==='herb'&&g.tier===1).map(g=>g.item):[k];
const ingHave=k=>ingKeys(k).reduce((a,x)=>a+(loot[x]|0),0);
function ingTake(k,q){for(const x of ingKeys(k).sort((a,b)=>(loot[b]|0)-(loot[a]|0))){const t=Math.min(q,loot[x]|0);if(t>0){loot[x]-=t;q-=t;if(loot[x]<=0)delete loot[x];}if(q<=0)break;}}
function craftMax(rid){const r=TD.RECIPES[rid];if(!r)return 0;return Math.min(...r.ing.map(([k,q])=>Math.floor(ingHave(k)/q)));}
function craft(rid,n){
  const r=TD.RECIPES[rid];if(!r||!(loot[rid]>0))return 0;n=Math.min(n||1,craftMax(rid));
  if(n<1){toast(T('toast.alc.no'));return 0;}
  r.ing.forEach(([k,q])=>ingTake(k,q*n));
  loot[r.out]=(loot[r.out]|0)+n;lootUI();toast(T('toast.alc',{name:I18N.itemName(r.out),n}));return n;
}

function recalc(){
  const sum=el=>cult.pl[el].reduce((a,b)=>a+b,0),pe=TD.PEARL,rd=x=>Math.round(x*1000)/1000;
  STT.dmg=rd(sum('kim')*pe.kim.per);STT.hp=rd(sum('moc')*pe.moc.per);STT.red=Math.min(.6,rd(sum('tho')*pe.tho.per));STT.spd=rd(sum('hoa')*pe.hoa.per);STT.qi=rd(sum('thuy')*pe.thuy.per);
  if(cult.qi>realmNeed(cult.rl)+TD.DAN['dan.tukhi'].qi)cult.qi=realmNeed(cult.rl);   /* save cũ: tu vi vượt trần → về trần */
  const mx=Math.round((100+STT.hp)*realmMul()),old=P.maxHp;P.maxHp=mx;P.hp=mx>old?Math.min(mx,P.hp+(mx-old)):Math.min(P.hp,mx);
}
/* ---------- DEF · TÚI CÓ DUNG TÍCH ---------- */
const defVal=()=>Math.round(TD.BASE.def*realmMul());
/* kích thước (ô) mỗi vật phẩm: nguyên liệu theo bậc 1/2/3, châu 2/4/8, đan 1, đan phương 2, Linh Thạch tiền tệ 0 */
function itemSize(n){
  if(n==='lt')return 0;if(TD.BAG.sz[n]!=null)return TD.BAG.sz[n];
  const g=TD.byItem[n];if(g)return g.tier;const p=TD.byPearl[n];if(p)return [2,4,8][p.tier-1];
  return 1;
}
function bagUsed(){let s=0;for(const k in loot)if(loot[k]>0)s+=itemSize(k)*loot[k];return s;}
const bagFree=()=>TD.BAG.cap-bagUsed();
let bagFullT=0;
const dmgRoll=()=>Math.round((7+Math.floor(Math.random()*6)+STT.dmg)*realmMul());
const atkCd=()=>470/(1+STT.spd);

/* ---------- NGỌC: nuốt (trần 10/bậc) · hợp nhất 10 → 1 ---------- */
function pearlInfo(item){
  const p=TD.byPearl[item];if(!p)return null;
  const arr=cult.pl[p.el],t=p.tier,done=arr[t-1];let can=true,reason='';
  if(t>1&&arr[t-2]<TD.PCAP){can=false;reason='lock';}
  else if(done>=TD.PCAP){can=false;reason=t<TD.PT?'cap':'max';}
  return{el:p.el,tier:t,done,cap:TD.PCAP,can,reason,next:t<TD.PT?TD.pearlId(p.el,t+1):null};
}
function swallow(item){
  const i=pearlInfo(item);if(!i||!i.can||!(loot[item]>0))return false;
  lootDec(item);cult.pl[i.el][i.tier-1]++;recalc();lootUI();
  toast(T('toast.swallow',{name:I18N.itemName(item),eff:T('eff.'+i.el)}));return true;
}
function fuse(item){
  const i=pearlInfo(item);if(!i||!i.next||(loot[item]|0)<TD.PFUSE)return false;
  loot[item]-=TD.PFUSE;if(loot[item]<=0)delete loot[item];loot[i.next]=(loot[i.next]|0)+1;lootUI();
  toast(T('toast.fuse',{name:I18N.itemName(i.next)}));return true;
}

/* ---------- ĐỊNH NGHĨA QUÁI ---------- */
const rowN=(r,n)=>Array.from({length:n},(_,i)=>'r'+r+'c'+i);
const MD={
 hoa:{el:'hoa',sc:1.65,hp:140,spd:46,aggro:180,leash:430,lair:[158,158],shw:28,fly:0,
   idle:rowN(0,7),walk:rowN(1,7),die:['r4c3','r4c4','r4c5','r4c6'],
   skills:[
    {k:'cone',cd:3800,range:190,wind:rowN(2,4),wms:105,fx:['r2c4','r2c5'],fxms:[170,300],ox:26,oy:-30,len:190,hw:32,dmg:14,hit:120},
    {k:'aoe', cd:6500,range:300,wind:['r3c0','r3c1'],wms:380,tele:750,fx:['r3c2','r3c3','r3c4'],fxms:130,r:46,dmg:16,col:'255,110,40'}]},
 tho:{el:'tho',sc:1.55,hp:120,spd:58,aggro:200,leash:460,lair:[158,42],shw:20,fly:1,
   idle:rowN(0,7),walk:rowN(1,7),die:null,
   skills:[
    {k:'proj',cd:2800,range:260,wind:rowN(2,4),wms:110,fx:['r2c4','r2c5','r2c6','r2c7','r2c8','r2c9'],speed:170,life:1500,ox:34,oy:-22,r:15,dmg:11},
    {k:'aoe', cd:6500,range:320,wind:['r4c0','r4c1'],wms:380,tele:750,fx:['r4c3','r4c4','r4c5','r4c6'],fxms:120,r:48,dmg:16,col:'210,160,90'}]},
 kim:{el:'kim',sc:1.55,hp:180,spd:40,aggro:170,leash:420,lair:[42,42],shw:30,fly:0,
   idle:rowN(0,7),walk:rowN(1,7),die:['r4c3','r4c4','r4c5','r4c6'],
   skills:[
    {k:'charge',cd:4500,range:260,wind:['r2c0','r2c1'],wms:220,dash:['r2c2','r2c3','r2c4','r2c5'],dms:80,dist:230,speed:300,dmg:18},
    {k:'aoe',   cd:6500,range:300,wind:['r3c1'],wms:700,tele:750,fx:['r3c2','r3c3','r3c4','r3c5'],fxms:120,r:48,dmg:16,col:'255,215,110'}]},
 moc:{el:'moc',sc:1.55,hp:160,spd:42,aggro:170,leash:420,lair:[42,158],shw:28,fly:0,
   idle:rowN(0,8),walk:rowN(1,8),die:['r4c3','r4c4','r4c5','r4c6'],
   skills:[
    {k:'proj',cd:2600,range:250,wind:['r3c0','r3c1'],wms:200,fx:['r3c2','r3c3','r3c4'],speed:190,life:1400,ox:44,oy:-34,r:13,dmg:11},
    {k:'aoe', cd:6500,range:300,wind:['r2c0','r2c1'],wms:350,tele:750,fx:['r3c5','r3c6','r3c7'],fxms:170,r:50,dmg:15,col:'140,230,70'}]}
};
const mons2=[],fx2=[],projs=[];
function findLand(tx,ty){
  for(let r=0;r<45;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
    if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;const x=tx+dx,y=ty+dy;if(x<4||y<4||x>=MW-4||y>=MH-4)continue;
    let ok=true;for(let a=-2;a<=2&&ok;a++)for(let b=-2;b<=2;b++){const q=tiles[y+b][x+a];if(q!==G&&q!==D&&q!==R){ok=false;break;}}
    if(ok)return{x:x*TILE+8,y:y*TILE+8};
  }return{x:tx*TILE+8,y:ty*TILE+8};
}
for(const id in MD){const d=MD[id],h=findLand(d.lair[0],d.lair[1]);
  mons2.push({id,d,x:h.x,y:h.y,hx:h.x,hy:h.y,f:1,hp:d.hp,maxHp:d.hp,st:'idle',t0:0,cd:[0,0],sk:null,flash:0,hold:0,deadAt:0,dieMs:900,tx:0,ty:0});}
const monAlive=m=>m===M?(mTargetable()&&M.st!=='die'):(m.st!=='dead'&&m.st!=='die');
const pearlOf=el=>TD.pearlId(el,1);

/* ---------- THUẦN HÓA · LINH THÚ ---------- */
const PETS=[],petObjs=[];
const POFF=[[-32,-12],[32,-16],[-46,10],[46,8],[0,-36]];
function addPet(id){if(PETS.includes(id)||!TD.MONS.some(m=>m.id===id))return false;PETS.push(id);petObjs.push({id,x:P.x-20,y:P.y,f:1,cd:0,run:false});return true;}
function setPets(list){PETS.length=0;petObjs.length=0;for(const id of (Array.isArray(list)?list:[]))addPet(id);}
function tameRoll(id){if(!PETS.includes(id)&&Math.random()<TAME_P&&addPet(id))toast(T('toast.tame',{name:T('monster.'+id)}));}
function petsUpdate(dt,t){
  const tg=(AUTO.on&&AUTO.tgt&&AUTO.tgt.k==='mon'&&monAlive(AUTO.tgt.ref))?AUTO.tgt.ref:null;
  petObjs.forEach((o,i)=>{
    const off=POFF[i%POFF.length];let tx,ty;
    if(tg){tx=tg.x-(tg.x>=P.x?1:-1)*30;ty=tg.y+(i%2?10:-6);}else{tx=P.x+off[0];ty=P.y+off[1];}
    const dx=tx-o.x,dy=ty-o.y,d=Math.hypot(dx,dy);o.run=d>5;
    if(d>4){const sp=Math.min(d*4,tg?140:100)*dt;o.x+=dx/d*sp;o.y+=dy/d*sp;}
    if(Math.abs(dx)>3)o.f=dx>0?1:-1;
    if(tg&&t>o.cd&&Math.hypot(tg.x-o.x,tg.y-o.y)<60){
      o.cd=t+1100;const dmg=4+Math.floor(STT.dmg/2),el=(TD.MONS.find(m=>m.id===o.id)||{}).el;
      fx2.push({k:'bolt',x0:o.x,y0:o.y-8,x1:tg.x,y1:tg.y-16,t0:t,dur:200,col:TD.PEARL[el].col});
      if(tg===M)mHit(dmg);else monHit(tg,dmg);
    }
    if(d>320){o.x=P.x;o.y=P.y;}
  });
}

/* ---------- AI QUÁI ---------- */
function moveMon(m,tx,ty,spd,dt){
  const dx=tx-m.x,dy=ty-m.y,d=Math.hypot(dx,dy);if(d<1)return;const s=Math.min(spd*dt,d),nx=m.x+dx/d*s,ny=m.y+dy/d*s;
  if(m.d.fly){m.x=nx;m.y=ny;return;}
  if(!isWater(nx,m.y))m.x=nx;if(!isWater(m.x,ny))m.y=ny;
}
function startSkill(m,i,t){
  const s=m.d.skills[i];m.st='atk';m.sk=s;m.t0=t;m.cd[i]=t+s.cd;m.done=false;m.f=P.x>=m.x?1:-1;m.dashInit=false;
  if(s.k==='aoe'){m.tx=P.x;m.ty=P.y;fx2.push({k:'tele',x:m.tx,y:m.ty,r:s.r,t0:t,dur:s.tele,col:s.col});}
}
function endSkill(m,t){m.st='chase';m.sk=null;m.t0=t;m.hold=t+250;}
function skillStep(m,t,dt){
  const s=m.sk,e=t-m.t0,d=m.d;
  if(s.k==='cone'){const wt=s.wind.length*s.wms,ft=s.fxms.reduce((a,b)=>a+b,0);
    if(!m.done&&e>=wt){m.done=true;fx2.push({k:'cone',id:m.id,mx:m.x+m.f*s.ox*d.sc,my:m.y+s.oy*d.sc,f:m.f,frames:s.fx,fxms:s.fxms,t0:t,dur:ft,len:s.len,hw:s.hw,dmg:s.dmg,hitT:s.hit,hit:false,sc:d.sc});}
    if(e>wt+ft+300)endSkill(m,t);
  }else if(s.k==='proj'){const wt=s.wind.length*s.wms;
    if(!m.done&&e>=wt){m.done=true;const mx=m.x+m.f*s.ox*d.sc,my=m.y+s.oy*d.sc+(d.fly?-16:0),a=Math.atan2(P.y-12-my,P.x-mx);
      projs.push({x:mx,y:my,vx:Math.cos(a)*s.speed,vy:Math.sin(a)*s.speed,t0:t,life:s.life,r:s.r,dmg:s.dmg,frames:s.fx,sc:d.sc,id:m.id});}
    if(e>wt+400)endSkill(m,t);
  }else if(s.k==='aoe'){
    if(!m.done&&e>=s.tele){m.done=true;fx2.push({k:'aoe',id:m.id,x:m.tx,y:m.ty,frames:s.fx,fxms:s.fxms,t0:t,dur:s.fx.length*s.fxms+120,hitT:s.fxms,hit:false,r:s.r,dmg:s.dmg,sc:d.sc});}
    if(e>s.tele+s.fx.length*s.fxms+300)endSkill(m,t);
  }else if(s.k==='charge'){const wt=s.wind.length*s.wms,dtm=s.dist/s.speed*1000;
    if(e>=wt&&e<wt+dtm){
      if(!m.dashInit){m.dashInit=true;const a=Math.atan2(P.y-m.y,P.x-m.x);m.dvx=Math.cos(a);m.dvy=Math.sin(a);m.f=m.dvx>=0?1:-1;m.dhit=false;}
      const nx=m.x+m.dvx*s.speed*dt,ny=m.y+m.dvy*s.speed*dt;if(!isWater(nx,ny)){m.x=nx;m.y=ny;}
      if(!m.dhit&&!P.dead&&Math.hypot(P.x-m.x,P.y-m.y)<30){m.dhit=true;hurtPlayer(s.dmg,m.x,m.y);}
    }else if(e>=wt+dtm+300)endSkill(m,t);
  }
}
function stepMon(m,dt,t){
  const d=m.d;m.flash=Math.max(0,m.flash-dt);
  if(m.st==='dead'){if(t-m.deadAt>MON_RESPAWN){m.hp=m.maxHp;m.x=m.hx;m.y=m.hy;m.st='idle';m.t0=t;m.hold=t+600;}return;}
  if(m.st==='die'){if(t-m.t0>m.dieMs){m.st='dead';m.deadAt=t;}return;}
  const pd=Math.hypot(P.x-m.x,P.y-m.y),hd=Math.hypot(m.hx-m.x,m.hy-m.y);
  switch(m.st){
   case'idle':
     if(m.hp<m.maxHp)m.hp=Math.min(m.maxHp,m.hp+dt*m.maxHp*.05);
     if(!P.dead&&pd<d.aggro&&t>m.hold){m.st='chase';m.t0=t;}
     break;
   case'chase':{
     if(P.dead||hd>d.leash){m.st='return';m.t0=t;break;}
     m.f=P.x>=m.x?1:-1;
     if(t>=m.hold){const a=d.skills[0],b=d.skills[1],ra=t>=m.cd[0]&&pd<a.range,rb=t>=m.cd[1]&&pd<b.range;
       if(ra||rb){startSkill(m,(ra&&rb)?(Math.random()<.45?1:0):(rb?1:0),t);break;}}
     if(pd>58)moveMon(m,P.x,P.y,d.spd,dt);
     break;}
   case'return':
     moveMon(m,m.hx,m.hy,d.spd*1.5,dt);m.hp=Math.min(m.maxHp,m.hp+dt*m.maxHp*.2);
     if(hd<6){m.st='idle';m.t0=t;m.hold=t+400;}
     break;
   case'atk':skillStep(m,t,dt);break;
  }
}
function monHit(m,dmg){
  if(m===M){mHit(dmg);return;}
  if(!monAlive(m))return;const t=now();
  m.hp=Math.max(0,m.hp-dmg);m.flash=.12;floaters.push({x:m.x,y:m.y-m.d.sc*38,t0:t,s:String(dmg),c:'#fff'});
  if(m.st==='idle'||m.st==='return'){m.st='chase';m.t0=t;m.hold=t;}
  if(m.hp<=0){
    stats.kills++;m.st='die';m.t0=t;m.sk=null;m.dieMs=m.d.die?m.d.die.length*260+500:1000;
    const pid=pearlOf(m.d.el);drops.push({x:m.x,y:m.y-8,t0:t,n:pid});
    toast(T('toast.pearl',{name:I18N.itemName(pid)}));tameRoll(m.id);
  }
}
function hitMons2(dmg){
  let best=null,bd=1e9;
  for(const m of mons2){if(!monAlive(m))continue;const dx=(m.x-P.x)*P.f,d=Math.hypot(m.x-P.x,m.y-14-(P.y-6));if(dx>-10&&d<54+m.d.sc*8&&d<bd){best=m;bd=d;}}
  if(!best)return false;monHit(best,dmg);return true;
}
function mon2Update(dt,t){
  for(const m of mons2)stepMon(m,dt,t);
  for(let i=projs.length-1;i>=0;i--){const p=projs[i];p.x+=p.vx*dt;p.y+=p.vy*dt;
    if(t-p.t0>p.life){projs.splice(i,1);continue;}
    if(!P.dead&&Math.hypot(P.x-p.x,P.y-6-p.y)<p.r+9){hurtPlayer(p.dmg,p.x-p.vx,p.y-p.vy);projs.splice(i,1);}}
  for(let i=fx2.length-1;i>=0;i--){const f=fx2[i],e=t-f.t0;
    if(f.k==='aoe'&&!f.hit&&e>=f.hitT){f.hit=true;if(!P.dead&&Math.hypot(P.x-f.x,(P.y-f.y)*1.5)<f.r)hurtPlayer(f.dmg,f.x,f.y);}
    else if(f.k==='cone'&&!f.hit&&e>=f.hitT){f.hit=true;const dx=(P.x-f.mx)*f.f,dy=P.y-6-f.my;if(!P.dead&&dx>-6&&dx<f.len&&Math.abs(dy)<f.hw)hurtPlayer(f.dmg,f.mx,f.my);}
    if(e>f.dur)fx2.splice(i,1);}
  petsUpdate(dt,t);
}

/* ---------- VẼ ---------- */
function spr1(img,meta,name,x,y,sc,flip,alpha){
  const f=meta[name];if(!f||!img.complete)return;
  ctx.save();ctx.translate(x,y);if(flip<0)ctx.scale(-1,1);if(alpha!==undefined)ctx.globalAlpha=alpha;
  ctx.drawImage(img,f[0],f[1],f[2],f[3],f[4]*sc,f[5]*sc,f[2]*sc,f[3]*sc);ctx.restore();
}
function monFrame(m,t){
  const d=m.d,e=t-m.t0;
  switch(m.st){
   case'idle':return d.idle[Math.floor(t/130)%d.idle.length];
   case'chase':case'return':return d.walk[Math.floor(t/105)%d.walk.length];
   case'atk':{const s=m.sk;
     if(s.k==='charge'){const wt=s.wind.length*s.wms;return e<wt?s.wind[Math.min(s.wind.length-1,Math.floor(e/s.wms))]:s.dash[Math.floor((e-wt)/s.dms)%s.dash.length];}
     return s.wind[Math.min(s.wind.length-1,Math.floor(e/s.wms))];}
   case'die':return d.die?d.die[Math.min(d.die.length-1,Math.floor(e/260))]:d.idle[0];
  }
  return d.idle[0];
}
function drawMon2(m,t){
  if(m.st==='dead')return;const d=m.d,img=MIMG[m.id],meta=MMETA[m.id],name=monFrame(m,t),hover=d.fly?-16+Math.sin(t/240)*3:0;
  ctx.save();ctx.globalAlpha=.3;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(m.x,m.y+1,d.shw,d.shw*.28,0,0,7);ctx.fill();ctx.restore();
  let al=1;if(m.st==='die'){const k=(t-m.t0)/m.dieMs;al=d.die?(k>.7?Math.max(0,1-(k-.7)/.3):1):Math.max(0,1-k);}
  spr1(img,meta,name,m.x,m.y+hover,d.sc,m.f,al);
  if(m.flash>0){ctx.save();ctx.globalCompositeOperation='lighter';spr1(img,meta,name,m.x,m.y+hover,d.sc,m.f,al*.55);ctx.restore();}
  if(m.st!=='die'&&m.hp<m.maxHp){const f=meta[name],bw=34,by=m.y+hover+(f?f[5]*d.sc:-50)-8;
    ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(m.x-bw/2-1,by-1,bw+2,5);ctx.fillStyle=TD.PEARL[d.el].col;ctx.fillRect(m.x-bw/2,by,bw*m.hp/m.maxHp,3);}
}
function drawPet(o,t){
  const bob=Math.sin(t/200+o.x)*(o.run?1.4:.6);
  ctx.save();ctx.globalAlpha=.25;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(o.x,o.y+1,7,2,0,0,7);ctx.fill();ctx.restore();
  if(o.id==='thuylong'){const r=DR.idx['idle'+(Math.floor(t/110)%8)];if(!r)return;const s=.3;ctx.save();ctx.translate(o.x,o.y+bob);if(o.f<0)ctx.scale(-1,1);
    ctx.drawImage(IMG.dragon,r[0],r[1],r[2],r[3],(-DR.ax+r[4])*s,(-DR.ay+r[5])*s,r[2]*s,r[3]*s);ctx.restore();return;}
  const d=MD[o.id];if(!d)return;spr1(MIMG[o.id],MMETA[o.id],d.idle[Math.floor(t/130)%d.idle.length],o.x,o.y+bob+(d.fly?-5:0),d.sc*.34,o.f);
}
function drawMonFx(t){
  for(const f of fx2){const e=t-f.t0;
    if(f.k==='tele'){const k=Math.min(1,e/f.dur);ctx.save();ctx.fillStyle='rgba('+f.col+','+(.1+.22*k)+')';ctx.beginPath();ctx.ellipse(f.x,f.y,f.r*k,f.r*k*.66,0,0,7);ctx.fill();
      ctx.strokeStyle='rgba('+f.col+',.85)';ctx.lineWidth=1.2;ctx.setLineDash([5,4]);ctx.beginPath();ctx.ellipse(f.x,f.y,f.r,f.r*.66,0,0,7);ctx.stroke();ctx.restore();}
    else if(f.k==='aoe'){const i=Math.min(f.frames.length-1,Math.floor(e/f.fxms));spr1(MIMG[f.id],MMETA[f.id],f.frames[i],f.x,f.y+4,f.sc,1,e>f.dur-120?Math.max(0,(f.dur-e)/120):1);}
    else if(f.k==='cone'){let a=0,i=0;for(;i<f.fxms.length-1&&e>=a+f.fxms[i];i++)a+=f.fxms[i];const fr=MMETA[f.id][f.frames[i]];if(fr)spr1(MIMG[f.id],MMETA[f.id],f.frames[i],f.mx+f.f*(fr[2]*f.sc/2),f.my,f.sc,f.f);}
    else if(f.k==='bolt'){const k=e/f.dur;ctx.save();ctx.globalAlpha=1-k;ctx.strokeStyle=f.col;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(f.x0,f.y0);ctx.lineTo(f.x0+(f.x1-f.x0)*Math.min(1,k*2),f.y0+(f.y1-f.y0)*Math.min(1,k*2));ctx.stroke();ctx.restore();}}
  for(const p of projs){const i=Math.floor((t-p.t0)/90)%p.frames.length;spr1(MIMG[p.id],MMETA[p.id],p.frames[i],p.x,p.y,p.sc,p.vx>=0?1:-1);}
}

/* ---------- TỰ ĐỘNG SĂN (trong vùng quanh chỗ bật) ---------- */
const AUTO={on:false,ax:0,ay:0,R:224,tgt:null,pt:0};
const autoBtn=document.createElement('button');autoBtn.id='autoBtn';autoBtn.type='button';
{const st=document.createElement('style');st.textContent='#autoBtn{position:fixed;right:calc(env(safe-area-inset-right,0px) + 26px);bottom:calc(env(safe-area-inset-bottom,0px) + 126px);min-width:74px;height:34px;padding:0 10px;border-radius:17px;border:1px solid #fff7;background:#1a2f42cc;color:#fff;font-size:12px;font-weight:800;letter-spacing:.5px;display:none;-webkit-user-select:none;user-select:none}#autoBtn.on{background:#d98a1ecc;border-color:#ffe58f;box-shadow:0 0 12px #ffb34799}';document.head.appendChild(st);}
document.body.appendChild(autoBtn);
function autoLabel(){autoBtn.textContent=T(AUTO.on?'auto.btn.on':'auto.btn');autoBtn.classList.toggle('on',AUTO.on);}
function setAuto(v,why){
  if(!!v===AUTO.on)return;AUTO.on=!!v;AUTO.tgt=null;
  if(v){AUTO.ax=P.x;AUTO.ay=P.y;toast(T('toast.auto.on',{r:Math.round(AUTO.R/TILE)}));}
  else toast(T(why==='low'?'toast.auto.low':'toast.auto.off'));
  autoLabel();
}
autoBtn.addEventListener('pointerdown',e=>{setAuto(!AUTO.on);e.preventDefault();e.stopPropagation();});
autoBtn.addEventListener('click',e=>e.stopPropagation());
I18N.on(autoLabel);autoLabel();
function pickTarget(t){
  const inR=(x,y)=>Math.hypot(x-AUTO.ax,y-AUTO.ay)<=AUTO.R;let best=null,bd=1e9;
  for(const d of drops){if(d.exp||!inR(d.x,d.y))continue;const dd=Math.hypot(d.x-P.x,d.y-P.y);if(dd<bd){bd=dd;best={k:'drop',ref:d,x:d.x,y:d.y,reach:5};}}
  if(best)return best;
  for(const m of mons2.concat([M])){if(!monAlive(m)||!inR(m.x,m.y))continue;const dd=Math.hypot(m.x-P.x,m.y-P.y);if(dd<bd){bd=dd;best={k:'mon',ref:m,x:m.x,y:m.y-14,reach:38};}}
  if(best)return best;
  for(const n of nodesNear(AUTO.ax,AUTO.ay,Math.ceil(AUTO.R/64)+1)){if(n.gone||!inR(n.x,n.y))continue;const dd=Math.hypot(n.x-P.x,n.y-P.y);if(dd<bd){bd=dd;best={k:'node',ref:n,x:n.x,y:n.y-6,reach:24};}}
  return best;
}
function validTarget(g){return g.k==='drop'?drops.includes(g.ref):g.k==='mon'?monAlive(g.ref):!g.ref.gone;}
function autoThink(t){
  if(P.dead){setAuto(false);return{x:0,y:0};}
  if(P.hp<P.maxHp*.3){setAuto(false,'low');return{x:0,y:0};}
  if(!AUTO.tgt||t-AUTO.pt>300||!validTarget(AUTO.tgt)){AUTO.tgt=pickTarget(t);AUTO.pt=t;}
  const g=AUTO.tgt;
  if(!g){const dx=AUTO.ax-P.x,dy=AUTO.ay-P.y,d=Math.hypot(dx,dy);return d>30?{x:dx/d,y:dy/d}:{x:0,y:0};}
  if(g.k==='mon'){g.x=g.ref.x;g.y=g.ref.y-14;}
  const dx=g.x-P.x,dy=g.y-(P.y-6),d=Math.hypot(dx,dy);
  if(d<=g.reach&&g.k!=='drop'){P.f=dx>=0?1:-1;attack();return{x:0,y:0};}
  return d>1?{x:dx/d,y:dy/d}:{x:0,y:0};
}
function drawAutoRing(t){if(!AUTO.on)return;ctx.save();ctx.strokeStyle='rgba(255,229,143,.35)';ctx.lineWidth=1;ctx.setLineDash([8,8]);ctx.beginPath();ctx.arc(AUTO.ax,AUTO.ay,AUTO.R,0,7);ctx.stroke();ctx.restore();}
recalc();
