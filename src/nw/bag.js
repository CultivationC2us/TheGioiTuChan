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
function U(n){return 'url(data:image/png;base64,'+window.UIP[n]+')';}
function PNG(n){return 'data:image/png;base64,'+window.UIP[n];}
function uimg(n,cls){var i=new Image();i.src=PNG(n);if(cls)i.className=cls;i.draggable=false;return i;}

/* ----- icon túi gấm 16x16 (nút túi cũ, ẩn; vẫn là cầu nối) ----- */
var PAL={o:'#2a1530',P:'#8a46b8',L:'#c58bf0',d:'#5a2a80',g:'#f2c14e',G:'#ffe58f',r:'#d9434f'};
var MAP=['................','....oo....oo....','...oPPo..oPPo...','...oPPPooPPPo...','....oPPPPPPo....','...ogGgrrgGgo...','..ooooooooooo...','.oPPPPPPPPPPPo..','oLLPPPPPPPPPPPo.','oLPPPPPGGPPPPPo.','oPPPPPGGGGPPPPo.','oPPPPPPGGPPPPPo.','oPPPPPPPPPPPPPo.','.oddPPPPPPPddo..','..ooddddddddoo..','....oooooooo....'];
function pouch(px){var c=document.createElement('canvas');c.width=c.height=16*px;var x=c.getContext('2d');
  for(var y=0;y<16;y++){var row=MAP[y];for(var i=0;i<16;i++){var ch=row.charAt(i);if(ch!=='.'){x.fillStyle=PAL[ch];x.fillRect(i*px,y*px,px,px);}}}
  c.style.imageRendering='pixelated';return c;}

