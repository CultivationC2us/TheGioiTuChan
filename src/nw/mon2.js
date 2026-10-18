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
/* 10 quái mới dùng chung 1 atlas (khung tên '<id>_fN') */
const NEW10=['thachnhan','satrung','dalinh','cotxa','nhanhoa','namlinh','phapkhi','bangtinh','hoakhuyen','hoamoc'];
{const i=new Image();i.src='data:image/webp;base64,{{MON10}}';const mt={{MON10META}};for(const id of NEW10){MIMG[id]=i;MMETA[id]=mt;}}
let TAME_P=0.01;                 /* tỉ lệ thuần hóa mỗi lần hạ quái */
const MON_RESPAWN=7000;          /* quái hồi sinh sau 7 giây, ngay gần chỗ cũ */

/* ---------- CHỈ SỐ NHÂN VẬT ---------- */
const STT={dmg:0,hp:0,red:0,spd:0,qi:0};
const GS={atk:0,def:0,hp:0,spd:0,aspd:0,bag:0,crit:0,cdmg:0};   /* cộng từ chỉ số ngẫu nhiên của trang bị đang mặc */
/* ---------- THẾ GIỚI TRÒN: qua mép bản đồ thì dịch cả người, camera, chó, linh thú, tâm tự động ---------- */
function onWrap(sx,sy){P.x+=sx;P.y+=sy;cam.x+=sx;cam.y+=sy;dog.x+=sx;dog.y+=sy;for(const o of petObjs){o.x+=sx;o.y+=sy;}AUTO.ax+=sx;AUTO.ay+=sy;}

/* ---------- TU VI · CẢNH GIỚI (Luyện Khí 1-10) ----------
   Tu vi cần để qua tầng n = base·2^(n-1) (gấp đôi mỗi tầng). Mỗi lần đột phá, máu & sát thương nhân thêm ×1,2 (cộng dồn).
   Tu luyện thường chậm (REALM.rate + Thủy châu); thảo dược thô không cho tu vi — phải luyện thành đan (đan phương). */
const realmNeed=l=>l>=TD.REALM.max?Infinity:TD.REALM.base*Math.pow(2,l-1);
const realmMul=l=>Math.pow(TD.REALM.mul,(l||cult.rl)-1);
const qiRate=()=>TD.REALM.rate+STT.qi;
function qiTick(dt){
  if(!cult.dpg&&!(loot['dp.tukhi']>0)){loot['dp.tukhi']=1;loot['cg.tuyet_van']=Math.max(1,loot['cg.tuyet_van']|0);cult.dpg=true;lootUI();}   /* tặng đan phương đầu tiên (1 lần) */
  if(!cult.aw||cult.rl>=TD.REALM.max)return;const nd=realmNeed(cult.rl);if(cult.qi<nd)cult.qi=Math.min(nd,cult.qi+dt*qiRate());
}
function rankStat(){let s=0;for(let l=1;l<cult.rl;l++)s+=realmNeed(l);return{realm:cult.rl|0,qi_total:Math.round(s+(cult.aw?cult.qi:0)),kills:stats.kills|0};}
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
const matKeys=(el,t)=>TD.RES.filter(g=>g.el===el&&(g.kind==='ore'||g.kind==='tree')&&g.tier>=t).map(g=>g.item);
const ingKeys=k=>k==='@herb1'?TD.RES.filter(g=>g.kind==='herb'&&g.tier===1).map(g=>g.item):k.indexOf('@mat:')===0?matKeys(k.split(':')[1],+k.split(':')[2]):[k];
const ingHave=k=>ingKeys(k).reduce((a,x)=>a+(loot[x]|0),0);
function ingTake(k,q){for(const x of ingKeys(k).sort((a,b)=>(loot[b]|0)-(loot[a]|0))){const t=Math.min(q,loot[x]|0);if(t>0){loot[x]-=t;q-=t;if(loot[x]<=0)delete loot[x];}if(q<=0)break;}}
const recipeOf=(rid,idx)=>{const R=TD.RECIPES[rid];return R&&R.list[idx||0];};
function craftMax(rid,idx){const r=recipeOf(rid,idx);if(!r)return 0;return Math.min(...r.ing.map(([k,q])=>Math.floor(ingHave(k)/q)));}
function craft(rid,n,idx){
  const r=recipeOf(rid,idx);if(!r||!(loot[rid]>0))return 0;n=Math.min(n||1,craftMax(rid,idx));
  if(n<1){toast(T('toast.alc.no'));return 0;}
  r.ing.forEach(([k,q])=>ingTake(k,q*n));
  if(TD.byWeapon[r.out]){for(let i=0;i<n;i++)mkGear(r.out);}else loot[r.out]=(loot[r.out]|0)+n;lootUI();toast(T('toast.alc',{name:I18N.itemName(r.out),n}));return n;
}

