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
NPC_GEAR.push({id:'mt.tuyet_van',slot:'m',price:500,name:TD.byMount['mt.tuyet_van']});
const npcPrice=id=>{const g=NPC_GEAR.find(x=>x.id===id);return g?g.price:0;};
const NPCS=[];
function npcMk(i){
  /* sinh rải rác khắp bản đồ (không tụ ở quảng trường): chọn điểm đất liền cách các NPC khác >= 30 ô và cách quảng trường >= 14 ô */
  let sp=null;
  for(let k=0;k<30&&!sp;k++){
    const q=findLand(8+Math.floor(Math.random()*(MW-16)),8+Math.floor(Math.random()*(MH-16)));
    const tx=q.x/TILE,ty=q.y/TILE;
    if(Math.hypot(tx-NPC_PLAZA[0]/TILE,ty-NPC_PLAZA[1]/TILE)<14)continue;
    if(NPCS.some(o=>Math.hypot(o.x-q.x,o.y-q.y)<30*TILE*(k<20?1:.4)))continue;
    sp=q;
  }
  if(!sp){const a=Math.random()*6.283,r=30+Math.random()*60;sp={x:NPC_PLAZA[0]+Math.cos(a)*r,y:NPC_PLAZA[1]+Math.sin(a)*r};}
  return{i,x:sp.x,y:sp.y,f:1,rl:1+Math.floor(Math.random()*3),qi:0,lt:[700,1500,400,2200,900,300][i%6],
    inv:{},eq:{w:null,h:null,o:null,g:null,r:null,l:null,p:null,m:null},path:null,pg:null,bl:{},lx:0,ly:0,lt0:0,stuck:0,hp:100,mhp:100,st:'idle',t0:0,tgt:null,atkT:-999,mv:false,ph:Math.random()*4000,say:null,sayT:0,want:6+Math.floor(Math.random()*5),cdA:0,kills:0};
}
function npcSave(){try{localStorage.setItem(NPC_KEY,JSON.stringify({ts:Date.now(),n:NPCS.map(n=>({rl:n.rl,qi:n.qi,lt:n.lt,eq:n.eq,inv:n.inv,kills:n.kills|0}))}));}catch(e){}}
function npcLoad(){
  let d=null;try{d=JSON.parse(localStorage.getItem(NPC_KEY)||'null');}catch(e){}
  for(let i=0;i<NPC_NAMES.length;i++){const n=npcMk(i);NPCS.push(n);
    const s=d&&d.n&&d.n[i];if(s){n.rl=Math.max(1,Math.min(TD.REALM.max,s.rl|0||1));n.qi=+s.qi||0;n.lt=+s.lt||0;n.inv=s.inv&&typeof s.inv==='object'?s.inv:{};n.kills=Math.max(0,s.kills|0);
      for(const k in n.eq)n.eq[k]=(s.eq&&NPC_GEAR.some(g=>g.id===s.eq[k]))?s.eq[k]:null;}
    else{n.eq.h=null;}
    if(!Object.values(n.eq).some(Boolean)){n.lt=Math.max(n.lt,[700,1500,400,2200,900,300][i%6]);npcShop(n,true);}
    if(d&&d.ts)npcOffline(n,Math.min(8*3600,(Date.now()-d.ts)/1000));}
}
const npcPow=n=>{let a=0;const w=n.eq.w&&TD.byWeapon[n.eq.w];if(w)a+=w.tier*4;for(const k of['h','o','g'])if(n.eq[k])a+=3;return a;};
const npcDef=n=>['h','o','g'].reduce((s,k)=>s+(n.eq[k]?(TD.byOutfit[n.eq[k]]||{def:0}).def:0),0);
function npcSay(n,s){n.say=s;n.sayT=now()+3200;}
function npcBreak(n){while(n.rl<TD.REALM.max&&n.qi>=npcNeed(n.rl)){n.qi-=npcNeed(n.rl);n.rl++;npcSay(n,T('npc.bt',{n:n.rl}));}
  if(n.rl>=TD.REALM.max)n.qi=0;n.mhp=Math.round(100*Math.pow(TD.REALM.mul,n.rl-1))+npcDef(n)*3;}