/* ----- CSS (đơn vị = px thiết kế; cả bảng được scale) ----- */
var css=document.createElement('style');
/* Mọi khung/nút/biểu tượng vẽ bằng pixel (pix/pixui.py). 1 ô pixel = 2 css px → image-rendering:pixelated */
function BI(n,sl,w){return 'border-image:'+U(n)+' '+sl+' fill/'+w+'px stretch;image-rendering:pixelated;';}
css.textContent=
'#loot{display:none}'+
'.pn canvas{position:static!important;inset:auto!important;width:auto;height:auto}'+
'#chPort canvas{position:absolute!important;left:50%!important;bottom:8px!important;transform:translateX(-50%)}'+
'#bagBtn{display:none!important}'+
'.pn{position:fixed;inset:0;z-index:900;display:none;align-items:center;justify-content:center;background:#000b;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-user-select:none;user-select:none;color:#e8f0fb}'+
'.pn *{box-sizing:border-box}'+
'.pn .pf{position:relative;border:24px solid transparent;border-image:'+U('panel9')+' 12/24px stretch;image-rendering:pixelated;'+'background:'+U('bgtile')+' 0 0/24px;background-clip:padding-box;image-rendering:pixelated;display:flex;flex-direction:column}'+
'.pn .hd{position:relative;height:40px;flex:none;margin:-10px 0 0 20px}'+
'.pn .md{position:absolute;left:-52px;top:-30px;width:48px;height:48px;image-rendering:pixelated}'+
'.pn .ts{position:absolute;left:-40px;top:20px;width:16px;height:44px;image-rendering:pixelated}'+
'.pn h2{position:absolute;left:0;top:0;margin:0;font-size:20px;line-height:26px;font-weight:900;color:#ffe9a8;letter-spacing:.5px;text-shadow:2px 0 #070b16,-2px 0 #070b16,0 2px #070b16,0 -2px #070b16,2px 2px #070b16}'+
'.pn .cap{position:absolute;left:0;top:24px;font-size:10px;line-height:12px;font-weight:700;color:#7be0c6;text-shadow:1px 1px #070b16}'+
'.pn .xb{position:absolute;right:-30px;top:-32px;width:28px;height:28px;padding:0;border:0;background:'+U('xbtn')+' 0 0/100% 100% no-repeat;image-rendering:pixelated;cursor:pointer;-webkit-tap-highlight-color:transparent}'+
'.pn .xb:active{transform:translateY(2px)}'+
'.pn .bd{flex:1;min-height:0;display:flex;flex-direction:column;margin-top:2px}'+
'#bagCats{display:flex;gap:4px;overflow-x:auto;padding:0 0 6px;flex:none;-webkit-overflow-scrolling:touch;scrollbar-width:none}#bagCats::-webkit-scrollbar{display:none}'+
'#bagCats button{flex:none;height:26px;padding:0 6px;font-size:11px;font-weight:800;color:#9fb8d8;border:8px solid transparent;'+BI('tab','4',8)+'background:none;cursor:pointer;white-space:nowrap;line-height:10px;margin:-2px 0}'+
'#bagCats button.on{color:#3a2208}#bagCats button.on{'+BI('tab_on','4',8)+'}'+
'#bagStage{position:relative;flex:1;min-height:60px;overflow:hidden;border:8px solid transparent;'+BI('card','4',8)+'}'+
'#bagSc{position:absolute;inset:0;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;padding:2px}'+
'#bagStage .empty{position:absolute;left:0;right:0;top:30%;text-align:center;color:#6e88aa;font-size:11px;line-height:1.5;padding:0 14px}'+
'#bagFl{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:4px}'+
'#bag .it{position:relative;aspect-ratio:1/1;cursor:pointer;display:flex;align-items:center;justify-content:center;border:8px solid transparent;'+BI('cell','4',8)+'-webkit-tap-highlight-color:transparent}'+
'#bag .it.sel{'+BI('cell_sel','4',8)+'}'+
'#bag .it .orb{position:relative;width:70%;aspect-ratio:1/1;border-radius:50%}'+
'#bag .it .orb i{position:absolute;left:24%;top:18%;width:22%;height:22%;border-radius:50%;background:#fff;opacity:.85}'+
'#bag .it .orb.ic{width:auto;aspect-ratio:auto;border-radius:0;display:flex;align-items:center;justify-content:center}'+
'#bag .it .orb.ic{max-width:100%;max-height:100%}#bag .it .orb.ic canvas{max-width:32px;max-height:32px}'+
'#bag .it .nm{display:none}'+
'#bag .it .n{position:absolute;right:0;bottom:-3px;font-size:7px;line-height:8px;font-weight:900;color:#fff;text-shadow:1px 0 #070b16,-1px 0 #070b16,0 1px #070b16,0 -1px #070b16}'+
'#bag .it .eq{position:absolute;left:-2px;top:-5px;font-size:8px;color:#ffe08a;font-weight:900;text-shadow:1px 0 #070b16,-1px 0 #070b16,0 1px #070b16,0 -1px #070b16}'+
'#bagInfo{flex:none;margin-top:4px;padding:2px 4px;border:8px solid transparent;'+BI('card','4',8)+'font-size:10px;line-height:1.35;color:#b9cde6;max-height:44%;overflow-y:auto}'+
'#bagInfo b{display:block;font-size:12px;color:#ffe9a8;margin-bottom:1px}'+
'#bagInfo .pl{margin-top:2px;font-size:10px;color:#e8bb48}'+
'#bagInfo .acts{display:flex;gap:4px;margin-top:5px}#bagInfo .acts.two{margin-top:3px}'+
'#bagInfo .acts button{flex:1;height:24px;padding:0 3px;font-size:10px;font-weight:800;line-height:9px;border:8px solid transparent;'+BI('btn_blue','4',8)+'background:none;color:#e8f0fb;cursor:pointer;margin:-4px 0;text-shadow:1px 1px #070b16}'+
'#bagInfo .acts button.mid{flex:1.5}'+
'#bagInfo .acts button.dr{'+BI('btn_red','4',8)+'}'+
'#bagInfo .acts button.us{'+BI('btn_gold','4',8)+'color:#3a2208;text-shadow:none}'+
'#bagInfo .acts button[disabled]{opacity:.4}'+
'.pn .sc{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;padding-right:2px}'+
'.pn .parch{border:8px solid transparent;'+BI('parch','4',8)+'color:#2c2418}'+
'.pn .card{border:8px solid transparent;'+BI('card','4',8)+'}'+
/* Tu Luyện */
'#tuScene{height:88px;border:4px solid #070b16;outline:2px solid #a8782a;overflow:hidden;margin:2px 2px 8px;flex:none}'+
'#tuScene img{width:100%;height:100%;object-fit:cover;display:block;image-rendering:pixelated}'+
'#bagR{padding:2px 2px 4px}'+
'#bagR .hint{font-size:10px;line-height:1.4;color:#5b4c2e;margin:0 0 4px}'+
'#bagR .er{display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:2px solid #b9a272}'+
'#bagR .er .el{width:26px;height:26px;border:2px solid #070b16;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:900;color:#12082a;flex:none;box-shadow:inset 2px 2px 0 #fff8,inset -2px -2px 0 #0003}'+
'#bagR .er .mid{flex:1;min-width:0}'+
'#bagR .er .nm{font-size:11px;color:#2c2418;font-weight:800;display:flex;justify-content:space-between}'+
'#bagR .bar2{height:8px;background:#13213b;border:2px solid #070b16;margin:2px 0;overflow:hidden}'+
'#bagR .bar2 i{display:block;height:100%}'+
'#bagR .er small{font-size:9px;color:#6b5a38}'+
'#bagR .er button,#bagR .aw{cursor:pointer;font-weight:900;color:#3a2208;border:8px solid transparent;'+BI('btn_gold','4',8)+'background:none;line-height:9px;padding:0}'+
'#bagR .er button{height:22px;min-width:54px;font-size:10px;flex:none;margin:-4px 0}'+
'#bagR button[disabled]{opacity:.45;filter:grayscale(.6)}'+
'#bagR .aw{margin:8px auto 2px;display:block;width:70%;height:30px;font-size:13px}'+
'#bagR .done{margin:4px 0;text-align:center;padding:5px;background:#f3e8c8;border:2px solid #b9a272;color:#6b4a14;font-size:10px}'+
'#bagR .done b{display:block;font-size:15px;color:#2a1c06;margin:1px 0}'+
'#bagR .tips{margin:6px 0 2px;font-size:10px;line-height:1.45;color:#4a3d24}#bagR .tips h4{margin:0 0 2px;font-size:11px;color:#2c2418}#bagR .tips li{margin-left:14px}'+
/* Nhân Vật */
'#chTop{position:relative;flex:none;height:240px;margin:2px 2px 8px;padding:0}'+
'.slot{position:absolute;width:40px;height:40px;border:8px solid transparent;'+BI('slot','4',8)+'display:flex;align-items:center;justify-content:center;cursor:default}'+
'.slot img,.slot canvas{max-width:22px;max-height:22px;image-rendering:pixelated;display:block}'+
'.slot.ph img{opacity:.9}'+
'.slot.wp{cursor:pointer}.slot.has{filter:drop-shadow(0 0 3px #e8bb48)}'+
'#chPort{position:absolute;left:52px;right:52px;top:6px;height:170px}'+
'#chPort .ped{position:absolute;left:50%;bottom:0;width:104px;height:20px;margin-left:-52px;background:'+'repeating-linear-gradient(#5c7595 0 4px,#41567a 4px 8px)'+';box-shadow:0 0 0 2px #070b16,0 0 0 4px #a8782a;border-radius:50%}'+
'#chName{position:absolute;left:0;right:0;top:178px;text-align:center;font-size:13px;font-weight:900;color:#2c2418}'+
'#chBar{position:absolute;left:26px;right:26px;top:202px;height:16px;border:4px solid #070b16;outline:2px solid #a8782a;background:#13213b;overflow:hidden}'+
'#chBar i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(#c8f6ff 0 25%,#1f9be0 25% 70%,#1b3a8a 70%)}'+
'#chBar span{position:absolute;left:0;right:0;top:0;line-height:8px;text-align:center;font-size:8px;font-weight:900;color:#fff;text-shadow:1px 1px #070b16}'+
'#chStats{padding:2px 4px}'+
'#bagS h3{margin:0 0 2px;font-size:13px;color:#ffe9a8;font-weight:900;text-shadow:1px 1px #070b16}'+
'#bagS h3.dt{margin:8px 0 2px;font-size:11px;color:#e8bb48}'+
'#bagS .row2{display:flex;align-items:center;gap:8px;height:32px;border-top:2px solid #1b3052}'+
'#bagS .row2 img{width:24px;height:24px;flex:none;image-rendering:pixelated}'+
'#bagS .row2 .lb{flex:none;width:92px;font-size:11px;color:#c8d8ee}'+
'#bagS .row2 .vv{flex:1;text-align:right;font-size:12px;font-weight:900;color:#fff}'+
'#bagS .row2 .bw{flex:1}#bagS .row2 .bw em{display:block;text-align:right;font-style:normal;font-size:10px;font-weight:800;color:#fff;margin-bottom:1px}'+
'#bagS .row2 .tr{height:8px;background:#0d1628;border:2px solid #070b16;outline:1px solid #27456f;overflow:hidden}#bagS .row2 .tr i{display:block;height:100%}'+
'#bagS .row{display:flex;justify-content:space-between;gap:8px;font-size:10px;padding:4px 0;border-top:2px solid #1b3052;color:#b9cde6}'+
'#bagS .row b{color:#fff;text-align:right}';
document.head.appendChild(css);

