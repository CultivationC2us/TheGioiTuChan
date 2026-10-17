import sys
sys.path.insert(0,'.')
from test_auth import *
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':430,'height':932},device_scale_factor=2)
    mock=Mock(); ctx.route(f'https://{HOST}/**',mock.handle)
    pg=ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else 0)
    pg.goto('file://'+S); pg.wait_for_timeout(300)
    pg.click('#tReg'); pg.fill('#aName','sm_t'); pg.fill('#aPw','abcdef'); pg.fill('#aPw2','abcdef'); pg.click('#aGo'); pg.wait_for_timeout(1000)
    for i,(x,y) in enumerate([(8,8),(11*16,3),(5,23*16),(3190,3190)]):
        pg.evaluate(f"G.P.x={x};G.P.y={y};G.cam.x={x};G.cam.y={y}"); pg.wait_for_timeout(400)
        pg.screenshot(path=S.replace('game.html',f'seam{i}.png'),clip={'x':0,'y':250,'width':430,'height':420})
    print(errs)
