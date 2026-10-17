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
  'Thủy Long Châu':{col:'#7fd8ff',glow:'#3aa9ff'}
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
'#bag .tabs button{flex:1;padding:8px 0;font-weight:700;color:#b9a6df}'+
'#bag .tabs button.on{background:#6b3fb4;border-color:#c58bf0;color:#fff}'+
'#bagStage{position:relative;height:min(46vh,380px);min-height:260px;border-radius:14px;overflow:hidden;background:radial-gradient(ellipse at 50% 45%,#2a1a5c 0%,#120a2e 55%,#05030f 100%);border:1px solid #3c2a66}'+
'#bagStage canvas{position:absolute;inset:0;width:100%;height:100%}'+
'#bagStage .empty{position:absolute;left:0;right:0;top:46%;text-align:center;color:#8f7fbd;font-size:13px;line-height:1.6;padding:0 20px}'+
'#bag .it{position:absolute;width:64px;margin:-32px 0 0 -32px;text-align:center;animation:bagfloat 3.4s ease-in-out infinite;cursor:pointer}'+
'#bag .it .orb{width:46px;height:46px;margin:0 auto;border-radius:50%;position:relative}'+
'#bag .it .orb i{position:absolute;left:24%;top:18%;width:22%;height:22%;border-radius:50%;background:#fff;opacity:.85}'+
'#bag .it .n{position:absolute;right:2px;top:-3px;min-width:17px;height:17px;border-radius:9px;background:#ffcf5a;color:#2a1530;font-size:10px;font-weight:800;line-height:17px;text-align:center;padding:0 3px;box-sizing:border-box}'+
'#bag .it .nm{margin-top:4px;font-size:10px;line-height:1.15;color:#e9defc;text-shadow:0 1px 3px #000}'+
'#bag .it.sel .orb{outline:2px solid #fff8;outline-offset:3px}'+
'@keyframes bagfloat{0%,100%{transform:translateY(-4px)}50%{transform:translateY(5px)}}'+
'#bagInfo{margin-top:10px;min-height:62px;padding:9px 11px;border-radius:12px;background:#150f2d;border:1px solid #33265a;font-size:12.5px;line-height:1.5;color:#cbbbee}'+
'#bagInfo b{display:block;font-size:14px;color:#fff;margin-bottom:2px}'+
'#bagCap{margin-top:8px;font-size:11px;color:#8f7fbd;text-align:right}'+
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
'#bagJ .test{margin-top:12px;width:100%;border-style:dashed;color:#b9a6df}';
document.head.appendChild(css);

/* ----- nút túi ----- */
var btn=document.createElement('button');btn.id='bagBtn';btn.type='button';btn.setAttribute('aria-label',I18N.t('bag.title'));
btn.appendChild(pouch(3));var cnt=document.createElement('span');cnt.className='cnt';cnt.style.display='none';btn.appendChild(cnt);
document.body.appendChild(btn);

