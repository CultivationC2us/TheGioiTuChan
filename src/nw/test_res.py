import sys
sys.path.insert(0,'.')
from test_auth import *
def run3():
    res=[]
    def ok(c,m): res.append(bool(c)); print(('PASS ' if c else 'FAIL ')+m)
    with sync_playwright() as p:
        b=p.chromium.launch(); ctx=b.new_context(viewport={'width':390,'height':800},device_scale_factor=2)
        mock=Mock(); ctx.route(f'https://{HOST}/**',mock.handle)
        pg=ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        pg.goto('file://'+S); pg.wait_for_timeout(300)
        pg.click('#tReg'); pg.fill('#aName','res_test'); pg.fill('#aPw','abcdef'); pg.fill('#aPw2','abcdef'); pg.click('#aGo'); pg.wait_for_timeout(900)
        # ---- bản đồ ----
        info=pg.evaluate("""(()=>{const n=G.nodes,T=G.tiles,bad=[],tc={1:0,2:0,3:0},el={};let near=0,minD=1e9;
          for(const o of n){const tx=o.x/16|0,ty=o.y/16|0;const t=T[ty][tx];if(t>2)bad.push([tx,ty,t]);tc[o.g.tier]++;el[o.g.el]=(el[o.g.el]||0)+1;
            const d=Math.hypot(tx-100,ty-100);minD=Math.min(minD,d);if(d<25)near++;}
          return {n:n.length,bad:bad.length,tc,el,near,minD}})()""")
        print(info)
        ok(250<=info['n']<=900,f"số nguồn tài nguyên hợp lý: {info['n']}")
        ok(info['bad']==0,'không nguồn nào trên nước/gạch/đường')
        ok(info['minD']>=9,f"chừa quảng trường (gần nhất {info['minD']:.1f} ô)")
        ok(all(info['tc'][k]>0 for k in ('1','2','3')) if isinstance(list(info['tc'].keys())[0],str) else all(info['tc'][k]>0 for k in (1,2,3)),f"đủ 3 bậc: {info['tc']}")
        ok(len(info['el'])==5,f"đủ 5 hệ ngũ hành xuất hiện: {info['el']}")
        ok(info['near']>=5,f"có tài nguyên gần điểm xuất phát ({info['near']} trong 25 ô)")
        # ---- khai thác ----
        pg.evaluate("""(()=>{const best=G.nodes.filter(o=>o.g.tier===1).sort((a,b)=>Math.hypot(a.x-1608,a.y-1610)-Math.hypot(b.x-1608,b.y-1610))[0];
           window.__n=best;G.P.x=best.x-14;G.P.y=best.y;G.P.f=1;G.cam.x=G.P.x;G.cam.y=G.P.y;G.M.st='sub';})()""")
        pg.wait_for_timeout(300)
        pg.screenshot(path=S.replace('game.html','res_world.png'))
        hits=pg.evaluate("__n.g.hits")
        for i in range(hits):
            pg.evaluate("G.attack()"); pg.wait_for_timeout(560)
            h=pg.evaluate("__n.h")
            if i==0: ok(h==1,'đánh 1 lần → nguồn nhận 1 đòn')
        ok(pg.evaluate("__n.dead")>0,f'đủ {hits} đòn → cạn (khung 2)')
        ok(pg.evaluate("G.drops.filter(d=>d.ic).length+(G.loot[__n.g.item]|0)")>=1,'rơi vật phẩm có icon (hoặc đã tự nhặt)')
        pg.screenshot(path=S.replace('game.html','res_drop.png'))
        pg.wait_for_timeout(700)
        it=pg.evaluate("__n.g.item")
        ok(pg.evaluate("G.loot[__n.g.item]|0")>=1,f'nhặt được vào túi: {it}')
        # hồi sinh
        pg.evaluate("__n.dead=G.now()-TT_RESPAWN".replace('TT_RESPAWN','91000')); pg.wait_for_timeout(200)
        ok(pg.evaluate("(()=>{G.draw();return __n.dead===0&&__n.h===0})()"),'hết thời gian hồi → mọc lại')
        # ---- luyện hóa ----
        pg.evaluate("for(const k in G.loot)delete G.loot[k];G.loot['nl.cay_coi']=30;G.loot['nl.thao_quy']=2;G.lootUI()")
        pg.click('#bagBtn'); pg.click('#tabR'); pg.wait_for_timeout(300)
        t=pg.inner_text('#bagR')
        ok('Linh Căn' in pg.inner_text('.tabs') and 'nguyên liệu: 32' in t,'tab Linh Căn hiện số nguyên liệu hệ Mộc (32)')
        ok(pg.is_disabled('#rootAw'),'chưa đủ 5 hệ → nút thức tỉnh khoá')
        pg.click('button[data-el=moc]'); pg.wait_for_timeout(200)
        r=pg.evaluate("[G.cult.r.moc,G.loot['nl.thao_quy']|0,G.loot['nl.cay_coi']|0]")
        ok(r[0]==100 and r[1]==0 and r[2]>=1,f'luyện hóa Mộc: quý trước, dừng ở 100 → {r}')
        pg.screenshot(path=S.replace('game.html','res_root.png'))
        for e,item in (('kim','nl.quang_kim'),('thuy','nl.co_linh_chi'),('hoa','nl.nam_linh_chi'),('tho','nl.da')):
            pg.evaluate(f"G.loot['{item}']=40;G.lootUI()"); pg.wait_for_timeout(100)
            pg.evaluate("document.getElementById('bagR').innerHTML&&0"); pg.click('#tabT'); pg.click('#tabR'); pg.wait_for_timeout(150)
            if e!='tho': ok(pg.is_disabled('#rootAw'),f'còn thiếu → khoá ({e})')
            pg.click(f'button[data-el={e}]'); pg.wait_for_timeout(150)
        ok(pg.evaluate("Object.values(G.cult.r).every(v=>v===100)"),'cả 5 hệ đạt 100')
        ok(not pg.is_disabled('#rootAw'),'đủ 5 hệ → mở khoá thức tỉnh')
        pg.screenshot(path=S.replace('game.html','res_root_ready.png'))
        pg.click('#rootAw'); pg.wait_for_timeout(300)
        ok(pg.evaluate("G.cult.aw")==True and 'đã thức tỉnh' in pg.inner_text('#bagR'),'thức tỉnh Linh Căn')
        q0=pg.evaluate("G.cult.qi"); pg.wait_for_timeout(2300); q1=pg.evaluate("G.cult.qi")
        ok(1.8<=q1-q0<=2.7,f'linh khí tăng ~1/giây: {q1-q0:.2f} trong 2.3s')
        pg.screenshot(path=S.replace('game.html','res_awake.png'))
        pg.click('#bagX'); pg.wait_for_timeout(400)
        ok(pg.is_visible('#qi') and 'Linh khí' in pg.inner_text('#qi'),'HUD linh khí hiện ở góc trái dưới')
        # đi và đứng yên đều tăng
        pg.evaluate("G.keys.d=1"); q2=pg.evaluate("G.cult.qi"); pg.wait_for_timeout(1500); pg.evaluate("G.keys.d=0")
        ok(pg.evaluate("G.cult.qi")-q2>=1.2,'đang di chuyển vẫn hấp thu linh khí')
        # ---- lưu ----
        pg.evaluate("TT.push(false,false)"); pg.wait_for_timeout(500)
        sv=list(mock.saves.values())[0]['data']
        ok(sv['cul']['aw']==1 and all(v==100 for v in sv['cul']['r'].values()) and sv['cul']['qi']>=3,f"đã lưu server: {sv['cul']}")
        pg.reload(); pg.wait_for_timeout(1000)
        ok(pg.evaluate("G.cult.aw")==True and pg.evaluate("G.cult.qi")>=3 and pg.evaluate("G.cult.r.kim")==100,'tải lại: Linh Căn, linh khí, ngũ hành vẫn còn')
        # ---- đa ngôn ngữ ----
        pg.evaluate("I18N.set('zh-Hant')"); pg.click('#bagBtn'); pg.click('#tabR'); pg.wait_for_timeout(300)
        t=pg.inner_text('#bagR')
        ok('靈根已覺醒' in t and '木' in t,'繁體: 靈根已覺醒')
        ok(pg.evaluate("I18N.itemName('nl.thao_quy')")=='靈蓮' and '材料' in pg.evaluate("I18N.itemDesc('nl.da')"),'繁體: tên + mô tả vật phẩm')
        pg.evaluate("I18N.set('zh-Hans')"); pg.wait_for_timeout(200)
        ok(pg.evaluate("I18N.itemName('nl.thao_quy')")=='灵莲','简体: 灵莲')
        pg.evaluate("I18N.set('vi')"); pg.click('#bagX')
        # ---- túi hiển thị icon ----
        pg.evaluate("G.loot['nl.tre']=3;G.loot['nl.linh_thach']=1;G.loot['nl.hoa_linh']=2;G.lootUI()")
        pg.click('#bagBtn'); pg.click('#tabT'); pg.wait_for_timeout(500)
        ok(pg.locator('#bagStage .it canvas').count()>=3,'túi: vật phẩm tài nguyên vẽ bằng icon pixel')
        pg.screenshot(path=S.replace('game.html','res_bag.png'))
        ok(not errs,f'không lỗi JS {errs[:2]}')
        b.close()
    print('TỔNG',sum(res),'/',len(res)); sys.exit(0 if all(res) else 1)
run3()
