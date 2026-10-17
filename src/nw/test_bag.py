import sys
sys.path.insert(0,'.')
from test_auth import *
def run2():
    res=[]
    def ok(c,m): res.append(bool(c)); print(('PASS ' if c else 'FAIL ')+m)
    with sync_playwright() as p:
        b=p.chromium.launch(); ctx=b.new_context(viewport={'width':390,'height':800},device_scale_factor=2)
        mock=Mock(); ctx.route(f'https://{HOST}/**',mock.handle)
        pg=ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        pg.goto('file://'+S); pg.wait_for_timeout(300)
        ok(not pg.is_visible('#bagBtn'),'nút Túi ẩn khi chưa đăng nhập')
        pg.click('#tReg'); pg.fill('#aName','bag_test'); pg.fill('#aPw','abcdef'); pg.fill('#aPw2','abcdef'); pg.click('#aGo'); pg.wait_for_timeout(800)
        ok(pg.is_visible('#bagBtn'),'nút Túi hiện sau đăng nhập')
        pg.click('#bagBtn'); pg.wait_for_timeout(200)
        ok(pg.is_visible('#bag') and 'Chưa có' in pg.inner_text('#bagS'),'mở túi: trống ban đầu')
        pg.screenshot(path=S.replace('game.html','bag_empty.png'))
        pg.click('#bagT'); pg.wait_for_timeout(300)
        ok(pg.locator('#bagG .slot.has').count()==1,'bấm thêm vật phẩm thử → 1 ô có đồ')
        # đi bộ + thời gian: giả lập bằng chạy vòng lặp thật
        pg.click('#bagX')
        pg.evaluate("window.__pause=false;G.keys.d=1")
        pg.wait_for_timeout(2600); pg.evaluate("G.keys.d=0")
        pg.wait_for_timeout(1200)
        pg.evaluate("TT.push(false,false)"); pg.wait_for_timeout(500)
        sv=list(mock.saves.values())[0]['data']
        ok(sv['loot'].get('Thủy Long Châu')==1,'vật phẩm đã lên máy chủ')
        ok(sv['stats']['steps']>=5 and sv['stats']['sec']>=2, f"đếm quãng đường/thời gian: {sv['stats']}")
        x0=sv['x']
        pg.reload(); pg.wait_for_timeout(900)
        pg.click('#bagBtn'); pg.wait_for_timeout(200)
        txt=pg.inner_text('#bag')
        ok('Thủy Long Châu ×1' in txt,'tải lại → túi vẫn còn vật phẩm')
        ok(pg.locator('#bagG .slot.has').count()==1,'ô đồ vẫn hiện')
        ok(pg.evaluate("G.stats.steps")>=5,'quãng đường được khôi phục')
        pg.screenshot(path=S.replace('game.html','bag_full.png'))
        ok(not errs,f'không lỗi JS {errs[:2]}')
        b.close()
    print('TỔNG',sum(res),'/',len(res)); sys.exit(0 if all(res) else 1)
run2()
