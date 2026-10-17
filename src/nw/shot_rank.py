import sys
sys.path.insert(0,'.')
from test_auth import *
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2)
    mock=Mock(); ctx.route(f'https://{HOST}/**',mock.handle)
    pg=ctx.new_page(); errs=[]; reqs=[]; pg.on('request',lambda r: reqs.append((r.method,r.url.split('supabase.co')[-1][:60],(r.post_data or '')[:160])) if 'leaderboard' in r.url else 0); pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file://'+S); pg.wait_for_timeout(300)
    pg.click('#tReg'); pg.fill('#aName','rank_t'); pg.fill('#aPw','abcdef'); pg.fill('#aPw2','abcdef'); pg.click('#aGo'); pg.wait_for_timeout(1000)
    pg.evaluate("G.NPCS.forEach((n,i)=>{n.rl=2+i%4;n.kills=i*7+3})")
    pg.screenshot(path='r_hud.png')
    pg.evaluate("TTBag.openRank()"); pg.wait_for_timeout(1200); pg.screenshot(path='r_panel.png')
    pg.evaluate("document.querySelector('#rkTabs button[data-t=\"2\"]').click()"); pg.wait_for_timeout(800); pg.screenshot(path='r_panel2.png')
    print(pg.evaluate('JSON.stringify(TTRank.me())'),pg.evaluate('JSON.stringify(G.rankStat())'));print(reqs[:4]);print(errs)
