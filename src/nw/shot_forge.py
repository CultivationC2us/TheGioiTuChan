from playwright.sync_api import sync_playwright
import sys
sys.path.insert(0,'.')
from test_auth import *
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2)
    mock=Mock(); ctx.route(f'https://{HOST}/**',mock.handle)
    pg=ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file://'+S); pg.wait_for_timeout(300)
    pg.click('#tReg'); pg.fill('#aName','q_f'); pg.fill('#aPw','abcdef'); pg.fill('#aPw2','abcdef'); pg.click('#aGo'); pg.wait_for_timeout(1000)
    print(pg.evaluate("Object.keys(G.loot).filter(k=>k.startsWith('cg.')||k.startsWith('dp.'))"))
    pg.evaluate("G.loot['nl.cay_coi']=3;G.loot.lt=7;G.lootUI()")
    pg.evaluate("TTBag.openTab('T')"); pg.wait_for_timeout(300)
    pg.evaluate("document.querySelector('#bagCats [data-c=pp]').click()");pg.wait_for_timeout(300)
    pg.evaluate("document.querySelector('#bagFl .it[data-n=\"cg.tuyet_van\"]').click()");pg.wait_for_timeout(300)
    pg.evaluate("document.getElementById('biUse').click()");pg.wait_for_timeout(400); pg.screenshot(path='f_forge.png')
    pg.evaluate("document.getElementById('alcX').click()")
    pg.evaluate("document.querySelector('#bagFl .it[data-n=\"dp.tukhi\"]').click()");pg.evaluate("document.getElementById('biUse').click()");pg.wait_for_timeout(300); pg.screenshot(path='f_alc.png')
    print(errs)
