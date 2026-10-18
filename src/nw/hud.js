/* ============================================================
   HUD KIỂU MỚI (theo ảnh mẫu): chân dung + máu + tu vi + cảnh giới · hàng nút menu · bản đồ nhỏ + toạ độ + bản đồ lớn
   - Chỉ hiện khi đã đăng nhập (theo nút túi cũ #bagBtn, bị ẩn bằng CSS nhưng vẫn là cầu nối: nút mới bấm vào nút cũ).
   - Nút Tông Môn / Nhiệm Vụ: tạm báo "sắp ra mắt".
   - Thế giới tròn: toạ độ & khoảng cách tính theo vòng (wd).
   ============================================================ */
(function(){
'use strict';
var G=window.G,T=function(k,p){return I18N.t(k,p);};
function UPS(n){return 'data:image/png;base64,'+window.UIP[n];}
function UP(n){return 'url('+UPS(n)+')';}
function $(id){return document.getElementById(id);}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
var WW=500*16,MWT=500;
function wd(a,b,n){return ((b-a+n/2)%n+n)%n-n/2;}   /* hiệu vòng a→b */

var css=document.createElement('style');
css.textContent=
'#hp,#qi,#bagBtn,#setBtn,#hint{display:none!important}'+
'#hud{position:fixed;inset:0;z-index:30;pointer-events:none;display:none;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}'+
'#hud *{box-sizing:border-box}#hud canvas,#bigmap canvas{position:static!important;inset:auto!important;display:block}'+
'#hud .pf{position:absolute;left:4px;top:calc(env(safe-area-inset-top,0px) + 4px);width:236px;height:78px;pointer-events:auto}'+
'#hud .av{position:absolute;left:2px;top:2px;width:70px;height:71px;cursor:pointer;-webkit-tap-highlight-color:transparent}'+
'#hud .av canvas{position:absolute!important;left:13px!important;top:12px!important;width:52px!important;height:52px!important;border-radius:50%;background:radial-gradient(circle at 50% 35%,#35608e,#0e1c30);image-rendering:pixelated}'+
'#hud .av img.rg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;filter:drop-shadow(0 2px 3px #000a)}'+
'#hud .av .lv{position:absolute;left:49px;top:46px;width:20px;height:20px;border-radius:50%;background:#06101c;color:#ffe8a8;font-size:11px;font-weight:900;line-height:20px;text-align:center;text-shadow:0 1px 2px #000}'+
'#hud .bars{position:absolute;left:74px;top:0;width:164px}'+
'#hud .fr{position:relative;width:164px;height:22px;margin-bottom:2px;border:8px solid transparent;border-image:'+UP('hbar')+' 4 fill/8px stretch;image-rendering:pixelated}'+
'#hud .fr .tr{position:absolute;left:-2px;right:-2px;top:-2px;bottom:-2px;overflow:hidden}'+
'#hud .fr .tr i{position:absolute;left:0;top:0;bottom:0;transition:width .15s}'+
'#hud .fr.hp .tr i{background:linear-gradient(#ff7a58 0 28%,#c02f2c 28% 72%,#6a1418 72%)}#hud .fr.qi .tr i{background:linear-gradient(#d8f6ff 0 28%,#1f9be0 28% 72%,#1b3a8a 72%)}'+
'#hud .fr .ic{position:absolute;left:-16px;top:-8px;width:24px;height:24px;image-rendering:pixelated;z-index:2}'+
'#hud .fr span{position:absolute;left:10px;right:2px;top:-8px;line-height:22px;font-size:10px;font-weight:900;color:#fff;text-align:center;text-shadow:1px 0 #070b16,-1px 0 #070b16,0 1px #070b16,0 -1px #070b16;white-space:nowrap;z-index:2}'+
'#hud .rl{position:relative;width:132px;height:22px;margin-top:3px;margin-left:2px;border:8px solid transparent;border-image:'+UP('plate')+' 4 fill/8px stretch;image-rendering:pixelated}'+
'#hud .rl span{position:absolute;left:0;right:0;top:-8px;line-height:22px;font-size:11px;font-weight:900;color:#3a2208;text-align:center;white-space:nowrap}'+
'#hud .mpb{position:absolute;left:76px;top:76px;width:130px;height:11px;border:1px solid #070b16;border-radius:3px;background:#0b1020;overflow:hidden}#hud .mpb i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(#e2d4ff 0 28%,#8a5cff 28% 72%,#3a1f8a 72%)}#hud .mpb span{position:absolute;left:0;right:0;top:-1px;text-align:center;font-size:8px;line-height:11px;font-weight:900;color:#fff;text-shadow:0 0 2px #000,0 0 2px #000}'+
'#hud .up{position:absolute;left:204px;top:50px;width:24px;height:24px;cursor:pointer}#hud .up img{width:100%;height:100%;image-rendering:pixelated}#hud .up:active{transform:translateY(2px)}'+
'#hud .menu{position:absolute;left:8px;top:calc(env(safe-area-inset-top,0px) + 90px);display:flex;gap:1px;pointer-events:auto}'+
'#hud .mb{width:36px;text-align:center;cursor:pointer;-webkit-tap-highlight-color:transparent}'+
'#hud .mb canvas{display:block;width:36px;height:34px;border-radius:6px;filter:drop-shadow(0 2px 3px #000a)}'+
'#hud .mb:active canvas{transform:scale(.94)}'+
'#hud .mb em{display:block;white-space:nowrap;margin-left:-6px;margin-right:-6px;font-style:normal;font-size:7px;line-height:10px;margin-top:1px;color:#fff;font-weight:700;text-shadow:0 1px 2px #000,0 0 3px #000}'+
'#hud .mm{position:absolute;right:6px;top:calc(env(safe-area-inset-top,0px) + 6px);width:112px;pointer-events:auto;border:8px solid transparent;border-image:'+UP('minimap')+' 4 fill/8px stretch;image-rendering:pixelated;background:#0d1628;background-clip:padding-box}'+
'#hud .mm .zn{font-size:10px;font-weight:900;color:#ffe9a8;text-align:center;line-height:14px;background:#13213b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 2px;margin:-2px -2px 0;text-shadow:1px 1px #070b16}'+
'#hud .mm canvas{display:block;width:96px;height:96px;image-rendering:pixelated}'+
'#hud .mm .co{font-size:10px;font-weight:800;color:#c8f6ff;text-align:center;line-height:14px;background:#13213b;margin:0 -2px -2px}'+
'#hud .mm .pl{position:absolute;right:-6px;bottom:-6px;width:14px;height:14px;background:#e8bb48;border:2px solid #070b16;color:#13213b;font-size:12px;font-weight:900;line-height:11px;text-align:center}'+
'#acc{top:calc(env(safe-area-inset-top,0px) + 150px)!important;right:8px!important;font-size:10px!important}'+
'#monN{top:calc(env(safe-area-inset-top,0px) + 132px)!important}#mon{top:calc(env(safe-area-inset-top,0px) + 150px)!important}'+
'#bigmap{position:fixed;inset:0;z-index:960;display:none;align-items:center;justify-content:center;background:#000d;padding:14px;box-sizing:border-box;flex-direction:column;gap:8px;color:#fff}'+
'#bigmap canvas{width:min(92vw,520px);height:min(92vw,520px);border:2px solid #c8a85a;border-radius:10px;image-rendering:pixelated;background:#0b1624}'+
'#bigmap .t{font-size:15px;font-weight:800;color:#ffe8a8}#bigmap .h{font-size:12px;color:#aac}'+
'#sooner{position:fixed;left:50%;top:30%;transform:translateX(-50%);z-index:965;display:none;padding:16px 20px;border-radius:14px;border:2px solid #c8a85a;background:#0b1624f2;color:#ffe8a8;font-weight:800;text-align:center}';
document.head.appendChild(css);

var hud=document.createElement('div');hud.id='hud';
hud.innerHTML=
'<div class="pf"><div class="av" id="hAvB"><canvas id="hAv" width="112" height="112"></canvas><img class="rg" id="hRg"><div class="lv" id="hLv"></div></div><div class="bars">'+
 '<div class="fr hp"><div class="tr"><i id="hHp"></i></div><img class="ic" id="hFh"><span id="hHpT"></span></div><div class="fr qi"><div class="tr"><i id="hQi"></i></div><img class="ic" id="hFq"><span id="hQiT"></span></div><div class="rl"><span id="hRl"></span></div></div><div class="mpb"><i id="hMp"></i><span id="hMpT"></span></div><div class="up" id="hUp"><img id="hUpI"></div></div>'+
'<div class="menu" id="hMenu"></div>'+
'<div class="mm" id="hMm"><div class="zn" id="hZn"></div><canvas id="hMc" width="96" height="96"></canvas><div class="co" id="hCo"></div><div class="pl">+</div></div>';
document.body.appendChild(hud);
var big=document.createElement('div');big.id='bigmap';big.innerHTML='<div class="t" id="bmT"></div><canvas id="bmC" width="400" height="400"></canvas><div class="h" id="bmH"></div>';document.body.appendChild(big);
var soon=document.createElement('div');soon.id='sooner';document.body.appendChild(soon);

/* ----- nút menu (ảnh cắt từ thiết kế mẫu: it/ui_btn.webp, 7 ô 78x74) ----- */
var BI=new Image();BI.src='data:image/webp;base64,{{UIBTN}}';
var BTN=[['bag',0,'hud.bag'],['quest',2,'hud.quest'],['sect',3,'hud.sect'],['rank',7,'hud.rank'],['set',6,'hud.set']];   /* Bản đồ & Nhân vật bỏ: bấm minimap / avatar để mở */
var mb={};
BTN.forEach(function(b){
  var d=document.createElement('div');d.className='mb';d.innerHTML='<canvas width="108" height="102"></canvas><em></em>';$('hMenu').appendChild(d);mb[b[0]]=d;
  d.onclick=function(){act(b[0]);};
});
var BUI={bag:'h42',quest:'h44',sect:'h48',rank:'h47',set:'h46'};   /* bộ icon mới (lib/extract_all.py) */
function drawBtns(){
  if(!window.UIA||!BI.complete||!BI.naturalWidth||!(G.IMG&&G.IMG.uia&&G.IMG.uia.complete)){setTimeout(drawBtns,150);return;}
  BTN.forEach(function(b){var c=mb[b[0]].querySelector('canvas'),x=c.getContext('2d');x.clearRect(0,0,108,102);UIA.draw(c,BUI[b[0]],1);});
}
drawBtns();
function labels(){BTN.forEach(function(b){mb[b[0]].querySelector('em').textContent=T(b[2]);});}
function showSoon(){soon.textContent=T('hud.soon');soon.style.display='block';clearTimeout(showSoon.t);showSoon.t=setTimeout(function(){soon.style.display='none';},1400);}
function act(k){
  if(k==='bag'){$('bagBtn').click();}
  else if(k==='set'){$('setBtn').click();}
  else if(k==='char'){window.TTBag&&TTBag.openTab&&TTBag.openTab('S');}
  else if(k==='map'){openMap();}
  else if(k==='rank'){window.TTBag&&TTBag.openRank&&TTBag.openRank();}
  else showSoon();
}

/* ----- chân dung: cắt đầu nhân vật từ sprite (khung 76x90, chân y=71, tâm x=34) ----- */
var avDone=false,avKey=null;
function setImg(id,n){$(id).src=UPS(n);}
$('hRg').src='data:image/webp;base64,'+window.UIP.o_av_ring;setImg('hFh','st_hp');setImg('hFq','st_qi');setImg('hUpI','btn_up');
function drawAv(){   /* từ vạch yên (hàng 43) trở lên, canh giữa một chút */
  var im=G.IMG&&G.IMG.player;if(!im||!im.complete||!im.naturalWidth){setTimeout(drawAv,200);return;}
  var c=$('hAv'),x=c.getContext('2d');x.imageSmoothingEnabled=false;x.clearRect(0,0,112,112);
  if(G.OF&&G.OF.on()&&G.IMG.outfit.complete){var tmp=document.createElement('canvas');G.OF.portrait(tmp,6,8,19,58,67);x.imageSmoothingEnabled=true;x.drawImage(tmp,0,0,tmp.width,tmp.height,2,2,108,108);avDone=true;avKey=G.OF.sig();return;}
  avKey='||';x.drawImage(im,14,22,40,43,4,6,104,112);avDone=true;
}
drawAv();
$('hAvB').onclick=function(){window.TTBag&&TTBag.openTab('S');};
$('hUp').onclick=function(){window.TTBag&&TTBag.openTab('R');};

/* ----- tên vùng theo hướng so với điểm xuất phát (vòng) ----- */
function zoneName(){
  var sp=G.SPAWN,px=G.P.x/16,py=G.P.y/16,dx=wd(sp.x,px,MWT),dy=wd(sp.y,py,MWT);
  if(Math.hypot(dx,dy)<18)return T('zone.c');
  var b=G.tiles[Math.floor(G.P.y/16)%MWT][Math.floor(G.P.x/16)%MWT],bn={6:'zone.sa',7:'zone.dam',8:'zone.tuyet',9:'zone.rung',10:'zone.nui'}[b];if(bn)return T(bn);
  var s=Math.round(Math.atan2(dy,dx)/(Math.PI/4));s=((s%8)+8)%8;
  return T('zone.'+['e','se','s','sw','w','nw','n','ne'][s]);
}

/* ----- bản đồ: cache 1 điểm/ô, lặp 3x3 để cuộn vòng ----- */
var COL={0:[90,154,60],1:[201,168,106],2:[138,141,146],3:[160,160,164],4:[184,154,106],5:[63,143,181],6:[226,196,112],7:[84,92,52],8:[236,242,248],9:[44,96,58],10:[70,66,78]};
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
  (G.DRG||[]).forEach(function(d){if(d.st!=='sub'&&d.st!=='dead'&&d.st!=='tele')fn(d.x/16,d.y/16,'#9fe8ff',3);});
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
  $('hMp').style.width=Math.max(0,P.mp/P.maxMp*100)+'%';$('hMpT').textContent=T('hud.mp',{a:Math.floor(P.mp),b:P.maxMp});
  var qb=$('hQi'),qt=$('hQiT');
  if(!C.aw){qb.style.width='0%';qt.textContent=T('hud.asleep');}
  else if(C.rl>=G.TD.REALM.max){qb.style.width='100%';qt.textContent=T('hud.qi.max',{n:Math.floor(C.qi)});}
  else{var nd=G.realmNeed(C.rl);qb.style.width=Math.min(100,C.qi/nd*100)+'%';qt.textContent=T('hud.qi',{a:Math.floor(C.qi),b:nd});}
  $('hRl').textContent=C.aw?T('realm.n',{n:C.rl}):T('j.asleep');$('hLv').textContent=C.aw?C.rl:'–';
  $('hZn').textContent=zoneName();$('hCo').textContent='('+Math.floor(P.x/16)+', '+Math.floor(P.y/16)+')';
  if(!avDone||avKey!==(G.OF?G.OF.sig():'||'))drawAv();
}
setInterval(tick,120);
setInterval(function(){if(hud.style.display==='block')drawMini();},250);
labels();I18N.on(function(){labels();tick();});
window.TTHud={tick:tick,openMap:openMap};
})();

