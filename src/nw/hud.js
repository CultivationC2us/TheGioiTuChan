/* ============================================================
   HUD KIỂU MỚI (theo ảnh mẫu): chân dung + máu + tu vi + cảnh giới · hàng nút menu · bản đồ nhỏ + toạ độ + bản đồ lớn
   - Chỉ hiện khi đã đăng nhập (theo nút túi cũ #bagBtn, bị ẩn bằng CSS nhưng vẫn là cầu nối: nút mới bấm vào nút cũ).
   - Nút Tông Môn / Nhiệm Vụ: tạm báo "sắp ra mắt".
   - Thế giới tròn: toạ độ & khoảng cách tính theo vòng (wd).
   ============================================================ */
(function(){
'use strict';
var G=window.G,T=function(k,p){return I18N.t(k,p);};
function $(id){return document.getElementById(id);}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
var WW=200*16,MWT=200;
function wd(a,b,n){return ((b-a+n/2)%n+n)%n-n/2;}   /* hiệu vòng a→b */

var css=document.createElement('style');
css.textContent=
'#hp,#qi,#bagBtn,#setBtn,#hint{display:none!important}'+
'#hud{position:fixed;inset:0;z-index:30;pointer-events:none;display:none;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}'+
'#hud *{box-sizing:border-box}#hud canvas,#bigmap canvas{position:static!important;inset:auto!important;display:block}'+
'#hud .pf{position:absolute;left:8px;top:calc(env(safe-area-inset-top,0px) + 8px);width:226px;height:64px;pointer-events:auto}'+
'#hud .av{position:absolute;left:0;top:0;width:64px;height:64px;border-radius:50%;border:3px solid #c8a85a;background:radial-gradient(circle at 50% 40%,#2b4a6e,#0e1c30);box-shadow:0 0 0 2px #0b1624,0 0 10px #4fb8ff66;overflow:hidden}'+
'#hud .av canvas{width:100%;height:100%;display:block;image-rendering:pixelated}'+
'#hud .bars{position:absolute;left:70px;top:2px;right:0}'+
'#hud .b{position:relative;height:17px;margin-bottom:4px;border-radius:9px;border:2px solid #0b1624;background:#0b1624cc;overflow:hidden;box-shadow:0 0 0 1px #c8a85a88}'+
'#hud .b i{position:absolute;left:0;top:0;bottom:0;transition:width .15s}'+
'#hud .b.hp i{background:linear-gradient(#ff8a8a,#d02a2a)}#hud .b.qi i{background:linear-gradient(#7fe0ff,#1f8fe0)}'+
'#hud .b span{position:absolute;left:0;right:0;top:0;line-height:13px;font-size:10px;font-weight:800;color:#fff;text-align:center;text-shadow:0 1px 2px #000,0 0 3px #000;white-space:nowrap}'+
'#hud .rl{height:19px;border-radius:10px;border:2px solid #c8a85a;background:linear-gradient(#fff6d8,#e8d28f);color:#3a2a10;font-size:11px;font-weight:800;line-height:15px;text-align:center;box-shadow:0 0 0 1px #0b1624;white-space:nowrap;overflow:hidden}'+
'#hud .menu{position:absolute;left:8px;top:calc(env(safe-area-inset-top,0px) + 80px);display:flex;gap:2px;pointer-events:auto}'+
'#hud .mb{width:41px;text-align:center;cursor:pointer;-webkit-tap-highlight-color:transparent}'+
'#hud .mb canvas{display:block;width:41px;height:39px;border-radius:6px;filter:drop-shadow(0 2px 3px #000a)}'+
'#hud .mb:active canvas{transform:scale(.94)}'+
'#hud .mb em{display:block;white-space:nowrap;margin-left:-6px;margin-right:-6px;font-style:normal;font-size:8px;line-height:11px;margin-top:1px;color:#fff;font-weight:700;text-shadow:0 1px 2px #000,0 0 3px #000}'+
'#hud .mm{position:absolute;right:8px;top:calc(env(safe-area-inset-top,0px) + 8px);width:106px;pointer-events:auto;border-radius:10px;border:2px solid #c8a85a;background:#0b1624ee;box-shadow:0 0 0 1px #0b1624,0 2px 8px #0009;overflow:hidden}'+
'#hud .mm .zn{font-size:10px;font-weight:800;color:#ffe8a8;text-align:center;line-height:16px;background:#14283f;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 4px}'+
'#hud .mm canvas{display:block;width:102px;height:102px;image-rendering:pixelated}'+
'#hud .mm .co{font-size:10px;font-weight:700;color:#dff3ff;text-align:center;line-height:15px;background:#14283f}'+
'#hud .mm .pl{position:absolute;right:2px;bottom:1px;width:15px;height:15px;border-radius:4px;background:#c8a85a;color:#14283f;font-size:13px;font-weight:900;line-height:14px;text-align:center}'+
'#acc{top:calc(env(safe-area-inset-top,0px) + 150px)!important;right:8px!important;font-size:10px!important}'+
'#monN{top:calc(env(safe-area-inset-top,0px) + 132px)!important}#mon{top:calc(env(safe-area-inset-top,0px) + 150px)!important}'+
'#bigmap{position:fixed;inset:0;z-index:960;display:none;align-items:center;justify-content:center;background:#000d;padding:14px;box-sizing:border-box;flex-direction:column;gap:8px;color:#fff}'+
'#bigmap canvas{width:min(92vw,520px);height:min(92vw,520px);border:2px solid #c8a85a;border-radius:10px;image-rendering:pixelated;background:#0b1624}'+
'#bigmap .t{font-size:15px;font-weight:800;color:#ffe8a8}#bigmap .h{font-size:12px;color:#aac}'+
'#sooner{position:fixed;left:50%;top:30%;transform:translateX(-50%);z-index:965;display:none;padding:16px 20px;border-radius:14px;border:2px solid #c8a85a;background:#0b1624f2;color:#ffe8a8;font-weight:800;text-align:center}';
document.head.appendChild(css);

var hud=document.createElement('div');hud.id='hud';
hud.innerHTML=
'<div class="pf"><div class="av"><canvas id="hAv" width="64" height="64"></canvas></div><div class="bars">'+
 '<div class="b hp"><i id="hHp"></i><span id="hHpT"></span></div><div class="b qi"><i id="hQi"></i><span id="hQiT"></span></div><div class="rl" id="hRl"></div></div></div>'+
'<div class="menu" id="hMenu"></div>'+
'<div class="mm" id="hMm"><div class="zn" id="hZn"></div><canvas id="hMc" width="96" height="96"></canvas><div class="co" id="hCo"></div><div class="pl">+</div></div>';
document.body.appendChild(hud);
var big=document.createElement('div');big.id='bigmap';big.innerHTML='<div class="t" id="bmT"></div><canvas id="bmC" width="400" height="400"></canvas><div class="h" id="bmH"></div>';document.body.appendChild(big);
var soon=document.createElement('div');soon.id='sooner';document.body.appendChild(soon);

/* ----- nút menu (ảnh cắt từ thiết kế mẫu: it/ui_btn.webp, 7 ô 78x74) ----- */
var BI=new Image();BI.src='data:image/webp;base64,{{UIBTN}}';
var BTN=[['bag',0,'hud.bag'],['map',1,'hud.map'],['quest',2,'hud.quest'],['sect',3,'hud.sect'],['char',5,'hud.char'],['set',6,'hud.set']];
var mb={};
BTN.forEach(function(b){
  var d=document.createElement('div');d.className='mb';d.innerHTML='<canvas width="78" height="74"></canvas><em></em>';$('hMenu').appendChild(d);mb[b[0]]=d;
  d.onclick=function(){act(b[0]);};
});
function drawBtns(){
  if(!BI.complete||!BI.naturalWidth){setTimeout(drawBtns,150);return;}
  BTN.forEach(function(b){var c=mb[b[0]].querySelector('canvas'),x=c.getContext('2d');x.clearRect(0,0,78,74);x.drawImage(BI,b[1]*78,0,78,74,0,0,78,74);});
}
drawBtns();
function labels(){BTN.forEach(function(b){mb[b[0]].querySelector('em').textContent=T(b[2]);});}
function showSoon(){soon.textContent=T('hud.soon');soon.style.display='block';clearTimeout(showSoon.t);showSoon.t=setTimeout(function(){soon.style.display='none';},1400);}
function act(k){
  if(k==='bag'){$('bagBtn').click();}
  else if(k==='set'){$('setBtn').click();}
  else if(k==='char'){window.TTBag&&TTBag.openTab&&TTBag.openTab('S');}
  else if(k==='map'){openMap();}
  else showSoon();
}

/* ----- chân dung: cắt đầu nhân vật từ sprite (khung 76x90, chân y=71, tâm x=34) ----- */
var avDone=false;
function drawAv(){
  var im=G.IMG&&G.IMG.player;if(!im||!im.complete||!im.naturalWidth){setTimeout(drawAv,200);return;}
  var c=$('hAv'),x=c.getContext('2d');x.imageSmoothingEnabled=false;x.clearRect(0,0,64,64);
  x.drawImage(im,34-17,18,34,34,-2,0,68,68);avDone=true;
}
drawAv();

/* ----- tên vùng theo hướng so với điểm xuất phát (vòng) ----- */
function zoneName(){
  var sp=G.SPAWN,px=G.P.x/16,py=G.P.y/16,dx=wd(sp.x,px,MWT),dy=wd(sp.y,py,MWT);
  if(Math.hypot(dx,dy)<18)return T('zone.c');
  var s=Math.round(Math.atan2(dy,dx)/(Math.PI/4));s=((s%8)+8)%8;
  return T('zone.'+['e','se','s','sw','w','nw','n','ne'][s]);
}

/* ----- bản đồ: cache 1 điểm/ô, lặp 3x3 để cuộn vòng ----- */
var COL={0:[90,154,60],1:[201,168,106],2:[138,141,146],3:[160,160,164],4:[184,154,106],5:[63,143,181]};
var cache=null;
function buildCache(){
  var T0=G.tiles;if(!T0||!T0.length)return null;
  var c=document.createElement('canvas');c.width=c.height=MWT*3;var x=c.getContext('2d');
  var one=document.createElement('canvas');one.width=one.height=MWT;var ox=one.getContext('2d'),id=ox.createImageData(MWT,MWT);
  for(var y=0;y<MWT;y++)for(var q=0;q<MWT;q++){var k=COL[T0[y][q]]||COL[0],o=(y*MWT+q)*4;id.data[o]=k[0];id.data[o+1]=k[1];id.data[o+2]=k[2];id.data[o+3]=255;}
  ox.putImageData(id,0,0);
  for(var a=0;a<3;a++)for(var b=0;b<3;b++)x.drawImage(one,a*MWT,b*MWT);
  return {c:c,one:one};
}
var ELC={kim:'#ffe066',moc:'#6fe06b',thuy:'#5ab8ff',hoa:'#ff7a4a',tho:'#d9a85a'};
function monsDots(fn){
  G.mons2.forEach(function(m){if(m.st==='dead'||m.st==='die')return;fn(m.x/16,m.y/16,ELC[m.d.el]||'#fff',3);});
  if(G.M&&G.M.st!=='sub'&&G.M.st!=='dead')fn(G.M.x/16,G.M.y/16,'#9fe8ff',3);
}
function drawMini(){
  if(!cache){cache=buildCache();if(!cache)return;}
  var c=$('hMc'),x=c.getContext('2d'),R=24,tx=Math.floor(G.P.x/16),ty=Math.floor(G.P.y/16);
  x.imageSmoothingEnabled=false;x.drawImage(cache.c,tx+MWT-R,ty+MWT-R,R*2,R*2,0,0,96,96);
  var s=96/(R*2),cx=48,cy=48,px=G.P.x/16,py=G.P.y/16;
  G.nodes.forEach(function(n){if(n.gone)return;var dx=wd(px,n.x/16,MWT),dy=wd(py,n.y/16,MWT);if(Math.abs(dx)<R&&Math.abs(dy)<R){x.fillStyle=ELC[n.g.el];x.globalAlpha=.9;x.fillRect(cx+dx*s-1,cy+dy*s-1,2,2);}});
  x.globalAlpha=1;
  monsDots(function(mx,my,col,r){var dx=wd(px,mx,MWT),dy=wd(py,my,MWT);if(Math.abs(dx)<R&&Math.abs(dy)<R){x.fillStyle='#000';x.fillRect(cx+dx*s-r/2-1,cy+dy*s-r/2-1,r+2,r+2);x.fillStyle=col;x.fillRect(cx+dx*s-r/2,cy+dy*s-r/2,r,r);}});
  x.fillStyle='#000';x.fillRect(cx-3,cy-3,6,6);x.fillStyle='#fff';x.fillRect(cx-2,cy-2,4,4);
}
function openMap(){
  if(!cache)cache=buildCache();if(!cache)return;
  var c=$('bmC'),x=c.getContext('2d'),S=c.width/MWT;x.imageSmoothingEnabled=false;x.clearRect(0,0,c.width,c.height);
  x.drawImage(cache.one,0,0,c.width,c.height);
  x.strokeStyle='rgba(255,255,255,.12)';x.lineWidth=1;for(var i=1;i<4;i++){x.beginPath();x.moveTo(i*c.width/4,0);x.lineTo(i*c.width/4,c.height);x.moveTo(0,i*c.height/4);x.lineTo(c.width,i*c.height/4);x.stroke();}
  var sp=G.SPAWN;x.fillStyle='#ffe8a8';x.fillRect(sp.x*S-4,sp.y*S-4,8,8);x.strokeStyle='#000';x.strokeRect(sp.x*S-4,sp.y*S-4,8,8);
  monsDots(function(mx,my,col){x.fillStyle='#000';x.fillRect(mx*S-5,my*S-5,10,10);x.fillStyle=col;x.fillRect(mx*S-4,my*S-4,8,8);});
  var px=(G.P.x/16)%MWT*S,py=(G.P.y/16)%MWT*S;x.fillStyle='#000';x.beginPath();x.arc(px,py,7,0,7);x.fill();x.fillStyle='#fff';x.beginPath();x.arc(px,py,5,0,7);x.fill();x.fillStyle='#e03030';x.beginPath();x.arc(px,py,2.5,0,7);x.fill();
  $('bmT').textContent=T('hud.mapt')+' · '+zoneName()+' ('+Math.floor(G.P.x/16)+', '+Math.floor(G.P.y/16)+')';$('bmH').textContent=T('hud.maph');
  big.style.display='flex';
}
big.onclick=function(){big.style.display='none';};
$('hMm').onclick=openMap;

/* ----- cập nhật ----- */
function fmt(n){return I18N.lang==='vi'?String(n).replace('.',','):String(n);}
function tick(){
  var on=$('bagBtn')&&$('bagBtn').style.display!=='none';
  hud.style.display=on?'block':'none';if(!on)return;
  var P=G.P,C=G.cult;
  $('hHp').style.width=Math.max(0,P.hp/P.maxHp*100)+'%';$('hHpT').textContent=Math.round(P.hp)+' / '+P.maxHp;
  var qb=$('hQi'),qt=$('hQiT');
  if(!C.aw){qb.style.width='0%';qt.textContent=T('hud.asleep');}
  else if(C.rl>=G.TD.REALM.max){qb.style.width='100%';qt.textContent=T('hud.qi.max',{n:Math.floor(C.qi)});}
  else{var nd=G.realmNeed(C.rl);qb.style.width=Math.min(100,C.qi/nd*100)+'%';qt.textContent=T('hud.qi',{a:Math.floor(C.qi),b:nd});}
  $('hRl').textContent=T('realm.n',{n:C.rl});
  $('hZn').textContent=zoneName();$('hCo').textContent='('+Math.floor(P.x/16)+', '+Math.floor(P.y/16)+')';
  if(!avDone)drawAv();
}
setInterval(tick,120);
setInterval(function(){if(hud.style.display==='block')drawMini();},250);
labels();I18N.on(function(){labels();tick();});
window.TTHud={tick:tick,openMap:openMap};
})();
