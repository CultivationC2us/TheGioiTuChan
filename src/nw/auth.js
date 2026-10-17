/* ============================================================
   ĐĂNG NHẬP + LƯU TIẾN ĐỘ (Supabase, gọi thẳng REST — không cần thư viện)
   - Người chơi chỉ gõ TÊN + MẬT KHẨU. Game tự ghép thành email giả: ten@tuchan.game
   - Khoá dưới đây là PUBLISHABLE key (được phép công khai). KHÔNG BAO GIỜ dán secret/service_role vào đây.
   - Save: bảng public.saves (user_id, version, data jsonb, updated_at) — mỗi người chỉ đọc/ghi dòng của mình (RLS).
   - data.v = số phiên bản dữ liệu save; khi đổi cấu trúc, thêm hàm migrate bên dưới. KHÔNG đổi id vật phẩm đã phát hành.
   ============================================================ */
(function(){
'use strict';
var URL_='https://ehrknssxyojpncqtimfq.supabase.co';
var KEY='sb_publishable_vffTIOJtLmCU2IHY_4TEtw_d3v24Wfb';
var DOMAINS=['tuchan.game','mailinator.com']; /* thử lần lượt; domain đầu bị Supabase từ chối thì dùng domain sau */
var SAVE_V=1;
var LSK='tt_session_v1';
var G=window.G;
var S=null,mode='login',busy=false,lastJson='',lastOk=0,pushing=false,timer=0;

function ls(k,v){try{if(v===undefined)return localStorage.getItem(k);if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v);}catch(e){}return null;}
function $(id){return document.getElementById(id);}
function norm(n){return String(n||'').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/g,'d').replace(/Đ/g,'d').toLowerCase().trim();}
function emailOf(name,i){return name+'@'+DOMAINS[i];}

/* ---------- gọi API ---------- */
function req(path,method,body,token,keep){
  var h={apikey:KEY,'Content-Type':'application/json'};
  if(token)h.Authorization='Bearer '+token;
  return fetch(URL_+path,{method:method,headers:h,body:body?JSON.stringify(body):undefined,keepalive:!!keep}).then(function(r){
    return r.text().then(function(t){var j=null;try{j=t?JSON.parse(t):null;}catch(e){}return{ok:r.ok,status:r.status,j:j};});
  });
}
function rawErr(r){var j=r&&r.j||{};return String(j.msg||j.error_description||j.message||j.error||('HTTP '+(r&&r.status)));}
function viErr(r){
  var m=rawErr(r),l=m.toLowerCase();
  if(l.indexOf('invalid login')>=0)return 'Sai tên tài khoản hoặc mật khẩu.';
  if(l.indexOf('already registered')>=0||l.indexOf('already been registered')>=0)return 'Tên tài khoản này đã có người dùng, hãy chọn tên khác.';
  if(l.indexOf('at least')>=0&&l.indexOf('password')>=0)return 'Mật khẩu tối thiểu 6 ký tự.';
  if(l.indexOf('signups not allowed')>=0||l.indexOf('signup is disabled')>=0)return 'Máy chủ đang tắt đăng ký tài khoản mới.';
  if(l.indexOf('email logins are disabled')>=0||l.indexOf('provider is not enabled')>=0)return 'Máy chủ chưa bật đăng nhập bằng email (Authentication → Providers → Email).';
  if(l.indexOf('rate limit')>=0||r.status===429)return 'Thử quá nhiều lần, chờ một lát rồi thử lại.';
  return 'Lỗi máy chủ: '+m;
}
function mkSession(j,name){
  if(!j||!j.access_token)return null;
  return{at:j.access_token,rt:j.refresh_token,exp:j.expires_at?j.expires_at*1000:Date.now()+(j.expires_in||3600)*1000,uid:(j.user&&j.user.id)||'',name:name};
}
function persist(){ls(LSK,S?JSON.stringify(S):null);}