/* ----- da mới cho nút ĐÁNH · TỰ ĐỘNG · CƯỠI · BAY · LƯỚT (icon độ phân giải cao, vẽ mượt) ----- */
(function(){
  function go(){
    var u=function(n){return 'url('+UIA.url(n)+')';},st=document.getElementById('uiaSkin')||document.createElement('style');st.id='uiaSkin';
    var lab='text-shadow:-1px 0 #000,1px 0 #000,0 -1px #000,0 1px #000;font-weight:800;color:#fff;letter-spacing:0;';
    var bg=function(n){return 'background:'+u(n)+' center/100% 100% no-repeat;';};
    st.textContent=
     'body #atk{'+bg('h88')+'border:0;box-sizing:border-box;font-size:11px;align-items:flex-end;padding-bottom:3px;'+lab+'filter:drop-shadow(0 3px 5px #000b)}'+
     'body #atk.on,body #atk:active{filter:brightness(1.35) drop-shadow(0 0 9px #ff9a4a)}'+
     'body #autoBtn{'+bg('h89')+'border:0;box-sizing:border-box;min-width:0;width:52px;height:52px;padding:36px 0 0;border-radius:0;font-size:9px;line-height:12px;text-align:center;'+lab+'filter:drop-shadow(0 2px 4px #000b)}'+
     'body #autoBtn.on{'+bg('h89')+'box-shadow:none;filter:brightness(1.45) drop-shadow(0 0 8px #ffb347)}'+
     'body .mtb,body .mtb.on{border:0;border-radius:0;box-shadow:none;background-color:transparent;background-size:100% 100%;background-repeat:no-repeat;background-position:center;align-items:flex-end;padding:0 0 1px;font-size:9px;'+lab+'filter:drop-shadow(0 2px 4px #000b)}'+
     'body .mtb.on{filter:brightness(1.4) drop-shadow(0 0 8px #9fe3ff)}'+
     'body #mtFly,body #mtFly.on{background-image:'+u('h90')+'}body #mtDash,body #mtDash.on{background-image:'+u('h61')+'}';
    document.head.appendChild(st);
  }
  UIA.ready(go);
  /* CƯỠI / XUỐNG: biểu tượng là chính con linh thú đang chọn trên đĩa tròn (vẽ mượt), thay cho icon giày cũ */
  var lastM=null;
  function rideSkin(){
    var el=document.getElementById('mtRide');if(!el||!G.cult)return;
    var id=G.cult.mtSel||Object.keys(G.loot).find(function(k){return G.TD.byMount[k]&&G.loot[k]>0;})||'';
    if(id===lastM)return;var ic=id&&G.iconCanvas(id,3);if(id&&!ic)return;lastM=id;
    var c=document.createElement('canvas');c.width=c.height=128;var x=c.getContext('2d');
    var g=x.createRadialGradient(52,46,6,64,64,62);g.addColorStop(0,'#34507a');g.addColorStop(1,'#0e1830');
    x.fillStyle=g;x.beginPath();x.arc(64,64,58,0,7);x.fill();
    x.lineWidth=7;x.strokeStyle='#c8963a';x.stroke();x.lineWidth=2.5;x.strokeStyle='#ffe3a1';x.beginPath();x.arc(64,64,54.5,0,7);x.stroke();x.lineWidth=2;x.strokeStyle='#4a2f10';x.beginPath();x.arc(64,64,61.5,0,7);x.stroke();
    if(ic){var k=Math.min(80/ic.width,80/ic.height);x.imageSmoothingEnabled=false;x.drawImage(ic,64-ic.width*k/2,66-ic.height*k/2,ic.width*k,ic.height*k);}
    var url='url('+c.toDataURL('image/png')+')';el.style.setProperty('background-image',url,'important');
  }
  setInterval(rideSkin,600);
})();
