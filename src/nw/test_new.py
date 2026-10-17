import sys
sys.path.insert(0,'.')
from test_auth import *
res=[]
def ok(c,m): res.append(bool(c)); print(('PASS ' if c else 'FAIL ')+m)
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':390,'height':800})
    mock=Mock(); ctx.route(f'https://{HOST}/**',mock.handle)
    pg=ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file://'+S); pg.wait_for_timeout(300)
    pg.click('#tReg'); pg.fill('#aName','new_t'); pg.fill('#aPw','abcdef'); pg.fill('#aPw2','abcdef'); pg.click('#aGo'); pg.wait_for_timeout(900)
    ok(pg.evaluate("G.redeem('sai')")==False,'mã sai bị từ chối')
    pg.evaluate("document.getElementById('setBtn').click()"); pg.fill('#setCode','TuChan'); pg.click('#setCodeGo'); pg.wait_for_timeout(200)
    ok('thành công' in pg.inner_text('#setCodeMsg'),'nhập mã (không phân biệt hoa thường) → báo thành công')
    pg.click('#setX')
    ok(pg.evaluate("G.bagFree()")>=0 and pg.evaluate("G.BAG().cap")>1000,'túi tự mở rộng đủ chứa quà')
    ok(pg.evaluate("Object.keys(G.TD.byWeapon).every(k=>G.loot[k]>0)"),'có đủ vũ khí')
    ok(pg.evaluate("G.loot['dp.tukhi']>0&&G.loot['cg.vukhi']>0&&G.loot['lt']>=5000"),'có đan phương, cuộn giản, linh thạch')
    # vũ khí
    a0=pg.evaluate("G.wAtk()"); pg.evaluate("G.equipToggle('w.u_minh')"); a1=pg.evaluate("G.wAtk()")
    ok(a0==0 and a1==16,f'trang bị U Minh Kiếm: atk +{a1}')
    pg.evaluate("G.equipToggle('w.u_minh')"); ok(pg.evaluate("G.wAtk()")==0,'tháo vũ khí')
    # đan dùng xong không mất đan phương; đan dùng được
    pg.evaluate("G.cult.aw=true"); n0=pg.evaluate("G.loot['dan.tukhi']"); pg.evaluate("G.useItem('dan.tukhi')")
    ok(pg.evaluate("G.loot['dan.tukhi']")==n0-1,'dùng đan: giảm 1 viên')
    ok(pg.evaluate("G.loot['dp.tukhi']")>=1,'đan phương không bị tiêu')
    # cuộn giản chế vũ khí
    pg.evaluate("delete G.loot['w.tuyet_van']"); r=pg.evaluate("G.TD.RECIPES['cg.vukhi'].list.length")
    ok(r>=10,f'cuộn giản có {r} công thức')
    # danh mục
    cats=pg.evaluate("[...new Set(Object.keys(G.loot).map(k=>G.TD.catOf(k)))].sort().join()")
    ok(all(c in cats for c in ['dan','duoc','pp','vk','vl']),'danh mục: '+cats)
    # lưu + nạp
    pg.evaluate("G.equipToggle('w.han_bang')"); pg.wait_for_timeout(300)
    ok(pg.evaluate("G.cult.eq.w")=='w.han_bang','đang trang bị Hàn Băng Kiếm')
    ok(errs==[],f'không lỗi JS {errs}')
print('TỔNG',sum(res),'/',len(res))
