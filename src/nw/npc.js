/* ============================================================
   NPC ẢO — 6 tu sĩ tự sống trong thế giới: khai thác nguyên liệu thật (cùng nguồn với người chơi, tranh nhau),
   săn quái bầy, bán nguyên liệu lấy Linh Thạch, MUA trang bị / đan dược, uống đan, đột phá cảnh giới.
   Tiến độ lưu ở máy (localStorage) và được tính bù khi quay lại (tối đa 8 giờ).
   Dùng chung biến của game: P, cult, tiles, nodes, mons2, ctx, floaters, TD, T, now().
   ============================================================ */
const NPC_NAMES=[['Lăng Phong','凌風','凌风'],['Mộ Dung Tuyết','慕容雪','慕容雪'],['Tiêu Viêm Tử','蕭炎子','萧炎子'],['Liễu Như Yên','柳如煙','柳如烟'],['Cố Trường Ca','顧長歌','顾长歌'],['Dạ Thanh Vân','夜青雲','夜青云']];
const NPC_KEY='tc_npc_v1',NPC_PLAZA=[100*TILE,100*TILE];
const npcLang=()=>({vi:0,'zh-Hant':1,'zh-Hans':2}[I18N.lang]||0);
const npcNeed=l=>l>=TD.REALM.max?Infinity:TD.REALM.base*Math.pow(2,l-1);
const NPC_GEAR=[...TD.WEAPONS.map(w=>({id:w.id,slot:'w',price:{1:150,2:400,3:900}[w.tier],name:w})),
  ...TD.OUTFITS.filter(o=>o.part==='head'||o.part==='torso'||o.part==='boot').map(o=>({id:o.id,slot:TD.SLOT[o.part],price:o.def*40,name:o}))];
const npcPrice=id=>{const g=NPC_GEAR.find(x=>x.id===id);return g?g.price:0;};
const NPCS=[];
function npcMk(i){
  const a=Math.random()*6.283,r=30+Math.random()*60;
  return{i,x:NPC_PLAZA[0]+Math.cos(a)*r,y:NPC_PLAZA[1]+Math.sin(a)*r,f:1,rl:1+Math.floor(Math.random()*3),qi:0,lt:20+Math.floor(Math.random()*120),
    inv:{},eq:{w:null,h:null,o:null,g:null,r:null,l:null,p:null},hp:100,mhp:100,st:'idle',t0:0,tgt:null,atkT:-999,mv:false,ph:Math.random()*4000,say:null,sayT:0,want:6+Math.floor(Math.random()*5),cdA:0};
}
function npcSave(){try{localStorage.setItem(NPC_KEY,JSON.stringify({ts:Date.now(),n:NPCS.map(n=>({rl:n.rl,qi:n.qi,lt:n.lt,eq:n.eq,inv:n.inv}))}));}catch(e){}}
function npcLoad(){
  let d=null;try{d=JSON.parse(localStorage.getItem(NPC_KEY)||'null');}catch(e){}
  for(let i=0;i<NPC_NAMES.length;i++){const n=npcMk(i);NPCS.push(n);
    const s=d&&d.n&&d.n[i];if(s){n.rl=Math.max(1,Math.min(TD.REALM.max,s.rl|0||1));n.qi=+s.qi||0;n.lt=+s.lt||0;n.inv=s.inv&&typeof s.inv==='object'?s.inv:{};
      for(const k in n.eq)n.eq[k]=(s.eq&&NPC_GEAR.some(g=>g.id===s.eq[k]))?s.eq[k]:null;}
    else{n.eq.h=null;}
    if(d&&d.ts)npcOffline(n,Math.min(8*3600,(Date.now()-d.ts)/1000));}
}
const npcPow=n=>{let a=0;const w=n.eq.w&&TD.byWeapon[n.eq.w];if(w)a+=w.tier*4;for(const k of['h','o','g'])if(n.eq[k])a+=3;return a;};
const npcDef=n=>['h','o','g'].reduce((s,k)=>s+(n.eq[k]?(TD.byOutfit[n.eq[k]]||{def:0}).def:0),0);
function npcSay(n,s){n.say=s;n.sayT=now()+3200;}
function npcBreak(n){while(n.rl<TD.REALM.max&&n.qi>=npcNeed(n.rl)){n.qi-=npcNeed(n.rl);n.rl++;npcSay(n,T('npc.bt',{n:n.rl}));}
  if(n.rl>=TD.REALM.max)n.qi=0;n.mhp=Math.round(100*Math.pow(TD.REALM.mul,n.rl-1))+npcDef(n)*3;}
