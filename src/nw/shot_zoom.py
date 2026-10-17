import sys
sys.path.insert(0,'.')
from test_auth import *
from PIL import Image
combos=[('hog',''),('o',''),('h',''),('g',''),('hog','w.han_bang')]
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=8)
    mock=Mock(); ctx.route(f'https://{HOST}/**',mock.handle)
    pg=ctx.new_page(); pg.goto('file://'+S); pg.wait_for_timeout(300)
    pg.click('#tReg'); pg.fill('#aName','z_t'); pg.fill('#aPw','abcdef'); pg.fill('#aPw2','abcdef'); pg.click('#aGo'); pg.wait_for_timeout(1000)
    pg.evaluate("G.redeem('tuchan')"); pg.wait_for_timeout(300)
    ims=[]
    def shot(ms=None):
        if ms is not None: pg.evaluate("G.P.atkT=G.now()-%d"%ms)
        pg.screenshot(path='/tmp/z.png',clip={'x':170,'y':395,'width':60,'height':50}); return Image.open('/tmp/z.png').copy()
    for cs,w in combos:
        pg.evaluate("['h','o','g'].forEach(k=>{if(G.cult.eq[k])G.equipToggle(G.cult.eq[k])});G.cult.eq.w&&G.equipToggle(G.cult.eq.w)")
        pg.evaluate("(cs)=>{for(const k of cs)G.equipToggle('tb.tu_dien.'+k)}",list(cs))
        if w: pg.evaluate("(w)=>G.equipToggle(w)",w)
        pg.wait_for_timeout(300)
        ims.append(shot())
        if w:
            ims.append(shot(60)); ims.append(shot(300))
    W,H=ims[0].size
    n=len(ims); cols=4; rows=(n+cols-1)//cols
    s=Image.new('RGB',(W*cols//2,H*rows//2),(0,0,0))
    for k,i in enumerate(ims): s.paste(i.resize((W//2,H//2),Image.LANCZOS),((k%cols)*W//2,(k//cols)*H//2))
    s.save('zoom_sheet.png'); a=Image.new('RGB',(W*3,H)); [a.paste(ims[-3+k],(k*W,0)) for k in range(3)]; a.save('zoom_atk.png'); print(s.size)
