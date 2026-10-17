/* ============================================================
   NGÔN NGỮ (i18n): vi (mặc định) · zh-Hant (繁體中文) · zh-Hans (简体中文)
   - Mọi chữ hiển thị cho người chơi đều đi qua I18N.t('khoá', {tham_số}).
   - Phần tử HTML: data-i18n="khoá" (textContent) · data-i18n-html="khoá" (innerHTML) · data-i18n-ph="khoá" (placeholder).
   - ID vật phẩm/logic KHÔNG dịch (vẫn là tiếng Việt, ví dụ 'Thủy Long Châu'); tên hiển thị là khoá 'item.<id>'.
   - Thêm ngôn ngữ mới: thêm một bản vào D và một dòng vào LANGS.
   - Ngôn ngữ lưu ở localStorage (tt_lang) và trong save của tài khoản (set.lang).
   ============================================================ */
(function(){
'use strict';
var LANGS=[{c:'vi',n:'Tiếng Việt',h:'vi'},{c:'zh-Hant',n:'繁體中文',h:'zh-Hant'},{c:'zh-Hans',n:'简体中文',h:'zh-Hans'}];
var D={};
D.vi={
 'title':'Tu Tiên · Thế Giới Mới',
 'game.name':'Thế Giới Tu Chân',
 'monster.thuylong':'Thủy Long',
 'hint':'Kéo màn hình để đi · nút ĐÁNH',
 'atk':'ĐÁNH',
 'toast.welcome':'Thế giới mới · đánh Thủy Long ở hồ phía đông',
 'toast.dead':'Đạo hữu ngã xuống... tái sinh ở quảng trường',
 'toast.kill':'Thủy Long đã bị hạ!',
 'toast.pick':'Nhặt được: {name} (vật phẩm tạm — chờ bạn chốt loại phần thưởng)',
 'toast.hello_load':'Chào {name} · đã tải tiến độ',
 'toast.hello_new':'Chào {name} · bắt đầu hành trình',
 'item.Thủy Long Châu':'Thủy Long Châu',
 'itemdesc.Thủy Long Châu':'Viên châu kết tinh từ thủy linh của Thủy Long, lạnh như băng, bên trong có dòng nước chảy. (Vật phẩm tạm, công dụng chưa định.)',
 'itemdesc.default':'Một vật phẩm chưa rõ lai lịch.',
 'auth.sub':'Chỉ cần tên tài khoản và mật khẩu, không cần email.',
 'auth.login':'Đăng nhập',
 'auth.reg':'Tạo tài khoản',
 'auth.ph.name':'Tên tài khoản (chữ, số, _)',
 'auth.ph.pw':'Mật khẩu (từ 6 ký tự)',
 'auth.ph.pw2':'Nhập lại mật khẩu',
 'auth.go.reg':'Tạo tài khoản và vào game',
 'auth.note':'Quên mật khẩu sẽ không lấy lại được tài khoản, hãy nhớ kỹ.<br>Tên không phân biệt chữ hoa/thường và dấu.',
 'err.name':'Tên tài khoản gồm 3–20 ký tự: chữ không dấu, số hoặc _ (không có khoảng trắng).',
 'err.pw6':'Mật khẩu tối thiểu 6 ký tự.',
 'err.pwmatch':'Hai lần nhập mật khẩu chưa giống nhau.',
 'err.connecting':'Đang kết nối…',
 'err.entering':'Đang vào game…',
 'err.nonet':'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.',
 'err.confirm':'Máy chủ vẫn đang bật "Confirm email". Vào Supabase → Authentication → Sign In / Providers → tắt Confirm email → Save changes.',
 'err.badlogin':'Sai tên tài khoản hoặc mật khẩu.',
 'err.exists':'Tên tài khoản này đã có người dùng, hãy chọn tên khác.',
 'err.signupoff':'Máy chủ đang tắt đăng ký tài khoản mới.',
 'err.emailoff':'Máy chủ chưa bật đăng nhập bằng email (Authentication → Providers → Email).',
 'err.rate':'Thử quá nhiều lần, chờ một lát rồi thử lại.',
 'err.server':'Lỗi máy chủ: {m}',
 'err.expired':'Phiên đăng nhập hết hạn, hãy đăng nhập lại.',
 'st.saving':'Đang lưu…',
 'st.offline':'Offline — lưu tạm trên máy',
 'st.saved':'Đã lưu {t}',
 'st.saverr':'Lỗi lưu: {m}',
 'st.loaded':'Đã tải',
 'st.loaderr':'Lỗi tải save: {m}',
 'acc.logout':'Đăng xuất',
 'acc.logout.confirm':'Đăng xuất khỏi {name}?',
 'bag.title':'Túi Trữ Vật',
 'bag.tab.in':'Trong túi',
 'bag.tab.journal':'Đạo Ký',
 'bag.close':'Đóng',
 'bag.empty':'Không gian trong túi còn trống…<br>Hạ yêu thú để thu được bảo vật.',
 'bag.tap':'Chạm vào một vật phẩm để xem chi tiết.',
 'bag.cap':'Không gian túi: {n} / {cap} loại',
 'j.account':'Tài khoản','j.items':'Vật phẩm','j.none':'Chưa có','j.hp':'Máu','j.pos':'Vị trí (ô)',
 'j.steps':'Quãng đường đã đi','j.steps.v':'{n} ô','j.kills':'Thủy Long đã hạ','j.time':'Thời gian chơi',
 'j.lastsave':'Lần lưu lên máy chủ','j.never':'chưa',
 't.h':'{n} giờ','t.m':'{n} phút','t.s':'{n} giây',
 'set.title':'Cài đặt','set.lang':'Ngôn ngữ','set.account':'Tài khoản','set.name':'Tên đăng nhập','set.langnote':'Ngôn ngữ được lưu theo tài khoản.'
};
D['zh-Hant']={
 'title':'修仙・新世界',
 'game.name':'修真世界',
 'monster.thuylong':'水龍',
 'hint':'拖動螢幕移動 · 按「攻擊」',
 'atk':'攻擊',
 'toast.welcome':'新世界・到東邊的湖打水龍',
 'toast.dead':'道友倒下了……在廣場重生',
 'toast.kill':'水龍已被擊敗！',
 'toast.pick':'拾取：{name}（暫定物品，獎勵類型待定）',
 'toast.hello_load':'歡迎 {name}・已載入進度',
 'toast.hello_new':'歡迎 {name}・踏上修行之路',
 'item.Thủy Long Châu':'水龍珠',
 'itemdesc.Thủy Long Châu':'由水龍的水靈凝結而成的寶珠，冰涼如霜，珠中有水流轉動。（暫定物品，用途未定。）',
 'itemdesc.default':'來歷不明的物品。',
 'auth.sub':'只需帳號名稱和密碼，無需電子郵件。',
 'auth.login':'登入',
 'auth.reg':'建立帳號',
 'auth.ph.name':'帳號名稱（英文字母、數字、_）',
 'auth.ph.pw':'密碼（至少 6 個字元）',
 'auth.ph.pw2':'再次輸入密碼',
 'auth.go.reg':'建立帳號並進入遊戲',
 'auth.note':'忘記密碼將無法找回帳號，請牢記。<br>名稱不分大小寫與重音符號。',
 'err.name':'帳號名稱為 3–20 個字元：不含重音的英文字母、數字或 _（不可有空格）。',
 'err.pw6':'密碼至少需要 6 個字元。',
 'err.pwmatch':'兩次輸入的密碼不一致。',
 'err.connecting':'連線中…',
 'err.entering':'進入遊戲中…',
 'err.nonet':'無法連線到伺服器，請檢查網路後再試。',
 'err.confirm':'伺服器仍開啟「Confirm email」。請到 Supabase → Authentication → Sign In / Providers → 關閉 Confirm email → Save changes。',
 'err.badlogin':'帳號名稱或密碼錯誤。',
 'err.exists':'此帳號名稱已被使用，請換一個。',
 'err.signupoff':'伺服器目前關閉了新帳號註冊。',
 'err.emailoff':'伺服器尚未開啟電子郵件登入（Authentication → Providers → Email）。',
 'err.rate':'嘗試次數過多，請稍後再試。',
 'err.server':'伺服器錯誤：{m}',
 'err.expired':'登入已過期，請重新登入。',
 'st.saving':'儲存中…',
 'st.offline':'離線，暫存於本機',
 'st.saved':'已儲存 {t}',
 'st.saverr':'儲存失敗：{m}',
 'st.loaded':'已載入',
 'st.loaderr':'載入存檔失敗：{m}',
 'acc.logout':'登出',
 'acc.logout.confirm':'要登出 {name} 嗎？',
 'bag.title':'儲物袋',
 'bag.tab.in':'袋內',
 'bag.tab.journal':'道記',
 'bag.close':'關閉',
 'bag.empty':'袋中空間還是空的……<br>擊敗妖獸即可獲得寶物。',
 'bag.tap':'點選物品查看詳情。',
 'bag.cap':'袋中空間：{n} / {cap} 種',
 'j.account':'帳號','j.items':'物品','j.none':'尚無','j.hp':'氣血','j.pos':'位置（格）',
 'j.steps':'已行走距離','j.steps.v':'{n} 格','j.kills':'擊敗水龍','j.time':'遊玩時間',
 'j.lastsave':'上次儲存至伺服器','j.never':'尚未',
 't.h':'{n} 小時','t.m':'{n} 分','t.s':'{n} 秒',
 'set.title':'設定','set.lang':'語言','set.account':'帳號','set.name':'登入名稱','set.langnote':'語言設定會隨帳號儲存。'
};
D['zh-Hans']={
 'title':'修仙·新世界',
 'game.name':'修真世界',
 'monster.thuylong':'水龙',
 'hint':'拖动屏幕移动 · 按“攻击”',
 'atk':'攻击',
 'toast.welcome':'新世界·到东边的湖打水龙',
 'toast.dead':'道友倒下了……在广场重生',
 'toast.kill':'水龙已被击败！',
 'toast.pick':'拾取：{name}（暂定物品，奖励类型待定）',
 'toast.hello_load':'欢迎 {name}·已加载进度',
 'toast.hello_new':'欢迎 {name}·踏上修行之路',
 'item.Thủy Long Châu':'水龙珠',
 'itemdesc.Thủy Long Châu':'由水龙的水灵凝结而成的宝珠，冰凉如霜，珠中有水流转动。（暂定物品，用途未定。）',
 'itemdesc.default':'来历不明的物品。',
 'auth.sub':'只需账号名称和密码，无需电子邮箱。',
 'auth.login':'登录',
 'auth.reg':'创建账号',
 'auth.ph.name':'账号名称（英文字母、数字、_）',
 'auth.ph.pw':'密码（至少 6 个字符）',
 'auth.ph.pw2':'再次输入密码',
 'auth.go.reg':'创建账号并进入游戏',
 'auth.note':'忘记密码将无法找回账号，请牢记。<br>名称不区分大小写与重音符号。',
 'err.name':'账号名称为 3–20 个字符：不含重音的英文字母、数字或 _（不能有空格）。',
 'err.pw6':'密码至少需要 6 个字符。',
 'err.pwmatch':'两次输入的密码不一致。',
 'err.connecting':'连接中…',
 'err.entering':'进入游戏中…',
 'err.nonet':'无法连接到服务器，请检查网络后重试。',
 'err.confirm':'服务器仍开启了“Confirm email”。请到 Supabase → Authentication → Sign In / Providers → 关闭 Confirm email → Save changes。',
 'err.badlogin':'账号名称或密码错误。',
 'err.exists':'该账号名称已被使用，请换一个。',
 'err.signupoff':'服务器当前关闭了新账号注册。',
 'err.emailoff':'服务器尚未开启邮箱登录（Authentication → Providers → Email）。',
 'err.rate':'尝试次数过多，请稍后再试。',
 'err.server':'服务器错误：{m}',
 'err.expired':'登录已过期，请重新登录。',
 'st.saving':'保存中…',
 'st.offline':'离线，暂存于本机',
 'st.saved':'已保存 {t}',
 'st.saverr':'保存失败：{m}',
 'st.loaded':'已加载',
 'st.loaderr':'加载存档失败：{m}',
 'acc.logout':'退出登录',
 'acc.logout.confirm':'要退出 {name} 吗？',
 'bag.title':'储物袋',
 'bag.tab.in':'袋内',
 'bag.tab.journal':'道记',
 'bag.close':'关闭',
 'bag.empty':'袋中空间还是空的……<br>击败妖兽即可获得宝物。',
 'bag.tap':'点击物品查看详情。',
 'bag.cap':'袋中空间：{n} / {cap} 种',
 'j.account':'账号','j.items':'物品','j.none':'暂无','j.hp':'气血','j.pos':'位置（格）',
 'j.steps':'已行走距离','j.steps.v':'{n} 格','j.kills':'击败水龙','j.time':'游玩时间',
 'j.lastsave':'上次保存到服务器','j.never':'尚未',
 't.h':'{n} 小时','t.m':'{n} 分','t.s':'{n} 秒',
 'set.title':'设置','set.lang':'语言','set.account':'账号','set.name':'登录名称','set.langnote':'语言设置会随账号保存。'
};

var cur='vi',subs=[],LSK='tt_lang';
function ok(c){for(var i=0;i<LANGS.length;i++)if(LANGS[i].c===c)return true;return false;}
function guess(){
  var s=null;try{s=localStorage.getItem(LSK);}catch(e){}
  if(s&&ok(s))return s;
  var n=((navigator.languages&&navigator.languages[0])||navigator.language||'vi').toLowerCase();
  if(n.indexOf('zh')===0)return (/tw|hk|mo|hant/.test(n))?'zh-Hant':'zh-Hans';
  return 'vi';
}
function t(k,p){
  var s=(D[cur]&&D[cur][k]);if(s==null)s=D.vi[k];if(s==null)return k;
  if(p)s=s.replace(/\{(\w+)\}/g,function(m,a){return p[a]!=null?p[a]:m;});
  return s;
}
function has(k){return D[cur]&&D[cur][k]!=null||D.vi[k]!=null;}
function apply(root){
  root=root||document;var e,i;
  e=root.querySelectorAll('[data-i18n]');for(i=0;i<e.length;i++)e[i].textContent=t(e[i].getAttribute('data-i18n'));
  e=root.querySelectorAll('[data-i18n-html]');for(i=0;i<e.length;i++)e[i].innerHTML=t(e[i].getAttribute('data-i18n-html'));
  e=root.querySelectorAll('[data-i18n-ph]');for(i=0;i<e.length;i++)e[i].setAttribute('placeholder',t(e[i].getAttribute('data-i18n-ph')));
}
function set(c,silent){
  if(!ok(c))return false;
  var changed=c!==cur;cur=c;
  try{localStorage.setItem(LSK,c);}catch(e){}
  for(var i=0;i<LANGS.length;i++)if(LANGS[i].c===c)document.documentElement.lang=LANGS[i].h;
  document.title=t('title');apply();
  if(changed&&!silent)subs.forEach(function(f){try{f(c);}catch(e){}});
  return changed;
}
function fmtTime(s){
  s=Math.round(s);var h=Math.floor(s/3600),m=Math.floor(s%3600/60),r=s%60,sp=cur==='vi'?' ':'';
  return (h?t('t.h',{n:h})+sp:'')+t('t.m',{n:m})+sp+t('t.s',{n:r});
}
window.I18N={add:function(c,o){for(var k in o)D[c][k]=o[k];},LANGS:LANGS,t:t,has:has,apply:apply,set:set,fmtTime:fmtTime,on:function(f){subs.push(f);},get lang(){return cur;},
  itemName:function(id){var k='item.'+id;return has(k)?t(k):id;},
  itemDesc:function(id){var k='itemdesc.'+id;return has(k)?t(k):t('itemdesc.default');}};
cur=guess();
document.documentElement.lang=cur==='vi'?'vi':cur;
document.title=t('title');
})();