function npcShop(n,quiet){
  /* bán nguyên liệu */
  let g=0;for(const k in n.inv){const r=TD.byItem[k];if(r)g+=r.ls*n.inv[k];}
  if(g>0){n.lt+=g;n.inv={};if(!quiet)npcSay(n,T('npc.sell',{n:g}));}
  /* mua trang bị tốt hơn rẻ nhất */
  for(let guard=0;guard<6;guard++){
    const cand=NPC_GEAR.filter(x=>x.price<=n.lt&&x.price>npcPrice(n.eq[x.slot])).sort((a,b)=>a.price-b.price)[0];
    if(!cand)break;n.lt-=cand.price;n.eq[cand.slot]=cand.id;if(!quiet)npcSay(n,T('npc.buy',{name:I18N.itemName(cand.id)}));}
  /* mua & uống đan */
  while(n.lt>=40&&n.rl<TD.REALM.max&&n.qi<npcNeed(n.rl)*.9){n.lt-=40;n.qi=Math.min(npcNeed(n.rl),n.qi+TD.DAN['dan.tukhi'].qi);}
  npcBreak(n);
}
function npcOffline(n,sec){
  if(!(sec>30))return;const rate=.5*(1+.1*n.rl);let left=sec;
  while(left>0&&n.rl<TD.REALM.max){n.qi+=Math.min(left,60)*rate;left-=60;n.lt+=Math.min(left+60,60)*.12;if(Math.random()<.2)npcShop(n,true);npcBreak(n);}
  npcShop(n,true);
}
function npcMove(n,tx,ty,spd,dt){
  const dx=tx-n.x,dy=ty-n.y,d=Math.hypot(dx,dy);if(d<2){n.mv=false;return true;}
  const base=Math.atan2(dy,dx);n.mv=false;
  for(const da of[0,.9,-.9,1.8,-1.8]){const a=base+da,nx=n.x+Math.cos(a)*spd*dt,ny=n.y+Math.sin(a)*spd*dt;
    if(nx<48||ny<48||nx>MW*TILE-48||ny>MH*TILE-48||isWater(nx,ny+4))continue;n.x=nx;n.y=ny;n.mv=true;if(Math.abs(Math.cos(a))>.2)n.f=Math.cos(a)>0?1:-1;break;}
  return d<(spd*dt+1);
}
function npcPick(n){
  const t=now();
  if(n.hp<n.mhp*.35){n.st='rest';n.t0=t;n.tgt=null;return;}
  const tot=Object.values(n.inv).reduce((a,b)=>a+b,0);
  if(tot>=n.want){n.st='shop';n.t0=t;n.tgt=null;return;}
  if(n.rl>=3&&npcPow(n)>=6&&Math.random()<.35){
    let best=null,bd=1e9;for(const m of mons2){if(m.st==='dead'||m.st==='die')continue;const d=Math.hypot(m.x-n.x,m.y-n.y);if(d<bd){bd=d;best=m;}}
    if(best){n.st='hunt';n.tgt=best;n.t0=t;return;}}
  let best=null,bd=1e9;for(const o of nodesNear(n.x,n.y,5)){if(o.gone)continue;const d=Math.hypot(o.x-n.x,o.y-n.y);if(d<bd){bd=d;best=o;}}
  if(best){n.st='farm';n.tgt=best;n.t0=t;return;}
  n.st='wander';n.t0=t;const a=Math.random()*6.283;n.tgt={x:n.x+Math.cos(a)*120,y:n.y+Math.sin(a)*120};
}
function npcStep(n,dt,t){
  n.hp=Math.min(n.mhp,n.hp+dt*n.mhp*(n.st==='rest'?.08:.01));
  n.qi+=dt*.5*(1+.1*n.rl)*(n.st==='rest'?2.5:1);if(n.qi>=npcNeed(n.rl))npcBreak(n);
  const spd=50+n.rl*1.5;
  switch(n.st){
   case'idle':n.mv=false;if(t-n.t0>600+n.ph%900)npcPick(n);break;
   case'wander':if(npcMove(n,n.tgt.x,n.tgt.y,spd*.6,dt)||t-n.t0>5000){n.st='idle';n.t0=t;}break;
   case'rest':n.mv=false;if(n.hp>=n.mhp*.85||t-n.t0>20000){n.st='idle';n.t0=t;}break;
   case'shop':if(npcMove(n,NPC_PLAZA[0]+((n.i%3)-1)*34,NPC_PLAZA[1]+34+(n.i>2?18:0),spd,dt)){npcShop(n);npcSave();n.st='idle';n.t0=t;}break;
   case'farm':{const o=n.tgt;if(!o||o.gone){n.st='idle';n.t0=t;break;}
     if(Math.hypot(o.x-n.x,o.y-n.y)>20){npcMove(n,o.x-(o.x>n.x?14:-14),o.y,spd,dt);if(t-n.t0>14000){n.st='idle';n.t0=t;}break;}
     n.mv=false;n.f=o.x>=n.x?1:-1;
     if(t>=n.cdA){n.cdA=t+Math.max(380,900-n.rl*30-npcPow(n)*6);n.atkT=t;o.h++;o.shk=t;const g=o.g;
       if(o.h>=g.hits){o.gone=true;cellDel(o);respawnQ.push({n:o,at:t+TD.RESPAWN});const c=1+(Math.random()<.35?1:0);n.inv[g.item]=(n.inv[g.item]|0)+c;
         floaters.push({x:o.x,y:o.y-22,t0:t,s:'+'+c,c:'#9fe3b0'});n.st='idle';n.t0=t;}}
     break;}
   case'hunt':{const m=n.tgt;if(!m||m.st==='dead'||m.st==='die'){n.st='idle';n.t0=t;break;}
     if(Math.hypot(m.x-n.x,m.y-n.y)>38){npcMove(n,m.x-(m.x>n.x?30:-30),m.y,spd,dt);if(t-n.t0>30000){n.st='idle';n.t0=t;}break;}
     n.mv=false;n.f=m.x>=n.x?1:-1;
     if(t>=n.cdA){n.cdA=t+Math.max(450,950-n.rl*30);n.atkT=t;
       const dmg=Math.round((7+Math.floor(Math.random()*6)+npcPow(n))*Math.pow(TD.REALM.mul,n.rl-1));
       m.hp=Math.max(0,m.hp-dmg);m.flash=.12;floaters.push({x:m.x,y:m.y-m.d.sc*38,t0:t,s:String(dmg),c:'#9fd8ff'});
       n.hp-=(3+Math.random()*7)*Math.max(.35,1-npcDef(n)*.04);
       if(m.hp<=0){m.st='die';m.t0=t;m.sk=null;m.dieMs=m.d.die?m.d.die.length*260+500:1000;n.lt+=12+Math.floor(Math.random()*10);n.qi+=25;
         npcSay(n,T('npc.kill'));n.st='idle';n.t0=t;}
       if(n.hp<n.mhp*.3){n.st='rest';n.t0=t;}}
     break;}
  }
}
let npcSaveT=0;
function npcUpdate(dt,t){
  if(!NPCS.length)return;
  for(const n of NPCS)npcStep(n,dt,t);
  if(t-npcSaveT>15000){npcSaveT=t;npcSave();}
}
function drawNpc(n,t){
  const atking=t-n.atkT<430;let row,fr;
  if(atking){row=NC.rows.atk;fr=Math.min(7,Math.floor((t-n.atkT)/430*8));}
  else if(n.mv){row=NC.rows.walk;fr=Math.floor((t+n.ph)/95)%8;}
  else{row=NC.rows.idle;fr=ncIdle(t+n.ph);}
  const se=cult.eq,sa=P.atkT,sm=P.mv,sd=P.dead;cult.eq=n.eq;P.atkT=n.atkT;P.mv=n.mv;P.dead=0;
  const wd=isWater(n.x,n.y+6);
  ctx.save();if(!wd){ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(n.x,n.y+1,8,2.6,0,0,7);ctx.fill();}
  ctx.translate(n.x,n.y);ctx.scale(n.f,1);
  if(OF.on()){OF.draw(row,fr);OF.boots();}else ctx.drawImage(IMG.player,fr*NC.W,row*NC.H,NC.W,NC.H,-NC.CX*PX,-NC.FEET*PX,NC.W*PX,NC.H*PX);
  drawHeld(t,atking,row,fr);
  ctx.restore();cult.eq=se;P.atkT=sa;P.mv=sm;P.dead=sd;
  /* tên + cảnh giới + lời nói */
  const x=Math.round(n.x),y=Math.round(n.y-29);
  ctx.save();ctx.imageSmoothingEnabled=false;ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.font='bold 6px system-ui,sans-serif';
  const nm=NPC_NAMES[n.i][npcLang()],rl=T('realm.n',{n:n.rl});
  ctx.fillStyle='#07060c';for(const[dx,dy]of[[-.5,0],[.5,0],[0,-.5],[0,.5]]){ctx.fillText(nm,x+dx,y+dy);ctx.fillText(rl,x+dx,y+7+dy);}
  ctx.fillStyle='#9fe3ff';ctx.fillText(nm,x,y);ctx.fillStyle='#bfffd0';ctx.font='bold 5px system-ui,sans-serif';ctx.fillText(rl,x,y+7);
  if(n.say&&t<n.sayT){ctx.font='bold 6px system-ui,sans-serif';const w=ctx.measureText(n.say).width+8,by=y-14;
    ctx.fillStyle='#07060ccc';ctx.fillRect(x-w/2,by-7,w,10);ctx.fillStyle='#ffe9b0';ctx.fillText(n.say,x,by);}
  ctx.restore();
}
npcLoad();
