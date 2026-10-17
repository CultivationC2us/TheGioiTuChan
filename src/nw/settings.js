/* ============================================================
   CÀI ĐẶT: nút bánh răng pixel (dưới túi, góc trái) → bảng Cài đặt
   - Ngôn ngữ: Tiếng Việt / 繁體中文 / 简体中文 (I18N.set)
   - Tài khoản: tên đăng nhập + Đăng xuất (TT.logout)
   - Muốn thêm mục cài đặt mới: thêm một khối <section> trong html và hàm render tương ứng.
   ============================================================ */
(function(){
'use strict';
var T=function(k,p){return I18N.t(k,p);};
function $(id){return document.getElementById(id);}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}

/* bánh răng 16x16 vẽ bằng công thức (răng cưa 8 cái, lỗ giữa), viền tối + highlight */
function gear(px){
  var N=16,c=document.createElement('canvas');c.width=c.height=N*px;var x=c.getContext('2d'),f=[],i,j;
  for(j=0;j<N;j++){f[j]=[];for(i=0;i<N;i++){
    var dx=i-7.5,dy=j-7.5,r=Math.sqrt(dx*dx+dy*dy),a=Math.atan2(dy,dx);
    var tooth=Math.cos(a*8)>0.15;
    f[j][i]=(r<=5.3||(r<=7.4&&tooth))&&r>2.3;
  }}
  for(j=0;j<N;j++)for(i=0;i<N;i++){
    if(!f[j][i])continue;
    var edge=!(f[j-1]&&f[j-1][i])||!(f[j+1]&&f[j+1][i])||!f[j][i-1]||!f[j][i+1];
    var hole=false;
    x.fillStyle=edge?'#1c2a38':((i+j<12)?'#cfe3f2':((i+j>17)?'#6f8aa2':'#9db8cd'));
    x.fillRect(i*px,j*px,px,px);
  }
  c.style.imageRendering='pixelated';return c;
}

var css=document.createElement('style');
css.textContent=
'#setBtn{position:fixed;left:10px;top:calc(env(safe-area-inset-top,0px) + 92px);width:44px;height:44px;border-radius:50%;border:1px solid #9db8cd88;background:radial-gradient(circle,#1b2c3dcc,#0a1420cc);display:none;align-items:center;justify-content:center;padding:0}'+
'#setBtn canvas,#set .hd canvas{position:static;inset:auto;display:block;flex:none}'+
'#setBtn canvas{width:32px;height:32px}'+
'#set{position:fixed;inset:0;z-index:900;display:none;align-items:center;justify-content:center;background:#000b;padding:14px;box-sizing:border-box}'+
'#set .box{width:100%;max-width:380px;max-height:100%;overflow:auto;background:linear-gradient(#162636,#0a1520);border:1px solid #4d7494;border-radius:18px;padding:12px;color:#e8f4ff;-webkit-user-select:none;user-select:none}'+
'#set .hd{display:flex;align-items:center;gap:8px;margin-bottom:6px}'+
'#set .hd canvas{width:28px;height:28px}'+
'#set .hd h2{margin:0;font-size:17px;flex:1;letter-spacing:1px}'+
'#set button{padding:10px 12px;border-radius:10px;border:1px solid #4d7494;background:#1a2f42;color:#fff;font-size:14px}'+
'#set h3{margin:16px 0 8px;font-size:12px;color:#8fb4d0;letter-spacing:.5px;text-transform:uppercase}'+
'#set .langs{display:flex;flex-direction:column;gap:7px}'+
'#set .langs button{display:flex;justify-content:space-between;align-items:center;text-align:left;font-size:15px}'+
'#set .langs button.on{background:#2a86d6;border-color:#6fd3ff}'+
'#set .langs button.on:after{content:"✓";font-weight:800}'+
'#set .note{margin-top:7px;font-size:11px;color:#7f9fb8}'+
'#set .row{display:flex;justify-content:space-between;gap:10px;font-size:13px;padding:7px 0;border-bottom:1px solid #223a50}'+
'#set .row b{color:#fff}'+
'#set .out{margin-top:10px;width:100%;border-color:#a85a5a;color:#ffc0b8;background:#2a1a1e}';
document.head.appendChild(css);

var btn=document.createElement('button');btn.id='setBtn';btn.type='button';btn.appendChild(gear(2));document.body.appendChild(btn);
var pn=document.createElement('div');pn.id='set';
pn.innerHTML=
'<div class="box"><div class="hd"><span id="setIc"></span><h2 data-i18n="set.title"></h2><button id="setX" type="button" data-i18n="bag.close"></button></div>'+
'<h3 data-i18n="set.lang"></h3><div class="langs" id="setL"></div><div class="note" data-i18n="set.langnote"></div>'+
'<h3 data-i18n="set.account"></h3><div id="setA"></div></div>';
document.body.appendChild(pn);
$('setIc').appendChild(gear(2));

function render(){
  var L=$('setL');L.innerHTML='';
  I18N.LANGS.forEach(function(g){
    var b=document.createElement('button');b.type='button';b.textContent=g.n;b.className=g.c===I18N.lang?'on':'';
    b.onclick=function(){I18N.set(g.c);};L.appendChild(b);
  });
  var info=(window.TT&&TT.info)?TT.info():{name:'-'};
  $('setA').innerHTML='<div class="row"><span>'+T('set.name')+'</span><b>'+esc(info.name||'-')+'</b></div><button class="out" id="setOut" type="button">'+T('acc.logout')+'</button>';
  $('setOut').onclick=function(){if(window.TT&&TT.logout)TT.logout();};
}
function open(){render();pn.style.display='flex';}
function close(){pn.style.display='none';}
btn.onclick=open;$('setX').onclick=close;
pn.addEventListener('pointerdown',function(e){if(e.target===pn)close();});
I18N.apply(pn);
I18N.on(function(){I18N.apply(pn);render();});
window.TTSet={show:function(v){btn.style.display=v?'flex':'none';if(!v)close();},open:open,close:close};
})();
