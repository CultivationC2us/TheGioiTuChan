import base64,json
def b64(p): return base64.b64encode(open(p,'rb').read()).decode()
s=open('nw/game_tpl.html',encoding='utf-8').read()
M={'idx':json.load(open('nw/dr2/idx_trim.json'))}
rep={'{{PLAYER}}':b64('nw/assets/player.webp'),'{{DRAGON}}':b64('nw/assets/dragon.webp'),'{{BEAMA}}':b64('nw/assets/beamA.webp'),'{{BEAMB}}':b64('nw/assets/beamB.webp'),
 '{{DOG}}':open('nw/assets/dog.b64').read(),'{{DRIDX}}':json.dumps(M['idx'],separators=(',',':')),
 '{{RES_JS}}':open('nw/res.js',encoding='utf-8').read(),'{{RESATLAS}}':b64('nw/assets/res.webp'),'{{RESMETA}}':open('nw/assets/res_meta.json').read(),
 '{{I18N_JS}}':open('nw/i18n.js',encoding='utf-8').read(),
 '{{SET_JS}}':open('nw/settings.js',encoding='utf-8').read(),
 '{{BAG_JS}}':open('nw/bag.js',encoding='utf-8').read(),
 '{{AUTH_JS}}':open('nw/auth.js',encoding='utf-8').read(),
 '{{T_GRASS}}':b64('nw/assets/tile_grass.webp'),'{{T_T4}}':b64('nw/assets/tile_t4.webp'),'{{T_T3}}':b64('nw/assets/tile_t3.webp'),'{{T_T2}}':b64('nw/assets/tile_t2.webp'),'{{T_T16}}':b64('nw/assets/tile_t16.webp'),'{{T_T5}}':b64('nw/assets/tile_t5.webp')}
for k,v in rep.items():
    assert k in s,k
    s=s.replace(k,v)
import time
s=s.replace('{{BUILD}}',time.strftime('%m%d.%H%M',time.gmtime(time.time()+8*3600)))
open('nw/game.html','w',encoding='utf-8').write(s);print(len(s))