/* ----- bảng túi ----- */
var bag=document.createElement('div');bag.id='bag';
bag.innerHTML=
'<div class="box"><div class="hd"><span id="bagIc"></span><h2 data-i18n="bag.title"></h2><button id="bagX" type="button" data-i18n="bag.close"></button></div>'+
'<div class="tabs"><button type="button" id="tabT" class="on" data-i18n="bag.tab.in"></button><button type="button" id="tabR" data-i18n="bag.tab.root"></button><button type="button" id="tabJ" data-i18n="bag.tab.journal"></button></div>'+
'<div id="bagV"><div id="bagStage"><canvas id="bagCv"></canvas><div class="empty" id="bagEmpty" data-i18n-html="bag.empty"></div></div>'+
'<div id="bagInfo"></div><div id="bagCap"></div></div>'+
'<div id="bagR" style="display:none"></div><div id="bagJ" style="display:none"></div></div>';
document.body.appendChild(bag);
$('bagIc').appendChild(pouch(2));
function $(id){return document.getElementById(id);}

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
function renderStage(){
  var l=G.loot,k=Object.keys(l).filter(function(n){return l[n]>0;}),st=$('bagStage'),h='',i;
  var sig=k.map(function(n){return n+':'+l[n];}).join('|');
  $('bagEmpty').style.display=k.length?'none':'block';
  $('bagCap').textContent=T('bag.cap',{n:k.length,cap:CAP});
  if(sig===lastKeys)return;lastKeys=sig;
  var old=st.querySelectorAll('.it');for(i=0;i<old.length;i++)st.removeChild(old[i]);
  k.forEach(function(n,i){
    var it=ITEMS[n]||DEF,rs=G.TD&&G.TD.byItem[n],p=pos(i,k.length),e=document.createElement('div');
    e.className='it'+(sel===n?' sel':'');e.dataset.n=n;
    e.style.left=p[0]+'%';e.style.top=p[1]+'%';e.style.animationDelay=(-i*0.7)+'s';
    if(rs){var ec=elOf(rs.el).c;e.innerHTML='<div class="orb ic" style="filter:drop-shadow(0 0 5px '+ec+') drop-shadow(0 0 12px '+ec+'99)">'+(l[n]>1?'<span class="n">'+l[n]+'</span>':'')+'</div><div class="nm">'+esc(I18N.itemName(n))+'</div>';
      var cc=G.iconCanvas(n,2);if(cc){cc.style.cssText='position:static;display:block;margin:0 auto;max-width:56px;height:auto;image-rendering:pixelated';e.firstChild.insertBefore(cc,e.firstChild.firstChild);}}
    else e.innerHTML='<div class="orb" style="background:radial-gradient(circle at 35% 30%,#fff,'+it.col+' 38%,'+it.glow+');box-shadow:0 0 14px '+it.glow+',0 0 30px '+it.glow+'66"><i></i>'+(l[n]>1?'<span class="n">'+l[n]+'</span>':'')+'</div><div class="nm">'+esc(I18N.itemName(n))+'</div>';
    e.onclick=function(){sel=n;showInfo();var all=st.querySelectorAll('.it');for(var j=0;j<all.length;j++)all[j].className='it'+(all[j].dataset.n===sel?' sel':'');};
    st.appendChild(e);
  });
  if(sel&&!l[sel])sel='';
  showInfo();
}
function showInfo(){
  var l=G.loot,box=$('bagInfo');
  if(!sel||!l[sel]){box.textContent=T('bag.tap');return;}
  box.innerHTML='<b>'+esc(I18N.itemName(sel))+' ×'+l[sel]+'</b>'+esc(I18N.itemDesc(sel));
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
   row('j.lastsave',info.lastOk?hhmm(info.lastOk):T('j.never'))+
   '<button class="test" id="bagT" type="button">'+T('j.test')+'</button>';
  $('bagT').onclick=function(){G.loot['Thủy Long Châu']=(G.loot['Thủy Long Châu']||0)+1;if(G.lootUI)G.lootUI();renderJournal();if(window.TT&&TT.push)TT.push(false,false);};
}
var rootSig='';
function matCount(el){var n=0;G.TD.RES.forEach(function(g){if(g.el===el)n+=G.loot[g.item]|0;});return n;}
function renderRoot(force){
  var C=G.cult,N=G.TD.NEED,sig=G.TD.EL.map(function(e){return C.r[e.id]+':'+matCount(e.id);}).join('|')+(C.aw?'A':G.canAwake()?'C':'-')+I18N.lang;
  if(!force&&sig===rootSig){var q=$('rootQi');if(q)q.textContent=Math.floor(C.qi);return;}
  rootSig=sig;var h='<div class="hint">'+esc(T('cul.hint',{n:N}))+'</div>';
  G.TD.EL.forEach(function(e){
    var v=C.r[e.id],m=matCount(e.id),full=v>=N;
    h+='<div class="er"><div class="el" style="background:'+e.c+';box-shadow:0 0 10px '+e.c+'88">'+esc(T('el.'+e.id))+'</div><div class="mid"><div class="nm"><span>'+esc(T('el.'+e.id))+'</span><span>'+v+' / '+N+'</span></div><div class="bar2"><i style="width:'+Math.min(100,v/N*100)+'%;background:'+e.c+'"></i></div><small>'+esc(T('cul.mat',{n:m}))+'</small></div>'+
       '<button type="button" data-el="'+e.id+'"'+((full||!m)?' disabled':'')+'>'+esc(full?T('cul.full'):T('cul.refine'))+'</button></div>';
  });
  if(C.aw)h+='<div class="done">'+esc(T('cul.done'))+'<b>'+esc(T('cul.qi'))+': <span id="rootQi">'+Math.floor(C.qi)+'</span></b>'+esc(T('cul.rate'))+'</div>';
  else h+='<button type="button" class="aw" id="rootAw"'+(G.canAwake()?'':' disabled')+'>'+esc(G.canAwake()?T('cul.awake'):T('cul.need',{n:N}))+'</button>';
  $('bagR').innerHTML=h;
  var b=$('bagR').querySelectorAll('button[data-el]');
  for(var i=0;i<b.length;i++)b[i].onclick=function(){G.refineEl(this.getAttribute('data-el'));renderRoot(true);updBadge();if(window.TT&&TT.push)TT.push(false,false);};
  var a=$('rootAw');if(a)a.onclick=function(){if(G.awaken()){renderRoot(true);if(window.TT&&TT.push)TT.push(false,false);}};
}
function refresh(){if(tab==='T')renderStage();else if(tab==='R')renderRoot();else renderJournal();updBadge();}
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
  tab=t;$('tabT').className=t==='T'?'on':'';$('tabR').className=t==='R'?'on':'';$('tabJ').className=t==='J'?'on':'';
  $('bagV').style.display=t==='T'?'block':'none';$('bagR').style.display=t==='R'?'block':'none';$('bagJ').style.display=t==='J'?'block':'none';
  lastKeys='';rootSig='';refresh();if(t==='T')startFx();else cancelAnimationFrame(raf);
}
function open(){bag.style.display='flex';setTab(tab);clearInterval(tmr);tmr=setInterval(refresh,1000);}
function close(){bag.style.display='none';clearInterval(tmr);cancelAnimationFrame(raf);}
btn.onclick=open;$('bagX').onclick=close;
$('tabT').onclick=function(){setTab('T');};$('tabR').onclick=function(){setTab('R');};$('tabJ').onclick=function(){setTab('J');};
bag.addEventListener('pointerdown',function(e){if(e.target===bag)close();});
setInterval(function(){if(btn.style.display!=='none')updBadge();},1500);

I18N.apply(bag);
/* HUD linh khí (góc trái dưới) */
var qi=document.createElement('div');qi.id='qi';document.body.appendChild(qi);
setInterval(function(){var C=G.cult;if(btn.style.display==='none'||!C.aw){qi.style.display='none';return;}qi.style.display='block';qi.textContent='✦ '+T('hud.qi',{n:Math.floor(C.qi)});},250);
I18N.on(function(){btn.setAttribute('aria-label',I18N.t('bag.title'));I18N.apply(bag);lastKeys='';rootSig='';refresh();});
window.TTBag={show:function(v){btn.style.display=v?'flex':'none';if(!v)close();else updBadge();},open:open,close:close,select:function(n){sel=n;}};
})();
