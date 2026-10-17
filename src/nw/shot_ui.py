import sys
sys.path.insert(0,'.')
from test_auth import *
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2)
    mock=Mock(); ctx.route(f'https://{HOST}/**',mock.handle)
    pg=ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else 0)
    pg.goto('file://'+S); pg.wait_for_timeout(300)
    pg.click('#tReg'); pg.fill('#aName','ui_t'); pg.fill('#aPw','abcdef'); pg.fill('#aPw2','abcdef'); pg.click('#aGo'); pg.wait_for_timeout(1000)
    pg.evaluate("G.redeem('tuchan');G.equipToggle('w.han_bang')"); pg.wait_for_timeout(300)
    o=lambda n: S.replace('game.html',n+'.png')
    pg.screenshot(path=o('ui_hud'),clip={'x':0,'y':0,'width':390,'height':200})
    pg.evaluate("TTBag.openTab('T')"); pg.wait_for_timeout(500); pg.screenshot(path=o('ui_bag'))
    pg.evaluate("TTBag.openTab('S')"); pg.wait_for_timeout(500); pg.screenshot(path=o('ui_char'))
    pg.evaluate("TTBag.openTab('R')"); pg.wait_for_timeout(500); pg.screenshot(path=o('ui_tu'))
    pg.evaluate("TTBag.close()")
    pg.evaluate("G.P.atkT=G.now()-60"); pg.wait_for_timeout(5); pg.screenshot(path=o('sw0'),clip={'x':125,'y':330,'width':140,'height':140})
    for i,d in enumerate([170,260]):
        pg.evaluate("G.P.atkT=G.now()-%d"%d); pg.screenshot(path=o('sw%d'%(i+1)),clip={'x':125,'y':330,'width':140,'height':140})
    pg.wait_for_timeout(700); pg.screenshot(path=o('sw_idle'),clip={'x':125,'y':330,'width':140,'height':140})
    pg.click('#mtRide'); pg.wait_for_timeout(1000); pg.screenshot(path=o('ui_ride'),clip={'x':60,'y':300,'width':270,'height':260})
    print(errs)
