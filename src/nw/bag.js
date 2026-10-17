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
  'Thủy Long Châu':{col:'#7fd8ff',glow:'#3aa9ff',desc:'Viên châu kết tinh từ thủy linh của Thủy Long, lạnh như băng, bên trong có dòng nước chảy. (Vật phẩm tạm, công dụng chưa định.)'}
};
var DEF={col:'#ffe58f',glow:'#ffb347',desc:'Một vật phẩm chưa rõ lai lịch.'};

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
'#bagJ .test{margin-top:12px;width:100%;border-style:dashed;color:#b9a6df}';
document.head.appendChild(css);

/* ----- nút túi ----- */
var btn=document.createElement('button');btn.id='bagBtn';btn.type='button';btn.setAttribute('aria-label','Túi trữ vật');
btn.appendChild(pouch(3));var cnt=document.createElement('span');cnt.className='cnt';cnt.style.display='none';btn.appendChild(cnt);
document.body.appendChild(btn);

/* ----- bảng túi ----- */
var bag=document.createElement('div');bag.id='bag';
bag.innerHTML=
'<div class="box"><div class="hd"><span id="bagIc"></span><h2>Túi Trữ Vật</h2><button id="bagX" type="button">Đóng</button></div>'+
'<div class="tabs"><button type="button" id="tabT" class="on">Trong túi</button><button type="button" id="tabJ">Đạo Ký</button></div>'+
'<div id="bagV"><div id="bagStage"><canvas id="bagCv"></canvas><div class="empty" id="bagEmpty">Không gian trong túi còn trống…<br>Hạ yêu thú để thu được bảo vật.</div></div>'+
'<div id="bagInfo">Chạm vào một vật phẩm để xem chi tiết.</div><div id="bagCap"></div></div>'+
'<div id="bagJ" style="display:none"></div></div>';
document.body.appendChild(bag);
$('bagIc').appendChild(pouch(2));
function $(id){return document.getElementById(id);}

var sel='',tab='T',tmr=0,raf=0,stars=[],lastKeys='';
function fmtT(s){s=Math.round(s);var h=Math.floor(s/3600),m=Math.floor(s%3600/60);return (h?h+' giờ ':'')+m+' phút '+(s%60)+' giây';}
function hhmm(t){var d=new Date(t);return ('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2);}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}

function pos(i,n){ /* xoắn ốc quanh tâm, vật đầu tiên ở giữa */
  if(n===1)return[50,48];
  var a=i*2.4+.6,r=(i===0?0:14+8*Math.sqrt(i));
  var x=50+r*Math.cos(a)*1.25,y=48+r*Math.sin(a)*1.0;
  return[Math.max(14,Math.min(86,x)),Math.max(16,Math.min(78,y))];
}
function renderStage(){
  var l=G.loot,k=Object.keys(l).filter(function(n){return l[n]>0;}),st=$('bagStage'),h='',i;
  var sig=k.map(function(n){return n+':'+l[n];}).join('|');
  $('bagEmpty').style.display=k.length?'none':'block';
  $('bagCap').textContent='Không gian túi: '+k.length+' / '+CAP+' loại';
  if(sig===lastKeys)return;lastKeys=sig;
  var old=st.querySelectorAll('.it');for(i=0;i<old.length;i++)st.removeChild(old[i]);
  k.forEach(function(n,i){
    var it=ITEMS[n]||DEF,p=pos(i,k.length),e=document.createElement('div');
    e.className='it'+(sel===n?' sel':'');e.dataset.n=n;
    e.style.left=p[0]+'%';e.style.top=p[1]+'%';e.style.animationDelay=(-i*0.7)+'s';
    e.innerHTML='<div class="orb" style="background:radial-gradient(circle at 35% 30%,#fff,'+it.col+' 38%,'+it.glow+');box-shadow:0 0 14px '+it.glow+',0 0 30px '+it.glow+'66"><i></i>'+(l[n]>1?'<span class="n">'+l[n]+'</span>':'')+'</div><div class="nm">'+esc(n)+'</div>';
    e.onclick=function(){sel=n;showInfo();var all=st.querySelectorAll('.it');for(var j=0;j<all.length;j++)all[j].className='it'+(all[j].dataset.n===sel?' sel':'');};
    st.appendChild(e);
  });
  if(sel&&!l[sel])sel='';
  showInfo();
}
function showInfo(){
  var l=G.loot,box=$('bagInfo');
  if(!sel||!l[sel]){box.textContent='Chạm vào một vật phẩm để xem chi tiết.';return;}
  var it=ITEMS[sel]||DEF;box.innerHTML='<b>'+esc(sel)+' ×'+l[sel]+'</b>'+esc(it.desc);
}
function renderJournal(){
  var P=G.P,st=G.stats,l=G.loot,k=Object.keys(l).filter(function(n){return l[n]>0;});
  var info=(window.TT&&TT.info)?TT.info():{name:'-',lastOk:0};
  $('bagJ').innerHTML=
   '<div class="row"><span>Tài khoản</span><b>'+esc(info.name||'-')+'</b></div>'+
   '<div class="row"><span>Vật phẩm</span><b>'+(k.length?esc(k.map(function(n){return n+' ×'+l[n];}).join(', ')):'Chưa có')+'</b></div>'+
   '<div class="row"><span>Máu</span><b>'+Math.round(P.hp)+' / '+P.maxHp+'</b></div>'+
   '<div class="row"><span>Vị trí (ô)</span><b>'+Math.round(P.x/16)+', '+Math.round(P.y/16)+'</b></div>'+
   '<div class="row"><span>Quãng đường đã đi</span><b>'+Math.round(st.steps)+' ô</b></div>'+
   '<div class="row"><span>Thủy Long đã hạ</span><b>'+st.kills+'</b></div>'+
   '<div class="row"><span>Thời gian chơi</span><b>'+fmtT(st.sec)+'</b></div>'+
   '<div class="row"><span>Lần lưu lên máy chủ</span><b>'+(info.lastOk?hhmm(info.lastOk):'chưa')+'</b></div>'+
   '<button class="test" id="bagT" type="button">🧪 Thêm 1 vật phẩm thử (để kiểm tra lưu)</button>';
  $('bagT').onclick=function(){G.loot['Thủy Long Châu']=(G.loot['Thủy Long Châu']||0)+1;if(G.lootUI)G.lootUI();renderJournal();if(window.TT&&TT.push)TT.push(false,false);};
}
function refresh(){if(tab==='T')renderStage();else renderJournal();updBadge();}
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
  tab=t;$('tabT').className=t==='T'?'on':'';$('tabJ').className=t==='J'?'on':'';
  $('bagV').style.display=t==='T'?'block':'none';$('bagJ').style.display=t==='J'?'block':'none';
  lastKeys='';refresh();if(t==='T')startFx();else cancelAnimationFrame(raf);
}
function open(){bag.style.display='flex';setTab(tab);clearInterval(tmr);tmr=setInterval(refresh,1000);}
function close(){bag.style.display='none';clearInterval(tmr);cancelAnimationFrame(raf);}
btn.onclick=open;$('bagX').onclick=close;
$('tabT').onclick=function(){setTab('T');};$('tabJ').onclick=function(){setTab('J');};
bag.addEventListener('pointerdown',function(e){if(e.target===bag)close();});
setInterval(function(){if(btn.style.display!=='none')updBadge();},1500);

window.TTBag={show:function(v){btn.style.display=v?'flex':'none';if(!v)close();else updBadge();},open:open,close:close,select:function(n){sel=n;}};
})();
