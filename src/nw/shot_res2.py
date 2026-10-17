import sys
sys.path.insert(0,'.')
from test_auth import *
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':390,'height':800},device_scale_factor=2)
    mock=Mock(); ctx.route(f'https://{HOST}/**',mock.handle)
    pg=ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file://'+S); pg.wait_for_timeout(300)
    pg.click('#tReg'); pg.fill('#aName','shot2'); pg.fill('#aPw','abcdef'); pg.fill('#aPw2','abcdef'); pg.click('#aGo'); pg.wait_for_timeout(900)
    new=['kim_ngan_hoa','bach_kim_thao','huyen_thiet_thao','tinh_kim_thach','thanh_tam_thao','ngoc_linh_thao','cuu_diep_linh_chi','thanh_linh_moc','tuyet_lien','thuy_tinh_thao','han_bang_thao','thuy_linh_thach','hoa_lien','hoa_linh_chi','huyet_linh_thao','hoa_tinh_thach','hoang_tinh_thao','dia_tam_thao','tho_linh_chi','hoang_tho_thach']
    # đặt 20 nguồn thành lưới quanh người chơi
    pg.evaluate("""(ids)=>{const P=G.P;P.x=1600;P.y=1600;G.cam.x=P.x;G.cam.y=P.y;
      for(const n of G.nodes){n.gone=true;}
      ids.forEach((id,i)=>{const g=G.TD.byId[id];const n=G.nodes.find(o=>o.g===g)||null;if(n){n.gone=false;n.x=P.x-80+(i%5)*40;n.y=P.y-50+Math.floor(i/5)*34;n.h=0;}});}""",new)
    pg.wait_for_timeout(500); pg.screenshot(path=S.replace('game.html','res2_world.png'))
    pg.evaluate("(ids)=>{ids.forEach(id=>G.loot['nl.'+id]=1);G.lootUI()}",new)
    pg.click('#bagBtn'); pg.click('#tabT'); pg.wait_for_timeout(800); pg.screenshot(path=S.replace('game.html','res2_bag.png'))
    print(errs)
