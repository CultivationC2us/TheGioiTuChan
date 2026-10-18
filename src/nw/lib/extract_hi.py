"""Icon UI độ phân giải cao (không hạ mẫu, B=1): toàn bộ icon tròn/vuông 42-95 -> lib/out/uihi_*; tập con dùng trong game -> uih_*"""
import sys,json,numpy as np
sys.path.insert(0,'lib')
from extract_all import *
im,fg,c,lab=seg('lib/src_ui.png',3)
c.sort(key=ui_order if 'ui_order' in globals() else (lambda t:(round((t[1]+t[3])/2/40),t[0])))
allf={}
for i,(x0,y0,x1,y1,_) in enumerate(c):
    if 42<=i<=95 and i not in (93,94):
        f=cutbox(im,fg,(x0,y0,x1,y1),1)
        if f is not None: allf[f'h{i}']=f
at,m=pack(allf,'uihi',AW=900); print('uihi',len(m),at.shape)
USE=['h42','h43','h44','h45','h46','h47','h48','h61','h88','h89','h90','h91']
at2,m2=pack({k:allf[k] for k in USE},'uih',AW=700); print('uih',at2.shape)
contact(at2,m2,'uih',cols=6,cw=120,ch=120,sc=1)