function recalc(){
  gearStats();
  const sum=el=>cult.pl[el].reduce((a,b)=>a+b,0),pe=TD.PEARL,rd=x=>Math.round(x*1000)/1000;
  STT.dmg=rd(sum('kim')*pe.kim.per);STT.hp=rd(sum('moc')*pe.moc.per);STT.red=Math.min(.6,rd(sum('tho')*pe.tho.per));STT.spd=rd(sum('hoa')*pe.hoa.per);STT.qi=rd(sum('thuy')*pe.thuy.per);
  if(cult.qi>realmNeed(cult.rl)+TD.DAN['dan.tukhi'].qi)cult.qi=realmNeed(cult.rl);
  P.maxMp=60+12*((cult.rl|0)-1);P.mp=Math.min(P.mp,P.maxMp);
  const mx=Math.round((100+STT.hp+GS.hp)*realmMul()),old=P.maxHp;P.maxHp=mx;P.hp=mx>old?Math.min(mx,P.hp+(mx-old)):Math.min(P.hp,mx);
}
/* ---------- DEF · TÚI CÓ DUNG TÍCH ---------- */
const defVal=()=>Math.round(TD.BASE.def*realmMul())+GS.def+['h','o','g'].reduce((a,k)=>a+((cult.eq[k]&&loot[cult.eq[k]]>0&&TD.byOutfit[cult.eq[k]])?TD.byOutfit[cult.eq[k]].def:0),0);
function itemSize(n){
  if(n==='lt')return 0;if(TD.BAG.sz[n]!=null)return TD.BAG.sz[n];
  const g=TD.byItem[n];if(g)return g.tier;const p=TD.byPearl[n];if(p)return [2,4,8][p.tier-1];
  return 1;
}
function bagUsed(){let s=0;for(const k in loot)if(loot[k]>0)s+=itemSize(k)*loot[k];return s;}
const bagCap=()=>TD.BAG.cap+(cult.bc|0)+GS.bag;
const bagFree=()=>bagCap()-bagUsed();
let bagFullT=0;
let CRIT=0;   /* lần tung sát thương gần nhất có chí mạng không */
const critP=()=>Math.min(.75,.05+GS.crit),cdmgV=()=>1.5+GS.cdmg;
const dmgRoll=mult=>{let d=(7+Math.floor(Math.random()*6)+STT.dmg+wAtk())*realmMul()*(mult||1);CRIT=Math.random()<critP()?1:0;if(CRIT)d*=cdmgV();return Math.round(d);};
const atkCd=()=>470/(1+STT.spd+GS.aspd);

/* ---------- MÃ QUÀ TẶNG (CHỈ ĐỂ TEST — xoá/đổi trước khi phát hành) ---------- */
const GIFT_CODES={tuchan:()=>{
  TD.RES.forEach(g=>{loot[g.item]=(loot[g.item]|0)+40;});
  TD.EL.forEach(e=>{for(let t=1;t<=TD.PT;t++){const id=TD.pearlId(e.id,t);loot[id]=(loot[id]|0)+10;}});
  loot['dan.tukhi']=(loot['dan.tukhi']|0)+30;loot['lt']=(loot['lt']|0)+5000;TD.SKILLS.forEach(k=>{if(!skLearned(k.id))loot['sk.'+k.id]=Math.max(1,loot['sk.'+k.id]|0);});
  loot['dp.tukhi']=Math.max(1,loot['dp.tukhi']|0);TD.SCROLLS.forEach(s=>{loot[s.id]=Math.max(1,loot[s.id]|0);});
  [...TD.WEAPONS,...TD.OUTFITS].forEach(w=>{if(!Object.keys(loot).some(k=>baseId(k)===w.id&&loot[k]>0))mkGear(w.id);});
  TD.RES.forEach(g=>{if(g.kind==='ore'||g.kind==='tree')loot[g.item]=Math.max(30,loot[g.item]|0);});
  TD.MOUNTS.forEach(w=>{loot[w.id]=Math.max(1,loot[w.id]|0);});
  cult.bc=Math.min(5000,Math.max(cult.bc|0,bagUsed()-TD.BAG.cap+400));
}};
function redeem(code){
  const f=GIFT_CODES[String(code||'').trim().toLowerCase()];if(!f)return false;
  f();cult.codes=(cult.codes|0)+1;lootUI();return true;
}


/* ---------- TRANG BỊ: bản thể riêng + chỉ số ngẫu nhiên (thức tỉnh) ----------
   Mỗi món chế/nhặt được là 1 bản thể: id = '<mã gốc>#<uid>', cult.ins[uid] = {a:[[chỉ số,giá trị 1-50],…], cap: số dòng tối đa 5-10}. */
const GKEYS=['w','h','o','g','r','l'];
const baseId=id=>String(id).split('#')[0],uidOf=id=>String(id).split('#')[1]||'';
function regIns(id){const b=baseId(id);if(b===id)return;[TD.byWeapon,TD.byOutfit,TD.misc,TD.BAG.sz,TD.ICO].forEach(t=>{if(t[b]!==undefined&&t[id]===undefined)t[id]=t[b];});}
let insN=0;
function mkGear(b){const u=Date.now().toString(36)+(insN++).toString(36)+Math.floor(Math.random()*1296).toString(36),id=b+'#'+u;
  cult.ins[u]={a:[],cap:5+Math.floor(Math.random()*6)};regIns(id);loot[id]=1;return id;}