/* ----- khung bảng ----- */
var panels={};
function mkPanel(id,title,xid){
  var el=document.createElement('div');el.id=id;el.className='pn';
  var pf=document.createElement('div');pf.className='pf';
  pf.innerHTML='<img class="ts" alt=""><img class="md" alt=""><div class="hd"><h2></h2><span class="cap"></span></div><button type="button" class="xb" id="'+xid+'" aria-label="×"></button><div class="bd"></div>';
  pf.querySelector('.ts').src=PNG('tassel');pf.querySelector('.md').src=PNG('medal');
  el.appendChild(pf);document.body.appendChild(el);
  pf.querySelector('h2').setAttribute('data-i18n',title);
  var p={el:el,pf:pf,bd:pf.querySelector('.bd'),cap:pf.querySelector('.cap'),x:$(xid)};panels[id]=p;
  el.addEventListener('pointerdown',function(e){if(e.target===el)closeAll();});
  p.x.onclick=closeAll;
  return p;
}
/* bảng chiếm ~nửa chiều cao màn hình, rộng ~80% (tối đa 400px) */
function fit(p){
  var iw=window.innerWidth,ih=window.innerHeight,w=Math.min(iw-36,400),h=Math.max(420,Math.min(Math.round(ih*0.54),640));
  p.pf.style.width=w+'px';p.pf.style.height=h+'px';
}
window.addEventListener('resize',function(){for(var k in panels)if(panels[k].el.style.display==='flex')fit(panels[k]);});

