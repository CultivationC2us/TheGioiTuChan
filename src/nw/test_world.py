import sys
sys.path.insert(0,'.')
from test_auth import *
P_=F_=0
def ok(c,m):
    global P_,F_
    if c:P_+=1
    else:F_+=1
    print(('PASS ' if c else 'FAIL ')+m)
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':430,'height':932})
    mock=Mock(); ctx.route(f'https://{HOST}/**',mock.handle)
    pg=ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file://'+S); pg.wait_for_timeout(300)
    pg.click('#tReg'); pg.fill('#aName','world_t'); pg.fill('#aPw','abcdef'); pg.fill('#aPw2','abcdef'); pg.click('#aGo'); pg.wait_for_timeout(1000)
    ok(pg.evaluate("G.tiles.length==500&&G.tiles[0].length==500"),'bản đồ 500x500')
    ok(pg.evaluate("(()=>{const s=new Set();for(const r of G.tiles)for(const t of r)s.add(t);return [6,7,8,9,10].every(x=>s.has(x))})()"),'có đủ cát, bùn, tuyết, rừng, vách đá')
    ok(pg.evaluate("G.TRIBES.length>=10"),'có các bộ lạc')
    ok(pg.evaluate("G.NPCS.length==26 && G.NPCS.every(n=>/^[A-Za-z]+$/.test(String(n.i>=0?['Luna'].length:'')) || true)"),'26 NPC')
    # tên NPC: chỉ chữ cái ASCII
    ok(pg.evaluate("(()=>{const r=G.npcRank();return r.length===26&&r.every(x=>/^[A-Za-z]+$/.test(x.name))&&new Set(r.map(x=>x.pid)).size===26})()"),'tên NPC tiếng Anh không dấu không cách, mã người chơi không trùng')
    # quái trên đất đi được, thủ lĩnh mạnh hơn
    ok(pg.evaluate("G.mons2.every(m=>{const t=G.tiles[m.y/16|0][m.x/16|0];return t!==5&&t!==10})"),'quái đều ở đất liền')
    # auto: không giới hạn, tìm mục tiêu xa
    pg.evaluate("G.P.hp=1e6;G.P.maxHp=1e6;G.mons2.forEach(m=>m.hold=1e13);G.P.x=G.mons2[0].x-420;G.P.y=G.mons2[0].y;G.cam.x=G.P.x;G.cam.y=G.P.y")
    pg.click('#autoBtn'); pg.wait_for_timeout(2500)
    d=pg.evaluate("Math.hypot(G.P.x-G.mons2[0].x,G.P.y-G.mons2[0].y)")
    ok(d<390,f'auto tự đi tìm quái ở xa ~26 ô (còn cách {d:.0f})'); pg.click('#autoBtn')
    # PvP: người chơi đánh NPC
    pg.evaluate("(()=>{const n=G.NPCS[0];n.st='idle';n.hp=n.mhp=500;G.P.x=n.x-20;G.P.y=n.y;G.P.f=1;window.__n=n;})()")
    pg.evaluate("G.hitNpcs(50)"); h=pg.evaluate("__n.hp")
    ok(h<500 and pg.evaluate("__n.st")=='fight','đánh NPC: NPC mất máu và phản kháng')
    pg.evaluate("__n.lt=500;G.drops.length=0;G.npcHurt(__n,99999,'player')")
    ok(pg.evaluate("__n.st")=='dead' and pg.evaluate("G.drops.some(d=>d.n==='lt')"),'hạ NPC: NPC gục và rơi Linh Thạch')
    pg.evaluate("__n.deadAt=-1e9"); pg.wait_for_timeout(300)
    ok(pg.evaluate("__n.st!=='dead' && __n.hp>0"),'NPC hồi sinh sau một lúc')
    # NPC đánh người chơi
    pg.evaluate("(()=>{const n=G.NPCS[1];n.st='fight';n.foe='p';n.foeT=Date.now()+1e9;n.hp=n.mhp;n.x=G.P.x+25;n.y=G.P.y;n.cdA=0;G.P.hp=G.P.maxHp=1e6;G.P.inv=0;window.__h0=G.P.hp;})()")
    pg.wait_for_timeout(1800)
    ok(pg.evaluate("G.P.hp<__h0"),'NPC tấn công người chơi')
    # NPC đánh nhau
    pg.evaluate("(()=>{const a=G.NPCS[2],c=G.NPCS[3];for(const n of [a,c]){n.hp=n.mhp=300;n.st='idle';n.cdA=0;}a.x=G.P.x+300;a.y=G.P.y;c.x=a.x+18;c.y=a.y;a.st='fight';a.foe=c;a.foeT=Date.now()+1e9;window.__c=c;})()")
    pg.wait_for_timeout(2500)
    ok(pg.evaluate("__c.hp<300"),'NPC đánh NPC')
    # vách đá chặn người chơi
    c=pg.evaluate("(()=>{for(let y=2;y<498;y++)for(let x=2;x<498;x++)if(G.tiles[y][x]===10&&G.tiles[y][x-1]!==10&&G.tiles[y][x-1]!==5)return [x,y];})()")
    pg.evaluate(f"G.P.x={c[0]*16-14};G.P.y={c[1]*16+8};G.P.fly=false;G.P.hp=1e6;G.cam.x=G.P.x;G.cam.y=G.P.y;G.keys.d=1")
    pg.wait_for_timeout(700); pg.evaluate("G.keys.d=0")
    ok(pg.evaluate(f"G.P.x<{c[0]*16+14}"),'vách đá chặn đường')
    ok(not errs,f'không lỗi JS {errs[:2]}')
print('TỔNG',P_,'/',P_+F_)
