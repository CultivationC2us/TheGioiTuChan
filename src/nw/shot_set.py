from playwright.sync_api import sync_playwright
import sys
sys.path.insert(0,'.')
from test_auth import *
from PIL import Image
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':430,'height':932},device_scale_factor=8)
    mock=Mock(); ctx.route(f'https://{HOST}/**',mock.handle)
    pg=ctx.new_page(); pg.goto('file://'+S); pg.wait_for_timeout(300)
    pg.click('#tReg'); pg.fill('#aName','e_t'); pg.fill('#aPw','abcdef'); pg.fill('#aPw2','abcdef'); pg.click('#aGo'); pg.wait_for_timeout(1000)
    pg.evaluate("G.redeem('tuchan')")
    ims=[]
    for sets in (['tb.xich_diem.'],['tb.tu_dien.']):
        pg.evaluate("(pre)=>{['h','o','g','l'].forEach(k=>{G.cult.eq[k]=null});for(const k of Object.keys(G.loot)){if(k.startsWith(pre[0])){const o=G.TD.byOutfit[k];G.cult.eq[G.TD.SLOT[o.part]]=k}}const l=Object.keys(G.loot).find(k=>k.startsWith('lq.'));G.cult.eq.l=l;}",sets)
        pg.wait_for_timeout(350)
        pg.screenshot(path='/tmp/s.png',clip={'x':180,'y':440,'width':70,'height':60}); ims.append(Image.open('/tmp/s.png').copy())
    W,H=ims[0].size; s=Image.new('RGB',(W*2,H)); [s.paste(i,(k*W,0)) for k,i in enumerate(ims)]; s.save('h_zoom.png'); print(s.size)
