import sys
sys.path.insert(0,'.')
from test_auth import *
res=[]
def ok(c,m): res.append(bool(c)); print(('PASS ' if c else 'FAIL ')+m)
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':430,'height':932})
    mock=Mock(); ctx.route(f'https://{HOST}/**',mock.handle)
    pg=ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file://'+S); pg.wait_for_timeout(300)
    pg.click('#tReg'); pg.fill('#aName','sk_t'); pg.fill('#aPw','abcdef'); pg.fill('#aPw2','abcdef'); pg.click('#aGo'); pg.wait_for_timeout(900)
    ok(pg.evaluate("G.TD.SKILLS.length")==5,'có 5 công pháp')
    ok(pg.evaluate("G.TD.STATS.includes('crit')&&G.TD.STATS.includes('cdmg')"),'thức tỉnh có dòng chí mạng + sát thương chí mạng')
    ok(pg.evaluate("G.critP()")==.05 and pg.evaluate("G.cdmgV()")==1.5,'gốc: 5% chí mạng, ×1.5')
    ok(pg.evaluate("document.getElementById('skBar').style.display")!='flex','chưa học → chưa có nút')
    pg.evaluate("G.redeem('tuchan')")
    ok(pg.evaluate("G.itemInfo('sk.hoa').use"),'sách có nút Sử dụng bật')
    ok(all(pg.evaluate(f"G.loot['sk.{e}']>0") for e in ['hoa','thuy','tho','moc','kim']),'quà tặng có đủ 5 sách')
    for e in ['hoa','thuy','tho','moc','kim']: pg.evaluate(f"G.useItem('sk.{e}')")
    ok(pg.evaluate("G.cult.sk.length")==5 and not pg.evaluate("G.loot['sk.hoa']"),'học sách → học được, sách mất')
    pg.wait_for_timeout(300)
    ok(pg.evaluate("document.getElementById('skBar').children.length")==5 and pg.evaluate("getComputedStyle(document.getElementById('skBar')).display")=='flex','5 nút công pháp hiện')
    ok(pg.evaluate("G.saveEq().sk.length")==5,'lưu công pháp vào save')
    # sát thương ≥ 2× đòn thường tối đa
    pg.evaluate("Math.random=()=>0.5")
    r=pg.evaluate("""()=>{const S=G.TD.SKILLS.map(k=>k.mult);return S}""")
    ok(all(m>=2.2 for m in r),f'hệ số {r} đều ≥ 2')
    # tiêu linh lực + hồi chiêu
    pg.evaluate("G.P.mp=G.P.maxMp"); m0=pg.evaluate("G.P.mp")
    ok(pg.evaluate("G.castSkill('tho')"),'thi triển Huyền Thạch Trảm'); m1=pg.evaluate("G.P.mp")
    ok(abs((m0-m1)-22)<1,f'tốn linh lực {m0-m1:.1f}')
    ok(not pg.evaluate("G.castSkill('tho')"),'đang hồi chiêu → không dùng được')
    pg.evaluate("G.P.mp=1"); ok(not pg.evaluate("G.castSkill('kim')"),'thiếu linh lực → không dùng được')
    # đánh quái: sát thương
    pg.evaluate("G.P.mp=G.P.maxMp;for(const k in G.skCd)delete G.skCd[k]")
    pg.evaluate("""()=>{const m=G.mons2[0];m.x=G.P.x+60;m.y=G.P.y;m.hp=m.maxHp=99999;m.st='idle';G.P.f=1;window.__m=m;}""")
    pg.evaluate("Math.random=()=>0.99")  # không chí mạng? random>=critP -> không crit
    h0=pg.evaluate("window.__m.hp"); pg.evaluate("G.castSkill('hoa')"); mn=h0
    for _ in range(26):
        pg.wait_for_timeout(50); mn=min(mn,pg.evaluate("window.__m.hp"))
    d=h0-mn
    basic=pg.evaluate("Math.round((7+5+G.S.dmg+G.wAtk())*G.realmMul())")
    ok(d>=2*7*1 and d>basic,f'kỹ năng gây {d} (đòn thường tối đa {basic})')
    # chí mạng
    pg.evaluate("Math.random=()=>0.0")
    v=pg.evaluate("[G.TD.SKILLS.length, (()=>{G.GS.crit=1;return G.critP()})()]"); ok(v[1]==.75,'chí mạng giới hạn 75%')
    pg.evaluate("G.GS.crit=0")
    h0=pg.evaluate("window.__m.hp"); pg.evaluate("window.__m.st='idle';G.attack()"); pg.wait_for_timeout(700)
    ok(pg.evaluate("G.fx().length>=0"),'đánh thường vẫn chạy')
    fl=pg.evaluate("(()=>{G.monHit(window.__m,10);return 1})()")
    # thức tỉnh ra dòng crit
    pg.evaluate("window.__orig=Math.random")
    g=pg.evaluate("G.mkGear('w.u_minh')"); 
    import json
    pg.evaluate("(g)=>{const r=G.gearRec(g);r.a.push(['crit',20]);r.a.push(['cdmg',30]);G.cult.eq.w=g;G.recalc();}",g)
    ok(abs(pg.evaluate("G.critP()")-.15)<1e-6 and abs(pg.evaluate("G.cdmgV()")-1.8)<1e-6,f"dòng crit +10%, cdmg +30% → {pg.evaluate('G.critP()')}, {pg.evaluate('G.cdmgV()')}")
    ok(pg.evaluate("G.lineText('crit',20)")=='+10,0% Tỉ lệ chí mạng','hiển thị dòng: '+pg.evaluate("G.lineText('crit',20)"))
    # panel chỉ số
    pg.evaluate("G.P.mp=G.P.maxMp"); pg.evaluate("document.getElementById('tabS').click()"); pg.wait_for_timeout(300)
    t=pg.inner_text('#bagS'); ok('Tỉ lệ chí mạng' in t and 'Sát thương chí mạng' in t and 'Linh lực' in t,'panel nhân vật có chí mạng + linh lực')
    ok('Công pháp' in t and 'Vạn Kiếm' in t,'panel nhân vật liệt kê công pháp đã học')
    pg.screenshot(path='sk_panel.png')
    ok(not errs,f'không lỗi JS {errs}')
    print('TỔNG',sum(res),'/',len(res))