const DOGID='bach_khuyen';
const isBeast=id=>!!id&&(!!TD.byMount[id]||id===DOGID||PETS.includes(id));
function gearRec(id){const u=uidOf(id);if(u)return cult.ins[u]||null;
  if(isBeast(id))return cult.ins[id]||(cult.ins[id]={a:[],cap:5+Math.floor(Math.random()*6)});return null;}
const gearBase=id=>TD.byOutfit[baseId(id)]||TD.byWeapon[baseId(id)]||TD.byMount[id]||(id===DOGID?{el:'kim'}:null)||(PETS.includes(id)?TD.MONS.find(m=>m.id===id)||null:null);
function gearStats(){
  GS.atk=GS.def=GS.hp=GS.spd=GS.aspd=GS.bag=GS.crit=GS.cdmg=0;
  const own=GKEYS.map(k=>cult.eq[k]).filter(id=>id&&loot[id]>0);
  if(cult.eq.p&&isBeast(cult.eq.p))own.push(cult.eq.p);
  if(cult.mtSel&&loot[cult.mtSel]>0)own.push(cult.mtSel);
  for(const id of own){const r=gearRec(id);if(!r)continue;
    for(const [st,v] of r.a)GS[st]+=v*TD.STU[st]*((st==='spd'||st==='aspd'||st==='crit'||st==='cdmg')?.01:1);}
  GS.atk=Math.round(GS.atk);GS.def=Math.round(GS.def);GS.hp=Math.round(GS.hp);GS.bag=Math.round(GS.bag);
}
function lineText(st,v){const u=TD.STU[st]*v,n=x=>I18N.lang==='vi'?String(x).replace('.',','):String(x);
  return '+'+((st==='spd'||st==='aspd'||st==='crit'||st==='cdmg')?n(u.toFixed(1))+'%':Math.round(u))+' '+T('st.'+st);}
function awakeCost(id){const r=gearRec(id),o=gearBase(id);if(!r||!o)return null;const k=r.a.length;
  return{lt:10*(k+1),n:2+k,el:o.el,have:ingHave('@mat:'+o.el+':1'),full:k>=r.cap,lines:k,cap:r.cap};}
