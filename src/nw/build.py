import base64,json,os,re
from pathlib import Path
from PIL import Image

# Make builds independent of the caller's current working directory.
ROOT = Path(__file__).resolve().parents[2]
os.chdir(Path(__file__).resolve().parent.parent)
def b64(p): return base64.b64encode(open(p,'rb').read()).decode()

def ensure_webp(src, dst):
    src, dst = Path(src), Path(dst)
    if not dst.exists() or dst.stat().st_mtime < src.stat().st_mtime:
        dst.parent.mkdir(parents=True, exist_ok=True)
        with Image.open(src) as im:
            im.convert('RGBA').save(dst, 'WEBP', lossless=True, quality=100)

# These generated WebP files were absent from the repository, although their
# source atlases are tracked. Recreate them deterministically during the build.
ensure_webp('nw/lib/ui_atlas.png', 'nw/lib/out/ui_atlas.webp')
ensure_webp('nw/lib/uih_atlas.png', 'nw/lib/out/uih_atlas.webp')
ensure_webp('nw/lib/mon10_atlas.png', 'nw/lib/out/mon10_atlas.webp')

s=open('nw/game_tpl.html',encoding='utf-8').read()
idx_path = Path('nw/dr2/idx_trim.json')
if idx_path.exists():
    idx = json.loads(idx_path.read_text(encoding='utf-8'))
else:
    # Recover the exact dragon frame map from the last published bundle so a
    # fresh checkout can rebuild even if the derived metadata was not committed.
    published = (ROOT / 'index.html').read_text(encoding='utf-8')
    marker = 'mouth:[79,45],idx:'
    at = published.find(marker)
    if at < 0:
        raise RuntimeError('Missing nw/dr2/idx_trim.json and no embedded dragon index in index.html')
    decoder = json.JSONDecoder()
    idx, _ = decoder.raw_decode(published[at + len(marker):])
M={'idx':idx}
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
 '{{GLATLAS}}':b64('nw/lib/out/stone_atlas.webp'),'{{GLMETA}}':open('nw/lib/out/stone_meta.json').read(),'{{UIAATLAS}}':b64('nw/lib/out/ui_atlas.webp'),'{{UIAMETA}}':open('nw/lib/ui_meta.json').read(),'{{UIHATLAS}}':b64('nw/lib/out/uih_atlas.webp'),'{{UIHMETA}}':open('nw/lib/uih_meta.json').read(),'{{MON10}}':b64('nw/lib/out/mon10_atlas.webp'),'{{MON10META}}':open('nw/lib/mon10_meta.json').read(),
 '{{CATATLAS}}':b64('nw/lib/out/cat_atlas.webp'),'{{CATMETA}}':open('nw/lib/out/cat_meta.json').read(),'{{NATATLAS}}':b64('nw/lib/out/nat_atlas.webp'),'{{KIEATLAS}}':b64('nw/kie_atlas.webp'),'{{KIEMETA}}':open('nw/kie_meta.json').read(),'{{KIE_JS}}':open('nw/kie.js',encoding='utf-8').read(),'{{NATMETA}}':open('nw/lib/out/nat_meta.json').read(),'{{SKATLAS}}':b64('nw/lib/out/skill_hd.webp'),'{{SKMETA}}':open('nw/lib/out/skill_meta.json').read(),'{{SK_JS}}':open('nw/skill.js',encoding='utf-8').read(),
 '{{BAG_JS}}':open('nw/bag.js',encoding='utf-8').read(),
 '{{AUTH_JS}}':open('nw/auth.js',encoding='utf-8').read(),'{{HUD_JS}}':open('nw/hud.js',encoding='utf-8').read(),'{{UIBTN}}':b64('nw/it/ui_btn.webp'),
 '{{T_GRASS}}':b64('nw/assets/tile_grass.webp'),'{{T_T4}}':b64('nw/assets/tile_t4.webp'),'{{T_T3}}':b64('nw/assets/tile_t3.webp'),'{{T_T2}}':b64('nw/assets/tile_t2.webp'),'{{T_T16}}':b64('nw/assets/tile_t16.webp'),'{{T_T5}}':b64('nw/assets/tile_t5.webp'),'{{T_SAND}}':b64('nw/assets/tile_sand.webp'),'{{T_SNOW}}':b64('nw/assets/tile_snow.webp'),'{{T_FOREST}}':b64('nw/assets/tile_forest.webp'),'{{T_MUD}}':b64('nw/assets/tile_mud.webp')}
for k,v in rep.items():
    assert k in s,k
    s=s.replace(k,v)
import time
s=s.replace('{{BUILD}}',time.strftime('%m%d.%H%M',time.gmtime(time.time()+8*3600)))
out = Path('nw/game.html')
out.write_text(s, encoding='utf-8')
# GitHub Pages and the documented entry point serve the root bundle.
root_out = ROOT / 'index.html'
root_out.write_text(s, encoding='utf-8')
print('Built {} and {} ({} characters)'.format(out, root_out, len(s)))
