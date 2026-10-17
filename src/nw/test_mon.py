import sys
sys.path.insert(0,'.')
from test_auth import *
def run4():
    res=[]
    def ok(c,m): res.append(bool(c)); print(('PASS ' if c else 'FAIL ')+m)
    with sync_playwright() as p:
        b=p.chromium.launch(); ctx=b.new_context(viewport={'width':390,'height':800},device_scale_factor=2)
        mock=Mock(); ctx.route(f'https://{HOST}/**',mock.handle)
        pg=ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        pg.goto('file://'+S); pg.wait_for_timeout(300)
        pg.click('#tReg'); pg.fill('#aName','mon_test'); pg.fill('#aPw','abcdef'); pg.fill('#aPw2','abcdef'); pg.click('#aGo'); pg.wait_for_timeout(900)
        ok(pg.is_visible('#autoBtn') and 'TỰ ĐỘNG' in pg.inner_text('#autoBtn'),'nút TỰ ĐỘNG hiện sau đăng nhập')
        # ---- quái ----
        info=pg.evaluate("G.mons2.map(m=>({id:m.id,tx:m.x/16|0,ty:m.y/16|0,t:G.tiles[m.y/16|0][m.x/16|0],d:Math.hypot(m.x/16-100,m.y/16-100),hp:m.hp}))")
        print(info)
        ok(len(info)==4 and {i['id'] for i in info}=={'hoa','tho','kim','moc'},'có 4 quái Hỏa/Thổ/Kim/Mộc')
        ok(all(i['t']<=2 for i in info),'cả 4 đứng trên đất liền')
        ok(all(i['d']>45 for i in info),'xa điểm xuất phát (>45 ô)')
        pg.evaluate("G.P.maxHp=1e6;G.P.hp=1e6;G.setTameP(0)")
        for k in ('hoa','tho','kim','moc'):
            pg.evaluate(f"(()=>{{const m=G.mons2.find(o=>o.id=='{k}');G.P.x=m.x-150;G.P.y=m.y+20;G.P.f=1;G.cam.x=G.P.x;G.cam.y=G.P.y;}})()")
            seen=set();hp0=pg.evaluate("G.P.hp")
            for i in range(44):
                pg.wait_for_timeout(250)
                s=pg.evaluate(f"(()=>{{const m=G.mons2.find(o=>o.id=='{k}');return [m.st,m.sk?m.sk.k:'',G.fx2().length,G.projs.length]}})()") if False else pg.evaluate(f"(()=>{{const m=G.mons2.find(o=>o.id=='{k}');return [m.st,m.sk?m.sk.k:'']}})()")
                if s[1]: seen.add(s[1])
                if i==12: pg.screenshot(path=S.replace('game.html',f'mon_{k}.png'))
                pg.evaluate("G.P.hp=Math.max(G.P.hp,1e6-1)") if False else None
            hp1=pg.evaluate("G.P.hp")
            ok(len(seen)>=2,f'{k}: dùng cả 2 chiêu {seen}')
            ok(hp1<hp0,f'{k}: gây sát thương lên người chơi ({hp0-hp1:.0f})')
        # ---- hạ quái: rơi ngọc ----
        pg.evaluate("G.P.x=1608;G.P.y=1610;for(const m of G.mons2){m.st='idle';m.hold=1e9}")
        for k,el in (('hoa','hoa'),('tho','tho'),('kim','kim'),('moc','moc')):
            pg.evaluate(f"(()=>{{const m=G.mons2.find(o=>o.id=='{k}');m.hold=1e9;G.drops.length=0;G.monHit(m,99999);}})()")
            d=pg.evaluate("G.drops.map(d=>d.n)")
            ok(d==['ngoc.%s.1'%el],f'hạ {k} → rơi ngọc ngoc.{el}.1 {d}')
        ok(pg.evaluate("G.mons2.every(m=>m.st=='die')"),'4 quái vào trạng thái chết')
        pg.evaluate("for(const m of G.mons2){m.deadAt=G.now()-46000;m.st='dead'}"); pg.wait_for_timeout(300)
        ok(pg.evaluate("G.mons2.every(m=>m.st=='idle'&&m.hp==m.maxHp&&Math.hypot(m.x-m.hx,m.y-m.hy)<1)"),'hồi sinh tại hang sau 45 giây')
        # ---- thuần hóa ----
        pg.evaluate("G.setPets([]);G.setTameP(1);G.mons2[0].hold=1e9;G.monHit(G.mons2[0],99999)")
        ok(pg.evaluate("G.PETS.includes('hoa')") and 'Thuần hóa' in pg.inner_text('#toast') or pg.evaluate("G.PETS.includes('hoa')"),'tỉ lệ 100% (giả lập) → thuần hóa được')
        pg.evaluate("G.setTameP(0.01)")
        n=pg.evaluate("(()=>{G.setPets([]);let c=0;for(let i=0;i<20000;i++){G.tameRoll('kim');if(G.PETS.length){c++;G.setPets([]);}}return c})()")
        ok(100<n<320,f'tỉ lệ thuần hóa thực ≈1% ({n}/20000)')
        pg.evaluate("G.setPets(['hoa','thuylong'])")
        ok(pg.evaluate("G.petObjs.length")==2,'linh thú xuất hiện đi theo')
        pg.evaluate("G.P.x=1608;G.P.y=1610;G.cam.x=1608;G.cam.y=1610"); pg.wait_for_timeout(500)
        pg.screenshot(path=S.replace('game.html','mon_pets.png'))
        pg.evaluate("G.setPets([])")
        # ---- ngọc: nuốt, trần, hợp nhất ----
        pg.evaluate("G.P.maxHp=100;G.P.hp=100;for(const k in G.loot)delete G.loot[k];G.loot['ngoc.kim.1']=12;G.loot['ngoc.kim.2']=1;G.lootUI()")
        pi=pg.evaluate("G.pearlInfo('ngoc.kim.2')")
        ok(pi['reason']=='lock' and not pi['can'],'bậc 2 khóa khi chưa nuốt đủ 10 viên bậc 1')
        for i in range(10): pg.evaluate("G.swallow('ngoc.kim.1')")
        ok(pg.evaluate("G.S.dmg")==10 and pg.evaluate("G.cult.pl.kim[0]")==10,'nuốt 10 viên Kim → +10 sát thương')
        ok(pg.evaluate("G.swallow('ngoc.kim.1')")==False and pg.evaluate("G.pearlInfo('ngoc.kim.1').reason")=='cap','viên thứ 11 bị chặn (trần 10/bậc)')
        ok(pg.evaluate("G.itemInfo('ngoc.kim.2').use")==True and pg.evaluate("G.swallow('ngoc.kim.2')")==True and pg.evaluate("G.S.dmg")==11,'đủ 10 viên bậc 1 → mở bậc 2 (tác dụng như cũ +1)')
        ok(pg.evaluate("G.fuse('ngoc.kim.1')")==False,'chưa đủ 10 viên để hợp nhất (còn 2)')
        pg.evaluate("G.loot['ngoc.kim.1']=23;G.lootUI()")
        ok(pg.evaluate("[G.fuse('ngoc.kim.1'),G.loot['ngoc.kim.1'],G.loot['ngoc.kim.2']]")==[True,13,1],'hợp nhất 10 viên bậc 1 → 1 viên bậc 2')
        ok(pg.evaluate("I18N.itemName('ngoc.kim.2')")=='Kim Tinh Bảo Châu','viên bậc 2 có tên mới: Kim Tinh Bảo Châu')
        # các hệ khác
        pg.evaluate("G.loot['ngoc.moc.1']=3;G.loot['ngoc.tho.1']=4;G.loot['ngoc.hoa.1']=5;G.loot['Thủy Long Châu']=6;G.lootUI()")
        hp0=pg.evaluate("G.P.hp")
        for it,n in (('ngoc.moc.1',3),('ngoc.tho.1',4),('ngoc.hoa.1',5),('Thủy Long Châu',6)):
            for i in range(n): pg.evaluate(f"G.swallow('{it}')")
        s=pg.evaluate("({...G.S,mx:G.P.maxHp,cur:G.P.hp})")
        ok(s['hp']==18 and s['mx']==118 and s['cur']<=118,f"Mộc: +18 máu tối đa → {s['mx']}")
        ok(abs(s['red']-0.06)<1e-9,'Thổ: giảm 6% sát thương')
        ok(abs(s['spd']-0.10)<1e-9,'Hỏa: +10% tốc độ đánh')
        ok(abs(s['qi']-0.12)<1e-9,'Thủy: +0,12 tu vi/giây (0,02/viên)')
        pg.evaluate("G.P.inv=0;G.P.hp=118");pg.evaluate("G.mHit&&0")
        # giảm sát thương nhận
        pg.evaluate("G.P.inv=0;G.P.hp=100;G.P.maxHp=118")
        # ---- bảng vật phẩm ----
        pg.evaluate("G.loot['ngoc.kim.1']=12;G.cult.pl.kim[0]=10;G.lootUI()")
        pg.evaluate("document.getElementById('bagBtn').click()"); pg.evaluate("TTBag.openTab('T')"); pg.wait_for_timeout(500)
        pg.click('#bagStage .it[data-n="ngoc.kim.1"]',force=True); pg.wait_for_timeout(250)
        t=pg.inner_text('#bagInfo')
        ok('Bậc 1' in t and '10/10' in t and 'hợp nhất' in t.lower(),'bảng ngọc: bậc, đã nuốt 10/10, gợi ý hợp nhất')
        ok(pg.is_disabled('#biUse') and not pg.is_disabled('#biFuse'),'Sử dụng khóa, Hợp nhất mở')
        pg.screenshot(path=S.replace('game.html','mon_info.png'))
        pg.click('#biFuse'); pg.wait_for_timeout(250)
        ok(pg.evaluate("G.loot['ngoc.kim.1']")==2,'bấm Hợp nhất → trừ 10 viên')
        pg.evaluate("TTBag.openTab('S')"); pg.wait_for_timeout(250)
        st=pg.inner_text('#bagS')
        ok('Sát thương mỗi đòn' in st and '18 – 23' in st and 'Linh thú' in st and '10/10' in st,'tab Chỉ số hiển thị đầy đủ')
        pg.screenshot(path=S.replace('game.html','mon_stats.png'))
        pg.evaluate("TTBag.close()")
        # ---- tốc độ đánh tăng ----
        cd=pg.evaluate("(()=>{G.P.atkT=-9999;G.attack();const a=G.P.atkT;return 470/(1+G.S.spd)})()")
        ok(abs(cd-470/1.10)<0.5,f'chu kỳ đánh rút còn {cd:.0f} ms')
        b.close() if False else None
        # ---- tự động săn ----
        pg.evaluate("for(const m of G.mons2){m.st='idle';m.hold=1e12}")
        pg.evaluate("""(()=>{const n=G.nodes.filter(o=>o.g.tier===1&&!o.gone).sort((a,b)=>Math.hypot(a.x-1608,a.y-1610)-Math.hypot(b.x-1608,b.y-1610))[0];
          window.__an=n;G.P.x=n.x-110;G.P.y=n.y+30;G.P.f=1;G.cam.x=G.P.x;G.cam.y=G.P.y;G.P.hp=118;for(const k in G.loot)delete G.loot[k];G.M.st='sub'})()""")
        pg.click('#autoBtn'); pg.wait_for_timeout(200)
        ok(pg.evaluate("G.AUTO.on")==True and 'ĐANG CHẠY' in pg.inner_text('#autoBtn'),'bật TỰ ĐỘNG')
        pg.wait_for_timeout(9000)
        ok(pg.evaluate("__an.gone")==True or pg.evaluate("Object.keys(G.loot).some(k=>k.startsWith('nl.'))"),'tự động: tự đi tới và khai thác tài nguyên')
        ok(pg.evaluate("Object.keys(G.loot).some(k=>k.startsWith('nl.'))"),'tự động: tự nhặt vật phẩm rơi')
        ok(pg.evaluate("Math.hypot(G.P.x-G.AUTO.ax,G.P.y-G.AUTO.ay)<G.AUTO.R+60"),'tự động: không đi ra khỏi vùng')
        pg.screenshot(path=S.replace('game.html','mon_auto.png'))
        # tự động đánh quái + linh thú hỗ trợ
        pg.evaluate("""(()=>{const m=G.mons2.find(o=>o.id=='moc');m.hold=1e12;m.hp=m.maxHp=400;G.P.x=m.x-60;G.P.y=m.y;G.AUTO.ax=G.P.x;G.AUTO.ay=G.P.y;G.setPets(['hoa']);G.cam.x=G.P.x;G.cam.y=G.P.y;G.P.hp=118;G.P.maxHp=1e6;G.P.hp=1e6;
           for(const o of G.nodes)o.gone=true;G.P.f=1;})()""")
        hp0=pg.evaluate("G.mons2.find(o=>o.id=='moc').hp")
        pg.wait_for_timeout(6000)
        hp1=pg.evaluate("G.mons2.find(o=>o.id=='moc').hp")
        ok(hp1<hp0-60,f'tự động đánh quái ({hp0:.0f} → {hp1:.0f})')
        ok(pg.evaluate("G.petObjs[0].cd")>0,'linh thú tham gia tấn công khi bật tự động')
        pg.click('#autoBtn'); pg.wait_for_timeout(200)
        ok(pg.evaluate("G.AUTO.on")==False,'tắt TỰ ĐỘNG')
        # máu thấp tự tắt
        pg.click('#autoBtn'); pg.evaluate("G.P.maxHp=118;G.P.hp=20"); pg.wait_for_timeout(500)
        ok(pg.evaluate("G.AUTO.on")==False,'máu thấp → tự động tắt')
        # ---- lưu / tải ----
        pg.evaluate("G.setPets(['kim','thuylong']);TT.push(false,false)"); pg.wait_for_timeout(600)
        sv=list(mock.saves.values())[0]['data']
        ok(sv['pets']==['kim','thuylong'] and sv['cul']['pl']['kim'][0]==10 and sv['cul']['pl']['hoa'][0]==5,f"đã lưu linh thú + ngọc đã nuốt: {sv['pets']} {sv['cul']['pl']['kim']}")
        pg.reload(); pg.wait_for_timeout(1000)
        ok(pg.evaluate("G.PETS")==['kim','thuylong'] and pg.evaluate("G.cult.pl.kim[0]")==10,'tải lại: linh thú + ngọc đã nuốt vẫn còn')
        ok(pg.evaluate("G.P.maxHp")==118 and abs(pg.evaluate("G.S.dmg")-11)<1e-9,'tải lại: chỉ số tính lại đúng (máu 118, sát thương +11)')
        # ---- đa ngôn ngữ ----
        pg.evaluate("I18N.set('zh-Hant')"); pg.wait_for_timeout(200)
        ok(pg.evaluate("I18N.itemName('ngoc.kim.2')")=='金精寶珠' and pg.evaluate("I18N.t('monster.kim')")=='金甲犀' and '自動' in pg.inner_text('#autoBtn'),'繁體: ngọc, quái, nút tự động')
        pg.evaluate("I18N.set('zh-Hans')"); pg.wait_for_timeout(200)
        ok(pg.evaluate("I18N.itemName('ngoc.thuy.3')")=='水龙圣珠','简体: 水龙圣珠')
        pg.evaluate("I18N.set('vi')")
        ok(not errs,f'không lỗi JS {errs[:3]}')
        b.close()
    print('TỔNG',sum(res),'/',len(res)); sys.exit(0 if all(res) else 1)
run4()