var pBag=mkPanel('bag','bag.title','bagX'),pCh=mkPanel('chPan','ui.char','chX'),pTu=mkPanel('tuPan','ui.tu','tuX');
pBag.cap.id='bagCap';
pBag.bd.innerHTML='<div id="bagCats"></div><div id="bagStage"><div id="bagSc"><div id="bagFl"></div></div><div class="empty" id="bagEmpty" data-i18n-html="bag.empty"></div></div><div id="bagInfo"></div>';
pTu.bd.innerHTML='<div class="sc"><div id="tuScene"></div><div id="bagR" class="parch"></div></div>';
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
      icn.style.cssText='display:block;max-width:100%;max-height:100%;width:auto;height:auto;image-rendering:pixelated';e.firstChild.appendChild(icn);}
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
      (mx?esc(T('realm.full')):'<div class="bar2" style="margin:8px 30px"><i id="rootQb" style="width:'+pc+'%;background:linear-gradient(#d8f6ff 0 30%,#1f9be0 30% 70%,#1b3a8a 70%)"></i></div><span id="rootQi">'+Math.floor(C.qi)+'</span> / '+nd+' '+esc(T('realm.exp'))+
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
  var L=[['sl_wp',0,0],['sl_ring',0,0],['sl_boot',0,0]],R=[['sl_head',1,0],['sl_body',1,0],['sl_belt',1,0]];
  L.concat(R).forEach(function(s,i){var d=document.createElement('div');d.className='slot ph';d.style[s[1]?'right':'left']='4px';d.style.top=(6+(i%3)*58)+'px';d.dataset.k=s[0];d.appendChild(uimg(s[0]));top.appendChild(d);});
  var pt=document.createElement('div');pt.id='chPort';pt.innerHTML='<div class="ped"></div>';var cv=document.createElement('canvas');pt.appendChild(cv);top.appendChild(pt);
  var nm=document.createElement('div');nm.id='chName';top.appendChild(nm);
  var br=document.createElement('div');br.id='chBar';br.innerHTML='<i></i><span></span>';top.appendChild(br);
  top.querySelector('.slot[data-k="sl_wp"]').onclick=function(){if(G.cult.eq.w){G.equipToggle(G.cult.eq.w);chSig='';refresh();if(window.TT&&TT.push)TT.push(false,false);}};
  portrait(cv,51,3);cv.style.width=(cv.width)+'px';
}
function updChTop(){
  var top=$('chTop');if(!top.firstChild)buildChTop();
  var C=G.cult,w=top.querySelector('.slot[data-k="sl_wp"]'),eqw=C.eq.w;
  if(w.dataset.w!==String(eqw)){w.dataset.w=String(eqw);w.innerHTML='';
    if(eqw){var c=G.iconCanvas(eqw,3);if(c){c.style.cssText='max-width:22px;max-height:22px;image-rendering:pixelated;display:block';w.appendChild(c);}w.className='slot wp has';}
    else{w.appendChild(uimg('sl_wp'));w.className='slot wp ph';}}
  var oSig=String(C.eq.o);if(top.dataset.o!==oSig){top.dataset.o=oSig;var cvp=$('chPort').querySelector('canvas');portrait(cvp,51,3);cvp.style.width=cvp.width+'px';
    ['sl_head','sl_body','sl_boot'].forEach(function(k){var sd=top.querySelector('.slot[data-k="'+k+'"]');sd.innerHTML='';if(C.eq.o){var c=G.OF.icon(3,k==='sl_head'?'head':k==='sl_body'?'torso':'boot');if(c){c.style.cssText='max-width:22px;max-height:22px;display:block';sd.appendChild(c);}sd.className='slot';}else{sd.appendChild(uimg(k));sd.className='slot ph';}});}
  $('chName').textContent=C.aw?T('realm.n',{n:C.rl}):T('j.asleep');
  var b=$('chBar'),nd=G.realmNeed(C.rl),mx=C.rl>=G.TD.REALM.max;
  b.firstChild.style.width=(C.aw?(mx?100:Math.min(100,C.qi/nd*100)):0)+'%';
  b.lastChild.textContent=C.aw?(T('realm.exp')+' '+Math.floor(C.qi)+(mx?'':' / '+nd)):T('hud.asleep');
}
function renderStats(){
  var P=G.P,S=G.S,C=G.cult,N=I18N.lang==='vi'?function(x){return String(x).replace('.',',');}:function(x){return String(x);};
  updChTop();
  function row(a,b){return '<div class="row"><span>'+T(a)+'</span><b>'+b+'</b></div>';}
  function r2(ic,lb,val){return '<div class="row2"><img src="'+PNG(ic)+'"><span class="lb">'+esc(lb)+'</span><span class="vv">'+val+'</span></div>';}
  function rb(ic,lb,txt,pc,col){return '<div class="row2"><img src="'+PNG(ic)+'"><span class="lb">'+esc(lb)+'</span><div class="bw"><em>'+txt+'</em><div class="tr"><i style="width:'+Math.max(0,Math.min(100,pc))+'%;background:'+col+'"></i></div></div></div>';}
  var cd=470/(1+S.spd),m=G.realmMul(),nd=C.rl>=G.TD.REALM.max?0:G.realmNeed(C.rl);
  var pl=G.TD.EL.map(function(e){return '<div class="row"><span style="color:'+e.c+'">'+T('el.'+e.id)+'</span><b>'+C.pl[e.id].map(function(n){return n+'/'+G.TD.PCAP;}).join(' · ')+'</b></div>';}).join('');
  var pets=G.PETS.length?G.PETS.map(function(id){return esc(T('monster.'+id));}).join(', '):T('sx.none');
  $('bagS').innerHTML='<h3><span style="color:#e8bb48;margin-right:6px">✦</span>'+esc(T('ui.stats'))+'</h3>'+
   rb('st_hp',T('sx.hp'),Math.round(P.hp)+' / '+P.maxHp,P.hp/P.maxHp*100,'linear-gradient(#ff7a58 0 30%,#c02f2c 30% 70%,#6a1418 70%)')+
   rb('st_qi',T('realm.exp'),C.aw?(Math.floor(C.qi)+(nd?' / '+nd:'')):T('j.asleep'),C.aw&&nd?C.qi/nd*100:(C.aw?100:0),'linear-gradient(#d8f6ff 0 30%,#1f9be0 30% 70%,#1b3a8a 70%)')+
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
