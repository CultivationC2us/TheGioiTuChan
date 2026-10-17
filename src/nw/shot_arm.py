import sys
sys.path.insert(0,'.')
from test_auth import *
from PIL import Image
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=4)
    mock=Mock(); ctx.route(f'https://{HOST}/**',mock.handle)
    pg=ctx.new_page(); pg.goto('file://'+S); pg.wait_for_timeout(300)
    pg.click('#tReg'); pg.fill('#aName','arm_t'); pg.fill('#aPw','abcdef'); pg.fill('#aPw2','abcdef'); pg.click('#aGo'); pg.wait_for_timeout(1000)
    pg.evaluate("G.redeem('tuchan');['h','o','g'].forEach(k=>G.equipToggle('tb.tu_dien.'+k));G.equipToggle('w.han_bang')"); pg.wait_for_timeout(400)
    ims=[]
    for ms in (20,100,180,260,340,420):
        pg.evaluate("G.P.atkT=G.now()-%d"%ms); 
        pg.evaluate("window.__f=1")
        pg.screenshot(path='/tmp/a.png',clip={'x':150,'y':355,'width':120,'height':110}); ims.append(Image.open('/tmp/a.png').copy())
    W=sum(i.width for i in ims[:3]); s=Image.new('RGB',(ims[0].width*3,ims[0].height*2))
    for k,i in enumerate(ims): s.paste(i,((k%3)*i.width,(k//3)*i.height))
    s.save('arm_sheet.png')