function npcShop(n,quiet){
  /* bán nguyên liệu */
  let g=0;for(const k in n.inv){const r=TD.byItem[k];if(r)g+=r.ls*n.inv[k]*3;}
  if(g>0){n.lt+=g;n.inv={};if(!quiet)npcSay(n,T('npc.sell',{n:g}));}
  /* mua trang bị tốt hơn rẻ nhất */
  for(let guard=0;guard<6;guard++){
    const cand=NPC_GEAR.filter(x=>x.price<=n.lt&&x.price>npcPrice(n.eq[x.slot])).sort((a,b)=>((n.eq[a.slot]?1:0)-(n.eq[b.slot]?1:0))||(n.eq[a.slot]?b.price-a.price:a.price-b.price))[0];
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
/* tìm đường BFS trên lưới ô (tránh nước) — NPC vòng qua sông/hồ thay vì đứng đờ ra */
const NPV=new Int32Array(MW*MH),NPP=new Int32Array(MW*MH),NPQ=new Int32Array(MW*MH);let npStamp=0;
function npcPath(sx,sy,tx,ty){
  const s0=(Math.floor(sy/TILE)*MW+Math.floor(sx/TILE)),g0=(Math.floor(ty/TILE)*MW+Math.floor(tx/TILE));
  if(g0<0||g0>=MW*MH||s0<0||s0>=MW*MH)return null;
  if(tiles[Math.floor(ty/TILE)][Math.floor(tx/TILE)]===W)return null;
  if(s0===g0)return[];
  npStamp++;let qh=0,qt=0;NPQ[qt++]=s0;NPV[s0]=npStamp;NPP[s0]=-1;let found=false;
  const D=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
  while(qh<qt&&!found){const c=NPQ[qh++],cx=c%MW,cy=(c/MW)|0;
    for(const[dx,dy]of D){const x=cx+dx,y=cy+dy;if(x<2||y<2||x>=MW-2||y>=MH-2)continue;const k=y*MW+x;if(NPV[k]===npStamp)continue;
      if(tiles[y][x]===W)continue;if(dx&&dy&&(tiles[cy][x]===W||tiles[y][cx]===W))continue;
      NPV[k]=npStamp;NPP[k]=c;NPQ[qt++]=k;if(k===g0){found=true;break;}}}
  if(!found)return null;
  const pts=[];for(let c=g0;c!==-1&&c!==s0;c=NPP[c])pts.push([(c%MW)*TILE+8,((c/MW)|0)*TILE+8]);
  pts.reverse();const out=[];for(let i=0;i<pts.length;i++)if(i%2===1||i===pts.length-1)out.push(pts[i]);return out;
}
/* đi tới (tx,ty) theo đường tìm được; trả về 1 = tới nơi, 0 = đang đi, -1 = không tới được */
function npcGo(n,tx,ty,spd,dt,t){
  const key=Math.floor(tx/TILE)+','+Math.floor(ty/TILE);
  if(n.pg!==key||!n.path){n.pg=key;n.path=npcPath(n.x,n.y,tx,ty);n.stuck=0;if(!n.path)return -1;}
  while(n.path.length&&Math.hypot(n.path[0][0]-n.x,n.path[0][1]-n.y)<5)n.path.shift();
  const gx=n.path.length?n.path[0][0]:tx,gy=n.path.length?n.path[0][1]:ty,px=n.x,py=n.y;
  const arrived=npcMove(n,gx,gy,spd,dt);
  if(Math.hypot(n.x-px,n.y-py)<.05){n.stuck+=dt;if(n.stuck>1.2){n.pg=null;n.path=null;n.stuck=0;if(++n.lt0>3){n.lt0=0;return -1;}}}else n.stuck=0;
  return(arrived&&!n.path.length)?1:0;
}
function npcPick(n){
  const t=now();
  if(n.hp<n.mhp*.35){n.st='rest';n.t0=t;n.tgt=null;return;}
  const tot=Object.values(n.inv).reduce((a,b)=>a+b,0);
  if(tot>=n.want){n.st='shop';n.t0=t;n.tgt=null;return;}
  if(n.rl>=3&&npcPow(n)>=6&&Math.random()<.35){
    let best=null,bd=1e9;for(const m of mons2){if(m.st==='dead'||m.st==='die')continue;const d=Math.hypot(m.x-n.x,m.y-n.y);if(d<bd){bd=d;best=m;}}
    if(best){n.st='hunt';n.tgt=best;n.t0=t;n.path=null;n.pg=null;return;}}
  let best=null,bd=1e9;for(const o of nodesNear(n.x,n.y,6)){if(o.gone||(n.bl[o.x+','+o.y]>t))continue;const d=Math.hypot(o.x-n.x,o.y-n.y);if(d<bd){bd=d;best=o;}}
  if(best){n.st='farm';n.tgt=best;n.t0=t;n.path=null;n.pg=null;return;}
  n.st='wander';n.t0=t;n.path=null;n.pg=null;const a=Math.random()*6.283;n.tgt={x:n.x+Math.cos(a)*140,y:n.y+Math.sin(a)*140};
}
function npcStep(n,dt,t){
  n.hp=Math.min(n.mhp,n.hp+dt*n.mhp*(n.st==='rest'?.08:.01));
  n.qi+=dt*.5*(1+.1*n.rl)*(n.st==='rest'?2.5:1);if(n.qi>=npcNeed(n.rl))npcBreak(n);
  const spd=(50+n.rl*1.5)*(n.eq.m?1.7:1);
  switch(n.st){
   case'idle':n.mv=false;if(t-n.t0>600+n.ph%900)npcPick(n);break;
   case'wander':{const r=npcGo(n,n.tgt.x,n.tgt.y,spd*.6,dt,t);if(r!==0||t-n.t0>6000){n.st='idle';n.t0=t;n.mv=false;}break;}
   case'rest':n.mv=false;if(n.hp>=n.mhp*.85||t-n.t0>20000){n.st='idle';n.t0=t;}break;
   case'shop':{const r=npcGo(n,NPC_PLAZA[0]+((n.i%3)-1)*34,NPC_PLAZA[1]+34+(n.i>2?18:0),spd,dt,t);if(r!==0){npcShop(n);npcSave();n.st='idle';n.t0=t;n.mv=false;}break;}
   case'farm':{const o=n.tgt;if(!o||o.gone){n.st='idle';n.t0=t;break;}
     if(Math.hypot(o.x-n.x,o.y-n.y)>20){const r=npcGo(n,o.x,o.y+4,spd,dt,t);if(r===-1||t-n.t0>40000){n.bl[o.x+','+o.y]=t+90000;n.st='idle';n.t0=t;n.mv=false;}else if(r===1&&Math.hypot(o.x-n.x,o.y-n.y)>20){n.bl[o.x+','+o.y]=t+90000;n.st='idle';n.t0=t;}break;}
     n.mv=false;n.f=o.x>=n.x?1:-1;
     if(t>=n.cdA){n.cdA=t+Math.max(380,900-n.rl*30-npcPow(n)*6);n.atkT=t;o.h++;o.shk=t;const g=o.g;
       if(o.h>=g.hits){o.gone=true;cellDel(o);respawnQ.push({n:o,at:t+TD.RESPAWN});const c=1+(Math.random()<.35?1:0);n.inv[g.item]=(n.inv[g.item]|0)+c;
         floaters.push({x:o.x,y:o.y-22,t0:t,s:'+'+c,c:'#9fe3b0'});n.st='idle';n.t0=t;}}
     break;}
   case'hunt':{const m=n.tgt;if(!m||m.st==='dead'||m.st==='die'){n.st='idle';n.t0=t;break;}
     if(Math.hypot(m.x-n.x,m.y-n.y)>38){const r=npcGo(n,m.x-(m.x>n.x?24:-24),m.y,spd,dt,t);if(r===-1||t-n.t0>60000){n.st='idle';n.t0=t;n.mv=false;}break;}
     n.mv=false;n.f=m.x>=n.x?1:-1;
     if(t>=n.cdA){n.cdA=t+Math.max(450,950-n.rl*30);n.atkT=t;
       const dmg=Math.round((7+Math.floor(Math.random()*6)+npcPow(n))*Math.pow(TD.REALM.mul,n.rl-1));
       m.hp=Math.max(0,m.hp-dmg);m.flash=.12;floaters.push({x:m.x,y:m.y-m.d.sc*38,t0:t,s:String(dmg),c:'#9fd8ff'});
       n.hp-=(3+Math.random()*7)*Math.max(.35,1-npcDef(n)*.04);
       if(m.hp<=0){m.st='die';m.t0=t;m.sk=null;m.dieMs=m.d.die?m.d.die.length*260+500:1000;n.lt+=12+Math.floor(Math.random()*10);n.qi+=25;n.kills++;
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
  if(n.eq.m){const se=cult.eq,sv={};for(const k of NP_KEYS)sv[k]=P[k];cult.eq=n.eq;
    Object.assign(P,{x:n.x,y:n.y,f:n.f,mt:n.eq.m,fly:false,flyH:0,mv:n.mv,atkT:n.atkT,dead:0,hurtT:-9999,mtFx:-9999,dashT:-9999});
    NPD=true;try{drawMounted(t);}finally{NPD=false;Object.assign(P,sv);cult.eq=se;}
    return npcTag(n,t,16);}
  const se=cult.eq,sa=P.atkT,sm=P.mv,sd=P.dead;cult.eq=n.eq;P.atkT=n.atkT;P.mv=n.mv;P.dead=0;
  const wd=isWater(n.x,n.y+6);
  ctx.save();if(!wd){ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(n.x,n.y+1,8,2.6,0,0,7);ctx.fill();}
  ctx.translate(n.x,n.y);ctx.scale(n.f,1);
  if(OF.on()){OF.draw(row,fr);OF.boots();}else ctx.drawImage(IMG.player,fr*NC.W,row*NC.H,NC.W,NC.H,-NC.CX*PX,-NC.FEET*PX,NC.W*PX,NC.H*PX);
  drawHeld(t,atking,row,fr);
  ctx.restore();cult.eq=se;P.atkT=sa;P.mv=sm;P.dead=sd;
  npcTag(n,t,0);
}
const NP_KEYS=['x','y','f','mt','fly','flyH','mv','atkT','dead','hurtT','mtFx','dashT'];
function npcTag(n,t,lift){
  /* tên + cảnh giới + thanh HP + lời nói */
  const x=Math.round(n.x),y=Math.round(n.y-29-lift);
  const nm=NPC_NAMES[n.i][npcLang()],rl=T('realm.n',{n:n.rl});
  tagBox(x,y,22,(n.hp||0)/(n.mhp||1),nm,rl,'#9fe3ff','#bfffd0');
  if(n.say&&t<n.sayT){ctx.save();ctx.textAlign='center';ctx.font='bold 6px system-ui,sans-serif';const w=ctx.measureText(n.say).width+8,by=y-20;
    ctx.fillStyle='#07060ccc';ctx.fillRect(x-w/2,by-7,w,10);ctx.fillStyle='#ffe9b0';ctx.fillText(n.say,x,by);ctx.restore();}
}
/* dữ liệu cho bảng xếp hạng: NPC là người chơi có tiến trình thật (đang chạy trên máy này) */
function npcTotalQi(n){let s=0;for(let l=1;l<n.rl;l++)s+=npcNeed(l);return Math.round(s+n.qi);}
function npcRank(){return NPCS.map(n=>({name:NPC_NAMES[n.i][npcLang()],pid:'TC-'+['7A3F9C','B21E58','4D90A7','E6C413','19F8B2','C57D06'][n.i%6],realm:n.rl,qi_total:npcTotalQi(n),kills:n.kills|0,npc:1}));}
npcLoad();
