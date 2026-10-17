import numpy as np
from PIL import Image
from scipy import ndimage as ndi
im=np.array(Image.open('rings_src.png').convert('RGB')).astype(np.float32)
d=np.sqrt(((im-np.array([255,0,255],np.float32))**2).sum(2)); near=d<75
lab,k=ndi.label(near); border=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0}
bg=np.isin(lab,list(border)); halo=ndi.binary_dilation(bg,iterations=2)&(d<135)&((np.minimum(im[...,0],im[...,2])-im[...,1])>95)
hole=(d<95)&ndi.binary_dilation(near,iterations=1)           # lỗ nhẫn (magenta kín)
fg=~(bg|halo|hole)
row=fg.copy();row[390:]=False
lab,n=ndi.label(ndi.binary_dilation(row,iterations=3))
objs=[(s,i+1) for i,s in enumerate(ndi.find_objects(lab)) if ((lab[s]==i+1)&row[s]).sum()>5000]
objs.sort(key=lambda t:t[0][1].start)
OUT=64;sheet=Image.new('RGBA',(OUT*5,OUT),(0,0,0,0))
for k,(s,i) in enumerate(objs[:5]):
    m=(lab[s]==i)&fg[s];rgba=np.zeros(m.shape+(4,),np.uint8);rgba[...,:3]=im[s].astype(np.uint8);rgba[...,3]=m*255
    pil=Image.fromarray(rgba);w,h=pil.size;sc=(OUT-4)/max(w,h);pil=pil.resize((max(1,round(w*sc)),max(1,round(h*sc))),Image.BOX)
    sheet.alpha_composite(pil,(k*OUT+(OUT-pil.width)//2,(OUT-pil.height)//2))
sheet.save('rings.png');sheet.save('rings.webp',lossless=True)
bg=Image.new('RGBA',sheet.size,(40,40,70,255));bg.alpha_composite(sheet);bg.resize((sheet.width*3,sheet.height*3),Image.NEAREST).save('rings_prev.png')
