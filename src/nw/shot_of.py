import sys
sys.path.insert(0,'.')
from test_auth import *
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=3)
    mock=Mock(); ctx.route(f'https://{HOST}/**',mock.handle)
    pg=ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else 0)
    pg.goto('file://'+S); pg.wait_for_timeout(300)
    pg.click('#tReg'); pg.fill('#aName','of_t'); pg.fill('#aPw','abcdef'); pg.fill('#aPw2','abcdef'); pg.click('#aGo'); pg.wait_for_timeout(1000)
    pg.evaluate("G.redeem('tuchan');['h','o','g'].forEach(k=>G.equipToggle('tb.tu_dien.'+k));G.equipToggle('w.han_bang')"); pg.wait_for_timeout(400)
    o=lambda n: S.replace('game.html',n+'.png')
    clip={'x':100,'y':310,'width':190,'height':200}
    pg.screenshot(path=o('of_idle'),clip=clip)
    pg.evaluate("G.keys.d=1"); pg.wait_for_timeout(260); pg.screenshot(path=o('of_walk'),clip=clip); pg.evaluate("G.keys.d=0")
    pg.evaluate("G.P.atkT=G.now()-200"); pg.screenshot(path=o('of_atk'),clip=clip)
    pg.screenshot(path=o('of_hud'),clip={'x':0,'y':0,'width':390,'height':180})
    pg.click('#mtRide'); pg.wait_for_timeout(1000); pg.screenshot(path=o('of_ride'),clip={'x':40,'y':290,'width':310,'height':230})
    pg.evaluate("TTBag.openTab('S')"); pg.wait_for_timeout(500); pg.screenshot(path=o('of_char'))
    pg.evaluate("TTBag.openTab('T')"); pg.evaluate("TTBag.select('tb.tu_dien')"); pg.wait_for_timeout(300)
    print(pg.evaluate("document.querySelector('#bagCats').innerText"))
    print(errs)