function awakenGear(id){
  const r=gearRec(id),c=awakeCost(id);if(!r||!c)return null;
  if(c.full){toast(T('toast.awk.max'));return null;}
  if((loot.lt|0)<c.lt||c.have<c.n){toast(T('toast.awk.no'));return null;}
  loot.lt-=c.lt;if(!(loot.lt>0))delete loot.lt;ingTake('@mat:'+c.el+':1',c.n);
  const st=TD.STATS[Math.floor(Math.random()*TD.STATS.length)],v=TD.rollVal();r.a.push([st,v]);
  recalc();lootUI();toast(T('toast.awk',{line:lineText(st,v)}));return [st,v];
}
const EQSAVE={w:'eq',o:'eo',h:'eh',g:'eg',r:'er',l:'el',p:'ep',m:'em'};
function saveEq(){
  const o={};for(const k in EQSAVE)o[EQSAVE[k]]=(k==='m'?cult.mtSel:cult.eq[k])||(k==='p'?'none':'');
  const ins={};for(const id in loot){if(loot[id]>0&&id.indexOf('#')>0){const u=uidOf(id);if(cult.ins[u])ins[u]=cult.ins[u];}else if(loot[id]>0&&TD.byMount[id]&&cult.ins[id])ins[id]=cult.ins[id];}
  for(const id of [DOGID,...PETS])if(cult.ins[id])ins[id]=cult.ins[id];
  o.ins=ins;o.sk=cult.sk.slice();return o;
}
function loadEq(u){
  u=u||{};cult.ins={};cult.sk=(Array.isArray(u.sk)?u.sk:[]).filter(id=>TD.bySkill[id]);const si=(u.ins&&typeof u.ins==='object')?u.ins:{};
  for(const k in si){const r=si[k];if(r&&Array.isArray(r.a))cult.ins[k]={a:r.a.filter(x=>Array.isArray(x)&&TD.STATS.includes(x[0])&&x[1]>=1&&x[1]<=50).map(x=>[x[0],x[1]|0]).slice(0,10),cap:Math.max(5,Math.min(10,(r.cap|0)||5))};}
  for(const id of Object.keys(loot))if(id.indexOf('#')>0){if(gearBase(id))regIns(id);else delete loot[id];}
  if(loot['cg.vukhi']>0){delete loot['cg.vukhi'];TD.SCROLLS.forEach(s=>{loot[s.id]=Math.max(1,loot[s.id]|0);});}
  const map={};
  /* bộ trang phục cũ (1 món gộp) -> 3 món; vũ khí/đồ cũ không có '#' -> bản thể mới */
  if(loot['tb.tu_dien']>0){delete loot['tb.tu_dien'];map['tb.tu_dien']=['h','o','g'].map(p=>mkGear('tb.tu_dien.'+p));}
  for(const id of Object.keys(loot)){if(id.indexOf('#')<0&&loot[id]>0&&(TD.byWeapon[id]||TD.byOutfit[id])){const n=loot[id];delete loot[id];const a=[];for(let i=0;i<n;i++)a.push(mkGear(id));map[id]=a;}}
  for(const k of ['w','h','o','g','r','l','p'])cult.eq[k]=null;
  for(const k in EQSAVE){let id=typeof u[EQSAVE[k]]==='string'?u[EQSAVE[k]]:'';if(!id)continue;
    if(map[id]){if(id==='tb.tu_dien'){const need={h:0,o:1,g:2};id=map[id][need[k]]||'';}else id=map[id][0];}
    else if(id==='tb.tu_dien'){id='';}
    if(k==='m'){if(TD.byMount[id]&&loot[id]>0)cult.mtSel=id;continue;}
    if(k==='p'){if(id==='none')continue;if(id===DOGID||PETS.includes(id))cult.eq.p=id;continue;}
    if(!(loot[id]>0))continue;
    if(k==='w'?TD.byWeapon[baseId(id)]:(TD.byOutfit[baseId(id)]&&TD.SLOT[TD.byOutfit[baseId(id)].part]===k))cult.eq[k]=id;}
  if(!u.ep)cult.eq.p=DOGID;
  if(map['tb.tu_dien']&&u.eo==='tb.tu_dien'){cult.eq.h=map['tb.tu_dien'][0];cult.eq.o=map['tb.tu_dien'][1];cult.eq.g=map['tb.tu_dien'][2];}
  recalc();
}
/* ---------- VŨ KHÍ: trang bị / tháo, vẽ trên tay ---------- */
const wAtk=()=>GS.atk;   /* vũ khí chỉ là hình dáng — sát thương cộng thêm đến từ chỉ số trang bị */
function equipToggle(id){
  const o=TD.byOutfit[id],w=TD.byWeapon[id];
  if(!(loot[id]>0)||(!o&&!w))return false;
  const sk=o?TD.SLOT[o.part]:'w';
  if(cult.eq[sk]===id){cult.eq[sk]=null;recalc();toast(T('toast.unequip',{name:I18N.itemName(id)}));return true;}
  cult.eq[sk]=id;recalc();toast(T('toast.equip.g',{name:I18N.itemName(id)}));return true;
}
/* gán / bỏ trực tiếp một ô (dùng cho bảng thông tin trang bị) */
function setEq(k,id){
  if(k==='m'){cult.mtSel=id||null;recalc();return true;}
  if(k==='p'){cult.eq.p=id||null;recalc();return true;}
  if(id&&!(loot[id]>0))return false;cult.eq[k]=id||null;recalc();return true;
}
function drawHeld(t,atking,row,fr){
  const w=cult.eq.w&&TD.byWeapon[cult.eq.w];if(!w||P.dead)return;const f=ITM[w.ico];if(!f||!IMG.it.complete)return;
  const staff=(w.ico==='w10'||w.ico==='w11'||w.ico==='w12');
  /* kiếm & trượng dùng CHUNG một kiểu cầm: lơ lửng cách thân một chút (linh khí giữ thăng bằng), đầu hướng LÊN, khi đánh thì CHỌC thẳng về phía trước.
     kiếm: nắm ở cán (góc phải-trên ảnh, mũi chúc xuống-trái) · trượng: nắm giữa thân gậy (đầu ngọc ở góc phải-trên) → xoay ngược chiều để đầu ngọc hướng lên */
  const sc=.56,pvx=f[2]*(staff?.46:.84),pvy=f[3]*(staff?.58:.16),UP=staff?-.785:2.356,END=staff?.785:3.93;
  let th=UP+.10,ox=13,oy=-15+Math.sin(t/380)*.9;
  if(P.mv&&!atking){th+=Math.sin(t/95)*.05;oy+=Math.sin(t/95)*.6;}
  if(atking){const u=Math.min(1,(t-P.atkT)/430),ez=x=>x*x*(3-2*x);
    if(u<.3){const k=ez(u/.3);th=UP+.10-.35*k;ox=13-5*k;}                 /* thu về sau */
    else if(u<.55){const k=ez((u-.3)/.25);th=UP-.25+(END-UP+.25)*k;ox=8+11*k;oy+=2*k;}   /* chọc tới */
    else if(u<.75){th=END;ox=19;oy+=2;}
    else{const k=ez((u-.75)/.25);th=END-(END-UP-.10)*k;ox=19-6*k;oy+=2*(1-k);}
  }
  ctx.save();ctx.translate(ox,oy);ctx.rotate(th);ctx.imageSmoothingEnabled=false;
  ctx.drawImage(IMG.it,f[0],f[1],f[2],f[3],-pvx*sc,-pvy*sc,f[2]*sc,f[3]*sc);ctx.restore();
}

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
/* ---- 10 QUÁI MỚI (mỗi hệ 2 con): yếu hơn quái cùng hệ 1 cảnh giới, xuất hiện nhiều nơi, rơi nguyên liệu Giáp Phiến / Ủng Liệu ---- */
const nF=(id,...n)=>n.flat().map(x=>id+'_f'+x),nR=(a,b)=>Array.from({length:b-a+1},(_,i)=>a+i);
const NEWMD={
 thachnhan:{el:'tho',sc:2.4,spd:36,aggro:150,leash:380,lair:[128,22],shw:22,fly:0,idle:nF('thachnhan',nR(0,5)),die:nF('thachnhan',14,15,16),
   skills:[{k:'proj',cd:3200,range:240,wind:nF('thachnhan',6),wms:230,fx:nF('thachnhan',9,10,11),speed:165,life:1500,ox:26,oy:-24,r:12,dmg:10},
           {k:'aoe',cd:6500,range:280,wind:nF('thachnhan',8),wms:450,tele:750,fx:nF('thachnhan',12,13),fxms:160,r:44,dmg:14,col:'130,200,255'}]},
 satrung:{el:'tho',sc:2.3,spd:50,aggro:170,leash:400,lair:[182,72],shw:22,fly:0,idle:nF('satrung',nR(0,5)),die:['satrung_g'],
   skills:[{k:'proj',cd:2600,range:250,wind:nF('satrung',5),wms:200,fx:nF('satrung',6,7,8),speed:190,life:1400,ox:24,oy:-22,r:12,dmg:10},
           {k:'aoe',cd:6500,range:290,wind:nF('satrung',4),wms:420,tele:750,fx:nF('satrung',9,10,11),fxms:140,r:46,dmg:14,col:'210,160,90'}]},
 dalinh:{el:'thuy',sc:2.4,spd:44,aggro:180,leash:420,lair:[100,12],shw:20,fly:1,idle:nF('dalinh',nR(0,7)),die:nF('dalinh',13),
   skills:[{k:'proj',cd:2800,range:260,wind:nF('dalinh',6),wms:200,fx:nF('dalinh',8,9),speed:175,life:1500,ox:26,oy:-24,r:13,dmg:10},
           {k:'aoe',cd:6500,range:300,wind:nF('dalinh',7),wms:420,tele:750,fx:nF('dalinh',11,12,10),fxms:150,r:46,dmg:14,col:'110,190,255'}]},
 cotxa:{el:'thuy',sc:2.4,spd:44,aggro:170,leash:400,lair:[100,188],shw:26,fly:0,idle:nF('cotxa',nR(0,4)),die:['cotxa_d1','cotxa_d2'],
   skills:[{k:'proj',cd:2800,range:250,wind:nF('cotxa',5),wms:220,fx:nF('cotxa',6,7),speed:180,life:1500,ox:30,oy:-28,r:13,dmg:10},
           {k:'cone',cd:4200,range:150,wind:nF('cotxa',5),wms:260,fx:nF('cotxa',8,9),fxms:[170,260],ox:26,oy:-22,len:130,hw:34,dmg:14,hit:150}]},
 nhanhoa:{el:'moc',sc:2.5,spd:38,aggro:150,leash:380,lair:[72,182],shw:20,fly:0,idle:nF('nhanhoa',nR(0,5)),die:nF('nhanhoa',15),
   skills:[{k:'proj',cd:2500,range:250,wind:nF('nhanhoa',4),wms:200,fx:nF('nhanhoa',7,8,9,10),speed:150,life:1500,ox:22,oy:-26,r:12,dmg:10},
           {k:'aoe',cd:6500,range:290,wind:nF('nhanhoa',6),wms:480,tele:750,fx:['nhanhoa_ring',...nF('nhanhoa',12,13,14)],fxms:150,r:48,dmg:14,col:'200,60,90'}]},
 namlinh:{el:'moc',sc:2.5,spd:34,aggro:150,leash:380,lair:[20,128],shw:20,fly:0,idle:nF('namlinh',nR(0,6)),die:nF('namlinh',13),
   skills:[{k:'proj',cd:2600,range:240,wind:nF('namlinh',5),wms:200,fx:nF('namlinh',7,8),speed:150,life:1400,ox:20,oy:-26,r:14,dmg:10},
           {k:'aoe',cd:6500,range:280,wind:nF('namlinh',4),wms:400,tele:750,fx:nF('namlinh',9,10,11),fxms:170,r:48,dmg:13,col:'150,110,255'}]},
 phapkhi:{el:'kim',sc:2.4,spd:48,aggro:170,leash:400,lair:[72,22],shw:18,fly:1,idle:nF('phapkhi',nR(0,6)),die:nF('phapkhi',12,13),
   skills:[{k:'proj',cd:2500,range:260,wind:nF('phapkhi',1),wms:180,fx:nF('phapkhi',7,8,9),speed:200,life:1400,ox:20,oy:-24,r:14,dmg:10},
           {k:'aoe',cd:6500,range:300,wind:nF('phapkhi',2),wms:420,tele:750,fx:['phapkhi_f11','phapkhi_pil','phapkhi_f10'],fxms:150,r:50,dmg:14,col:'110,200,255'}]},
 bangtinh:{el:'kim',sc:2.4,spd:36,aggro:160,leash:400,lair:[20,72],shw:24,fly:0,idle:nF('bangtinh',0,1,2,3,6),die:nF('bangtinh',14),
   skills:[{k:'proj',cd:2800,range:250,wind:nF('bangtinh',4),wms:220,fx:['bangtinh_p0','bangtinh_p1'],speed:190,life:1400,ox:24,oy:-22,r:13,dmg:10},
           {k:'aoe',cd:6500,range:290,wind:nF('bangtinh',5),wms:450,tele:750,fx:['bangtinh_p2','bangtinh_p4','bangtinh_p3'],fxms:150,r:46,dmg:14,col:'140,220,255'}]},
 hoakhuyen:{el:'hoa',sc:2.3,spd:56,aggro:190,leash:420,lair:[135,175],shw:26,fly:0,idle:nF('hoakhuyen',nR(0,5)),die:nF('hoakhuyen',12),
   skills:[{k:'charge',cd:4200,range:250,wind:nF('hoakhuyen',4),wms:220,dash:nF('hoakhuyen',1,2,3,4,5),dms:70,dist:220,speed:310,dmg:12},
           {k:'aoe',cd:6500,range:290,wind:nF('hoakhuyen',5),wms:420,tele:750,fx:nF('hoakhuyen',8,10,11),fxms:150,r:46,dmg:14,col:'255,110,40'}]},
 hoamoc:{el:'hoa',sc:2.4,spd:34,aggro:160,leash:380,lair:[182,128],shw:22,fly:0,idle:nF('hoamoc',nR(0,5)),die:nF('hoamoc',13,14),
   skills:[{k:'proj',cd:2600,range:250,wind:nF('hoamoc',11),wms:220,fx:['hoamoc_p0','hoamoc_p1','hoamoc_p2'],speed:170,life:1400,ox:20,oy:-30,r:13,dmg:10},
           {k:'aoe',cd:6500,range:300,wind:nF('hoamoc',11),wms:420,tele:750,fx:nF('hoamoc',10,12),fxms:200,r:50,dmg:14,col:'255,150,50'}]}
};
for(const id in NEWMD){const d=NEWMD[id];d.sc=Math.round(d.sc*88)/100;d.walk=d.idle;d.hp=100;d.pack=8;d.mat=1;MD[id]=d;}
const mons2=[],fx2=[],projs=[];
function findLand(tx,ty){
  for(let r=0;r<45;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
    if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;const x=tx+dx,y=ty+dy;if(x<4||y<4||x>=MW-4||y>=MH-4)continue;
    let ok=true;for(let a=-2;a<=2&&ok;a++)for(let b=-2;b<=2;b++){const q=tiles[y+b][x+a];if(q!==G&&q!==D&&q!==R){ok=false;break;}}
    if(ok)return{x:x*TILE+8,y:y*TILE+8};
  }return{x:tx*TILE+8,y:ty*TILE+8};
}
/* mỗi loại quái là một BẦY 10 con tụ gần hang; con nào chết sẽ hồi sinh ngay gần đó (giữ đủ 10) */
/* ---- TU VI QUÁI: mỗi loài có cảnh giới riêng, mạnh hơn người cùng cảnh giới (quái chỉ có bản thân làm trang bị) + 1 sở trường theo hệ ----
   hp gốc 220×mul, sát thương skill ×mul×1.25 (mul = 1,2^(tầng-1) như người chơi). Sở trường: Kim=công ×1.7 · Mộc=máu ×1.9 · Thổ=giảm sát thương 40% · Hỏa=nhanh (chạy ×1.4, chiêu hồi ×0.65) · Thủy=hồi máu 2%/giây */
