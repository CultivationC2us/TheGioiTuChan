/* ============================================================
   TÚI TRỮ VẬT · NHÂN VẬT · TU LUYỆN — giao diện theo ảnh mẫu (khung cắt từ ui/mock.png, xem ui/extract_ui.py)
   - Ba bảng cùng một khung (rộng 548 "px thiết kế", co giãn bằng transform theo màn hình).
   - Túi chỉ chứa VẬT PHẨM. Bảng Nhân Vật (chỉ số) mở khi bấm avatar; bảng Tu Luyện mở khi bấm mũi tên ↑.
   - TTBag.openTab('T'|'R'|'S') = Túi | Tu Luyện | Nhân Vật.
   - ITEMS: KHÔNG BAO GIỜ đổi id vật phẩm đã phát hành.
   ============================================================ */
(function(){
'use strict';
var G=window.G;
var ITEMS={
  'Thủy Long Châu':{col:'#7fd8ff',glow:'#3aa9ff'},
  'lt':{col:'#e8f6ff',glow:'#6fd3ff'},
  'dp.tukhi':{col:'#ffffff',glow:'#b58cff'},
  'dan.tukhi':{col:'#b8f5a0',glow:'#2fbf5a'}
};
var DEF={col:'#ffe58f',glow:'#ffb347'};
var T=function(k,p){return I18N.t(k,p);};
function $(id){return document.getElementById(id);}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function U(n){return 'url(data:image/webp;base64,'+window.UIP[n]+')';}
function uimg(n,cls){var i=new Image();i.src='data:image/webp;base64,'+window.UIP[n];if(cls)i.className=cls;i.draggable=false;return i;}

/* ----- icon túi gấm 16x16 (nút túi cũ, ẩn; vẫn là cầu nối) ----- */
var PAL={o:'#2a1530',P:'#8a46b8',L:'#c58bf0',d:'#5a2a80',g:'#f2c14e',G:'#ffe58f',r:'#d9434f'};
var MAP=['................','....oo....oo....','...oPPo..oPPo...','...oPPPooPPPo...','....oPPPPPPo....','...ogGgrrgGgo...','..ooooooooooo...','.oPPPPPPPPPPPo..','oLLPPPPPPPPPPPo.','oLPPPPPGGPPPPPo.','oPPPPPGGGGPPPPo.','oPPPPPPGGPPPPPo.','oPPPPPPPPPPPPPo.','.oddPPPPPPPddo..','..ooddddddddoo..','....oooooooo....'];
function pouch(px){var c=document.createElement('canvas');c.width=c.height=16*px;var x=c.getContext('2d');
  for(var y=0;y<16;y++){var row=MAP[y];for(var i=0;i<16;i++){var ch=row.charAt(i);if(ch!=='.'){x.fillStyle=PAL[ch];x.fillRect(i*px,y*px,px,px);}}}
  c.style.imageRendering='pixelated';return c;}

/* ----- CSS (đơn vị = px thiết kế; cả bảng được scale) ----- */
var css=document.createElement('style');
css.textContent=
'#loot{display:none}'+
'.pn canvas{position:static!important;inset:auto!important;width:auto;height:auto}'+
'#chPort canvas{position:absolute!important;left:50%!important;bottom:34px!important}'+
'#bagBtn{display:none!important}'+
'.pn{position:fixed;inset:0;z-index:900;display:none;align-items:center;justify-content:center;background:#000b;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-user-select:none;user-select:none}'+
'.pn .pw{position:relative}'+
'.pn .pz{position:absolute;left:0;top:0;width:548px;transform-origin:0 0;color:#e8f0fb}'+
'.pn .pz *{box-sizing:border-box}'+
'.pn .pt{position:absolute;left:0;top:0;width:548px;height:86px;background-size:100% 100%}'+
'.pn .pm{position:absolute;left:0;right:0;top:85px;bottom:141px;background-size:100% 100%}'+
'.pn .pb{position:absolute;left:0;bottom:0;width:548px;height:142px;background-size:100% 100%;pointer-events:none}'+
'.pn .tas{position:absolute;left:0;top:86px;width:30px;height:92px;background-size:100% 100%;pointer-events:none}'+
'.pn h2{position:absolute;left:100px;top:18px;margin:0;font-size:32px;line-height:46px;font-weight:800;color:#fff;letter-spacing:.5px;text-shadow:0 2px 0 #0007,0 0 10px #0a2a4a}'+
'.pn .cap{position:absolute;right:90px;top:58px;font-size:17px;line-height:20px;font-weight:700;color:#9fb8d8;text-shadow:0 1px 2px #000}'+
'.pn .xb{position:absolute;right:16px;top:22px;width:62px;height:62px;padding:0;border:0;background:transparent;cursor:pointer;-webkit-tap-highlight-color:transparent}'+
'.pn .bd{position:absolute;left:22px;right:22px;top:98px;bottom:78px;display:flex;flex-direction:column;min-height:0}'+
/* thanh phân loại */
'#bagCats{display:flex;gap:10px;overflow-x:auto;padding:4px 2px 12px;flex:none;-webkit-overflow-scrolling:touch;scrollbar-width:none}#bagCats::-webkit-scrollbar{display:none}'+
'#bagCats button{flex:none;height:52px;padding:0 24px;font-size:22px;font-weight:700;color:#b9cbe2;border-radius:14px;border:2px solid #36587e;background:linear-gradient(#1d3556,#102340);box-shadow:inset 0 1px 0 #5b86b455,0 2px 4px #0006;cursor:pointer;white-space:nowrap}'+
'#bagCats button.on{color:#3a2208;border-color:#ffe9a8;background:linear-gradient(#ffe9a6,#f0b946 60%,#d99421);box-shadow:inset 0 2px 0 #fff8d8,0 0 14px #ffc85a88,0 2px 4px #0008}'+
'#bagStage{position:relative;flex:1;min-height:200px;overflow:hidden;border-top:2px solid #1b3550}'+
'#bagSc{position:absolute;inset:0;overflow-y:auto;-webkit-overflow-scrolling:touch}'+
'#bagStage .empty{position:absolute;left:0;right:0;top:36%;text-align:center;color:#7f9bbd;font-size:22px;line-height:1.5;padding:0 30px}'+
'#bagFl{display:grid;grid-template-columns:repeat(5,1fr);gap:6px 2px;padding:14px 0 18px}'+
'#bag .it{position:relative;height:104px;cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:16px;-webkit-tap-highlight-color:transparent}'+
'#bag .it.sel{background:radial-gradient(circle at 50% 45%,#3a5f8c66,transparent 72%);box-shadow:inset 0 0 0 2px #ffd97a}'+
'#bag .it .orb{position:relative;width:64px;height:64px;border-radius:50%}'+
'#bag .it .orb i{position:absolute;left:24%;top:18%;width:22%;height:22%;border-radius:50%;background:#fff;opacity:.85}'+
'#bag .it .orb.ic{width:auto;height:auto;border-radius:0;display:flex;align-items:center;justify-content:center}'+
'#bag .it .nm{display:none}'+
'#bag .it .n{position:absolute;right:6px;bottom:4px;min-width:34px;height:34px;border-radius:17px;background:#0b1626ee;border:2px solid #3f6794;color:#fff;font-size:20px;font-weight:800;line-height:30px;text-align:center;padding:0 6px}'+
'#bag .it .eq{position:absolute;left:6px;top:4px;font-size:18px;color:#ffd97a;font-weight:800;text-shadow:0 1px 2px #000}'+
'#bagInfo{flex:none;margin-top:8px;padding:14px 16px;border-radius:14px;background:linear-gradient(#0f2239,#0a172a);border:2px solid #284a70;font-size:21px;line-height:1.4;color:#c4d6ec;max-height:46%;overflow-y:auto}'+
'#bagInfo b{display:block;font-size:26px;color:#fff;margin-bottom:2px}'+
'#bagInfo .pl{margin-top:6px;font-size:20px;color:#ffe08a}'+
'#bagInfo .acts{display:flex;gap:10px;margin-top:12px}#bagInfo .acts.two{margin-top:8px}'+
'#bagInfo .acts button{flex:1;height:54px;padding:0 6px;font-size:20px;font-weight:700;line-height:1.1;border-radius:12px;border:2px solid #3b5f88;background:linear-gradient(#1f3a5e,#12263f);color:#e8f0fb;cursor:pointer}'+
'#bagInfo .acts button.mid{flex:1.5}'+
'#bagInfo .acts button.dr{border-color:#9b4d4d;color:#ffc4bb;background:linear-gradient(#3a1f25,#251218)}'+
'#bagInfo .acts button.us{color:#3a2208;border-color:#ffe9a8;background:linear-gradient(#ffe9a6,#f0b946 60%,#d99421)}'+
'#bagInfo .acts button[disabled]{opacity:.35}'+
/* bảng Tu Luyện / Nhân Vật: cuộn được */
'.pn .sc{flex:1;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch}'+
'.pn .parch{border-radius:12px;background:linear-gradient(#e9dfca,#d9cdb4);border:2px solid #b49c68;color:#2c2418;box-shadow:inset 0 0 0 2px #f4ecd8,inset 0 0 30px #b49c6855}'+
'.pn .card{border-radius:12px;background:linear-gradient(#142b45,#0c1c31);border:2px solid #2d5176;box-shadow:inset 0 0 0 1px #0a1626}'+
/* Tu Luyện */
'#tuScene{position:relative;height:300px;border-radius:12px;overflow:hidden;border:2px solid #3a5b80;flex:none}'+
'#tuScene img{width:100%;height:100%;object-fit:cover;display:block}'+
'#bagR{padding:12px 0 6px}'+
'#bagR .hint{font-size:20px;line-height:1.45;color:#5b4c2e;margin:2px 4px 10px}'+
'#bagR .er{display:flex;align-items:center;gap:12px;padding:10px 8px;border-bottom:1px solid #b9a77e}'+
'#bagR .er .el{width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;color:#1a1030;flex:none;border:2px solid #fff8}'+
'#bagR .er .mid{flex:1;min-width:0}'+
'#bagR .er .nm{font-size:21px;color:#2c2418;font-weight:700;display:flex;justify-content:space-between}'+
'#bagR .bar2{height:14px;border-radius:7px;background:#2a2418;border:2px solid #6b5a38;margin:5px 0 3px;overflow:hidden}'+
'#bagR .bar2 i{display:block;height:100%}'+
'#bagR .er small{font-size:17px;color:#6b5a38}'+
'#bagR .er button,#bagR .aw,#bagR .gold{cursor:pointer;font-weight:800;color:#3a2208;border:2px solid #7a5418;background:linear-gradient(#ffeaa0,#f0b83c 55%,#d38d1c);border-radius:12px;box-shadow:inset 0 2px 0 #fff6cf,0 3px 0 #8a5c18}'+
'#bagR .er button{height:50px;padding:0 16px;font-size:20px;flex:none}'+
'#bagR button[disabled]{opacity:.45;filter:grayscale(.5)}'+
'#bagR .aw{margin:14px auto 4px;display:block;width:78%;height:68px;font-size:30px}'+
'#bagR .done{margin:8px 4px;text-align:center;padding:12px;border-radius:12px;background:#f3ead4;border:2px solid #c3a968;color:#6b4a14;font-size:20px}'+
'#bagR .done b{display:block;font-size:32px;color:#2a1c06;margin:2px 0}'+
'#bagR .tips{margin:12px 6px 4px;font-size:20px;line-height:1.5;color:#4a3d24}#bagR .tips h4{margin:0 0 4px;font-size:23px;color:#2c2418}#bagR .tips li{margin-left:20px}'+
/* Nhân Vật */
'#chTop{position:relative;padding:14px 10px 12px;flex:none}'+
'.slot{position:absolute;width:84px;height:84px;border-radius:10px;background:radial-gradient(circle at 50% 40%,#1c3a5c,#0b1a2e);border:3px solid #c8a85a;box-shadow:inset 0 0 0 2px #0a1626,0 2px 4px #0006;display:flex;align-items:center;justify-content:center;cursor:default}'+
'.slot img,.slot canvas{max-width:56px;max-height:56px;image-rendering:pixelated}'+
'.slot.ph img{opacity:.32;filter:grayscale(.3)}'+
'.slot.wp{cursor:pointer}.slot.wp.has{box-shadow:inset 0 0 0 2px #0a1626,0 0 12px #ffd97a88}'+
'#chPort{position:relative;height:262px;margin:0 94px}'+
'#chPort .ped{position:absolute;left:50%;bottom:6px;width:230px;height:56px;margin-left:-115px;border-radius:50%;background:radial-gradient(ellipse,#8aa6c4 0%,#546e8c 55%,#2c3e55 100%);box-shadow:0 0 30px #7fc8ff99,inset 0 4px 0 #b9d0e8}'+
'#chPort .aura{position:absolute;left:50%;bottom:30px;width:240px;height:240px;margin-left:-120px;border-radius:50%;background:radial-gradient(circle,#9fdcff66,#6fb8ff22 55%,transparent 72%)}'+
'#chPort canvas{transform:translateX(-50%);image-rendering:pixelated}'+
'#chName{text-align:center;font-size:26px;font-weight:800;color:#2c2418;margin-top:2px}'+
'#chBar{position:relative;height:28px;margin:6px 70px 0;border-radius:14px;border:3px solid #1b3550;background:#0b1a2c;overflow:hidden}'+
'#chBar i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(#9bf0ff,#25b6f5 55%,#0b78d0)}'+
'#chBar span{position:absolute;left:0;right:0;top:0;line-height:22px;text-align:center;font-size:18px;font-weight:800;color:#fff;text-shadow:0 1px 2px #000}'+
'#chStats{margin-top:12px;padding:14px 18px 8px}'+
'#chStats h3{margin:0 0 6px;font-size:26px;color:#fff;font-weight:800}#chStats h3:before{content:"✦";color:#ffd97a;margin-right:10px}'+
'#bagS .row2{display:flex;align-items:center;gap:14px;height:62px;border-top:1px solid #2a4663}'+
'#bagS .row2 img{width:44px;height:44px;flex:none;image-rendering:pixelated}'+
'#bagS .row2 .lb{flex:none;width:176px;font-size:23px;color:#e3eefc}'+
'#bagS .row2 .vv{flex:1;text-align:right;font-size:25px;font-weight:800;color:#fff}'+
'#bagS .row2 .bw{flex:1;position:relative}#bagS .row2 .bw em{display:block;text-align:right;font-style:normal;font-size:20px;font-weight:700;color:#fff;margin-bottom:2px}'+
'#bagS .row2 .tr{height:12px;border-radius:6px;background:#091522;border:1px solid #2a4663;overflow:hidden}#bagS .row2 .tr i{display:block;height:100%}'+
'#bagS .row{display:flex;justify-content:space-between;gap:12px;font-size:21px;padding:9px 4px;border-top:1px solid #2a4663;color:#cfe0f5}'+
'#bagS .row b{color:#fff;text-align:right}'+
'#bagS h3.dt{margin:18px 0 4px;font-size:24px;color:#ffe08a}';
document.head.appendChild(css);

/* ----- khung bảng ----- */
var panels={};
function mkPanel(id,title,xid){
  var el=document.createElement('div');el.id=id;el.className='pn';
  var pz=document.createElement('div');pz.className='pz';
  pz.innerHTML='<div class="pm"></div><div class="pt"></div><div class="pb"></div><div class="tas"></div>'+
    '<h2></h2><span class="cap"></span><button type="button" class="xb" id="'+xid+'" aria-label="×"></button><div class="bd"></div>';
  pz.querySelector('.pt').style.backgroundImage=U('p_top');pz.querySelector('.pm').style.backgroundImage=U('p_mid');
  pz.querySelector('.pb').style.backgroundImage=U('p_bot');pz.querySelector('.tas').style.backgroundImage=U('p_tassel');
  var wrap=document.createElement('div');wrap.className='pw';wrap.appendChild(pz);el.appendChild(wrap);document.body.appendChild(el);
  var h2=pz.querySelector('h2');h2.setAttribute('data-i18n',title);
  var p={el:el,pz:pz,wrap:wrap,bd:pz.querySelector('.bd'),cap:pz.querySelector('.cap'),x:$(xid)};panels[id]=p;
  el.addEventListener('pointerdown',function(e){if(e.target===el)closeAll();});
  p.x.onclick=closeAll;
  return p;
}
function fit(p){
  var iw=window.innerWidth,ih=window.innerHeight,s=Math.min((iw-10)/548,1.25),H=Math.floor((ih-24)/s);
  H=Math.max(560,Math.min(H,1500));
  p.pz.style.transform='scale('+s+')';p.pz.style.height=H+'px';
  p.wrap.style.width=Math.round(548*s)+'px';p.wrap.style.height=Math.round(H*s)+'px';
}
window.addEventListener('resize',function(){for(var k in panels)if(panels[k].el.style.display==='flex')fit(panels[k]);});

var pBag=mkPanel('bag','bag.title','bagX'),pCh=mkPanel('chPan','ui.char','chX'),pTu=mkPanel('tuPan','ui.tu','tuX');
pBag.cap.id='bagCap';
pBag.bd.innerHTML='<div id="bagCats"></div><div id="bagStage"><div id="bagSc"><div id="bagFl"></div></div><div class="empty" id="bagEmpty" data-i18n-html="bag.empty"></div></div><div id="bagInfo"></div>';
pTu.bd.innerHTML='<div class="sc"><div id="tuScene"></div><div id="bagR" class="parch" style="margin-top:12px"></div></div>';
pCh.bd.innerHTML='<div class="sc"><div class="parch" id="chTop"></div><div class="card" id="chStats"><div id="bagS"></div></div></div>';
$('tuScene').appendChild(uimg('tu_scene'));

/* nút túi cũ (ẩn, cầu nối với HUD/test) */
var btn=document.createElement('button');btn.id='bagBtn';btn.type='button';btn.setAttribute('aria-label',I18N.t('bag.title'));
btn.appendChild(pouch(3));var cnt=document.createElement('span');cnt.className='cnt';cnt.style.display='none';btn.appendChild(cnt);document.body.appendChild(btn);

/* ----- lò luyện đan (đan phương) ----- */
var alc=document.createElement('div');alc.id='alc';
alc.style.cssText='position:fixed;inset:0;z-index:950;display:none;align-items:center;justify-content:center;background:#000c;padding:14px;box-sizing:border-box';
alc.innerHTML='<div style="width:100%;max-width:340px;background:linear-gradient(#1b1236,#0b0818);border:1px solid #6b4a9a;border-radius:18px;padding:14px;color:#efe6ff"><h3 id="alcT" style="margin:0 0 8px;font-size:16px"></h3><div id="alcB"></div></div>';
document.body.appendChild(alc);
var alcR='',alcI=0;var cs=document.createElement('style');cs.textContent='#alc button{padding:9px 6px;border-radius:10px;border:1px solid #6b4a9a;background:#241a45;color:#fff;font-size:13px}#alc button[disabled]{opacity:.4}#alc .opts{display:flex;flex-direction:column;gap:5px;max-height:34vh;overflow-y:auto;margin-bottom:8px}#alc .opts button{text-align:left;display:flex;justify-content:space-between;gap:8px;padding:8px 10px;font-size:12.5px}#alc .opts button.on{background:#6b3fb4;border-color:#ffe58f}';document.head.appendChild(cs);
function openAlc(rid){alcR=rid;alcI=0;alc.style.display='flex';renderAlc();}
function ingLabel(k){if(k==='@herb1')return T('alc.herb1');if(k.indexOf('@mat:')===0){var p=k.split(':');return T('alc.mat',{el:T('el.'+p[1]),t:p[2]});}return I18N.itemName(k);}
function renderAlc(){
  var R=G.TD.RECIPES[alcR];if(!R)return;var forge=R.verb==='forge',r=R.list[alcI]||R.list[0],mx=G.craftMax(alcR,alcI),h='';
  $('alcT').textContent=I18N.itemName(alcR)+' · '+T(forge?'alc.forge':'alc.title');
  if(R.list.length>1){h+='<div style="font-size:12px;color:#a999d0;margin-bottom:5px">'+esc(T('alc.pick'))+'</div><div class="opts">';
    R.list.forEach(function(o,i){var w=G.TD.byWeapon[o.out],can=G.craftMax(alcR,i)>0;h+='<button type="button" data-i="'+i+'" class="'+(i===alcI?'on':'')+'"><span style="color:'+(w?elOf(w.el).c:'#fff')+'">'+esc(I18N.itemName(o.out))+'</span><span style="color:'+(can?'#9bf0a8':'#8f7fbd')+'">'+(w?'+'+w.atk:'')+(can?' ✓':'')+'</span></button>';});h+='</div>';}
  r.ing.forEach(function(g){var have=G.ingHave(g[0]);h+='<div class="row" style="display:flex;justify-content:space-between;gap:8px;padding:7px 0;border-bottom:1px solid #2a1f4d;font-size:13px"><span>'+esc(ingLabel(g[0]))+' ×'+g[1]+'</span><b style="color:'+(have>=g[1]?'#9bf0a8':'#ff9b8a')+'">'+esc(T('alc.have',{n:have}))+'</b></div>';});
  var wo=G.TD.byWeapon[r.out];
  h+='<div style="margin:9px 0;font-size:12.5px;color:#cbbbee">'+esc(wo?T('alc.outw',{name:I18N.itemName(r.out),atk:wo.atk}):T('alc.out',{name:I18N.itemName(r.out),eff:'+'+G.TD.DAN[r.out].qi+' '+T('realm.exp')}))+'<br>'+esc(T('alc.keep'))+'</div>'+
   '<div style="display:flex;gap:6px"><button type="button" id="alcX" style="flex:1">'+esc(T('bag.close'))+'</button><button type="button" id="alcM" style="flex:1.2;background:#6b3fb4;border-color:#c58bf0"'+(mx>0?'':' disabled')+'>'+esc(T(forge?'alc.forge':'alc.make'))+'</button><button type="button" id="alcA" style="flex:1.4"'+(mx>1?'':' disabled')+'>'+esc(T(forge?'alc.forgeall':'alc.makeall',{n:mx}))+'</button></div>';
  $('alcB').innerHTML=h;
  var ob=$('alcB').querySelectorAll('.opts button');for(var q=0;q<ob.length;q++)ob[q].onclick=function(){alcI=+this.getAttribute('data-i');renderAlc();};
  $('alcX').onclick=function(){alc.style.display='none';lastKeys='';refresh();};
  $('alcM').onclick=function(){G.craft(alcR,1,alcI);afterAlc();};
  $('alcA').onclick=function(){G.craft(alcR,mx,alcI);afterAlc();};
}
function afterAlc(){lastKeys='';renderAlc();refresh();if(window.TT&&TT.push)TT.push(false,false);}


var CATS=['all','duoc','vl','dan','pp','vk','tb','mount','pet'],cat='all';
var sel='',tab='T',tmr=0,lastKeys='',rootSig='',chSig='';
function elOf(id){var E=G.TD.EL;for(var i=0;i<E.length;i++)if(E[i].id===id)return E[i];return E[0];}
function renderCats(){
  var h='';CATS.forEach(function(c){h+='<button type="button" data-c="'+c+'" class="'+(c===cat?'on':'')+'">'+esc(T('cat.'+c))+'</button>';});
  var el=$('bagCats');if(el.dataset.l!==h){var sx=el.scrollLeft;el.innerHTML=h;el.dataset.l=h;el.scrollLeft=sx;var bs=el.querySelectorAll('button');for(var i=0;i<bs.length;i++)bs[i].onclick=function(){cat=this.getAttribute('data-c');lastKeys='';sel='';renderStage();};}
}
function renderStage(){
  renderCats();
  var l=G.loot,k=Object.keys(l).filter(function(n){return l[n]>0&&(cat==='all'||G.TD.catOf(n)===cat);}),st=$('bagStage');
  if(cat==='pet'){k=[];}
  var sig=cat+'#'+k.map(function(n){return n+':'+l[n]+(G.cult.eq.w===n||G.cult.eq.o===n?'E':'')+(G.P.mt===n?'M':'');}).join('|')+(cat==='pet'?G.PETS.join(','):'');
  var none=cat==='pet'?!G.PETS.length:!k.length;
  var em=$('bagEmpty');em.style.display=none?'block':'none';
  if(none){if(cat==='all')em.setAttribute('data-i18n-html','bag.empty'),I18N.apply(em);else{em.removeAttribute('data-i18n-html');em.textContent=T(cat==='tb'||cat==='mount'||cat==='pet'?'cat.empty.'+cat:'cat.empty');}}
  pBag.cap.textContent=T('bag.cap2',{n:G.bagUsed(),cap:G.BAG().cap});
  if(sig===lastKeys)return;lastKeys=sig;
  var fl=$('bagFl');fl.innerHTML='';
  if(cat==='pet'){G.PETS.forEach(function(id){var pe=elOf((G.TD.MONS.filter(function(m){return m.id===id;})[0]||{}).el||'moc'),e=document.createElement('div');e.className='it';
    e.innerHTML='<div class="orb" style="background:radial-gradient(circle at 35% 30%,#fff,'+pe.c+' 42%,'+pe.c+'88);box-shadow:0 0 16px '+pe.c+'"><i></i></div><div class="nm">'+esc(T('monster.'+id))+'</div>';fl.appendChild(e);});}
  k.forEach(function(n){
    var it=ITEMS[n]||DEF,rs=G.TD&&G.TD.byItem[n],pb=G.TD&&G.TD.byPearl[n],e=document.createElement('div');
    if(pb){var pp=G.TD.PEARL[pb.el];it={col:pp.col,glow:pp.glow,tier:pb.tier};}
    e.className='it'+(sel===n?' sel':'');e.dataset.n=n;
    var wp=G.TD.byWeapon[n],icn=(!pb)&&G.iconCanvas(n,3);
    var badge=l[n]>1?'<span class="n">'+l[n]+'</span>':'';
    var mark=(G.cult.eq.w===n||G.cult.eq.o===n||G.P.mt===n)?'<span class="eq">✓</span>':'';
    if(icn){var ec=rs?elOf(rs.el).c:wp?elOf(wp.el).c:(it.glow||'#ffe58f');
      e.innerHTML='<div class="orb ic" style="filter:drop-shadow(0 0 5px '+ec+'aa)"></div>'+badge+mark+'<div class="nm">'+esc(I18N.itemName(n))+'</div>';
      icn.style.cssText='display:block;max-width:80px;max-height:80px;width:auto;height:auto;image-rendering:pixelated';e.firstChild.appendChild(icn);}
    else e.innerHTML='<div class="orb" style="background:radial-gradient(circle at 35% 30%,#fff,'+it.col+' 38%,'+it.glow+');box-shadow:0 0 14px '+it.glow+',0 0 30px '+it.glow+'66'+(it.tier===2?',inset 0 0 0 3px #ffe58f':it.tier===3?',inset 0 0 0 2px #fff,inset 0 0 0 5px '+it.glow:'')+'"><i></i></div>'+badge+mark+'<div class="nm">'+esc(I18N.itemName(n))+'</div>';
    e.onclick=function(){sel=n;showInfo();var all=st.querySelectorAll('.it');for(var j=0;j<all.length;j++)all[j].className='it'+(all[j].dataset.n===sel?' sel':'');};
    fl.appendChild(e);
  });
  if(sel&&!l[sel])sel='';
  showInfo();
}
function showInfo(){
  var l=G.loot,box=$('bagInfo');
  if(!sel||!l[sel]){box.textContent=T('bag.tap');return;}
  var inf=G.itemInfo(sel),sg=sel,pi=inf.pearl,ps='',sz=G.itemSize(sel),wpn=G.TD.byWeapon[sel],mtd=G.TD.byMount[sel];
  if(wpn)ps='<div class="pl">'+esc(T('wp.stat',{t:T('wtier.'+wpn.tier),atk:wpn.atk,el:T('el.'+wpn.el)}))+(inf.equipped?' — '+esc(T('wp.on')):'')+'</div>';
  if(G.TD.byOutfit[sel]){var od=G.TD.byOutfit[sel];ps='<div class="pl">'+esc(T('of.stat',{def:od.def,el:T('el.'+od.el)}))+(inf.equipped?' — '+esc(T('wp.on')):'')+'</div>';}
  if(mtd)ps='<div class="pl">'+esc(T('mt.stat',{run:String(mtd.spd).replace('.',I18N.lang==='vi'?',':'.'),fly:String(mtd.fspd).replace('.',I18N.lang==='vi'?',':'.'),el:T('el.'+mtd.el)}))+(inf.mounted?' — '+esc(T('act.unride')):'')+'</div>';
  if(pi){ps='<div class="pl">'+esc(T('pl.status',{t:pi.tier,n:pi.done,cap:pi.cap}))+(pi.reason?' — '+esc(T('pl.'+pi.reason,{cap:pi.cap})):'')+'</div>';}
  box.innerHTML='<b>'+esc(I18N.itemName(sel))+' ×'+l[sel]+'</b>'+esc(I18N.itemDesc(sel))+'<div class="pl" style="color:#9fc4e0">'+esc(sz?T('bag.size',{s:sz}):T('bag.size0'))+'</div>'+ps+
    '<div class="acts"><button type="button" class="dr" id="biDr"'+(inf.keep?' disabled':'')+'>'+esc(T('act.drop'))+'</button>'+
    '<button type="button" class="mid" id="biDec"'+(inf.dec>0?'':' disabled')+'>'+esc(T('act.dec',{n:inf.dec}))+'</button>'+
    '<button type="button" class="us" id="biUse"'+(inf.use?'':' disabled')+'>'+esc(T(inf.weapon?(inf.equipped?'act.unequip':'act.equip'):inf.mount?(inf.mounted?'act.unride':'act.ride'):inf.recipe?'act.open':'act.use'))+'</button></div>'+
    (inf.fuse?'<div class="acts two"><button type="button" class="mid" id="biFuse"'+((l[sel]|0)>=G.TD.PFUSE?'':' disabled')+'>'+esc(T('act.fuse',{n:G.TD.PFUSE,name:I18N.itemName(pi.next)}))+'</button></div>':'');
  function after(){lastKeys='';refresh();if(window.TT&&TT.push)TT.push(false,false);}
  $('biDr').onclick=function(){G.dropItem(sg);after();};
  $('biDec').onclick=function(){G.decompose(sg);after();};
  $('biUse').onclick=function(){if(inf.recipe){openAlc(sg);return;}G.useItem(sg);after();};
  if($('biFuse'))$('biFuse').onclick=function(){G.fuse(sg);after();};
}

/* ----- Tu Luyện ----- */
function matCount(el){var n=0;G.TD.RES.forEach(function(g){if(g.el===el)n+=G.loot[g.item]|0;});return n;}
function renderRoot(force){
  var C=G.cult,N=G.TD.NEED,sig=G.TD.EL.map(function(e){return C.r[e.id]+':'+matCount(e.id);}).join('|')+(C.aw?'A'+C.rl+':'+G.P.maxHp+':'+G.S.dmg+':'+G.S.spd:G.canAwake()?'C':'-')+I18N.lang;
  if(!force&&sig===rootSig){var q=$('rootQi');if(q)q.textContent=Math.floor(C.qi);var br=$('rootBr');if(br)br.disabled=!(C.qi>=G.realmNeed(C.rl));var qb=$('rootQb');if(qb&&C.aw&&C.rl<G.TD.REALM.max)qb.style.width=Math.min(100,C.qi/G.realmNeed(C.rl)*100)+'%';return;}
  rootSig=sig;var h='<div class="hint">'+esc(T('cul.hint',{n:N}))+'</div>';
  G.TD.EL.forEach(function(e){
    var v=C.r[e.id],m=matCount(e.id),full=v>=N;
    h+='<div class="er"><div class="el" style="background:'+e.c+';box-shadow:0 0 10px '+e.c+'88">'+esc(T('el.'+e.id))+'</div><div class="mid"><div class="nm"><span>'+esc(T('el.'+e.id))+'</span><span>'+v+' / '+N+'</span></div><div class="bar2"><i style="width:'+Math.min(100,v/N*100)+'%;background:'+e.c+'"></i></div><small>'+esc(T('cul.mat',{n:m}))+'</small></div>'+
       '<button type="button" data-el="'+e.id+'"'+((full||!m)?' disabled':'')+'>'+esc(full?T('cul.full'):T('cul.refine'))+'</button></div>';
  });
  if(C.aw){
    var nd=G.realmNeed(C.rl),mx=C.rl>=G.TD.REALM.max,pc=mx?100:Math.min(100,C.qi/nd*100),ready=!mx&&C.qi>=nd;
    h+='<div class="done"><span>'+esc(T('realm.cur'))+'</span><b>'+esc(T('realm.n',{n:C.rl}))+'</b>'+
      (mx?esc(T('realm.full')):'<div class="bar2" style="margin:8px 30px"><i id="rootQb" style="width:'+pc+'%;background:linear-gradient(#9bf0ff,#25b6f5)"></i></div><span id="rootQi">'+Math.floor(C.qi)+'</span> / '+nd+' '+esc(T('realm.exp'))+
        '<br><span style="color:#8a6a2a;font-size:18px">'+esc(T('cul.rate',{n:(I18N.lang==='vi'?G.qiRate().toFixed(2).replace('.',','):G.qiRate().toFixed(2))}))+'</span>')+'</div>';
    if(!mx)h+='<button type="button" class="aw" id="rootBr"'+(ready?'':' disabled')+'>'+esc(T('act.break',{n:C.rl+1}))+'</button>';
    h+='<div class="tips"><span style="font-size:18px;color:#6b5a38">'+esc(T('realm.bonus',{m:'1,2'.replace(',',I18N.lang==='vi'?',':'.')}))+'</span></div>';
  }
  else h+='<button type="button" class="aw" id="rootAw"'+(G.canAwake()?'':' disabled')+'>'+esc(G.canAwake()?T('cul.awake'):T('cul.need',{n:N}))+'</button>';
  h+='<div class="tips"><h4>? '+esc(T('ui.hint'))+'</h4><ul style="margin:0;padding:0"><li>'+esc(T('ui.h1'))+'</li><li>'+esc(T('ui.h2'))+'</li><li>'+esc(T('ui.h3'))+'</li></ul></div>';
  $('bagR').innerHTML=h;
  var b=$('bagR').querySelectorAll('button[data-el]');
  for(var i=0;i<b.length;i++)b[i].onclick=function(){G.refineEl(this.getAttribute('data-el'));renderRoot(true);updBadge();if(window.TT&&TT.push)TT.push(false,false);};
  var rb=$('rootBr');if(rb)rb.onclick=function(){if(G.breakthrough()){renderRoot(true);if(window.TT&&TT.push)TT.push(false,false);}};
  var a=$('rootAw');if(a)a.onclick=function(){if(G.awaken()){renderRoot(true);if(window.TT&&TT.push)TT.push(false,false);}};
}

/* ----- Nhân Vật ----- */
function portrait(cv,rows,sc){ /* sprite nhân vật đứng, cắt hàng 1..rows của lưới 40x51 */
  if(G.OF&&G.OF.on()&&G.IMG.outfit.complete){G.OF.portrait(cv,Math.round(sc*.9),6,16,68,72);return;}
  var im=G.IMG.player;cv.width=40*sc;cv.height=rows*sc;var x=cv.getContext('2d');x.imageSmoothingEnabled=false;x.clearRect(0,0,cv.width,cv.height);
  if(im&&im.complete)x.drawImage(im,14,22,40,rows,0,0,40*sc,rows*sc);
}
function slotHtml(cls,style){return '<div class="slot '+cls+'" style="'+style+'"></div>';}
function buildChTop(){
  var top=$('chTop');top.innerHTML='';
  var L=[['sl_wp',16,16],['sl_ring',16,116],['sl_boot',16,216]],R=[['sl_head',420,16],['sl_body',420,116],['sl_belt',420,216]];
  L.concat(R).forEach(function(s){var d=document.createElement('div');d.className='slot ph';d.style.left=s[1]+'px';d.style.top=(s[2]+14)+'px';d.dataset.k=s[0];d.appendChild(uimg(s[0]));top.appendChild(d);});
  var pt=document.createElement('div');pt.id='chPort';pt.innerHTML='<div class="aura"></div><div class="ped"></div>';var cv=document.createElement('canvas');pt.appendChild(cv);top.appendChild(pt);
  var nm=document.createElement('div');nm.id='chName';top.appendChild(nm);
  var br=document.createElement('div');br.id='chBar';br.innerHTML='<i></i><span></span>';top.appendChild(br);
  top.querySelector('.slot[data-k="sl_wp"]').onclick=function(){if(G.cult.eq.w){G.equipToggle(G.cult.eq.w);chSig='';refresh();if(window.TT&&TT.push)TT.push(false,false);}};
  portrait(cv,51,4);cv.style.width=(cv.width)+'px';
}
function updChTop(){
  var top=$('chTop');if(!top.firstChild)buildChTop();
  var C=G.cult,w=top.querySelector('.slot[data-k="sl_wp"]'),eqw=C.eq.w;
  if(w.dataset.w!==String(eqw)){w.dataset.w=String(eqw);w.innerHTML='';
    if(eqw){var c=G.iconCanvas(eqw,3);if(c){c.style.cssText='max-width:62px;max-height:62px;image-rendering:pixelated;display:block';w.appendChild(c);}w.className='slot wp has';}
    else{w.appendChild(uimg('sl_wp'));w.className='slot wp ph';}}
  var oSig=String(C.eq.o);if(top.dataset.o!==oSig){top.dataset.o=oSig;var cvp=$('chPort').querySelector('canvas');portrait(cvp,51,4);cvp.style.width=cvp.width+'px';
    ['sl_head','sl_body','sl_boot'].forEach(function(k){var sd=top.querySelector('.slot[data-k="'+k+'"]');sd.innerHTML='';if(C.eq.o){var c=G.OF.icon(6,k==='sl_head'?'head':k==='sl_body'?'torso':'boot');if(c){c.style.cssText='max-width:62px;max-height:62px;display:block';sd.appendChild(c);}sd.className='slot';}else{sd.appendChild(uimg(k));sd.className='slot ph';}});}
  $('chName').textContent=C.aw?T('realm.n',{n:C.rl}):T('j.asleep');
  var b=$('chBar'),nd=G.realmNeed(C.rl),mx=C.rl>=G.TD.REALM.max;
  b.firstChild.style.width=(C.aw?(mx?100:Math.min(100,C.qi/nd*100)):0)+'%';
  b.lastChild.textContent=C.aw?(T('realm.exp')+' '+Math.floor(C.qi)+(mx?'':' / '+nd)):T('hud.asleep');
}
function renderStats(){
  var P=G.P,S=G.S,C=G.cult,N=I18N.lang==='vi'?function(x){return String(x).replace('.',',');}:function(x){return String(x);};
  updChTop();
  function row(a,b){return '<div class="row"><span>'+T(a)+'</span><b>'+b+'</b></div>';}
  function r2(ic,lb,val){return '<div class="row2"><img src="data:image/webp;base64,'+window.UIP[ic]+'"><span class="lb">'+esc(lb)+'</span><span class="vv">'+val+'</span></div>';}
  function rb(ic,lb,txt,pc,col){return '<div class="row2"><img src="data:image/webp;base64,'+window.UIP[ic]+'"><span class="lb">'+esc(lb)+'</span><div class="bw"><em>'+txt+'</em><div class="tr"><i style="width:'+Math.max(0,Math.min(100,pc))+'%;background:'+col+'"></i></div></div></div>';}
  var cd=470/(1+S.spd),m=G.realmMul(),nd=C.rl>=G.TD.REALM.max?0:G.realmNeed(C.rl);
  var pl=G.TD.EL.map(function(e){return '<div class="row"><span style="color:'+e.c+'">'+T('el.'+e.id)+'</span><b>'+C.pl[e.id].map(function(n){return n+'/'+G.TD.PCAP;}).join(' · ')+'</b></div>';}).join('');
  var pets=G.PETS.length?G.PETS.map(function(id){return esc(T('monster.'+id));}).join(', '):T('sx.none');
  $('bagS').innerHTML='<h3 style="margin:0 0 6px;font-size:26px;color:#fff;font-weight:800"><span style="color:#ffd97a;margin-right:10px">✦</span>'+esc(T('ui.stats'))+'</h3>'+
   rb('st_hp',T('sx.hp'),Math.round(P.hp)+' / '+P.maxHp,P.hp/P.maxHp*100,'linear-gradient(#ff7b7b,#d02a2a)')+
   rb('st_qi',T('realm.exp'),C.aw?(Math.floor(C.qi)+(nd?' / '+nd:'')):T('j.asleep'),C.aw&&nd?C.qi/nd*100:(C.aw?100:0),'linear-gradient(#9bf0ff,#25b6f5)')+
   r2('st_atk',T('sx.atk'),Math.round((7+S.dmg+G.wAtk())*m)+' – '+Math.round((12+S.dmg+G.wAtk())*m))+
   r2('st_def',T('sx.def'),G.defVal())+
   r2('st_spd',T('sx.spd'),T('sx.spd.v',{n:N((1000/cd).toFixed(2))}))+
   r2('st_rng',T('sx.red'),N((S.red*100).toFixed(1))+'%')+
   '<h3 class="dt">'+esc(T('ui.detail'))+'</h3>'+
   row('sx.realm',esc(T('realm.n',{n:C.rl}))+' (×'+N(m.toFixed(2))+')')+
   row('sx.dmg',Math.round((7+S.dmg+G.wAtk())*m)+' – '+Math.round((12+S.dmg+G.wAtk())*m))+
   row('sx.weapon',C.eq.w?esc(I18N.itemName(C.eq.w)):T('sx.noweapon'))+
   row('sx.qi',C.aw?T('sx.qi.v',{n:N(G.qiRate().toFixed(2))}):T('j.asleep'))+
   row('sx.qitotal',Math.floor(C.qi)+' / '+(C.rl>=G.TD.REALM.max?'MAX':G.realmNeed(C.rl)))+
   row('sx.roots',G.TD.EL.map(function(e){return T('el.'+e.id)+' '+C.r[e.id];}).join(' · '))+
   '<div class="row" style="border-top:1px solid #2a4663"><span>'+T('sx.pearls')+'</span></div>'+pl+
   row('sx.pets',pets)+row('sx.kills',G.stats.kills)+row('sx.lt',G.loot.lt|0);
}
function refresh(){if(tab==='T')renderStage();else if(tab==='R')renderRoot();else if(tab==='S')renderStats();updBadge();}
function updBadge(){var n=Object.keys(G.loot).filter(function(k){return G.loot[k]>0;}).length;cnt.textContent=n;cnt.style.display=n?'block':'none';}
function closeAll(){for(var k in panels)panels[k].el.style.display='none';clearInterval(tmr);}
function show(t){
  closeAll();tab=t;var p=t==='T'?pBag:t==='R'?pTu:pCh;
  p.el.style.display='flex';fit(p);lastKeys='';rootSig='';
  if(t==='S')buildChTop();
  refresh();I18N.apply(p.el);tmr=setInterval(refresh,1000);
}
function open(){show(tab==='R'||tab==='S'?'T':tab);}
btn.onclick=function(){show('T');};
setInterval(function(){if(btn.style.display!=='none')updBadge();},1500);
I18N.apply(document.body);
/* cầu nối cho test cũ: #tabT/#tabR/#tabS (ẩn) */
['T','R','S'].forEach(function(t){var b=document.createElement('button');b.id='tab'+t;b.type='button';b.style.display='none';b.onclick=function(){show(t);};document.body.appendChild(b);});
I18N.on(function(){btn.setAttribute('aria-label',I18N.t('bag.title'));for(var k in panels)I18N.apply(panels[k].el);lastKeys='';rootSig='';refresh();});
window.TTBag={show:function(v){var ab=document.getElementById('autoBtn');if(ab)ab.style.display=v?'block':'none';btn.style.display=v?'flex':'none';if(!v)closeAll();else updBadge();},open:open,close:closeAll,openTab:function(t){show(t);},select:function(n){sel=n;}};
})();
