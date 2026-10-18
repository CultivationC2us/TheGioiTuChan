import sys
sys.path.insert(0,'.')
from test_auth import *
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':430,'height':932},device_scale_factor=2)
    mock=Mock(); ctx.route(f'https://{HOST}/**',mock.handle)
    pg=ctx.new_page(); pg.on('pageerror',lambda e:print('ERR',e)); pg.goto('file://'+S); pg.wait_for_timeout(300)
    pg.click('#tReg'); pg.fill('#aName','sk_s'); pg.fill('#aPw','abcdef'); pg.fill('#aPw2','abcdef'); pg.click('#aGo'); pg.wait_for_timeout(1200)
    pg.evaluate("G.redeem('tuchan');for(const e of ['hoa','thuy','tho','moc','kim'])G.useItem('sk.'+e);G.P.mp=G.P.maxMp")
    pg.evaluate("G.mons2.forEach(m=>{m.x=-999;m.y=-999})")
    pg.wait_for_timeout(400)
    for i,e in enumerate(['hoa','thuy','tho','moc','kim']):
        pg.evaluate("G.P.mp=G.P.maxMp;for(const k in G.skCd)delete G.skCd[k]")
        pg.evaluate(f"G.castSkill('{e}')")
        pg.wait_for_timeout(560 if e!='kim' else 780)
        pg.screenshot(path=f'sks_{e}.png',clip={'x':60,'y':330,'width':310,'height':260})
    pg.wait_for_timeout(1500)
    pg.screenshot(path='sks_hud.png')