const MREALM={hoa:3,tho:4,kim:5,moc:6,thuylong:9,hoakhuyen:2,hoamoc:2,thachnhan:3,satrung:3,phapkhi:4,bangtinh:4,nhanhoa:5,namlinh:5,dalinh:8,cotxa:8};   /* quái mới = quái cùng hệ − 1 cảnh giới */
function monStats(id,el){const rl=MREALM[id]||1,mul=Math.pow(TD.REALM.mul,rl-1);
  const o={rl,hp:Math.round(220*mul),dm:mul*1.25,red:0,spm:1,cdm:1,regen:0};
  if(el==='kim')o.dm*=1.7;else if(el==='moc')o.hp=Math.round(o.hp*1.9);else if(el==='tho')o.red=.4;else if(el==='hoa'){o.spm=1.4;o.cdm=.65;}else if(el==='thuy')o.regen=.02;
  return o;}
for(const d of DRG)Object.assign(d,monStats('thuylong','thuy'),{maxHp:monStats('thuylong','thuy').hp,hp:monStats('thuylong','thuy').hp});
const PACK_N=10;
for(const id in MD){const d=MD[id];
  for(let i=0;i<(d.pack||PACK_N);i++){const a=i*2.399+(id.charCodeAt(0)%7),rr=i===0?0:1.5+Math.sqrt(i)*1.55;
    const h=findLand(Math.round(d.lair[0]+Math.cos(a)*rr),Math.round(d.lair[1]+Math.sin(a)*rr));
    const ms=monStats(id,d.el),mh=ms.hp;
    mons2.push({id,d,rl:ms.rl,dm:ms.dm,red:ms.red,spm:ms.spm,cdm:ms.cdm,regen:ms.regen,x:h.x,y:h.y,hx:h.x,hy:h.y,f:i%2?1:-1,hp:mh,maxHp:mh,st:'idle',t0:0,cd:[0,0],sk:null,flash:0,hold:i*150,deadAt:0,dieMs:900,tx:0,ty:0});}}
