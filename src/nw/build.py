import base64,json
def b64(p): return base64.b64encode(open(p,'rb').read()).decode()
s=open('nw/game_tpl.html',encoding='utf-8').read()
M={'idx':json.load(open('nw/dr2/idx_trim.json'))}
import glob,os
UIP={os.path.basename(f)[:-4]:b64(f) for f in glob.glob('nw/pix/out/*.png')}
UIP.update({'o_'+os.path.basename(f)[:-5]:b64(f) for f in glob.glob('nw/ui/out/*.webp') if 'av_badge' not in f})
rep={'{{UIPIECES}}':json.dumps(UIP,separators=(',',':')),'{{OF_JS}}':open('nw/outfit.js',encoding='utf-8').read(),'{{OFATLAS}}':b64('nw/outfit/atlas.webp'),'{{OF2ATLAS}}':b64('nw/outfit/atlas2.webp'),'{{RINGS}}':b64('nw/outfit/rings.webp'),'{{AURA}}':b64('nw/outfit/aura.webp'),'{{OFMETA2}}':open('nw/outfit/meta2.json').read(),'{{OFMETA}}':open('nw/outfit/meta.json').read(),'{{OFHD}}':open('nw/outfit/headoff.json').read(),'{{MNT_JS}}':open('nw/mnt.js',encoding='utf-8').read(),'{{MNTATLAS}}':b64('nw/mnt/atlas.webp'),'{{MNTMETA}}':open('nw/mnt/meta.json').read(),'{{NPC_JS}}':open('nw/npc.js',encoding='utf-8').read(),'{{MON_JS}}':open('nw/mon2.js',encoding='utf-8').read(),
 '{{MON_HOA}}':b64('nw/mon/atlas_hoa.webp'),'{{MON_THO}}':b64('nw/mon/atlas_tho.webp'),'{{MON_KIM}}':b64('nw/mon/atlas_kim.webp'),'{{MON_MOC}}':b64('nw/mon/atlas_moc.webp'),
 '{{MONMETA_HOA}}':open('nw/mon/meta_hoa.json').read(),'{{MONMETA_THO}}':open('nw/mon/meta_tho.json').read(),'{{MONMETA_KIM}}':open('nw/mon/meta_kim.json').read(),'{{MONMETA_MOC}}':open('nw/mon/meta_moc.json').read(),
 '{{PLAYER}}':b64('nw/assets/player.webp'),'{{DRAGON}}':b64('nw/assets/dragon.webp'),'{{BEAMA}}':b64('nw/assets/beamA.webp'),'{{BEAMB}}':b64('nw/assets/beamB.webp'),
 '{{DOG}}':open('nw/assets/dog.b64').read(),'{{DRIDX}}':json.dumps(M['idx'],separators=(',',':')),
 '{{RES_JS}}':open('nw/res.js',encoding='utf-8').read(),'{{RESATLAS}}':b64('nw/assets/res.webp'),'{{RESMETA}}':open('nw/assets/res_meta.json').read(),'{{ITATLAS}}':b64('nw/it/atlas.webp'),'{{ITMETA}}':open('nw/it/meta.json').read(),
 '{{I18N_JS}}':open('nw/i18n.js',encoding='utf-8').read(),
 '{{SET_JS}}':open('nw/settings.js',encoding='utf-8').read(),
 '{{GLATLAS}}':b64('nw/lib/out/stone_atlas.webp'),'{{GLMETA}}':open('nw/lib/out/stone_meta.json').read(),'{{UIAATLAS}}':b64('nw/lib/out/ui_atlas.webp'),'{{UIAMETA}}':open('nw/lib/out/ui_meta.json').read(),'{{UIHATLAS}}':b64('nw/lib/out/uih_atlas.webp'),'{{UIHMETA}}':open('nw/lib/out/uih_meta.json').read(),'{{MON10}}':b64('nw/lib/out/mon10_atlas.webp'),'{{MON10META}}':open('nw/lib/out/mon10_meta.json').read(),
 '{{CATATLAS}}':b64('nw/lib/out/cat_atlas.webp'),'{{CATMETA}}':open('nw/lib/out/cat_meta.json').read(),'{{SKATLAS}}':b64('nw/lib/out/skill_hd.webp'),'{{SKMETA}}':open('nw/lib/out/skill_meta.json').read(),'{{SK_JS}}':open('nw/skill.js',encoding='utf-8').read(),
 '{{BAG_JS}}':open('nw/bag.js',encoding='utf-8').read(),
 '{{AUTH_JS}}':open('nw/auth.js',encoding='utf-8').read(),'{{HUD_JS}}':open('nw/hud.js',encoding='utf-8').read(),'{{UIBTN}}':b64('nw/it/ui_btn.webp'),
 '{{T_GRASS}}':b64('nw/assets/tile_grass.webp'),'{{T_T4}}':b64('nw/assets/tile_t4.webp'),'{{T_T3}}':b64('nw/assets/tile_t3.webp'),'{{T_T2}}':b64('nw/assets/tile_t2.webp'),'{{T_T16}}':b64('nw/assets/tile_t16.webp'),'{{T_T5}}':b64('nw/assets/tile_t5.webp')}
for k,v in rep.items():
    assert k in s,k
    s=s.replace(k,v)
import time
s=s.replace('{{BUILD}}',time.strftime('%m%d.%H%M',time.gmtime(time.time()+8*3600)))
open('nw/game.html','w',encoding='utf-8').write(s);print(len(s))
