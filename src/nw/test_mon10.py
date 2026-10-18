import sys
sys.path.insert(0,'.')
from test_auth import *
ok=0;tot=0
def chk(n,c,extra=''):
    global ok,tot;tot+=1;ok+=bool(c);print(('PASS ' if c else 'FAIL ')+n,extra)
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2)
    mock=Mock(); ctx.route(f'https://{HOST}/**',mock.handle)
    pg=ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file://'+S); pg.wait_for_timeout(300)
    pg.click('#tReg'); pg.fill('#aName','s_m10'); pg.fill('#aPw','abcdef'); pg.fill('#aPw2','abcdef'); pg.click('#aGo'); pg.wait_for_timeout(1500)
    NEW=['thachnhan','satrung','dalinh','cotxa','nhanhoa','namlinh','phapkhi','bangtinh','hoakhuyen','hoamoc']
    bad=pg.evaluate("""(()=>{const bad=[];const N=%s;for(const id of N){const d=G.MD[id];if(!d){bad.push(id+':nomd');continue;}
      const fr=[...d.idle,...(d.die||[])];for(const s of d.skills){fr.push(...s.wind,...(s.fx||[]),...(s.dash||[]));}
      for(const f of fr)if(!G.MMETA[id][f])bad.push(id+':'+f);}return bad;})()"""%NEW)
    chk('mọi khung hình của 10 quái mới tồn tại',not bad,bad)
    cnt=pg.evaluate("(()=>{const o={};for(const m of G.mons2)o[m.id]=(o[m.id]||0)+1;return o;})()")
    chk('mỗi quái mới 8 con, quái cũ 10',all(cnt.get(i)==8 for i in NEW) and all(cnt.get(i)==10 for i in ['hoa','tho','kim','moc']),cnt)
    info=pg.evaluate("G.mons2.filter(m=>['dalinh','satrung','hoamoc'].includes(m.id)).slice(0,24).map(m=>m.id+':'+m.rl+':'+m.maxHp+':'+Math.round(m.x/16)+','+Math.round(m.y/16)).join(' ')")
    print(info)
    # tu vi: mới < cùng hệ
    rl=pg.evaluate("(()=>{const o={};for(const m of G.mons2)o[m.id]=m.rl;return o;})()")
    chk('quái mới yếu hơn quái cùng hệ 1 cảnh giới (hoa/tho/kim/moc)',rl['hoamoc']==rl['hoa']-1 and rl['thachnhan']==rl['tho']-1 and rl['phapkhi']==rl['kim']-1 and rl['nhanhoa']==rl['moc']-1 and rl['dalinh']==8,rl)
    # giáp/giày: giết 1 con -> rơi nguyên liệu
    pg.evaluate("Math.random=()=>.1")
    r=pg.evaluate("(()=>{const m=G.mons2.find(m=>m.id==='hoamoc');const n0=G.drops.length;G.monHit(m,99999);return G.drops.map(d=>d.n);})()")
    chk('rơi Giáp Phiến + Ủng Liệu hệ hỏa',('gp.hoa' in dict.fromkeys(r)) and ('uo.hoa' in dict.fromkeys(r)),r)
    names=pg.evaluate("[I18N.itemName('gp.hoa'),I18N.itemName('uo.kim'),I18N.t('monster.dalinh')]")
    chk('tên vật phẩm/quái có',all(n and '.' not in n for n in names),names)
    ic=pg.evaluate("(()=>{const a=G.iconCanvas('gp.moc',3),b=G.iconCanvas('lt',3);return [!!a,!!b,a&&a.width,b&&b.width];})()")
    chk('icon nguyên liệu & Linh Thạch từ thư viện đá',ic[0] and ic[1],ic)
    chk('không lỗi JS',not errs,errs)
    print(ok,'/',tot)
