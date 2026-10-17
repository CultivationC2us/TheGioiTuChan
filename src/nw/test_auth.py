import json, time, sys
from playwright.sync_api import sync_playwright

S = '/tmp/claude-0/-home-claude/3557922d-097f-524e-bc43-9c215c1e40de/scratchpad/nw/game.html'
HOST = 'ehrknssxyojpncqtimfq.supabase.co'
CORS = {'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*'}

class Mock:
    def __init__(s, confirm_on=False, bad_domain=None):
        s.users = {}      # email -> (pw, uid)
        s.saves = {}      # uid -> row
        s.toks = {}       # access -> uid
        s.rt = {}         # refresh -> uid
        s.n = 0
        s.log = []
        s.confirm_on = confirm_on
        s.bad_domain = bad_domain
    def sess(s, uid, email):
        s.n += 1
        at = f'AT{s.n}'; rt = f'RT{s.n}'
        s.toks[at] = uid; s.rt[rt] = uid
        return {'access_token': at, 'refresh_token': rt, 'expires_in': 3600, 'expires_at': int(time.time()) + 3600,
                'user': {'id': uid, 'email': email}}
    def handle(s, route, req):
        u = req.url; m = req.method
        s.log.append((m, u.split(HOST)[1]))
        if m == 'OPTIONS':
            return route.fulfill(status=204, headers=CORS)
        h = dict(CORS); h['content-type'] = 'application/json'
        body = json.loads(req.post_data) if req.post_data else {}
        path = u.split(HOST)[1]
        if path.startswith('/auth/v1/signup'):
            e = body['email']
            if s.bad_domain and e.endswith('@' + s.bad_domain):
                return route.fulfill(status=400, headers=h, body=json.dumps({'code': 400, 'error_code': 'email_address_invalid', 'msg': f'Email address "{e}" is invalid'}))
            if e in s.users:
                return route.fulfill(status=422, headers=h, body=json.dumps({'code': 422, 'error_code': 'user_already_exists', 'msg': 'User already registered'}))
            if len(body['password']) < 6:
                return route.fulfill(status=422, headers=h, body=json.dumps({'code': 422, 'msg': 'Password should be at least 6 characters.'}))
            uid = f'uid-{len(s.users)+1}'
            s.users[e] = (body['password'], uid)
            if s.confirm_on:
                return route.fulfill(status=200, headers=h, body=json.dumps({'id': uid, 'email': e}))
            return route.fulfill(status=200, headers=h, body=json.dumps(s.sess(uid, e)))
        if path.startswith('/auth/v1/token?grant_type=password'):
            e = body['email']
            if e in s.users and s.users[e][0] == body['password']:
                return route.fulfill(status=200, headers=h, body=json.dumps(s.sess(s.users[e][1], e)))
            return route.fulfill(status=400, headers=h, body=json.dumps({'code': 400, 'error_code': 'invalid_credentials', 'msg': 'Invalid login credentials'}))
        if path.startswith('/auth/v1/token?grant_type=refresh_token'):
            uid = s.rt.get(body['refresh_token'])
            if not uid:
                return route.fulfill(status=400, headers=h, body=json.dumps({'msg': 'Invalid Refresh Token'}))
            return route.fulfill(status=200, headers=h, body=json.dumps(s.sess(uid, 'x')))
        if path.startswith('/rest/v1/saves'):
            auth = req.headers.get('authorization', '')
            uid = s.toks.get(auth.replace('Bearer ', ''))
            if not uid:
                return route.fulfill(status=401, headers=h, body=json.dumps({'message': 'JWT invalid'}))
            if m == 'GET':
                row = s.saves.get(uid)
                return route.fulfill(status=200, headers=h, body=json.dumps([row] if row else []))
            if m == 'POST':
                assert body['user_id'] == uid
                s.saves[uid] = {'data': body['data'], 'updated_at': body['updated_at']}
                return route.fulfill(status=201, headers=h, body='')
        route.fulfill(status=404, headers=h, body='{}')