function packSpot(m){for(let k=0;k<12;k++){const a=Math.random()*6.283,r=14+Math.random()*50,x=m.hx+Math.cos(a)*r,y=m.hy+Math.sin(a)*r;
  if(!isWater(x,y)&&!isWater(x,y+8)&&tiles[y/TILE|0]&&[G,D,R].includes(tiles[y/TILE|0][x/TILE|0]))return{x,y};}return{x:m.hx,y:m.hy};}
const monAlive=m=>m.dr?withDr(m,()=>mTargetable()&&M.st!=='die'):(m.st!=='dead'&&m.st!=='die');
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
      monHit(tg,dmg);
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
  const s=m.d.skills[i];m.st='atk';m.sk=s;m.t0=t;m.cd[i]=t+s.cd*(m.cdm||1);m.done=false;m.f=P.x>=m.x?1:-1;m.dashInit=false;
  if(s.k==='aoe'){m.tx=P.x;m.ty=P.y;fx2.push({k:'tele',x:m.tx,y:m.ty,r:s.r,t0:t,dur:s.tele,col:s.col});}
}
function endSkill(m,t){m.st='chase';m.sk=null;m.t0=t;m.hold=t+250;}
function skillStep(m,t,dt){
  const s=m.sk,e=t-m.t0,d=m.d;
  if(s.k==='cone'){const wt=s.wind.length*s.wms,ft=s.fxms.reduce((a,b)=>a+b,0);
    if(!m.done&&e>=wt){m.done=true;fx2.push({k:'cone',id:m.id,mx:m.x+m.f*s.ox*d.sc,my:m.y+s.oy*d.sc,f:m.f,frames:s.fx,fxms:s.fxms,t0:t,dur:ft,len:s.len,hw:s.hw,dmg:s.dmg*m.dm,hitT:s.hit,hit:false,sc:d.sc});}
    if(e>wt+ft+300)endSkill(m,t);
  }else if(s.k==='proj'){const wt=s.wind.length*s.wms;
    if(!m.done&&e>=wt){m.done=true;const mx=m.x+m.f*s.ox*d.sc,my=m.y+s.oy*d.sc+(d.fly?-16:0),a=Math.atan2(P.y-12-my,P.x-mx);
      projs.push({x:mx,y:my,vx:Math.cos(a)*s.speed,vy:Math.sin(a)*s.speed,t0:t,life:s.life,r:s.r,dmg:s.dmg*m.dm,frames:s.fx,sc:d.sc,id:m.id});}
    if(e>wt+400)endSkill(m,t);
  }else if(s.k==='aoe'){
    if(!m.done&&e>=s.tele){m.done=true;fx2.push({k:'aoe',id:m.id,x:m.tx,y:m.ty,frames:s.fx,fxms:s.fxms,t0:t,dur:s.fx.length*s.fxms+120,hitT:s.fxms,hit:false,r:s.r,dmg:s.dmg*m.dm,sc:d.sc});}
    if(e>s.tele+s.fx.length*s.fxms+300)endSkill(m,t);
  }else if(s.k==='charge'){const wt=s.wind.length*s.wms,dtm=s.dist/s.speed*1000;
    if(e>=wt&&e<wt+dtm){
      if(!m.dashInit){m.dashInit=true;const a=Math.atan2(P.y-m.y,P.x-m.x);m.dvx=Math.cos(a);m.dvy=Math.sin(a);m.f=m.dvx>=0?1:-1;m.dhit=false;}
      const nx=m.x+m.dvx*s.speed*dt,ny=m.y+m.dvy*s.speed*dt;if(!isWater(nx,ny)){m.x=nx;m.y=ny;}
      if(!m.dhit&&!P.dead&&Math.hypot(P.x-m.x,P.y-m.y)<30){m.dhit=true;hurtPlayer(s.dmg*m.dm,m.x,m.y);}
    }else if(e>=wt+dtm+300)endSkill(m,t);
  }
}
function stepMon(m,dt,t){
  const d=m.d;m.flash=Math.max(0,m.flash-dt);
  if(m.regen&&m.st!=='die'&&m.st!=='dead'&&m.hp<m.maxHp)m.hp=Math.min(m.maxHp,m.hp+dt*m.maxHp*m.regen);
  if(m.st==='dead'){if(t-m.deadAt>MON_RESPAWN){const s=packSpot(m);m.hp=m.maxHp;m.x=s.x;m.y=s.y;m.st='idle';m.t0=t;m.hold=t+600;}return;}
  if(m.st==='die'){if(t-m.t0>m.dieMs){m.st='dead';m.deadAt=t;}return;}
  const pd=Math.hypot(P.x-m.x,P.y-m.y),hd=Math.hypot(m.hx-m.x,m.hy-m.y);
  switch(m.st){
   case'idle':
     if(m.hp<m.maxHp)m.hp=Math.min(m.maxHp,m.hp+dt*m.maxHp*.05);
     if(!P.dead&&t>m.hold&&(pd<d.aggro||mons2.some(o=>o!==m&&o.id===m.id&&o.st==='chase'&&Math.hypot(o.x-m.x,o.y-m.y)<120&&pd<d.aggro*2))){m.st='chase';m.t0=t;}
     break;
   case'chase':{
     if(P.dead||hd>d.leash){m.st='return';m.t0=t;break;}
     m.f=P.x>=m.x?1:-1;
     if(t>=m.hold){const a=d.skills[0],b=d.skills[1],ra=t>=m.cd[0]&&pd<a.range,rb=t>=m.cd[1]&&pd<b.range;
       if(ra||rb){startSkill(m,(ra&&rb)?(Math.random()<.45?1:0):(rb?1:0),t);break;}}
     if(pd>58)moveMon(m,P.x,P.y,d.spd*(m.spm||1),dt);
     break;}
   case'return':
     moveMon(m,m.hx,m.hy,d.spd*1.5*(m.spm||1),dt);m.hp=Math.min(m.maxHp,m.hp+dt*m.maxHp*.2);
     if(hd<6){m.st='idle';m.t0=t;m.hold=t+400;}
     break;
   case'atk':skillStep(m,t,dt);break;
  }
}
function monHit(m,dmg){
  if(m.dr){withDr(m,()=>mHit(dmg));return;}
  if(!monAlive(m))return;const t=now();dmg=Math.max(1,Math.round(dmg*(1-(m.red||0))));
  m.hp=Math.max(0,m.hp-dmg);m.flash=.12;floaters.push({x:m.x,y:m.y-m.d.sc*38,t0:t,s:String(dmg)+(CRIT?'!':''),c:CRIT?'#ffd93a':'#fff',cr:CRIT});CRIT=0;
  if(m.st==='idle'||m.st==='return'){m.st='chase';m.t0=t;m.hold=t;}
  if(m.hp<=0){
    stats.kills++;m.st='die';m.t0=t;m.sk=null;m.dieMs=m.d.die?m.d.die.length*260+500:1000;
    if(Math.random()<.4){const pid=pearlOf(m.d.el);drops.push({x:m.x,y:m.y-8,t0:t,n:pid});toast(T('toast.pearl',{name:I18N.itemName(pid)}));}
    if(Math.random()<.04){const lk=TD.SCROLLS.map(s=>s.id).filter(id=>!(loot[id]>0));if(lk.length)drops.push({x:m.x+6,y:m.y-8,t0:t,n:lk[Math.floor(Math.random()*lk.length)]});}
    if(Math.random()<.03&&!skLearned(m.d.el)&&!(loot['sk.'+m.d.el]>0))drops.push({x:m.x+12,y:m.y-8,t0:t,n:'sk.'+m.d.el});   /* sách kỹ năng cùng hệ */
    if(m.d.mat){for(const kd of['gp','uo'])if(Math.random()<.32)drops.push({x:m.x+(kd==='gp'?-8:8),y:m.y-6,t0:t,n:kd+'.'+m.d.el});}   /* nguyên liệu Giáp / Giày theo hệ */
    tameRoll(m.id);
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
  if(m.st!=='die'){const f=meta[name],by=m.y+hover+(f?f[5]*d.sc:-50)-10;
    tagBox(Math.round(m.x),Math.round(by),34,m.hp/m.maxHp,T('monster.'+m.id)+' - '+T('realm.n',{n:m.rl}),null,TD.PEARL[d.el].col);}
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
  for(const m of mons2.concat(DRG)){if(!monAlive(m)||!inR(m.x,m.y))continue;const dd=Math.hypot(m.x-P.x,m.y-P.y);if(dd<bd){bd=dd;best={k:'mon',ref:m,x:m.x,y:m.y-14,reach:38};}}
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
