/* ============================================================
   TÚI TRỮ VẬT (túi gấm của tiên nhân)
   - Icon: túi gấm pixel 16x16 ở góc trái. Bấm → mở "không gian trong túi": nền tối có linh khí,
     vật phẩm lơ lửng phát sáng (không có ô lưới). Bấm vật phẩm để xem tên + mô tả.
   - Tab "Đạo Ký": tiến độ đã lưu (để kiểm tra save).
   - ITEMS: danh mục vật phẩm. KHÔNG BAO GIỜ đổi id (tên khoá) vật phẩm đã phát hành.
   - Chỉ cần: window.G (loot, P, stats) và window.TT.info() (từ auth.js).
   ============================================================ */
(function(){
'use strict';
var G=window.G;
var CAP=30; /* số loại vật phẩm tối đa trong túi (tạm) */
var ITEMS={
  'Thủy Long Châu':{col:'#7fd8ff',glow:'#3aa9ff'},
  'lt':{col:'#e8f6ff',glow:'#6fd3ff'},
  'dp.tukhi':{col:'#ffffff',glow:'#b58cff'},
  'dan.tukhi':{col:'#b8f5a0',glow:'#2fbf5a'}
};
var DEF={col:'#ffe58f',glow:'#ffb347'};
var T=function(k,p){return I18N.t(k,p);};

/* ----- icon túi gấm 16x16 ----- */
var PAL={o:'#2a1530',P:'#8a46b8',L:'#c58bf0',d:'#5a2a80',g:'#f2c14e',G:'#ffe58f',r:'#d9434f'};
var MAP=[
'................',
'....oo....oo....',
'...oPPo..oPPo...',
'...oPPPooPPPo...',
'....oPPPPPPo....',
'...ogGgrrgGgo...',
'..ooooooooooo...',
'.oPPPPPPPPPPPo..',
'oLLPPPPPPPPPPPo.',
'oLPPPPPGGPPPPPo.',
'oPPPPPGGGGPPPPo.',
'oPPPPPPGGPPPPPo.',
'oPPPPPPPPPPPPPo.',
'.oddPPPPPPPddo..',
'..ooddddddddoo..',
'....oooooooo....'];
function pouch(px){
  var c=document.createElement('canvas');c.width=c.height=16*px;var x=c.getContext('2d');
  for(var y=0;y<16;y++){var row=MAP[y];for(var i=0;i<16;i++){var ch=row.charAt(i);if(ch!=='.'){x.fillStyle=PAL[ch];x.fillRect(i*px,y*px,px,px);}}}
  c.style.imageRendering='pixelated';return c;
}

/* ----- CSS ----- */
var css=document.createElement('style');
css.textContent=
'#loot{display:none}'+
'#bagBtn{position:fixed;left:10px;top:calc(env(safe-area-inset-top,0px) + 30px);width:54px;height:54px;border-radius:50%;border:1px solid #c58bf088;background:radial-gradient(circle,#2b1a4acc,#0a0716cc);display:none;align-items:center;justify-content:center;padding:0;box-shadow:0 0 12px #8a46b855}'+
'#bagBtn canvas,#bag .hd canvas{position:static;inset:auto;display:block;flex:none}'+
'#bagBtn canvas{width:40px;height:40px}'+
'#bagBtn .cnt{position:absolute;right:-2px;bottom:-2px;min-width:18px;height:18px;border-radius:9px;background:#ffcf5a;color:#2a1530;font-size:11px;font-weight:800;line-height:18px;text-align:center;padding:0 4px;box-sizing:border-box}'+
'#bag{position:fixed;inset:0;z-index:900;display:none;align-items:center;justify-content:center;background:#000b;padding:14px;box-sizing:border-box}'+
'#bag .box{width:100%;max-width:380px;max-height:100%;display:flex;flex-direction:column;background:linear-gradient(#1b1236,#0b0818);border:1px solid #6b4a9a;border-radius:18px;padding:12px;color:#efe6ff;box-shadow:0 0 30px #6b3fb455;-webkit-user-select:none;user-select:none}'+
'#bag .hd{display:flex;align-items:center;gap:8px;margin-bottom:10px}'+
'#bag .hd canvas{width:28px;height:28px}'+
'#bag .hd h2{margin:0;font-size:17px;flex:1;letter-spacing:1px}'+
'#bag button{padding:8px 12px;border-radius:10px;border:1px solid #6b4a9a;background:#241a45;color:#fff;font-size:13px}'+
'#bag .tabs{display:flex;gap:6px;margin-bottom:10px}'+
'#bag .tabs button{flex:1;padding:8px 0;font-weight:700;color:#b9a6df;font-size:12px}'+
'#bag .tabs button.on{background:#6b3fb4;border-color:#c58bf0;color:#fff}'+
'#bagCats{display:flex;gap:6px;overflow-x:auto;margin:0 0 8px;padding-bottom:3px;-webkit-overflow-scrolling:touch;scrollbar-width:none}#bagCats::-webkit-scrollbar{display:none}'+
'#bagCats button{flex:none;padding:6px 11px;font-size:12px;border-radius:9px;color:#b9a6df;background:#1a1236;border:1px solid #4a3678}#bagCats button.on{background:#ffd25a;border-color:#ffe9a0;color:#2a1530;font-weight:800}'+
'#bagStage{position:relative;height:min(46vh,380px);min-height:260px;border-radius:14px;overflow:hidden;background:radial-gradient(ellipse at 50% 45%,#2a1a5c 0%,#120a2e 55%,#05030f 100%);border:1px solid #3c2a66}'+
'#bagStage canvas{position:absolute;inset:0;width:100%;height:100%}'+
'#bagStage .empty{position:absolute;left:0;right:0;top:46%;text-align:center;color:#8f7fbd;font-size:13px;line-height:1.6;padding:0 20px}'+
'#bagSc{position:absolute;inset:0;overflow-y:auto;-webkit-overflow-scrolling:touch}'+
'#bagFl{display:flex;flex-wrap:wrap;justify-content:center;align-content:flex-start;gap:18px 2px;padding:18px 6px 28px;min-height:100%;box-sizing:border-box}'+
'#bag .it{position:relative;width:78px;text-align:center;animation:bagfloat 3.4s ease-in-out infinite;cursor:pointer}'+
'#bag .it .orb{width:46px;height:46px;margin:0 auto;border-radius:50%;position:relative}'+
'#bag .it .orb i{position:absolute;left:24%;top:18%;width:22%;height:22%;border-radius:50%;background:#fff;opacity:.85}'+
'#bag .it .n{position:absolute;right:2px;top:-3px;min-width:17px;height:17px;border-radius:9px;background:#ffcf5a;color:#2a1530;font-size:10px;font-weight:800;line-height:17px;text-align:center;padding:0 3px;box-sizing:border-box}'+
'#bag .it .nm{margin-top:4px;font-size:10px;line-height:1.15;color:#e9defc;text-shadow:0 1px 3px #000}'+
'#bag .it.sel .orb{outline:2px solid #fff8;outline-offset:3px}'+
'@keyframes bagfloat{0%,100%{transform:translateY(-4px)}50%{transform:translateY(5px)}}'+
'#bagInfo{margin-top:10px;min-height:96px;padding:9px 11px;border-radius:12px;background:#150f2d;border:1px solid #33265a;font-size:12.5px;line-height:1.5;color:#cbbbee}'+
'#bagInfo b{display:block;font-size:14px;color:#fff;margin-bottom:2px}'+
'#bagCap{margin-top:8px;font-size:11px;color:#8f7fbd;text-align:right}'+
'#bagS .row{display:flex;justify-content:space-between;gap:10px;font-size:13px;padding:7px 0;border-bottom:1px solid #2a1f4d}'+
'#bagS .row b{color:#fff;text-align:right}'+
'#bagInfo .pl{margin-top:6px;font-size:12px;color:#ffe58f}'+
'#bagInfo .acts.two{margin-top:6px}'+
'#bagJ .row{display:flex;justify-content:space-between;gap:10px;font-size:13px;padding:7px 0;border-bottom:1px solid #2a1f4d}'+
'#bagJ .row b{color:#fff;text-align:right}'+
'#bag .it .orb.ic{width:auto;height:auto;border-radius:0}'+
'#bag .it .orb.ic .n{right:-4px}'+
'#bagR .hint{font-size:12px;color:#a999d0;line-height:1.5;margin-bottom:8px}'+
'#bagR .er{display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid #2a1f4d}'+
'#bagR .er .el{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#1a1030;flex:none;overflow:hidden}'+
'#bagR .er .mid{flex:1;min-width:0}'+
'#bagR .er .nm{font-size:12px;color:#e9defc;display:flex;justify-content:space-between}'+
'#bagR .bar2{height:8px;border-radius:4px;background:#0c0820;border:1px solid #33265a;margin:4px 0 2px;overflow:hidden}'+
'#bagR .bar2 i{display:block;height:100%}'+
'#bagR .er small{font-size:10.5px;color:#8f7fbd}'+
'#bagR .er button{padding:7px 9px;font-size:12px;flex:none}'+
'#bagR button[disabled]{opacity:.45}'+
'#bagR .aw{margin-top:12px;width:100%;padding:12px;font-size:15px;font-weight:800;background:#6b3fb4;border-color:#ffe58f;color:#fff}'+
'#bagR .done{margin-top:12px;text-align:center;padding:12px;border-radius:12px;background:#150f2d;border:1px solid #ffe58f77;color:#ffe58f;font-size:13px}'+
'#bagR .done b{display:block;font-size:24px;color:#fff;margin:4px 0}'+
'#qi{position:fixed;left:12px;bottom:calc(env(safe-area-inset-bottom,0px) + 14px);display:none;color:#ffe58f;font-size:13px;font-weight:700;text-shadow:0 1px 3px #000,0 0 8px #ffb34788;pointer-events:none}'+
'#bagInfo .acts{display:flex;gap:6px;margin-top:9px}'+
'#bagInfo .acts button{flex:1;padding:8px 4px;font-size:12px;line-height:1.25}'+
'#bagInfo .acts button.mid{flex:1.5}'+
'#bagInfo .acts button.dr{border-color:#a85a5a;color:#ffc0b8;background:#2a1a1e}'+
'#bagInfo .acts button.us{background:#6b3fb4;border-color:#c58bf0}'+
'#bagInfo .acts button[disabled]{opacity:.35}';
document.head.appendChild(css);

/* ----- nút túi ----- */
var btn=document.createElement('button');btn.id='bagBtn';btn.type='button';btn.setAttribute('aria-label',I18N.t('bag.title'));
btn.appendChild(pouch(3));var cnt=document.createElement('span');cnt.className='cnt';cnt.style.display='none';btn.appendChild(cnt);
document.body.appendChild(btn);

/* ----- bảng túi ----- */
var bag=document.createElement('div');bag.id='bag';
bag.innerHTML=
'<div class="box"><div class="hd"><span id="bagIc"></span><h2 data-i18n="bag.title"></h2><button id="bagX" type="button" data-i18n="bag.close"></button></div>'+
'<div class="tabs"><button type="button" id="tabT" class="on" data-i18n="bag.tab.in"></button><button type="button" id="tabR" data-i18n="bag.tab.root"></button><button type="button" id="tabS" data-i18n="bag.tab.stats"></button></div>'+
'<div id="bagV"><div id="bagCats"></div><div id="bagStage"><canvas id="bagCv"></canvas><div id="bagSc"><div id="bagFl"></div></div><div class="empty" id="bagEmpty" data-i18n-html="bag.empty"></div></div>'+
'<div id="bagInfo"></div><div id="bagCap"></div></div>'+
'<div id="bagR" style="display:none"></div><div id="bagS" style="display:none"></div></div>';
document.body.appendChild(bag);
$('bagIc').appendChild(pouch(2));
function $(id){return document.getElementById(id);}

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
var sel='',tab='T',tmr=0,raf=0,stars=[],lastKeys='';
function hhmm(t){var d=new Date(t);return ('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2);}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}

function elOf(id){var E=G.TD.EL;for(var i=0;i<E.length;i++)if(E[i].id===id)return E[i];return E[0];}
function pos(i,n){ /* xoắn ốc quanh tâm, vật đầu tiên ở giữa */
  if(n===1)return[50,48];
  var a=i*2.4+.6,r=(i===0?0:19+10*Math.sqrt(i));
  var x=50+r*Math.cos(a)*1.25,y=48+r*Math.sin(a)*1.0;
  return[Math.max(16,Math.min(84,x)),Math.max(14,Math.min(76,y))];
}
function renderCats(){
  var h='';CATS.forEach(function(c){h+='<button type="button" data-c="'+c+'" class="'+(c===cat?'on':'')+'">'+esc(T('cat.'+c))+'</button>';});
  var el=$('bagCats');if(el.dataset.l!==h){el.innerHTML=h;el.dataset.l=h;var bs=el.querySelectorAll('button');for(var i=0;i<bs.length;i++)bs[i].onclick=function(){cat=this.getAttribute('data-c');lastKeys='';sel='';renderStage();};}
}
function renderStage(){
  renderCats();
  var l=G.loot,k=Object.keys(l).filter(function(n){return l[n]>0&&(cat==='all'||G.TD.catOf(n)===cat);}),st=$('bagStage'),h='',i;
  if(cat==='pet'){k=[];}
  var sig=cat+'#'+k.map(function(n){return n+':'+l[n]+(G.cult.eq.w===n?'E':'');}).join('|')+(cat==='pet'?G.PETS.join(','):'');
  var none=cat==='pet'?!G.PETS.length:!k.length;
  var em=$('bagEmpty');em.style.display=none?'block':'none';
  if(none){if(cat==='all')em.setAttribute('data-i18n-html','bag.empty'),I18N.apply(em);else{em.removeAttribute('data-i18n-html');em.textContent=T(cat==='tb'||cat==='mount'||cat==='pet'?'cat.empty.'+cat:'cat.empty');}}
  $('bagCap').textContent=T('bag.cap2',{n:G.bagUsed(),cap:G.BAG().cap});
  if(sig===lastKeys)return;lastKeys=sig;
  var fl=$('bagFl');fl.innerHTML='';
  if(cat==='pet'){G.PETS.forEach(function(id,i){var pe=elOf((G.TD.MONS.filter(function(m){return m.id===id;})[0]||{}).el||'moc'),e=document.createElement('div');e.className='it';e.style.animationDelay=(-i*0.7)+'s';e.innerHTML='<div class="orb" style="background:radial-gradient(circle at 35% 30%,#fff,'+pe.c+' 38%,'+pe.c+'88);box-shadow:0 0 14px '+pe.c+'"><i></i></div><div class="nm">'+esc(T('monster.'+id))+'</div>';fl.appendChild(e);});$('bagInfo').textContent=T('bag.tap');return;}
  k.forEach(function(n,i){
    var it=ITEMS[n]||DEF,rs=G.TD&&G.TD.byItem[n],pb=G.TD&&G.TD.byPearl[n],p=pos(i,k.length),e=document.createElement('div');
    if(pb){var pp=G.TD.PEARL[pb.el];it={col:pp.col,glow:pp.glow,tier:pb.tier};}
    e.className='it'+(sel===n?' sel':'');e.dataset.n=n;
    e.style.animationDelay=(-i*0.7)+'s';
    var wp=G.TD.byWeapon[n],icn=(!pb)&&G.iconCanvas(n,2);
    if(icn){var ec=rs?elOf(rs.el).c:wp?elOf(wp.el).c:(it.glow||'#ffe58f');e.innerHTML='<div class="orb ic" style="filter:drop-shadow(0 0 5px '+ec+') drop-shadow(0 0 12px '+ec+'99)">'+(l[n]>1?'<span class="n">'+l[n]+'</span>':'')+'</div><div class="nm">'+esc(I18N.itemName(n))+'</div>';
      icn.style.cssText='position:static;display:block;margin:0 auto;max-width:58px;max-height:64px;width:auto;height:auto;image-rendering:pixelated';e.firstChild.insertBefore(icn,e.firstChild.firstChild);if(G.cult.eq.w===n)e.firstChild.insertAdjacentHTML('beforeend','<span class="n" style="left:-2px;right:auto;background:#7fe39a">E</span>');}
    else e.innerHTML='<div class="orb" style="background:radial-gradient(circle at 35% 30%,#fff,'+it.col+' 38%,'+it.glow+');box-shadow:0 0 14px '+it.glow+',0 0 30px '+it.glow+'66'+(it.tier===2?',inset 0 0 0 3px #ffe58f':it.tier===3?',inset 0 0 0 2px #fff,inset 0 0 0 5px #ffd25a,0 0 22px #ffd25a':'')+(it.tier===3?';width:54px;height:54px':'')+'"><i></i>'+(l[n]>1?'<span class="n">'+l[n]+'</span>':'')+'</div><div class="nm">'+esc(I18N.itemName(n))+'</div>';
    e.onclick=function(){sel=n;showInfo();var all=st.querySelectorAll('.it');for(var j=0;j<all.length;j++)all[j].className='it'+(all[j].dataset.n===sel?' sel':'');};
    fl.appendChild(e);
  });
  if(sel&&!l[sel])sel='';
  showInfo();
}
function showInfo(){
  var l=G.loot,box=$('bagInfo');
  if(!sel||!l[sel]){box.textContent=T('bag.tap');return;}
  var inf=G.itemInfo(sel),sg=sel,pi=inf.pearl,ps='',sz=G.itemSize(sel),wpn=G.TD.byWeapon[sel];
  var mtd=G.TD.byMount[sel];
  if(wpn)ps='<div class="pl">'+esc(T('wp.stat',{t:T('wtier.'+wpn.tier),atk:wpn.atk,el:T('el.'+wpn.el)}))+(inf.equipped?' — '+esc(T('wp.on')):'')+'</div>';
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
function renderJournal(){
  var P=G.P,st=G.stats,l=G.loot,k=Object.keys(l).filter(function(n){return l[n]>0;});
  var info=(window.TT&&TT.info)?TT.info():{name:'-',lastOk:0};
  function row(a,b){return '<div class="row"><span>'+T(a)+'</span><b>'+b+'</b></div>';}
  $('bagJ').innerHTML=
   row('j.account',esc(info.name||'-'))+
   row('j.items',k.length?esc(k.map(function(n){return I18N.itemName(n)+' ×'+l[n];}).join(', ')):T('j.none'))+
   row('j.roots',G.TD.EL.map(function(e){return T('el.'+e.id)+' '+G.cult.r[e.id];}).join(' · '))+
   row('j.qi',G.cult.aw?Math.floor(G.cult.qi):T('j.asleep'))+
   row('j.hp',Math.round(P.hp)+' / '+P.maxHp)+
   row('j.pos',Math.round(P.x/16)+', '+Math.round(P.y/16))+
   row('j.steps',T('j.steps.v',{n:Math.round(st.steps)}))+
   row('j.kills',st.kills)+
   row('j.time',I18N.fmtTime(st.sec))+
   row('j.lastsave',info.lastOk?hhmm(info.lastOk):T('j.never'));
}
var rootSig='';
function baseGrid(){
  var S=G.S,P=G.P,m=G.realmMul(),cd=470/(1+S.spd);
  function c(a,v){return '<div style="background:#150f2d;border:1px solid #33265a;border-radius:10px;padding:7px 9px"><div style="font-size:11px;color:#a999d0">'+esc(T(a))+'</div><div style="font-size:15px;font-weight:800;color:#fff">'+v+'</div></div>';}
  return '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:10px;text-align:left">'+
    c('sx.hp',P.maxHp)+c('sx.atk',Math.round((7+S.dmg+G.wAtk())*m)+'–'+Math.round((12+S.dmg+G.wAtk())*m))+c('sx.def',G.defVal())+c('sx.spd',(1000/cd).toFixed(2).replace('.',I18N.lang==='vi'?',':'.')+'/s')+'</div>';
}
function matCount(el){var n=0;G.TD.RES.forEach(function(g){if(g.el===el)n+=G.loot[g.item]|0;});return n;}
function renderRoot(force){
  var C=G.cult,N=G.TD.NEED,sig=G.TD.EL.map(function(e){return C.r[e.id]+':'+matCount(e.id);}).join('|')+(C.aw?'A'+C.rl+':'+G.P.maxHp+':'+G.S.dmg+':'+G.S.spd:G.canAwake()?'C':'-')+I18N.lang;
  if(!force&&sig===rootSig){var q=$('rootQi');if(q)q.textContent=Math.floor(C.qi);var br=$('rootBr');if(br)br.disabled=!(C.qi>=G.realmNeed(C.rl));return;}
  rootSig=sig;var h='<div class="hint">'+esc(T('cul.hint',{n:N}))+'</div>';
  G.TD.EL.forEach(function(e){
    var v=C.r[e.id],m=matCount(e.id),full=v>=N;
    h+='<div class="er"><div class="el" style="background:'+e.c+';box-shadow:0 0 10px '+e.c+'88">'+esc(T('el.'+e.id))+'</div><div class="mid"><div class="nm"><span>'+esc(T('el.'+e.id))+'</span><span>'+v+' / '+N+'</span></div><div class="bar2"><i style="width:'+Math.min(100,v/N*100)+'%;background:'+e.c+'"></i></div><small>'+esc(T('cul.mat',{n:m}))+'</small></div>'+
       '<button type="button" data-el="'+e.id+'"'+((full||!m)?' disabled':'')+'>'+esc(full?T('cul.full'):T('cul.refine'))+'</button></div>';
  });
  if(C.aw){
    var nd=G.realmNeed(C.rl),mx=C.rl>=G.TD.REALM.max,pc=mx?100:Math.min(100,C.qi/nd*100),ready=!mx&&C.qi>=nd;
    h+='<div class="done"><span style="font-size:12px;color:#cbbbee">'+esc(T('realm.cur'))+'</span><b>'+esc(T('realm.n',{n:C.rl}))+'</b>'+
      (mx?esc(T('realm.full')):'<div class="bar2"><i style="width:'+pc+'%;background:#ffe58f"></i></div><span id="rootQi">'+Math.floor(C.qi)+'</span> / '+nd+' '+esc(T('realm.exp'))+
        '<br><span style="color:#a999d0;font-size:12px">'+esc(T('cul.rate',{n:(I18N.lang==='vi'?G.qiRate().toFixed(2).replace('.',','):G.qiRate().toFixed(2))}))+'</span>'+
        '<br><button type="button" class="aw" id="rootBr" style="margin-top:8px"'+(ready?'':' disabled')+'>'+esc(T('act.break',{n:C.rl+1}))+'</button>')+
      '<br><span style="color:#a999d0;font-size:12px">'+esc(T('realm.bonus',{m:'1,2'.replace(',',I18N.lang==='vi'?',':'.')}))+'</span></div>';
    h+=baseGrid();
  }
  else h+='<button type="button" class="aw" id="rootAw"'+(G.canAwake()?'':' disabled')+'>'+esc(G.canAwake()?T('cul.awake'):T('cul.need',{n:N}))+'</button>';
  $('bagR').innerHTML=h;
  var b=$('bagR').querySelectorAll('button[data-el]');
  for(var i=0;i<b.length;i++)b[i].onclick=function(){G.refineEl(this.getAttribute('data-el'));renderRoot(true);updBadge();if(window.TT&&TT.push)TT.push(false,false);};
  var rb=$('rootBr');if(rb)rb.onclick=function(){if(G.breakthrough()){renderRoot(true);if(window.TT&&TT.push)TT.push(false,false);}};
  var a=$('rootAw');if(a)a.onclick=function(){if(G.awaken()){renderRoot(true);if(window.TT&&TT.push)TT.push(false,false);}};
}
function renderStats(){
  var P=G.P,S=G.S,C=G.cult,pe=G.TD.PEARL,N=I18N.lang==='vi'?function(x){return String(x).replace('.',',');}:function(x){return String(x);};
  function row(a,b){return '<div class="row"><span>'+T(a)+'</span><b>'+b+'</b></div>';}
  var cd=470/(1+S.spd),pl=G.TD.EL.map(function(e){return '<div class="row"><span style="color:'+e.c+'">'+T('el.'+e.id)+'</span><b>'+C.pl[e.id].map(function(n){return n+'/'+G.TD.PCAP;}).join(' · ')+'</b></div>';}).join('');
  var pets=G.PETS.length?G.PETS.map(function(id){return esc(T('monster.'+id));}).join(', '):T('sx.none');
  $('bagS').innerHTML=
   row('sx.hp',Math.round(P.hp)+' / '+P.maxHp)+
   row('sx.realm',esc(T('realm.n',{n:C.rl}))+' (×'+N(G.realmMul().toFixed(2))+')')+
   row('sx.def',G.defVal())+
   row('sx.dmg',Math.round((7+S.dmg+G.wAtk())*G.realmMul())+' – '+Math.round((12+S.dmg+G.wAtk())*G.realmMul()))+
   row('sx.weapon',C.eq.w?esc(I18N.itemName(C.eq.w)):T('sx.noweapon'))+
   row('sx.spd',T('sx.spd.v',{n:N((1000/cd).toFixed(2))}))+
   row('sx.red',N((S.red*100).toFixed(1))+'%')+
   row('sx.qi',C.aw?T('sx.qi.v',{n:N(G.qiRate().toFixed(2))}):T('j.asleep'))+
   row('sx.qitotal',Math.floor(C.qi)+' / '+(C.rl>=G.TD.REALM.max?'MAX':G.realmNeed(C.rl)))+
   row('sx.roots',G.TD.EL.map(function(e){return T('el.'+e.id)+' '+C.r[e.id];}).join(' · '))+
   '<div class="row" style="border:0;padding-bottom:0"><span>'+T('sx.pearls')+'</span></div>'+pl+
   row('sx.pets',pets)+row('sx.kills',G.stats.kills)+row('sx.lt',G.loot.lt|0);
}
function refresh(){if(tab==='T')renderStage();else if(tab==='R')renderRoot();else if(tab==='S')renderStats();updBadge();}
function updBadge(){var n=Object.keys(G.loot).filter(function(k){return G.loot[k]>0;}).length;cnt.textContent=n;cnt.style.display=n?'block':'none';}

/* ----- linh khí (hạt sáng trôi lên) ----- */
function startFx(){
  var cv=$('bagCv'),x=cv.getContext('2d');
  function fit(){var r=cv.getBoundingClientRect(),d=Math.min(2,window.devicePixelRatio||1);cv.width=Math.max(1,r.width*d);cv.height=Math.max(1,r.height*d);}
  fit();stars=[];for(var i=0;i<46;i++)stars.push({x:Math.random(),y:Math.random(),s:.4+Math.random()*1.2,v:.012+Math.random()*.03,p:Math.random()*6.28,c:Math.random()<.3?'#ffe58f':'#b9d8ff'});
  var t0=performance.now();
  function f(t){
    var W=cv.width,H=cv.height,k=(t-t0)/1000;x.clearRect(0,0,W,H);
    for(var i=0;i<stars.length;i++){var s=stars[i];s.y-=s.v*.016;if(s.y<-.02)s.y=1.02;
      var a=.35+.45*Math.sin(k*1.6+s.p);x.globalAlpha=Math.max(.05,a);x.fillStyle=s.c;var z=Math.max(1,Math.round(s.s*W/260));x.fillRect(Math.round(s.x*W+Math.sin(k*.5+s.p)*6),Math.round(s.y*H),z,z);}
    x.globalAlpha=1;raf=requestAnimationFrame(f);
  }
  cancelAnimationFrame(raf);raf=requestAnimationFrame(f);
}
function setTab(t){
  tab=t;$('tabT').className=t==='T'?'on':'';$('tabR').className=t==='R'?'on':'';$('tabS').className=t==='S'?'on':'';
  $('bagV').style.display=t==='T'?'block':'none';$('bagR').style.display=t==='R'?'block':'none';$('bagS').style.display=t==='S'?'block':'none';
  lastKeys='';rootSig='';refresh();if(t==='T')startFx();else cancelAnimationFrame(raf);
}
function open(){bag.style.display='flex';setTab(tab);clearInterval(tmr);tmr=setInterval(refresh,1000);}
function close(){bag.style.display='none';clearInterval(tmr);cancelAnimationFrame(raf);}
btn.onclick=open;$('bagX').onclick=close;
$('tabT').onclick=function(){setTab('T');};$('tabR').onclick=function(){setTab('R');};$('tabS').onclick=function(){setTab('S');};
bag.addEventListener('pointerdown',function(e){if(e.target===bag)close();});
setInterval(function(){if(btn.style.display!=='none')updBadge();},1500);

I18N.apply(bag);
/* HUD linh khí (góc trái dưới) */
var qi=document.createElement('div');qi.id='qi';document.body.appendChild(qi);
setInterval(function(){var C=G.cult;if(btn.style.display==='none'||!C.aw){qi.style.display='none';return;}qi.style.display='block';qi.textContent='✦ '+T('realm.n',{n:C.rl})+' · '+Math.floor(C.qi)+(C.rl>=G.TD.REALM.max?'':'/'+G.realmNeed(C.rl));},250);
I18N.on(function(){btn.setAttribute('aria-label',I18N.t('bag.title'));I18N.apply(bag);lastKeys='';rootSig='';refresh();});
window.TTBag={show:function(v){var ab=document.getElementById('autoBtn');if(ab)ab.style.display=v?'block':'none';btn.style.display=v?'flex':'none';if(!v)close();else updBadge();},open:open,close:close,openTab:function(t){tab=t;open();},select:function(n){sel=n;}};
})();
