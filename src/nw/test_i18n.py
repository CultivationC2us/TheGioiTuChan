import sys
sys.path.insert(0,'.')
from test_auth import *
def run3():
    res=[]
    def ok(c,m): res.append(bool(c)); print(('PASS ' if c else 'FAIL ')+m)
    with sync_playwright() as p:
        b=p.chromium.launch()
        mock=Mock()
        def newctx(loc='en-US'):
            c=b.new_context(viewport={'width':390,'height':800},device_scale_factor=2,locale=loc)
            c.route(f'https://{HOST}/**',mock.handle); return c
        errs=[]
        # 1) ngôn ngữ mặc định theo máy
        for loc,exp in [('en-US','vi'),('vi-VN','vi'),('zh-TW','zh-Hant'),('zh-HK','zh-Hant'),('zh-CN','zh-Hans')]:
            c=newctx(loc); pg=c.new_page(); pg.goto('file://'+S); pg.wait_for_timeout(250)
            ok(pg.evaluate('I18N.lang')==exp and pg.evaluate('document.documentElement.lang')==exp,f'máy {loc} → mặc định {exp}')
            c.close()
        # 2) màn đăng nhập đổi ngôn ngữ
        c=newctx(); pg=c.new_page(); pg.on('pageerror',lambda e:errs.append(str(e))); pg.goto('file://'+S); pg.wait_for_timeout(300)
        ok(pg.locator('#aLang button').count()==3,'màn đăng nhập có 3 nút ngôn ngữ')
        ok(pg.inner_text('#aGo')=='Đăng nhập','mặc định tiếng Việt')
        pg.click('#aLang button[data-c="zh-Hant"]'); pg.wait_for_timeout(150)
        ok(pg.inner_text('#aLang button.on')=='繁體中文' and pg.inner_text('#aForm h1')=='修真世界' and pg.inner_text('#aGo')=='登入','đổi sang 繁體: tiêu đề + nút đổi')
        ok(pg.get_attribute('#aName','placeholder').startswith('帳號名稱'),'placeholder đổi theo (繁體)')
        ok(pg.evaluate('document.title')=='修仙・新世界','tiêu đề tab trình duyệt đổi')
        pg.fill('#aName','zh_user'); pg.fill('#aPw','123'); pg.click('#aGo')
        ok('至少需要 6' in pg.inner_text('#aErr'),'lỗi mật khẩu ngắn hiện bằng tiếng Trung')
        pg.click('#aLang button[data-c="zh-Hans"]'); pg.wait_for_timeout(150)
        ok(pg.inner_text('#aGo')=='登录' and pg.inner_text('#tReg')=='创建账号','đổi sang 简体: 登录 / 创建账号')
        pg.screenshot(path=S.replace('game.html','i18n_login.png'))
        pg.click('#tReg')
        ok(pg.inner_text('#aGo')=='创建账号并进入游戏','nút tạo tài khoản dịch đúng')
        pg.fill('#aName','zh_user'); pg.fill('#aPw','abcdef'); pg.fill('#aPw2','abcdee'); pg.click('#aGo')
        ok('不一致' in pg.inner_text('#aErr'),'lỗi hai mật khẩu khác nhau (简体)')
        pg.fill('#aPw2','abcdef'); pg.click('#aGo'); pg.wait_for_timeout(900)
        # 3) trong game
        ok(pg.inner_text('#atk')=='攻击' and '拖动屏幕' in pg.inner_text('#hint') and pg.inner_text('#monN')=='水龙','HUD trong game: 攻击 / hướng dẫn / 水龙')
        ok(pg.is_visible('#setBtn') and pg.is_visible('#bagBtn'),'nút Cài đặt (bánh răng) và Túi cùng hiện')
        ok('已保存' in pg.inner_text('#accS') or '已加载' in pg.inner_text('#accS'),'trạng thái lưu bằng tiếng Trung: '+pg.inner_text('#accS'))
        pg.click('#setBtn'); pg.wait_for_timeout(200)
        ok(pg.is_visible('#set') and pg.inner_text('#set h2')=='设置','mở Cài đặt (设置)')
        ok(pg.inner_text('#setL button.on')=='简体中文' and pg.locator('#setL button').count()==3,'danh sách ngôn ngữ đánh dấu đúng ngôn ngữ hiện tại')
        pg.screenshot(path=S.replace('game.html','i18n_settings.png'))
        pg.click('#setL button:has-text("繁體中文")'); pg.wait_for_timeout(300)
        ok(pg.inner_text('#set h2')=='設定' and pg.inner_text('#atk')=='攻擊','đổi ngôn ngữ ngay trong game: 設定 / 攻擊')
        pg.click('#setX')
        # túi đồ theo ngôn ngữ
        pg.evaluate("G.loot['Thủy Long Châu']=1;G.lootUI()")
        pg.click('#bagBtn'); pg.wait_for_timeout(400)
        ok(pg.inner_text('#bag h2')=='儲物袋' and '背包容量' in pg.inner_text('#bagCap'),'túi: 儲物袋 + "背包容量 …"')
        ok('水龍珠' in pg.inner_text('#bagStage'),'tên vật phẩm hiển thị 水龍珠 (id nội bộ vẫn giữ nguyên)')
        pg.click('#bagStage .it[data-n="Thủy Long Châu"]',force=True); pg.wait_for_timeout(150)
        ok('水' in pg.inner_text('#bagInfo') and '龍珠' in pg.inner_text('#bagInfo'),'mô tả vật phẩm bằng tiếng Trung')
        pg.screenshot(path=S.replace('game.html','i18n_bag.png'))
        ok('tabJ' not in pg.content(),'không còn tab Đạo Ký')
        pg.click('#bagX')
        ok(list(mock.saves.values())[0]['data'].get('loot') is not None,'loot id vẫn là tiếng Việt trong save')
        pg.evaluate("TT.push(false,true)"); pg.wait_for_timeout(500)
        sv=list(mock.saves.values())[0]['data']
        ok(sv['set']['lang']=='zh-Hant',f"ngôn ngữ được lưu vào tài khoản: {sv['set']}")
        # 4) thiết bị khác (máy tiếng Anh) → đăng nhập → tự theo ngôn ngữ tài khoản
        c2=newctx('en-US'); p2=c2.new_page(); p2.goto('file://'+S); p2.wait_for_timeout(300)
        ok(p2.inner_text('#aGo')=='Đăng nhập','máy mới mặc định tiếng Việt')
        p2.fill('#aName','zh_user'); p2.fill('#aPw','abcdef'); p2.click('#aGo'); p2.wait_for_timeout(900)
        ok(p2.evaluate('I18N.lang')=='zh-Hant' and p2.inner_text('#atk')=='攻擊','đăng nhập máy khác → tự chuyển sang 繁體 theo tài khoản')
        # 5) đăng xuất qua Cài đặt
        p2.on('dialog',lambda d:d.accept())
        p2.click('#setBtn'); p2.wait_for_timeout(150); p2.click('#setOut'); p2.wait_for_timeout(1200)
        ok(p2.is_visible('#auth') and not p2.is_visible('#setBtn'),'đăng xuất từ Cài đặt → về màn đăng nhập, nút ẩn')
        ok(p2.inner_text('#aGo')=='登入','màn đăng nhập giữ ngôn ngữ đã chọn (繁體)')
        # 6) chuyển về tiếng Việt
        p2.click('#aLang button[data-c="vi"]'); p2.wait_for_timeout(150)
        ok(p2.inner_text('#aGo')=='Đăng nhập' and p2.evaluate('document.title')=='Tu Tiên · Thế Giới Mới','về lại tiếng Việt')
        ok(not errs,f'không lỗi JS {errs[:2]}')
        b.close()
    print('TỔNG',sum(res),'/',len(res)); sys.exit(0 if all(res) else 1)
run3()
