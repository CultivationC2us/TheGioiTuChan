import sys
sys.path.insert(0,'.')
from test_auth import *
res=[]
def ok(c,m): res.append(bool(c)); print(('PASS ' if c else 'FAIL ')+m)
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':430,'height':932})
    mock=Mock(); ctx.route(f'https://{HOST}/**',mock.handle)
    pg=ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file://'+S); pg.wait_for_timeout(300)
    pg.click('#tReg'); pg.fill('#aName','ui_t'); pg.fill('#aPw','abcdef'); pg.fill('#aPw2','abcdef'); pg.click('#aGo'); pg.wait_for_timeout(1000)
    E=lambda s: pg.evaluate(s)
    E("G.redeem('tuchan')")
    for e in ['hoa','thuy','tho','moc','kim']: E(f"G.useItem('sk.{e}')")
    pg.wait_for_timeout(400)
    E("for(const id of ['mtRide','mtFly','mtDash']){const x=document.getElementById(id);if(x)x.style.display='block';}")
    rects=E("""(()=>{const o={};const add=(k,el)=>{if(!el)return;const r=el.getBoundingClientRect();if(r.width>0)o[k]=[r.left,r.top,r.right,r.bottom];};
      [...document.querySelectorAll('#skBar .skb')].forEach((e,i)=>add('sk'+(i+1),e));
      add('atk',document.getElementById('atk'));add('auto',document.getElementById('autoBtn'));
      add('ride',document.getElementById('mtRide'));add('fly',document.getElementById('mtFly'));add('dash',document.getElementById('mtDash'));return o;})()""")
    ks=list(rects)
    ok(all(k in rects for k in ['sk1','sk2','sk3','sk4','sk5','atk','auto']),'đủ nút: 5 kỹ năng, đánh, tự động '+str(ks))
    bad=[]
    for i in range(len(ks)):
        for j in range(i+1,len(ks)):
            a,c=rects[ks[i]],rects[ks[j]]
            if a[0]<c[2]-.5 and c[0]<a[2]-.5 and a[1]<c[3]-.5 and c[1]<a[3]-.5: bad.append((ks[i],ks[j]))
    ok(not bad,'không nút nào đè lên nhau '+str(bad))
    ok(all(r[0]>=0 and r[2]<=430 and r[1]>=0 and r[3]<=932 for r in rects.values()),'tất cả nút nằm trong màn hình')
    ar=rects['auto'];ride=rects.get('ride')
    ok(abs((ar[2]-ar[0])-54)<1 and abs((ar[3]-ar[1])-54)<1,'nút tự động cùng cỡ 54px với nút thú cưỡi')
    ok(ride is None or (abs(ar[2]-ride[2])<1 and ride[3]<=ar[1]),'nút tự động nằm đúng cột chỗ cũ của nút cưỡi, thú cưỡi dời lên trên')
    # xếp hạng
    ok(E("G.realmLabel(10)")=='Luyện Khí tầng 10' and E("G.realmLabel(11)")=='Trúc Cơ sơ kỳ' and E("G.realmLabel(13)")=='Trúc Cơ hậu kỳ','xếp hạng: nhãn "Luyện Khí tầng 10" / "Trúc Cơ sơ kỳ"')
    E("G.cult.aw=true;G.cult.rl=10;G.cult.tc=0;G.recalc()"); r0=E("G.rankStat()")
    E("G.cult.tc=1;G.cult.qi=0;G.recalc()"); r1=E("G.rankStat()")
    ok(r0['realm']==10 and r1['realm']==11,'rankStat: Luyện Khí 10 → 10, Trúc Cơ sơ kỳ → 11')
    ok(abs(r1['qi_total']-r0['qi_total'])<=r0['qi_total']*0.0+1,'qi_total liên tục khi lên Trúc Cơ (không nhảy → không bị nghi gian lận)')
    ok(E("G.cult.qi=500;G.rankStat().qi_total")-r1['qi_total']==500,'qi_total tăng theo tu vi Trúc Cơ')
    # bóng vòng lam: chạy vài khung hình khi Trúc Cơ (đi bộ + cưỡi) không lỗi, và có vẽ
    E("window.__a=0;const o=auraShadow;")if False else None
    E("G.cult.tc=1;G.cult.qi=0")
    pg.wait_for_timeout(500)
    n1=pg.evaluate("""(()=>{const cv=document.querySelector('canvas');const c=cv.getContext('2d');const px=c.getImageData(0,0,cv.width,cv.height).data;let blue=0;for(let i=0;i<px.length;i+=4*7){if(px[i+2]>170&&px[i+2]>px[i]+60&&px[i+1]<px[i+2])blue++;}return blue;})()""")
    E("G.cult.tc=0"); pg.wait_for_timeout(400)
    n0=pg.evaluate("""(()=>{const cv=document.querySelector('canvas');const c=cv.getContext('2d');const px=c.getImageData(0,0,cv.width,cv.height).data;let blue=0;for(let i=0;i<px.length;i+=4*7){if(px[i+2]>170&&px[i+2]>px[i]+60&&px[i+1]<px[i+2])blue++;}return blue;})()""")
    ok(n1>n0,f'Trúc Cơ: dưới chân có vòng lam mờ (điểm xanh {n0} → {n1})')
    ok(errs==[],'không lỗi JS: '+str(errs[:2]))
    b.close()
print('TỔNG',sum(res),'/',len(res))
