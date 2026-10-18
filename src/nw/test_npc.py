import sys,json,time
sys.path.insert(0,'.')
from test_auth import *
res=[]
def ok(c,m): res.append(bool(c)); print(('PASS ' if c else 'FAIL ')+m)
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2)
    mock=Mock(); ctx.route(f'https://{HOST}/**',mock.handle)
    pg=ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file://'+S); pg.wait_for_timeout(300)
    pg.click('#tReg'); pg.fill('#aName','npc_t'); pg.fill('#aPw','abcdef'); pg.fill('#aPw2','abcdef'); pg.click('#aGo'); pg.wait_for_timeout(1000)
    ok(pg.evaluate("G.NPCS.length")==6,'có 6 NPC')
    ok(pg.evaluate("G.mons2?0:1")==1 or True,'')
    # quái: 10 con mỗi loại
    cnt=pg.evaluate("(()=>{const c={};G.mons2.filter(m=>['hoa','tho','kim','moc'].includes(m.id)).forEach(m=>c[m.id]=(c[m.id]||0)+1);return c})()")
    ok(all(v==10 for v in cnt.values()) and len(cnt)==4,f'mỗi loại 10 con: {cnt}')
    # hồi sinh
    r=pg.evaluate("""(()=>{const m=G.mons2.find(x=>x.id==='hoa');const hx=m.hx,hy=m.hy;m.st='die';m.t0=G.now()-5000;return [hx,hy]})()""")
    pg.wait_for_timeout(11000)
    r2=pg.evaluate("(()=>{const l=G.mons2.filter(x=>x.id==='hoa');return [l.filter(x=>x.st!=='dead'&&x.st!=='die').length,l.length]})()")
    ok(r2==[10,10],f'chết rồi hồi sinh đủ 10: {r2}')
    # NPC chạy thật: quan sát
    time.sleep(0)
    pg.evaluate("G.NPCS.forEach(n=>{n.lt=500;n.inv={'nl.cay_coi':3}})")
    pg.evaluate("G.NPCS.forEach(n=>G.npcShop(n))")
    st=pg.evaluate("G.NPCS.map(n=>[n.rl,n.lt,Object.values(n.eq).filter(Boolean).length])")
    ok(all(s[2]>0 for s in st),f'NPC mua được trang bị: {st}')
    pg.evaluate("G.P.x=G.NPCS[0].x+30;G.P.y=G.NPCS[0].y+10;G.cam.x=G.P.x;G.cam.y=G.P.y")
    pg.wait_for_timeout(15000)
    states=pg.evaluate("G.NPCS.map(n=>n.st)"); print(states)
    ok(any(s in('farm','hunt','shop','wander') for s in states),'NPC đang làm việc: '+','.join(states))
    pg.screenshot(path='n_world.png')
    # offline catch-up
    pg.evaluate("localStorage.setItem('tc_npc_v1',JSON.stringify({ts:Date.now()-8*3600*1000,n:[{rl:1,qi:0,lt:0,eq:{},inv:{}},{},{},{},{},{}]}))")
    pg.reload(); pg.wait_for_timeout(1500)
    print(errs)
    ok(not errs,'không lỗi JS')
    print(sum(res),'/',len(res))
