import sys
sys.path.insert(0,'.')
from test_auth import *
res=[]
def ok(c,m): res.append(bool(c)); print(('PASS ' if c else 'FAIL ')+m)
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':430,'height':932},device_scale_factor=2)
    mock=Mock(); ctx.route(f'https://{HOST}/**',mock.handle)
    pg=ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file://'+S); pg.wait_for_timeout(300)
    pg.click('#tReg'); pg.fill('#aName','cat_t'); pg.fill('#aPw','abcdef'); pg.fill('#aPw2','abcdef'); pg.click('#aGo'); pg.wait_for_timeout(1000)
    ok(pg.evaluate("G.TD.MONS.some(m=>m.id==='hacmieu')"),'Hắc Miêu có trong danh sách linh thú')
    pg.evaluate("G.redeem('tuchan')")
    ok(pg.evaluate("G.PETS.includes('hacmieu')"),'mã quà tặng Hắc Miêu')
    ok(pg.evaluate("I18N.t('monster.hacmieu')")=='Hắc Miêu','tên: '+pg.evaluate("I18N.t('monster.hacmieu')"))
    # tách mèo ra khỏi quái khác, đặt 1 quái gần chủ
    pg.evaluate("""()=>{G.mons2.forEach(m=>{m.x=-999;m.y=-999});const m=G.mons2[0];m.x=G.P.x+90;m.y=G.P.y+10;m.hp=m.maxHp=99999;m.st='idle';m.hx=m.x;m.hy=m.y;window.__m=m;
      const o=G.petObjs.find(o=>o.id==='hacmieu');window.__o=o;}""")
    mn=99999;seen=set()
    for _ in range(60):
        pg.wait_for_timeout(100)
        mn=min(mn,pg.evaluate("window.__m.hp"));seen.add(pg.evaluate("window.__o.st||'move'"))
        pg.evaluate("window.__m.x=Math.max(window.__m.x,G.P.x+60)")  # giữ quái không chạy xa
    ok(mn<99999,f'mèo tự đánh quái: máu {mn}/99999 · trạng thái {sorted(seen)}')
    pg.screenshot(path='cat_fight.png',clip={'x':100,'y':380,'width':230,'height':170})
    # ngủ khi chủ đứng yên
    pg.evaluate("G.mons2.forEach(m=>{m.x=-999;m.y=-999})"); pg.wait_for_timeout(2500)
    pg.evaluate("window.__o.idleT=G.now()-7000"); pg.wait_for_timeout(300); ok(pg.evaluate("window.__o.sleep===true"),'chủ đứng yên lâu → mèo ngủ')
    pg.screenshot(path='cat_sleep.png',clip={'x':100,'y':380,'width':230,'height':170})
    # vũ khí ném ra đất có ảnh
    w=pg.evaluate("Object.keys(G.loot).find(k=>k.startsWith('w.'))"); pg.evaluate("(w)=>G.dropItem(w)",w)
    pg.evaluate("G.drops.push({x:G.P.x+60,y:G.P.y+20,t0:G.now(),n:Object.keys(G.loot).find(k=>k.startsWith('tb.')||k.startsWith('o.')),pa:G.now()+9e4,exp:G.now()+9e5})")
    pg.wait_for_timeout(400); pg.screenshot(path='drop_weapon.png',clip={'x':100,'y':380,'width':230,'height':170})
    ok(pg.evaluate("!!G.iconCanvas('%s',1)"%w),'icon vũ khí tồn tại')
    ok(not errs,f'không lỗi JS {errs}')
    print('TỔNG',sum(res),'/',len(res))