function signIn(name,pw){
  var i=0,last=null;
  function next(){
    if(i>=DOMAINS.length)return Promise.resolve({err:last});
    var k=i++;
    return req('/auth/v1/token?grant_type=password','POST',{email:emailOf(name,k),password:pw}).then(function(r){
      if(r.ok){var s=mkSession(r.j,name);if(s)return{s:s};}
      last=r;
      return next();
    });
  }
  return next();
}
function signUp(name,pw){
  var i=0;
  function next(){
    var k=i++;
    return req('/auth/v1/signup','POST',{email:emailOf(name,k),password:pw}).then(function(r){
      if(r.ok){
        var s=mkSession(r.j,name);
        if(s)return{s:s};
        return{err:r,confirmOn:true};
      }
      var l=rawErr(r).toLowerCase();
      if((l.indexOf('invalid')>=0&&l.indexOf('email')>=0)&&i<DOMAINS.length)return next();
      return{err:r};
    });
  }
  return next();
}
function refresh(){
  if(!S)return Promise.resolve(false);
  return req('/auth/v1/token?grant_type=refresh_token','POST',{refresh_token:S.rt}).then(function(r){
    if(r.ok){var s=mkSession(r.j,S.name);if(s){S=s;persist();return true;}}
    if(r.status>=400&&r.status<500){S=null;persist();return false;}
    return null;
  },function(){return null;});
}
function ensure(){
  if(!S)return Promise.resolve(false);
  if(S.exp-60000>Date.now())return Promise.resolve(true);
  return refresh();
}

/* ---------- dữ liệu save ---------- */
function collect(){
  var P=G.P,l={};for(var k in G.loot)l[k]=G.loot[k];
  return{v:SAVE_V,x:+P.x.toFixed(1),y:+P.y.toFixed(1),f:P.f,hp:Math.round(P.hp),loot:l};
}
function migrate(d){/* d.v cũ → mới. Hiện mới có v=1 nên chưa cần. */return d;}
function apply(d){
  if(!d||typeof d!=='object')return;
  d=migrate(d);var P=G.P;
  if(isFinite(d.x)&&isFinite(d.y)){P.x=d.x;P.y=d.y;G.cam.x=P.x;G.cam.y=P.y;G.dog.x=P.x-18;G.dog.y=P.y+4;}
  if(d.f===1||d.f===-1)P.f=d.f;
  P.hp=(isFinite(d.hp)&&d.hp>0)?Math.min(P.maxHp,d.hp):P.maxHp;
  if(d.loot&&typeof d.loot==='object'){for(var k in G.loot)delete G.loot[k];for(var n in d.loot){var c=+d.loot[n];if(c>0)G.loot[n]=c;}if(G.lootUI)G.lootUI();}
}
function localGet(uid){var t=ls('tt_save_'+uid);try{return t?JSON.parse(t):null;}catch(e){return null;}}
function localSet(uid,o){ls('tt_save_'+uid,JSON.stringify(o));}
function fetchSave(){
  return req('/rest/v1/saves?select=data,updated_at&user_id=eq.'+encodeURIComponent(S.uid),'GET',null,S.at).then(function(r){
    if(r.ok&&Array.isArray(r.j))return{ok:true,row:r.j[0]||null};
    return{ok:false,r:r};
  },function(){return{ok:false,net:true};});
}

