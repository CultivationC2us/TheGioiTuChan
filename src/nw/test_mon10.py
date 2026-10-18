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
    chk('mỗi loài 5 ổ x 7 con',all(cnt.get(i)==35 for i in NEW+['hoa','tho','kim','moc']),cnt)
    info=pg.evaluate("G.mons2.filter(m=>['dalinh','satrung','hoamoc'].includes(m.id)).slice(0,24).map(m=>m.id+':'+m.rl+':'+m.maxHp+':'+Math.round(m.x/16)+','+Math.round(m.y/16)).join(' ')")
    # tu vi: mới < cùng hệ
    rl=pg.evaluate("(()=>{const o={};for(const m of G.mons2)o[m.id]=m.rl;return o;})()")
    chk('mỗi bầy: thường + tinh anh + thủ lĩnh, tu vi khác nhau, quái nhỏ 1/2',pg.evaluate("(()=>{for(const id of Object.keys(G.MD)){const a=G.mons2.filter(m=>m.id===id);const t=new Set(a.map(m=>m.tier));if(!(t.has(0)&&t.has(1)&&t.has(2)))return id+' thiếu bậc';const lead=a.find(m=>m.tier===2),nor=a.find(m=>m.tier===0);if(!(lead.rl>nor.rl||lead.rl===10))return id+' thủ lĩnh không mạnh hơn';if(!(nor.sc<=G.MD[id].sc*.5+.001))return id+' chưa thu nhỏ';}return 'ok'})()")=='ok',pg.evaluate("1"))
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