def run():
    res = []
    def ok(c, msg):
        res.append((bool(c), msg)); print(('PASS ' if c else 'FAIL ') + msg)
    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx = b.new_context(viewport={'width': 390, 'height': 800}, device_scale_factor=2)
        mock = Mock()
        ctx.route(f'https://{HOST}/**', mock.handle)
        pg = ctx.new_page()
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None)
        pg.goto('file://' + S)
        pg.wait_for_timeout(500)
        ok(pg.is_visible('#auth'), 'màn đăng nhập hiện khi chưa có phiên')
        ok(pg.evaluate('window.__pause') is True, 'game tạm dừng khi chưa đăng nhập')
        pg.screenshot(path=S.replace('game.html', 'auth_login.png'))
        # validation
        pg.click('#tReg'); pg.wait_for_timeout(100)
        ok(pg.is_visible('#aPw2'), 'tab tạo tài khoản hiện ô nhập lại mật khẩu')
        pg.fill('#aName', 'ab'); pg.fill('#aPw', '123456'); pg.fill('#aPw2', '123456'); pg.click('#aGo')
        ok('3–20' in pg.inner_text('#aErr'), 'tên quá ngắn bị chặn')
        pg.fill('#aName', 'Minh Long'); pg.click('#aGo')
        ok('3–20' in pg.inner_text('#aErr'), 'tên có khoảng trắng bị chặn')
        pg.fill('#aName', 'Minh_Long'); pg.fill('#aPw', '123'); pg.fill('#aPw2', '123'); pg.click('#aGo')
        ok('6 ký tự' in pg.inner_text('#aErr'), 'mật khẩu ngắn bị chặn')
        pg.fill('#aPw', '123456'); pg.fill('#aPw2', '654321'); pg.click('#aGo')
        ok('chưa giống' in pg.inner_text('#aErr'), 'hai mật khẩu khác nhau bị chặn')
        ok(len([l for l in mock.log if l[0] == 'POST']) == 0, 'chưa gọi máy chủ khi dữ liệu sai')
        pg.screenshot(path=S.replace('game.html', 'auth_reg.png'))
        # đăng ký thành công
        pg.fill('#aName', 'Minh_Long'); pg.fill('#aPw', '123456'); pg.fill('#aPw2', '123456'); pg.click('#aGo')
        pg.wait_for_timeout(800)
        ok(not pg.is_visible('#auth'), 'đăng ký xong vào game')
        ok(pg.evaluate('window.__pause') is False, 'game chạy lại sau đăng nhập')
        ok('minh_long@tuchan.game' in mock.users, 'email giả = ten@tuchan.game (đã bỏ hoa/thường)')
        ok(len(mock.saves) == 1, 'tạo dòng save đầu tiên cho tài khoản mới')
        # chơi: di chuyển, nhặt đồ
        pg.evaluate("(()=>{G.P.x=1500;G.P.y=1700;G.P.f=-1;G.P.hp=63;G.loot['Thủy Long Châu']=2;G.lootUI();})()")
        pg.evaluate("TT.push(false,false)")
        pg.wait_for_timeout(500)
        sv = list(mock.saves.values())[0]['data']
        ok(abs(sv['x'] - 1500) < 1 and sv['hp'] == 63 and sv['loot'].get('Thủy Long Châu') == 2, f'save lên máy chủ đúng: {sv}')
        ok('Đã lưu' in pg.inner_text('#accS'), 'chip trạng thái hiện "Đã lưu"')
        # tải lại trang: tự đăng nhập bằng phiên cũ, tải tiến độ
        pg.reload(); pg.wait_for_timeout(900)
        st = pg.evaluate("({x:G.P.x,y:G.P.y,hp:G.P.hp,f:G.P.f,l:G.loot,cx:G.cam.x})")
        ok(not pg.is_visible('#auth'), 'tải lại trang → tự vào game, không hỏi lại')
        ok(abs(st['x'] - 1500) < 1 and abs(st['y'] - 1700) < 1 and st['hp'] == 63 and st['f'] == -1, f'khôi phục vị trí/máu: {st}')
        ok(st['l'].get('Thủy Long Châu') == 2, 'khôi phục túi đồ')
        ok('Thủy Long Châu' in pg.inner_text('#loot'), 'túi đồ hiển thị trên màn hình')
        ok(abs(st['cx'] - 1500) < 2, 'camera nhảy tới nhân vật')
        pg.screenshot(path=S.replace('game.html', 'auth_ingame.png'))
        # gõ chữ j/space trong ô nhập không bị game chặn
        # đăng xuất → đăng nhập lại ở "thiết bị khác" (context mới)
        ctx2 = b.new_context(viewport={'width': 390, 'height': 800})
        ctx2.route(f'https://{HOST}/**', mock.handle)
        p2 = ctx2.new_page(); p2.goto('file://' + S); p2.wait_for_timeout(400)
        p2.type('#aName', 'MINH_long', delay=20)
        p2.type('#aPw', 'sai-mat-khau'); p2.click('#aGo'); p2.wait_for_timeout(500)
        ok('Sai tên tài khoản' in p2.inner_text('#aErr'), 'sai mật khẩu → báo lỗi tiếng Việt')
        p2.fill('#aPw', '123456'); p2.click('#aGo'); p2.wait_for_timeout(800)
        st2 = p2.evaluate("({x:G.P.x,hp:G.P.hp,l:G.loot})")
        ok(not p2.is_visible('#auth') and abs(st2['x'] - 1500) < 1, f'thiết bị khác đăng nhập → thấy đúng tiến độ: {st2}')
        # tạo trùng tên
        ctx3 = b.new_context(viewport={'width': 390, 'height': 800}); ctx3.route(f'https://{HOST}/**', mock.handle)
        p3 = ctx3.new_page(); p3.goto('file://' + S); p3.wait_for_timeout(300); p3.click('#tReg')
        p3.fill('#aName', 'minh_long'); p3.fill('#aPw', 'abcdef'); p3.fill('#aPw2', 'abcdef'); p3.click('#aGo'); p3.wait_for_timeout(500)
        ok('đã có người dùng' in p3.inner_text('#aErr'), 'trùng tên → báo lỗi')
        # tên có dấu → bỏ dấu
        p3.fill('#aName', 'Đạo Hữu'); p3.click('#aGo'); p3.wait_for_timeout(200)
        ok('3–20' in p3.inner_text('#aErr'), 'khoảng trắng bị chặn dù có dấu')
        p3.fill('#aName', 'Đạo_Hữu'); p3.click('#aGo'); p3.wait_for_timeout(800)
        ok('dao_huu@tuchan.game' in mock.users, 'tên có dấu → bỏ dấu thành dao_huu')
        # Confirm email còn bật
        ctx4 = b.new_context(); m4 = Mock(confirm_on=True); ctx4.route(f'https://{HOST}/**', m4.handle)
        p4 = ctx4.new_page(); p4.goto('file://' + S); p4.wait_for_timeout(300); p4.click('#tReg')
        p4.fill('#aName', 'tester'); p4.fill('#aPw', 'abcdef'); p4.fill('#aPw2', 'abcdef'); p4.click('#aGo'); p4.wait_for_timeout(500)
        ok('Confirm email' in p4.inner_text('#aErr') and p4.is_visible('#auth'), 'Confirm email còn bật → hướng dẫn tắt, không vào game')
        # domain đầu bị từ chối → dùng domain dự phòng, đăng nhập lại vẫn được
        ctx5 = b.new_context(); m5 = Mock(bad_domain='tuchan.game'); ctx5.route(f'https://{HOST}/**', m5.handle)
        p5 = ctx5.new_page(); p5.goto('file://' + S); p5.wait_for_timeout(300); p5.click('#tReg')
        p5.fill('#aName', 'tester'); p5.fill('#aPw', 'abcdef'); p5.fill('#aPw2', 'abcdef'); p5.click('#aGo'); p5.wait_for_timeout(800)
        ok(not p5.is_visible('#auth') and 'tester@mailinator.com' in m5.users, 'domain đầu bị từ chối → tự dùng domain dự phòng')
        p5.evaluate("localStorage.clear()")
        p5.reload(); p5.wait_for_timeout(300)
        p5.fill('#aName', 'tester'); p5.fill('#aPw', 'abcdef'); p5.click('#aGo'); p5.wait_for_timeout(800)
        ok(not p5.is_visible('#auth'), 'đăng nhập lại tài khoản dùng domain dự phòng')
        # offline: mất mạng khi đang chơi → vẫn chơi được, lưu tạm máy
        pg.route(f'https://{HOST}/**', lambda r, q: r.abort())
        pg.evaluate("G.P.x=1111")
        pg.evaluate("TT.push(false,true)"); pg.wait_for_timeout(500)
        ok(not pg.is_visible('#auth'), 'mất mạng → game vẫn chơi bình thường')
        ok('Offline' in pg.inner_text('#accS') or 'Lỗi' in pg.inner_text('#accS'), 'báo trạng thái offline: ' + pg.inner_text('#accS'))
        pg.reload(); pg.wait_for_timeout(1200)
        ok(not pg.is_visible('#auth') and abs(pg.evaluate("G.P.x") - 1111) < 1, 'mở lại khi offline → dùng bản lưu tạm trên máy (x=1111)')
        # phiên hết hạn / token hỏng
        ctx6 = b.new_context(); m6 = Mock(); ctx6.route(f'https://{HOST}/**', m6.handle)
        p6 = ctx6.new_page(); p6.goto('file://' + S); p6.wait_for_timeout(300)
        p6.evaluate("localStorage.setItem('tt_session_v1', JSON.stringify({at:'x',rt:'bad',exp:0,uid:'u',name:'ma'}))")
        p6.reload(); p6.wait_for_timeout(800)
        ok(p6.is_visible('#auth') and 'hết hạn' in p6.inner_text('#aErr'), 'phiên hỏng → yêu cầu đăng nhập lại')
        ok(not errs, f'không có lỗi JS: {errs[:3]}')
        b.close()
    bad = [m for c, m in res if not c]
    print('\nTỔNG:', len(res) - len(bad), '/', len(res), 'đạt')
    sys.exit(1 if bad else 0)
if __name__=='__main__':
    run()