/* ---------- đẩy save lên ---------- */
function status(s,bad){var e=$('accS');if(e){e.textContent=s;e.style.color=bad?'#ffb0a0':'#bfe6ff';}}
function hh(){var d=new Date();return ('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2);}
function push(keep,force){
  if(!S||pushing)return Promise.resolve();
  var d=collect(),j=JSON.stringify(d);
  localSet(S.uid,{t:Date.now(),d:d});
  if(!force&&j===lastJson)return Promise.resolve();
  pushing=true;status('Đang lưu…');
  return ensure().then(function(ok){
    if(ok===false){pushing=false;showAuth('Phiên đăng nhập hết hạn, hãy đăng nhập lại.');return;}
    if(ok===null){pushing=false;status('Offline — lưu tạm trên máy',1);return;}
    return req('/rest/v1/saves?on_conflict=user_id','POST',{user_id:S.uid,version:SAVE_V,data:d,updated_at:new Date().toISOString()},S.at,keep)
      .then(function(r){
        pushing=false;
        if(r.ok){lastJson=j;lastOk=Date.now();status('Đã lưu '+hh());}
        else status('Lỗi lưu: '+rawErr(r).slice(0,40),1);
      },function(){pushing=false;status('Offline — lưu tạm trên máy',1);});
  });
}

/* ---------- giao diện ---------- */
var css=document.createElement('style');
css.textContent=
'#auth{position:fixed;inset:0;z-index:1000;display:none;align-items:center;justify-content:center;background:radial-gradient(ellipse at 50% 30%,#16324a,#0b1620 70%);overflow:auto;padding:20px;box-sizing:border-box;-webkit-user-select:text;user-select:text;touch-action:pan-y}'+
'#auth .card{width:100%;max-width:340px;color:#e8f4ff}'+
'#auth h1{margin:0 0 4px;font-size:24px;text-align:center;letter-spacing:1px}'+
'#auth .sub{margin:0 0 18px;text-align:center;font-size:12px;color:#8fb4d0}'+
'#auth .tabs{display:flex;gap:8px;margin-bottom:14px}'+
'#auth .tabs button{flex:1;padding:10px 0;border-radius:10px;border:1px solid #3d6a8e;background:#0e2233;color:#9fc4e0;font-size:14px;font-weight:700}'+
'#auth .tabs button.on{background:#2a86d6;border-color:#6fd3ff;color:#fff}'+
'#auth input{display:block;width:100%;box-sizing:border-box;margin:0 0 10px;padding:12px;border-radius:10px;border:1px solid #3d6a8e;background:#0a1a28;color:#fff;font-size:16px;outline:none;-webkit-user-select:text;user-select:text}'+
'#auth input:focus{border-color:#6fd3ff}'+
'#auth .go{width:100%;padding:13px 0;border-radius:10px;border:0;background:linear-gradient(#5cc0ff,#2a86d6);color:#fff;font-size:16px;font-weight:800}'+
'#auth .go[disabled]{opacity:.55}'+
'#auth .err{min-height:18px;margin:2px 0 10px;font-size:13px;color:#ffb0a0;line-height:1.35}'+
'#auth .note{margin-top:14px;font-size:11px;color:#7f9fb8;text-align:center;line-height:1.5}'+
'#acc{position:fixed;right:12px;top:calc(env(safe-area-inset-top,0px) + 28px);font-size:11px;color:#bfe6ff;text-shadow:0 1px 2px #000;text-align:right;line-height:1.5;display:none}'+
'#acc button{margin-left:6px;padding:1px 7px;border-radius:8px;border:1px solid #fff5;background:#0007;color:#fff;font-size:10px}';
document.head.appendChild(css);

var ov=document.createElement('div');ov.id='auth';
ov.innerHTML=
'<form class="card" id="aForm" autocomplete="on">'+
'<h1>Thế Giới Tu Chân</h1><p class="sub">Chỉ cần tên tài khoản và mật khẩu, không cần email.</p>'+
'<div class="tabs"><button type="button" id="tLogin" class="on">Đăng nhập</button><button type="button" id="tReg">Tạo tài khoản</button></div>'+
'<input id="aName" type="text" placeholder="Tên tài khoản (chữ, số, _)" maxlength="20" autocapitalize="none" autocorrect="off" spellcheck="false" autocomplete="username">'+
'<input id="aPw" type="password" placeholder="Mật khẩu (từ 6 ký tự)" maxlength="64" autocomplete="current-password">'+
'<input id="aPw2" type="password" placeholder="Nhập lại mật khẩu" maxlength="64" autocomplete="new-password" style="display:none">'+
'<div class="err" id="aErr"></div>'+
'<button class="go" id="aGo" type="submit">Đăng nhập</button>'+
'<div class="note">Quên mật khẩu sẽ không lấy lại được tài khoản, hãy nhớ kỹ.<br>Tên không phân biệt chữ hoa/thường và dấu.</div>'+
'</form>';
document.body.appendChild(ov);
var acc=document.createElement('div');acc.id='acc';acc.innerHTML='<span id="accN"></span> · <span id="accS"></span><button id="accOut" type="button">Thoát</button>';
document.body.appendChild(acc);

function setMode(m){
  mode=m;$('tLogin').className=m==='login'?'on':'';$('tReg').className=m==='reg'?'on':'';
  $('aPw2').style.display=m==='reg'?'block':'none';
  $('aPw').autocomplete=m==='reg'?'new-password':'current-password';
  $('aGo').textContent=m==='reg'?'Tạo tài khoản và vào game':'Đăng nhập';
  $('aErr').textContent='';
}
function showAuth(msg){
  window.__pause=true;S=S&&S.uid?S:null;
  ov.style.display='flex';acc.style.display='none';setMode('login');
  $('aErr').textContent=msg||'';busy=false;$('aGo').disabled=false;
}
function enter(){
  ov.style.display='none';acc.style.display='block';$('accN').textContent=S.name;status('Đã tải');
  window.__pause=false;
  clearInterval(timer);timer=setInterval(function(){push(false,false);},10000);
}
function loadAndEnter(){
  /* lấy save mới nhất giữa máy chủ và bản lưu tạm trên máy */
  return fetchSave().then(function(f){
    var loc=localGet(S.uid),pick=null;
    if(f.ok){
      var srv=f.row?{t:Date.parse(f.row.updated_at)||0,d:f.row.data}:null;
      pick=srv;
      if(loc&&(!srv||loc.t>srv.t+1000))pick=loc;
    }else{
      if(f.r&&(f.r.status===401||f.r.status===403)&&/jwt|token/i.test(rawErr(f.r))){S=null;persist();showAuth('Phiên đăng nhập hết hạn, hãy đăng nhập lại.');return;}
      pick=loc; /* offline hoặc lỗi bảng → dùng bản trên máy */
      if(!f.net)setTimeout(function(){status('Lỗi tải save: '+rawErr(f.r).slice(0,36),1);},300);
    }
    if(pick)apply(pick.d);
    lastJson=pick?JSON.stringify(collect()):'';
    enter();
    if(f.ok&&!pick)push(false,true); /* tài khoản mới: tạo dòng save đầu tiên */
    if(G.toast)G.toast('Chào '+S.name+(pick?' · đã tải tiến độ':' · bắt đầu hành trình'));
  });
}

$('tLogin').onclick=function(){setMode('login');};
$('tReg').onclick=function(){setMode('reg');};
$('aForm').addEventListener('submit',function(e){
  e.preventDefault();if(busy)return;
  var name=norm($('aName').value),pw=$('aPw').value,err=$('aErr');
  if(!/^[a-z0-9_]{3,20}$/.test(name)){err.textContent='Tên tài khoản gồm 3–20 ký tự: chữ không dấu, số hoặc _ (không có khoảng trắng).';return;}
  if(pw.length<6){err.textContent='Mật khẩu tối thiểu 6 ký tự.';return;}
  if(mode==='reg'&&pw!==$('aPw2').value){err.textContent='Hai lần nhập mật khẩu chưa giống nhau.';return;}
  busy=true;$('aGo').disabled=true;err.textContent='Đang kết nối…';
  var p=mode==='reg'?signUp(name,pw):signIn(name,pw);
  p.then(function(res){
    busy=false;$('aGo').disabled=false;
    if(res.s){S=res.s;persist();err.textContent='';loadAndEnter();return;}
    if(res.confirmOn){err.textContent='Máy chủ vẫn đang bật "Confirm email". Vào Supabase → Authentication → Sign In / Providers → tắt Confirm email → Save changes.';return;}
    err.textContent=viErr(res.err||{status:0,j:{msg:'không rõ'}});
  },function(){busy=false;$('aGo').disabled=false;err.textContent='Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.';});
});
$('accOut').onclick=function(){
  if(!confirm('Đăng xuất khỏi '+(S&&S.name)+'?'))return;
  push(false,true).then(function(){ls(LSK,null);location.reload();});
};
addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')push(true,false);});
addEventListener('pagehide',function(){push(true,false);});

/* ---------- khởi động ---------- */
window.__pause=true;
(function boot(){
  var t=ls(LSK);if(t){try{S=JSON.parse(t);}catch(e){S=null;}}
  if(!S||!S.rt){showAuth('');return;}
  ov.style.display='flex';$('aErr').textContent='Đang vào game…';$('aGo').disabled=true;
  ensure().then(function(ok){
    if(ok===false){showAuth('Phiên đăng nhập hết hạn, hãy đăng nhập lại.');return;}
    loadAndEnter(); /* ok===null (offline) → loadAndEnter tự dùng bản lưu trên máy */
  });
})();
window.TT={state:function(){return{S:S,mode:mode,collect:collect};},push:push,apply:apply,signIn:signIn,signUp:signUp};
})();
