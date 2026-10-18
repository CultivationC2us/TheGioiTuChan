"""Phân tách sprite tự động từ bảng nền magenta. seg(path,dil) -> (im, fg, comps[(x0,y0,x1,y1,mask_label_id)], lab)"""
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
def key(path):
    im=np.array(Image.open(path).convert('RGB')).astype(np.float32)
    r,g,b=im[...,0],im[...,1],im[...,2]
    near=(r>165)&(b>165)&(g<120)&(np.abs(r-b)<75)
    tint=((np.minimum(r,b)-g)>38)&(r>105)&(b>80)
    for _ in range(4):
        grow=ndi.binary_dilation(near,iterations=1)&~near&tint
        if not grow.any():break
        near|=grow
    return im,~near
def seg(path,dil=5,minpx=60):
    im,fg=key(path)
    lab,n=ndi.label(ndi.binary_dilation(fg,iterations=dil) if dil else fg,structure=np.ones((3,3)))
    out=[]
    for i,sl in enumerate(ndi.find_objects(lab)):
        m=(lab[sl]==i+1)&fg[sl]
        if m.sum()>=minpx: out.append([sl[1].start,sl[0].start,sl[1].stop,sl[0].stop,i+1])
    return im,fg,out,lab
if __name__=='__main__':
    import sys
    for p,d in [('lib/src_mon.png',5),('lib/src_stone.png',3),('lib/src_book.png',3),('lib/src_ui.png',3)]:
        im,fg,c,lab=seg(p,d);print(p,len(c))
