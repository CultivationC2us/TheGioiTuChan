from playwright.sync_api import sync_playwright
import sys
sys.path.insert(0,'.')
from test_auth import *
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2)
    mock=Mock(); ctx.route(f'https://{HOST}/**',mock.handle)
    pg=ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else 0)
    pg.goto('file://'+S); pg.wait_for_timeout(300)
    pg.click('#tReg'); pg.fill('#aName','q_t'); pg.fill('#aPw','abcdef'); pg.fill('#aPw2','abcdef'); pg.click('#aGo'); pg.wait_for_timeout(1000)
    pg.evaluate("G.redeem('tuchan');G.setPets(['hoa']);G.cult.eq.p='hoa'")
    pg.evaluate("""(()=>{const pick=(pre)=>Object.keys(G.loot).find(k=>k.startsWith(pre));
      ['tb.tu_dien.h','tb.tu_dien.o','tb.tu_dien.g','nh.hoa','lq.','w.'].forEach(p=>{const id=pick(p);if(id)G.equipToggle(id)});
      for(let i=0;i<7;i++){for(const k of ['h','o','g','r','l','w'])if(G.cult.eq[k])G.awaken(G.cult.eq[k]);}
      const m=Object.keys(G.loot).find(k=>G.TD.byMount[k]);G.cult.mtSel=m;})()""")
    pg.wait_for_timeout(400)
    pg.evaluate("TTBag.openTab('S')"); pg.wait_for_timeout(600); pg.screenshot(path='q_char.png')
    pg.evaluate("document.querySelector('.slot[data-e=\"h\"]').click()"); pg.wait_for_timeout(400); pg.screenshot(path='q_pop.png')
    pg.evaluate("document.getElementById('eqRep').click()"); pg.wait_for_timeout(300)
    pg.evaluate("document.querySelector('#eqRow .slot').click()"); pg.wait_for_timeout(300); pg.screenshot(path='q_pick.png')
    pg.evaluate("document.getElementById('eqPut').click()"); pg.wait_for_timeout(300); pg.screenshot(path='q_after.png')
    pg.evaluate("document.getElementById('eqX').click()");pg.wait_for_timeout(200)
    pg.evaluate("TTBag.openTab('T')"); pg.wait_for_timeout(500)
    pg.evaluate("document.querySelector('#bagCats [data-c=tb]').click()");pg.wait_for_timeout(300)
    pg.evaluate("document.querySelector('#bagFl .it').click()");pg.wait_for_timeout(300); pg.screenshot(path='q_bag.png')
    print(errs)
