import sys
sys.path.insert(0,'.')
from test_auth import *
res=[]
def ok(c,m): res.append(bool(c)); print(('PASS ' if c else 'FAIL ')+m)
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':390,'height':800},device_scale_factor=2)
    mock=Mock(); ctx.route(f'https://{HOST}/**',mock.handle)
    pg=ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file://'+S); pg.wait_for_timeout(300)
    pg.click('#tReg'); pg.fill('#aName','wrap_t'); pg.fill('#aPw','abcdef'); pg.fill('#aPw2','abcdef'); pg.click('#aGo'); pg.wait_for_timeout(900)
    ok(pg.evaluate("G.tiles.every(r=>r.every(t=>t!==undefined))") ,'bản đồ đủ ô')
    # không còn biển viền: hàng ngoài cùng không toàn nước
    edge=pg.evaluate("(()=>{let w=0,n=0;for(let i=0;i<200;i++){for(const [x,y] of [[i,0],[i,199],[0,i],[199,i]]){n++;if(G.tiles[y][x]===5)w++;}}return w/n})()")
    ok(edge<.1,f'viền bản đồ không còn là biển ({edge:.2%} nước)')
    # liền mạch hai mép: so sánh ô cạnh nhau qua mép (độ lệch giống nội bộ)
    seam=pg.evaluate("(()=>{let a=0,b=0;for(let y=0;y<200;y++){if(G.tiles[y][0]!==G.tiles[y][199])a++;if(G.tiles[y][100]!==G.tiles[y][101])b++;}return [a,b]})()")
    ok(seam[0]<=seam[1]*3+8,f'mép trái/phải liền mạch (khác nhau {seam[0]} vs bên trong {seam[1]})')
    seam=pg.evaluate("(()=>{let a=0,b=0;for(let x=0;x<200;x++){if(G.tiles[0][x]!==G.tiles[199][x])a++;if(G.tiles[50][x]!==G.tiles[51][x])b++;}return [a,b]})()")
    ok(seam[0]<=seam[1]*3+8,f'mép trên/dưới liền mạch ({seam[0]} vs {seam[1]})')
    # đi qua mép phải → xuất hiện bên trái
    pg.evaluate("G.P.x=3200-6;G.P.y=1600;G.cam.x=G.P.x;G.cam.y=G.P.y;G.P.hp=1e6;G.keys.d=1")
    pg.wait_for_timeout(600); pg.evaluate("G.keys.d=0")
    x=pg.evaluate("G.P.x"); ok(0<=x<60,f'qua mép phải → quay lại phía trái (x={x:.0f})')
    ok(abs(pg.evaluate("G.cam.x-G.P.x"))<40,'camera đi theo, không giật qua nửa bản đồ')
    ok(abs(pg.evaluate("G.dog.x-G.P.x"))<60,'chó đi theo qua mép')
    pg.screenshot(path=S.replace('game.html','wrap_x.png'))
    pg.evaluate("G.P.x=1600;G.P.y=6;G.cam.x=G.P.x;G.cam.y=G.P.y;G.keys.w=1"); pg.wait_for_timeout(500); pg.evaluate("G.keys.w=0")
    y=pg.evaluate("G.P.y"); ok(y>3100,f'qua mép trên → xuất hiện phía dưới (y={y:.0f})')
    pg.screenshot(path=S.replace('game.html','wrap_y.png'))
    # đi thẳng một hướng đúng một vòng
    pg.evaluate("G.P.x=2950;G.P.y=1600;G.cam.x=2950;G.cam.y=1600;G.keys.d=1")
    seen=0
    for i in range(40):
        pg.wait_for_timeout(250); x=pg.evaluate("G.P.x")
        if x<1000: seen=1
    pg.evaluate("G.keys.d=0")
    ok(seen==1,'đi mãi về một hướng sẽ vòng lại')
    ok(not errs,'không lỗi JS '+str(errs[:2]))
    b.close()
print('TỔNG',sum(res),'/',len(res))
