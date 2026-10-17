/* ============================================================
   TÀI NGUYÊN + NGŨ HÀNH + LINH CĂN (dữ liệu & chuỗi đa ngôn ngữ; logic nằm ở game_tpl.html)
   - id vật phẩm = 'nl.<nhóm>'; KHÔNG BAO GIỜ đổi id đã phát hành.
   - tier 1/2/3 = thường/hiếm/quý → số lần đánh để khai thác & điểm luyện hóa.
   - Muốn thêm tài nguyên: thêm 1 nhóm trong ảnh (res/extract.py), thêm 1 dòng ở RES + NAMES.
   ============================================================ */
(function(){
'use strict';
var EL=[ /* thứ tự cố định: kim, mộc, thủy, hỏa, thổ */
 {id:'kim', c:'#f2d36b', n:['Kim','金','金']},
 {id:'moc', c:'#6fd36b', n:['Mộc','木','木']},
 {id:'thuy',c:'#5ab8ff', n:['Thủy','水','水']},
 {id:'hoa', c:'#ff7a4a', n:['Hỏa','火','火']},
 {id:'tho', c:'#c49a5a', n:['Thổ','土','土']}
];
var RES=[ /* kind: tree|herb|ore (quyết định nơi mọc), sc: tỉ lệ vẽ */
 {id:'cay_coi',     el:'moc', tier:1,kind:'tree',sc:1.1},
 {id:'cay_cao',     el:'moc', tier:1,kind:'tree',sc:1.1},
 {id:'tre',         el:'moc', tier:1,kind:'tree',sc:1.0},
 {id:'thao_duoc',   el:'moc', tier:1,kind:'herb',sc:.8333},
 {id:'da',          el:'tho', tier:1,kind:'ore', sc:.8333},
 {id:'go_dac_biet', el:'thuy',tier:2,kind:'tree',sc:1.1},
 {id:'co_linh_chi', el:'thuy',tier:2,kind:'herb',sc:.8333},
 {id:'hoa_linh',    el:'hoa', tier:2,kind:'herb',sc:.8333},
 {id:'nam_linh_chi',el:'hoa', tier:2,kind:'herb',sc:.8333},
 {id:'quang_kim',   el:'kim', tier:2,kind:'ore', sc:.8333},
 {id:'thao_quy',    el:'moc', tier:3,kind:'herb',sc:.8333},
 {id:'thuoc_hiem',  el:'thuy',tier:3,kind:'herb',sc:.8333},
 {id:'linh_thach',  el:'kim', tier:3,kind:'ore', sc:.8333},
 {id:'da_linh',     el:'tho', tier:3,kind:'ore', sc:.8333},
 /* đợt 2 (res2/): 20 loại, 4 mỗi hệ, đúng hệ theo hình dạng */
 {id:'kim_ngan_hoa',   el:'kim', tier:1,kind:'herb',sc:1.0},
 {id:'bach_kim_thao',  el:'kim', tier:2,kind:'herb',sc:1.0},
 {id:'huyen_thiet_thao', el:'kim', tier:3,kind:'herb',sc:1.0},
 {id:'tinh_kim_thach', el:'kim', tier:2,kind:'ore',sc:1.2},
 {id:'thanh_tam_thao', el:'moc', tier:1,kind:'herb',sc:1.0},
 {id:'ngoc_linh_thao', el:'moc', tier:2,kind:'herb',sc:1.0},
 {id:'cuu_diep_linh_chi', el:'moc', tier:3,kind:'tree',sc:1.5},
 {id:'thanh_linh_moc', el:'moc', tier:2,kind:'tree',sc:1.5},
 {id:'tuyet_lien',     el:'thuy', tier:1,kind:'herb',sc:1.0},
 {id:'thuy_tinh_thao', el:'thuy', tier:2,kind:'herb',sc:1.0},
 {id:'han_bang_thao',  el:'thuy', tier:3,kind:'herb',sc:1.0},
 {id:'thuy_linh_thach', el:'thuy', tier:2,kind:'ore',sc:1.2},
 {id:'hoa_lien',       el:'hoa', tier:1,kind:'herb',sc:1.0},
 {id:'hoa_linh_chi',   el:'hoa', tier:2,kind:'herb',sc:1.0},
 {id:'huyet_linh_thao', el:'hoa', tier:3,kind:'herb',sc:1.0},
 {id:'hoa_tinh_thach', el:'hoa', tier:2,kind:'ore',sc:1.2},
 {id:'hoang_tinh_thao', el:'tho', tier:1,kind:'herb',sc:1.0},
 {id:'dia_tam_thao',   el:'tho', tier:2,kind:'herb',sc:1.0},
 {id:'tho_linh_chi',   el:'tho', tier:3,kind:'herb',sc:1.0},
 {id:'hoang_tho_thach', el:'tho', tier:2,kind:'ore',sc:1.2}
];
var HITS={1:3,2:4,3:5}, PTS={1:5,2:15,3:40}, LS={1:1,2:3,3:8}, NEED=100;
var MISC={'Thủy Long Châu':{dec:20},'lt':{dec:0},'dp.tukhi':{dec:0,keep:1},'cg.vukhi':{dec:0,keep:1},'dan.tukhi':{dec:10}};
var BAG={cap:120,sz:{'dp.tukhi':2,'cg.vukhi':2,'dan.tukhi':1}};   /* dung tích túi (ô); sz: kích thước riêng từng vật phẩm */
var BASE={def:2};                                       /* phòng thủ gốc (cố định trừ thẳng vào sát thương nhận, nhân theo cảnh giới) */
/* ---- TU VI (Luyện Khí 1-10) ---- */
var REALM={max:10,base:100,mul:1.2,rate:.2};  /* tu vi cần để qua tầng n = base*2^(n-1); mỗi tầng nhân ×mul máu & sát thương; tu luyện thường rate/giây */
var DAN={'dan.tukhi':{qi:100}};                          /* đan -> tu vi cộng thêm */
var RECIPES={'dp.tukhi':{verb:'alc',list:[{out:'dan.tukhi',ing:[['@herb1',3],['lt',1]]}]}};   /* '@herb1' = thảo dược bậc 1 bất kỳ */
/* RECIPES.cg.vukhi gán sau khi có FORGE */
var AFF=[['moc','thuy'],['hoa','tho','kim'],['kim','tho','hoa']];   /* hệ ưa thích theo địa hình: cỏ(0) · cát(1) · đá(2) */  /* đan phương: không mất khi dùng */
var WATK={1:4,2:9,3:16}, WLS={1:8,2:25,3:60};   /* sát thương cộng thêm và Linh Thạch khi rã, theo phẩm */
var WTIER=[['Phàm Khí','凡器','凡器'],['Linh Khí','靈器','灵器'],['Bảo Khí','寶器','宝器']];
var WEAPONS=[ /* vũ khí: id, ô ảnh trong it/atlas, hệ, phẩm (1-3), tên */
 {id:'w.tuyet_van',ico:'w1',el:'thuy',tier:1,atk:WATK[1],n:['Tuyết Vân Kiếm','雪雲劍','雪云剑']},
 {id:'w.hac_huyet',ico:'w2',el:'hoa',tier:2,atk:WATK[2],n:['Hắc Huyết Kiếm','黑血劍','黑血剑']},
 {id:'w.han_bang',ico:'w3',el:'thuy',tier:2,atk:WATK[2],n:['Hàn Băng Kiếm','寒冰劍','寒冰剑']},
 {id:'w.u_minh',ico:'w4',el:'tho',tier:3,atk:WATK[3],n:['U Minh Kiếm','幽冥劍','幽冥剑']},
 {id:'w.xich_diem',ico:'w5',el:'hoa',tier:3,atk:WATK[3],n:['Xích Diễm Kiếm','赤焰劍','赤焰剑']},
 {id:'w.thanh_dang',ico:'w6',el:'moc',tier:1,atk:WATK[1],n:['Thanh Đằng Kiếm','青藤劍','青藤剑']},
 {id:'w.kim_quang',ico:'w7',el:'kim',tier:2,atk:WATK[2],n:['Kim Quang Kiếm','金光劍','金光剑']},
 {id:'w.anh_hoa',ico:'w8',el:'moc',tier:2,atk:WATK[2],n:['Anh Hoa Kiếm','櫻花劍','樱花剑']},
 {id:'w.huyen_thuy',ico:'w9',el:'thuy',tier:3,atk:WATK[3],n:['Huyền Thủy Kiếm','玄水劍','玄水剑']},
 {id:'w.kim_linh',ico:'w10',el:'kim',tier:3,atk:WATK[3],n:['Kim Linh Trượng','金靈杖','金灵杖']},
 {id:'w.tu_lam',ico:'w11',el:'thuy',tier:2,atk:WATK[2],n:['Tử Lam Trượng','紫藍杖','紫蓝杖']},
 {id:'w.thuy_ngoc',ico:'w12',el:'moc',tier:3,atk:WATK[3],n:['Thúy Ngọc Trượng','翠玉杖','翠玉杖']}
];
var byWeapon={},ICO={'dp.tukhi':'s7','cg.vukhi':'s2','dan.tukhi':'o4'};
WEAPONS.forEach(function(w){byWeapon[w.id]=w;ICO[w.id]=w.ico;MISC[w.id]={dec:WLS[w.tier]};BAG.sz[w.id]=3;});
/* thú cưỡi: spd = nhân tốc độ khi chạy, fspd = khi bay (linh thú bay được, phàm thú chỉ chạy) */
var MOUNTS=[{id:'mt.tuyet_van',el:'thuy',fly:true,spd:1.7,fspd:2.6,n:['Tuyết Vân Kỳ Lân','雪雲麒麟','雪云麒麟']}];
var OUTFITS=[
 {id:'tb.tu_dien.h',part:'head',set:'A',el:'kim',def:4,n:['Mũ Tử Điện','紫電戰盔','紫电战盔']},{id:'tb.tu_dien.o',part:'torso',set:'A',el:'kim',def:5,n:['Giáp Tử Điện','紫電戰甲','紫电战甲']},{id:'tb.tu_dien.g',part:'boot',set:'A',el:'kim',def:3,n:['Hài Tử Điện','紫電戰靴','紫电战靴']},
 {id:'tb.xich_diem.h',part:'head',set:'B',el:'hoa',def:4,n:['Mũ Xích Diệm','赤焰戰盔','赤焰战盔']},{id:'tb.xich_diem.o',part:'torso',set:'B',el:'hoa',def:5,n:['Giáp Xích Diệm','赤焰戰甲','赤焰战甲']},{id:'tb.xich_diem.g',part:'boot',set:'B',el:'hoa',def:3,n:['Hài Xích Diệm','赤焰戰靴','赤焰战靴']},
 {id:'nh.thuy',part:'ring',ic:0,el:'thuy',def:0,n:['Băng Hải Giới','冰海戒','冰海戒']},{id:'nh.hoa',part:'ring',ic:1,el:'hoa',def:0,n:['Xích Viêm Giới','赤炎戒','赤炎戒']},{id:'nh.kim',part:'ring',ic:2,el:'kim',def:0,n:['Kim Linh Giới','金靈戒','金灵戒']},{id:'nh.tho',part:'ring',ic:3,el:'tho',def:0,n:['Tử Địa Giới','紫地戒','紫地戒']},{id:'nh.moc',part:'ring',ic:4,el:'moc',def:0,n:['Thanh Mộc Giới','青木戒','青木戒']},
 {id:'lq.hoang_diem',part:'aura',el:'hoa',def:0,n:['Linh Quang Hoàng Diễm','靈光皇焰','灵光皇焰']}
];
var SLOT={head:'h',torso:'o',boot:'g',ring:'r',aura:'l'};
var PARTN={head:['mũ','盔','盔'],torso:['giáp','甲','甲'],boot:['hài','靴','靴'],ring:['nhẫn','戒指','戒指'],aura:['linh quang','靈光','灵光']};
/* ---- chỉ số ngẫu nhiên (thức tỉnh): mỗi dòng = (chỉ số, giá trị 1-50). Hệ số quy đổi + màu theo giá trị ---- */
var STATS=['atk','def','hp','spd','aspd','bag'];
var STU={atk:1,def:1,hp:3,spd:.5,aspd:.5,bag:2};          /* hệ số: atk/def/hp cộng thẳng; spd/aspd = % ; bag = ô */
var RAR=[{max:3,c:'#58d66a'},{max:6,c:'#4aa3ff'},{max:9,c:'#b36bff'},{max:12,c:'#ff9a2e'},{max:15,c:'#ffd93a'},{max:19,c:'#ff4a4a'},{max:50,c:'#16121c',edge:'#ff2a2a'}];
var RARW=[40,26,16,9,5.5,3,.5];                              /* xác suất mỗi bậc — càng cao càng hiếm */
function rarOf(v){for(var i=0;i<RAR.length;i++)if(v<=RAR[i].max)return i;return RAR.length-1;}
function rollVal(){var r=Math.random()*100,i=0,acc=0;for(;i<RARW.length-1;i++){acc+=RARW[i];if(r<acc)break;}
  var lo=i?RAR[i-1].max+1:1,hi=RAR[i].max;return i===6?lo+Math.floor(Math.pow(Math.random(),3)*(hi-lo+1)):lo+Math.floor(Math.random()*(hi-lo+1));}
var byOutfit={};OUTFITS.forEach(function(o){byOutfit[o.id]=o;MISC[o.id]={dec:10};BAG.sz[o.id]=1;});
var byMount={};MOUNTS.forEach(function(m){byMount[m.id]=m;MISC[m.id]={dec:0,keep:1};BAG.sz[m.id]=4;});
/* công thức chế vũ khí: 6/8/12 vật liệu cùng hệ (quặng hoặc gỗ) + Linh Thạch. '@mat:hệ:bậc tối thiểu' = vật liệu bất kỳ của hệ đó */
var FORGE=WEAPONS.map(function(w){var t=w.tier;return {out:w.id,ing:[['@mat:'+w.el+':'+(t===1?1:2),t===1?6:t===2?8:12],['lt',t===1?2:t===2?5:15]]};});
var NAMES={ /* vi, zh-Hant, zh-Hans */
 cay_coi:['Linh Mộc','靈木','灵木'], cay_cao:['Đào Hoa Mộc','桃花木','桃花木'], tre:['Linh Trúc','靈竹','灵竹'],
 thao_duoc:['Linh Sâm','靈參','灵参'], da:['Thanh Ngọc Thạch','青玉石','青玉石'],
 go_dac_biet:['Bích Thủy Mộc','碧水木','碧水木'], co_linh_chi:['Thủy Linh Thảo','水靈草','水灵草'],
 hoa_linh:['Hỏa Linh Hoa','火靈花','火灵花'], nam_linh_chi:['Xích Linh Chi','赤靈芝','赤灵芝'],
 quang_kim:['Kim Tinh Quặng','金精礦','金精矿'], thao_quy:['Linh Liên','靈蓮','灵莲'],
 thuoc_hiem:['U Tử Thảo','幽紫草','幽紫草'], linh_thach:['Tử Linh Thạch','紫靈石','紫灵石'],
 da_linh:['Địa Linh Thạch','地靈石','地灵石'],
 kim_ngan_hoa:['Kim Ngân Hoa','金銀花','金银花'],
 bach_kim_thao:['Bạch Kim Thảo','白金草','白金草'],
 huyen_thiet_thao:['Huyền Thiết Thảo','玄鐵草','玄铁草'],
 tinh_kim_thach:['Tinh Kim Thạch','精金石','精金石'],
 thanh_tam_thao:['Thanh Tâm Thảo','清心草','清心草'],
 ngoc_linh_thao:['Ngọc Linh Thảo','玉靈草','玉灵草'],
 cuu_diep_linh_chi:['Cửu Diệp Linh Chi','九葉靈芝','九叶灵芝'],
 thanh_linh_moc:['Thanh Linh Mộc','青靈木','青灵木'],
 tuyet_lien:['Tuyết Liên','雪蓮','雪莲'],
 thuy_tinh_thao:['Thủy Tinh Thảo','水晶草','水晶草'],
 han_bang_thao:['Hàn Băng Thảo','寒冰草','寒冰草'],
 thuy_linh_thach:['Thủy Linh Thạch','水靈石','水灵石'],
 hoa_lien:['Hỏa Liên','火蓮','火莲'],
 hoa_linh_chi:['Hỏa Linh Chi','火靈芝','火灵芝'],
 huyet_linh_thao:['Huyết Linh Thảo','血靈草','血灵草'],
 hoa_tinh_thach:['Hỏa Tinh Thạch','火精石','火精石'],
 hoang_tinh_thao:['Hoàng Tinh Thảo','黃精草','黄精草'],
 dia_tam_thao:['Địa Tâm Thảo','地心草','地心草'],
 tho_linh_chi:['Thổ Linh Chi','土靈芝','土灵芝'],
 hoang_tho_thach:['Hoàng Thổ Thạch','黃土石','黄土石']
};
var LG=['vi','zh-Hant','zh-Hans'];
var byItem={},byId={},i;
for(i=0;i<RES.length;i++){var r=RES[i];r.item='nl.'+r.id;r.hits=HITS[r.tier];r.pts=PTS[r.tier];r.ls=LS[r.tier];byItem[r.item]=r;byId[r.id]=r;}

RECIPES['cg.vukhi']={verb:'forge',list:FORGE};

/* danh mục túi */
function catOf(id){if(byItem[id])return byItem[id].kind==='herb'?'duoc':'vl';if(byPearl[id]||DAN[id])return 'dan';if(RECIPES[id])return 'pp';if(byWeapon[id])return 'vk';if(byOutfit[id])return 'tb';if(byMount[id])return 'mount';return 'vl';}

/* ---- NGỌC (linh châu) rơi từ 5 quái ngũ hành: nuốt để tăng chỉ số vĩnh viễn ---- */
var PCAP=10, PFUSE=10, PT=3;                 /* mỗi bậc nuốt tối đa 10; 10 viên bậc t -> 1 viên bậc t+1; 3 bậc */
var PEARL={ /* hệ -> tên gốc [vi,hant,hans], chỉ số, mức cộng mỗi viên, màu */
 kim: {n:['Kim Tinh','金精','金精'],  stat:'dmg',per:1,   col:'#f2d36b',glow:'#e0a82e'},
 moc: {n:['Mộc Linh','木靈','木灵'],  stat:'hp', per:6,   col:'#8be57a',glow:'#3fae3a'},
 thuy:{n:['Thủy Long','水龍','水龙'], stat:'qi', per:.02,  col:'#7fd8ff',glow:'#3aa9ff'},
 hoa: {n:['Hỏa Diễm','火焰','火焰'],  stat:'spd',per:.02, col:'#ff9b6a',glow:'#ff5a2a'},
 tho: {n:['Thổ Nguyên','土元','土元'],stat:'red',per:.015,col:'#d9b06a',glow:'#a9743a'}
};
var PSUF=[['Châu','珠','珠'],['Bảo Châu','寶珠','宝珠'],['Thánh Châu','聖珠','圣珠']];
var PDEC=[20,200,2000];                      /* rã ra Linh Thạch theo bậc */
var EFF={ /* mô tả tác dụng: [vi,hant,hans] */
 kim:['+1 sát thương mỗi đòn đánh','每次攻擊傷害 +1','每次攻击伤害 +1'],
 moc:['+6 máu tối đa','最大生命 +6','最大生命 +6'],
 thuy:['+0,02 tu vi/giây (khi đã thức tỉnh Linh Căn)','修為吸收 +0.02／秒（覺醒靈根後）','修为吸收 +0.02／秒（觉醒灵根后）'],
 hoa:['+2% tốc độ đánh','攻擊速度 +2%','攻击速度 +2%'],
 tho:['giảm 1,5% sát thương nhận','受到傷害 −1.5%','受到伤害 −1.5%']
};
function pearlId(el,t){return (el==='thuy'&&t===1)?'Thủy Long Châu':'ngoc.'+el+'.'+t;}
var byPearl={};
EL.forEach(function(e){for(var t=1;t<=PT;t++){byPearl[pearlId(e.id,t)]={el:e.id,tier:t};MISC[pearlId(e.id,t)]={dec:PDEC[t-1]};}});
/* quái (id, hệ, tên) */
var MONS=[
 {id:'thuylong',el:'thuy',n:['Thủy Long','水龍','水龙']},
 {id:'hoa',el:'hoa',n:['Hỏa Diễm Long','火焰龍','火焰龙']},
 {id:'tho',el:'tho',n:['Thổ Dực Long','土翼龍','土翼龙']},
 {id:'kim',el:'kim',n:['Kim Giáp Tê','金甲犀','金甲犀']},
 {id:'moc',el:'moc',n:['Mộc Linh Thú','木靈獸','木灵兽']}
];

var S=[ /* chuỗi giao diện mới: [vi, zh-Hant, zh-Hans] */
 ['bag.tab.root','Linh Căn','靈根','灵根'],
 ['cul.hint','Khai thác tài nguyên (nút ĐÁNH khi đứng gần), rồi luyện hóa thành Kim · Mộc · Thủy · Hỏa · Thổ. Đủ 5 hệ đạt {n} sẽ thức tỉnh được Linh Căn.','擊打資源（靠近後按攻擊）獲取材料，再煉化成金、木、水、火、土。五行各達 {n} 即可覺醒靈根。','击打资源（靠近后按攻击）获取材料，再炼化成金、木、水、火、土。五行各达 {n} 即可觉醒灵根。'],
 ['cul.refine','Luyện hóa','煉化','炼化'],
 ['cul.mat','nguyên liệu: {n}','材料：{n}','材料：{n}'],
 ['cul.full','Đã đầy','已滿','已满'],
 ['cul.awake','✦ Thức tỉnh Linh Căn','✦ 覺醒靈根','✦ 觉醒灵根'],
 ['cul.need','Cần đủ 5 hệ đạt {n} để thức tỉnh','需五行皆達 {n} 才能覺醒','需五行皆达 {n} 才能觉醒'],
 ['cul.done','Linh Căn đã thức tỉnh','靈根已覺醒','灵根已觉醒'],
 ['cul.qi','Linh khí','靈氣','灵气'],
 ['cul.rate','Tu luyện thường {n} tu vi/giây — muốn nhanh hơn phải dùng đan dược','平時修煉每秒 {n} 修為——想更快須服用丹藥','平时修炼每秒 {n} 修为——想更快须服用丹药'],
 ['realm.n','Luyện Khí tầng {n}','練氣第 {n} 層','练气第 {n} 层'],
 ['realm.full','Luyện Khí viên mãn — cần đan dược để vào cảnh giới sau','練氣圓滿——需丹藥方能進入下一境界','练气圆满——需丹药方能进入下一境界'],
 ['realm.cur','Cảnh giới','境界','境界'],['realm.mul','Hệ số cảnh giới','境界倍率','境界倍率'],
 ['realm.exp','Tu vi','修為','修为'],
 ['act.break','⚡ Đột phá tầng {n}','⚡ 突破第 {n} 層','⚡ 突破第 {n} 层'],
 ['realm.bonus','Đột phá: máu và sát thương ×{m} (cộng dồn)','突破：生命與傷害 ×{m}（累乘）','突破：生命与伤害 ×{m}（累乘）'],
 ['toast.break','Đột phá thành công! Luyện Khí tầng {n} — máu & sát thương ×{m}','突破成功！練氣第 {n} 層——生命與傷害 ×{m}','突破成功！练气第 {n} 层——生命与伤害 ×{m}'],
 ['toast.nobreak','Tu vi chưa đủ để đột phá','修為不足，無法突破','修为不足，无法突破'],
 ['toast.dan','Dùng {name}: +{n} tu vi','服用{name}：修為 +{n}','服用{name}：修为 +{n}'],
 ['toast.dan.full','Tu vi tầng này đã đầy — hãy đột phá trước','此層修為已滿——請先突破','此层修为已满——请先突破'],
 ['toast.dan.max','Luyện Khí đã viên mãn, đan này không còn tác dụng','練氣已圓滿，此丹無效','练气已圆满，此丹无效'],
 ['toast.dan.asleep','Cần thức tỉnh Linh Căn trước','需先覺醒靈根','需先觉醒灵根'],
 ['ui.char','Nhân Vật','角色','角色'],['ui.tu','Tu Luyện','修煉','修炼'],['ui.stats','Chỉ số cơ bản','基礎屬性','基础属性'],['ui.detail','Chi tiết','詳細資訊','详细信息'],['ui.hint','Gợi ý','提示','提示'],
 ['ui.h1','Hạ yêu thú ngũ hành để thu nguyên liệu, rồi luyện hóa vào Linh Căn.','擊敗五行妖獸取得材料，再煉化入靈根。','击败五行妖兽取得材料，再炼化入灵根。'],
 ['ui.h2','Linh Căn đủ đầy mới thức tỉnh được; tu vi tăng dần theo thời gian.','靈根圓滿方可覺醒；修為隨時間增長。','灵根圆满方可觉醒；修为随时间增长。'],
 ['ui.h3','Đủ tu vi thì đột phá để lên tầng cảnh giới mới.','修為足夠即可突破，晉升新境界。','修为足够即可突破，晋升新境界。'],
 ['toast.equip.g','Đã trang bị {name}','已裝備{name}','已装备{name}'],['toast.awk','Thức tỉnh: {line}','覺醒：{line}','觉醒：{line}'],['toast.awk.no','Chưa đủ nguyên liệu thức tỉnh','覺醒材料不足','觉醒材料不足'],['toast.awk.max','Đã mở hết dòng chỉ số','屬性已全部開啟','属性已全部开启'],
 ['st.atk','Tấn công','攻擊','攻击'],['st.def','Phòng thủ','防禦','防御'],['st.hp','Khí huyết','氣血','气血'],['st.spd','Tốc chạy','移速','移速'],['st.aspd','Tốc đánh','攻速','攻速'],['st.bag','Sức chứa kho','倉庫容量','仓库容量'],
 ['rar.0','Lục','綠','绿'],['rar.1','Lam','藍','蓝'],['rar.2','Tím','紫','紫'],['rar.3','Cam','橙','橙'],['rar.4','Vàng','金','金'],['rar.5','Đỏ','紅','红'],['rar.6','Huyền Bí','玄秘','玄秘'],
 ['eq.title','Trang bị','裝備','装备'],['eq.base','Cơ bản','基礎','基础'],['eq.lines','Thức tỉnh {n}/{cap}','覺醒 {n}/{cap}','觉醒 {n}/{cap}'],['eq.empty','Chưa mở dòng nào','尚未開啟','尚未开启'],['eq.locked','（chưa mở）','（未開）','（未开）'],
 ['eq.unequip','Tháo','卸下','卸下'],['eq.replace','Thay thế','更換','更换'],['eq.awake','Thức tỉnh','覺醒','觉醒'],['eq.awake.cost','Cần {lt} Linh Thạch + {n} nguyên liệu hệ {el} ({have} có)','需 {lt} 靈石 + {n} 個{el}系材料（現有 {have}）','需 {lt} 灵石 + {n} 个{el}系材料（现有 {have}）'],['eq.awake.full','Đã mở hết','已全開','已全开'],
 ['eq.none','Không có món phù hợp trong kho','倉庫中沒有合適的','仓库中没有合适的'],['eq.pick','Chọn món để thay','選擇要更換的裝備','选择要更换的装备'],['eq.close','Đóng','關閉','关闭'],
 ['eq.slot.head','Mũ','頭盔','头盔'],['eq.slot.body','Giáp','護甲','护甲'],['eq.slot.boot','Hài','靴子','靴子'],['eq.slot.wp','Vũ khí','武器','武器'],['eq.slot.ring','Nhẫn','戒指','戒指'],['eq.slot.aura','Linh quang','靈光','灵光'],['eq.slot.pet','Pet','寵物','宠物'],['eq.slot.mount','Linh thú','靈獸','灵兽'],
 ['eq.pet.info','Linh thú đồng hành hệ {el}','同行靈寵，{el}系','同行灵宠，{el}系'],['eq.mount.info','Chạy ×{run} · Bay ×{fly} · hệ {el}','奔跑 ×{run} · 飛行 ×{fly} · {el}系','奔跑 ×{run} · 飞行 ×{fly} · {el}系'],['eq.ride','Cưỡi','騎乘','骑乘'],['eq.unride','Xuống','下騎','下骑'],
 ['sx.run','Tốc chạy','移速','移速'],['sx.bagcap','Sức chứa kho','倉庫容量','仓库容量'],
 ['toast.equip.o','Đã mặc {name}: +{def} phòng thủ','已穿上{name}：防禦 +{def}','已穿上{name}：防御 +{def}'],['of.stat','Bộ Tử Điện · +{def} phòng thủ · hệ {el}','紫電套裝 · 防禦 +{def} · {el}系','紫电套装 · 防御 +{def} · {el}系'],
 ['cat.all','Tất cả','全部','全部'],
 ['cat.duoc','Linh dược','靈藥','灵药'],
 ['cat.vl','Vật liệu','材料','材料'],
 ['cat.dan','Linh đan','靈丹','灵丹'],
 ['cat.pp','Đan phương','丹方','丹方'],
 ['cat.vk','Vũ khí','武器','武器'],
 ['cat.tb','Trang bị','裝備','装备'],
 ['cat.mount','Thú cưỡi','坐騎','坐骑'],
 ['cat.pet','Pet','靈寵','灵宠'],
 ['cat.empty','Chưa có vật phẩm loại này.','尚無此類物品。','尚无此类物品。'],
 ['cat.empty.tb','Chưa có trang bị. Áo, mũ, giày sẽ sớm ra mắt.','尚無裝備。衣、帽、鞋即將推出。','尚无装备。衣、帽、鞋即将推出。'],
 ['cat.empty.mount','Chưa có thú cưỡi.','尚無坐騎。','尚无坐骑。'],
 ['cat.empty.pet','Chưa có pet. Hạ quái ngũ hành, mỗi con có 1% được thuần hóa.','尚無靈寵。擊敗五行妖獸，各有 1% 機率馴服。','尚无灵宠。击败五行妖兽，各有 1% 几率驯服。'],
 ['act.equip','Trang bị','裝備','装备'],
 ['act.unequip','Tháo ra','卸下','卸下'],
 ['act.open','Mở lò','開爐','开炉'],
 ['toast.equip','Đã trang bị {name}: +{atk} sát thương','已裝備{name}：傷害 +{atk}','已装备{name}：伤害 +{atk}'],
 ['toast.unequip','Đã tháo {name}','已卸下{name}','已卸下{name}'],
 ['wp.stat','Phẩm {t} · +{atk} sát thương mỗi đòn · hệ {el}','{t} · 每次攻擊傷害 +{atk} · {el}系','{t} · 每次攻击伤害 +{atk} · {el}系'],
 ['wp.on','Đang trang bị','裝備中','装备中'],
 ['alc.forge','Chế tạo','鍛造','锻造'],
 ['alc.forgeall','Chế tối đa ({n})','盡量鍛造（{n}）','尽量锻造（{n}）'],
 ['alc.pick','Chọn vật phẩm cần chế','選擇要製作的物品','选择要制作的物品'],
 ['alc.mat','Vật liệu hệ {el} (quặng/gỗ, bậc ≥{t})','{el}系材料（礦石／木，階 ≥{t}）','{el}系材料（矿石／木，阶 ≥{t}）'],
 ['alc.outw','Thành phẩm: {name} (+{atk} sát thương)','成品：{name}（傷害 +{atk}）','成品：{name}（伤害 +{atk}）'],
 ['item.cg.vukhi','Cuộn Giản: Chế Tạo Vũ Khí','卷簡：鍛造武器','卷简：锻造武器'],
 ['itemdesc.cg.vukhi','Ghi phương pháp chế tạo 12 loại vũ khí từ quặng, gỗ cùng hệ và Linh Thạch. Bấm Mở lò để chế. Không mất sau khi dùng.','記載以同系礦石、木材與靈石鍛造 12 種武器之法。按「開爐」製作。使用後不會消失。','记载以同系矿石、木材与灵石锻造 12 种武器之法。按「开炉」制作。使用后不会消失。'],
 ['sx.weapon','Vũ khí','武器','武器'],
 ['sx.noweapon','Tay không','空手','空手'],
 ['hud.bag','Túi','背包','背包'],
 ['hud.map','Bản đồ','地圖','地图'],
 ['hud.quest','Nhiệm vụ','任務','任务'],
 ['hud.sect','Tông Môn','宗門','宗门'],
 ['hud.char','Nhân vật','角色','角色'],
 ['hud.set','Cài đặt','設定','设置'],
 ['hud.soon','Sắp ra mắt','即將推出','即将推出'],
 ['hud.asleep','Chưa thức tỉnh Linh Căn','尚未覺醒靈根','尚未觉醒灵根'],
 ['hud.qi','Tu vi {a} / {b}','修為 {a} / {b}','修为 {a} / {b}'],
 ['hud.qi.max','Tu vi {n} · viên mãn','修為 {n} · 圓滿','修为 {n} · 圆满'],
 ['hud.mapt','Bản đồ thế giới','世界地圖','世界地图'],
 ['hud.maph','Thế giới hình tròn: đi mãi một hướng sẽ quay lại. Chạm để đóng.','世界是圓的：一直走會回到原點。點擊關閉。','世界是圆的：一直走会回到原点。点击关闭。'],
 ['zone.c','Thanh Vân Thôn','青雲村','青云村'],
 ['zone.n','Bắc Nguyên','北原','北原'],
 ['zone.ne','Thổ Dực Sơn','土翼山','土翼山'],
 ['zone.e','Đông Vực','東域','东域'],
 ['zone.se','Hỏa Diễm Cốc','火焰谷','火焰谷'],
 ['zone.s','Nam Hoang','南荒','南荒'],
 ['zone.sw','Mộc Linh Lâm','木靈林','木灵林'],
 ['zone.w','Tây Vực','西域','西域'],
 ['zone.nw','Kim Giáp Lĩnh','金甲嶺','金甲岭'],
 ['set.code','Mã quà tặng','禮包碼','礼包码'],
 ['set.code.ph','Nhập mã','輸入代碼','输入代码'],
 ['set.code.go','Nhận','領取','领取'],
 ['toast.code.ok','Nhận quà thành công! Đã thêm tài nguyên, đan, vũ khí và cuộn giản để thử nghiệm.','領取成功！已加入資源、丹藥、武器與卷簡供測試。','领取成功！已加入资源、丹药、武器与卷简供测试。'],
 ['toast.code.bad','Mã không đúng','代碼錯誤','代码错误'],
 ['alc.herb1','Thảo dược bậc 1 (loại nào cũng được)','一階草藥（任意種類）','一阶草药（任意种类）'],
 ['alc.title','Luyện đan','煉丹','炼丹'],['alc.have','có {n}','擁有 {n}','拥有 {n}'],['alc.make','Luyện đan','煉製','炼制'],['alc.makeall','Luyện tối đa ({n})','盡量煉製（{n}）','尽量炼制（{n}）'],
 ['alc.out','Thành phẩm: {name} ({eff})','成品：{name}（{eff}）','成品：{name}（{eff}）'],['alc.keep','Đan phương không mất sau khi dùng.','丹方不會消耗。','丹方不会消耗。'],
 ['toast.alc','Luyện thành {name} ×{n}','煉成{name} ×{n}','炼成{name} ×{n}'],['toast.alc.no','Thiếu nguyên liệu','材料不足','材料不足'],
 ['item.dp.tukhi','Đan Phương: Tụ Khí Đan','丹方：聚氣丹','丹方：聚气丹'],
 ['itemdesc.dp.tukhi','Công thức luyện Tụ Khí Đan (3 thảo dược bậc 1 bất kỳ + 1 Linh Thạch). Bấm Sử dụng để mở lò luyện. Không mất sau khi dùng.','聚氣丹的煉製丹方（任意 3 株一階草藥 + 1 靈石）。按「使用」開啟丹爐。使用後不會消失。','聚气丹的炼制丹方（任意 3 株一阶草药 + 1 灵石）。按「使用」开启丹炉。使用后不会消失。'],
 ['item.dan.tukhi','Tụ Khí Đan','聚氣丹','聚气丹'],
 ['itemdesc.dan.tukhi','Đan dược cơ bản của Luyện Khí kỳ. Sử dụng: +100 tu vi. Rã: 10 Linh Thạch.','練氣期基礎丹藥。使用：修為 +100。分解：靈石 10。','练气期基础丹药。使用：修为 +100。分解：灵石 10。'],
 ['toast.bagfull','Túi đã đầy — vứt, rã hoặc dùng bớt vật phẩm','背包已滿——請丟棄、分解或使用一些物品','背包已满——请丢弃、分解或使用一些物品'],
 ['bag.cap2','Dung tích túi: {n} / {cap} ô','背包容量：{n} / {cap} 格','背包容量：{n} / {cap} 格'],
 ['bag.size','Chiếm {s} ô mỗi vật phẩm','每件佔 {s} 格','每件占 {s} 格'],['bag.size0','Tiền tệ, không chiếm chỗ','貨幣，不佔空間','货币，不占空间'],
 ['sx.def','Phòng thủ','防禦','防御'],['sx.atk','Tấn công','攻擊力','攻击力'],
 ['sx.realm','Cảnh giới','境界','境界'],

 ['toast.refine','Luyện hóa: +{n} {el}','煉化：+{n} {el}','炼化：+{n} {el}'],
 ['toast.refine0','Không còn nguyên liệu hệ {el}','沒有{el}系材料了','没有{el}系材料了'],
 ['toast.awake','Linh Căn thức tỉnh! Linh khí bắt đầu tụ về mỗi giây.','靈根覺醒！靈氣開始每秒匯聚。','灵根觉醒！灵气开始每秒汇聚。'],
 ['toast.hit','{name} {n}/{m}','{name} {n}/{m}','{name} {n}/{m}'],
 ['j.roots','Ngũ hành','五行','五行'],
 ['j.qi','Linh khí','靈氣','灵气'],
 ['j.asleep','chưa thức tỉnh','未覺醒','未觉醒'],
 ['act.drop','Vứt','丟棄','丢弃'],['act.dec','Rã thành Linh Thạch (+{n})','分解成靈石（+{n}）','分解成灵石（+{n}）'],['act.use','Sử dụng','使用','使用'],
 ['toast.drop','Đã vứt {name} (biến mất sau 1 phút)','已丟棄{name}（1 分鐘後消失）','已丢弃{name}（1 分钟后消失）'],
 ['toast.dec','Rã {name} → +{n} Linh Thạch','分解{name} → 靈石 +{n}','分解{name} → 灵石 +{n}'],
 ['toast.full','Hệ {el} đã đầy','{el}行已滿','{el}行已满'],
 ['item.lt','Linh Thạch','靈石','灵石'],
 ['itemdesc.lt','Tinh hoa linh khí kết tinh, tiền tệ của giới tu tiên. Chưa có công dụng khác.','靈氣結晶，修仙界的通用貨幣。暫無其他用途。','灵气结晶，修仙界的通用货币。暂无其他用途。'],
 ['bag.tab.stats','Chỉ số','屬性','属性'],
 ['act.fuse','Hợp nhất {n} → 1 {name}','合成 {n} → 1 {name}','合成 {n} → 1 {name}'],
 ['toast.fuse','Hợp nhất thành công: {name}','合成成功：{name}','合成成功：{name}'],
 ['toast.swallow','Nuốt {name}: {eff}','吞服{name}：{eff}','吞服{name}：{eff}'],
 ['pl.status','Bậc {t} · đã nuốt {n}/{cap}','第 {t} 階 · 已吞服 {n}/{cap}','第 {t} 阶 · 已吞服 {n}/{cap}'],
 ['pl.lock','Cần nuốt đủ {cap} viên bậc trước để dùng bậc này.','需先吞服滿 {cap} 顆上一階，才能使用此階。','需先吞服满 {cap} 颗上一阶，才能使用此阶。'],
 ['mt.ride','CƯỠI','騎乘','骑乘'],['mt.down','XUỐNG','下騎','下骑'],['mt.fly','BAY','飛行','飞行'],['mt.land','HẠ','降落','降落'],['mt.dash','LƯỚT','衝刺','冲刺'],
 ['toast.mt.up','Đã cưỡi {name}','已騎乘{name}','已骑乘{name}'],['toast.mt.down','Đã xuống thú','已下騎','已下骑'],
 ['toast.mt.fly','Bay lên! Nhanh hơn, bỏ qua địa hình — nhưng không đánh được, cũng không bị đánh.','起飛！更快、無視地形——但無法攻擊，也不會被攻擊。','起飞！更快、无视地形——但无法攻击，也不会被攻击。'],
 ['toast.mt.land','Đã hạ xuống đất','已降落地面','已降落地面'],['toast.mt.nofly','Phàm thú không bay được','凡獸無法飛行','凡兽无法飞行'],['toast.mt.noatk','Đang bay: hạ xuống đất mới đánh được','飛行中：降落後才能攻擊','飞行中：降落后才能攻击'],
 ['act.ride','Cưỡi','騎乘','骑乘'],['act.unride','Xuống thú','下騎','下骑'],['mt.stat','Linh thú · chạy ×{run} · bay ×{fly} · hệ {el}','靈獸 · 奔跑 ×{run} · 飛行 ×{fly} · {el}系','灵兽 · 奔跑 ×{run} · 飞行 ×{fly} · {el}系'],
 ['pl.cap','Đã nuốt đủ {cap} viên bậc này. Hãy hợp nhất {cap} viên thành 1 viên bậc cao hơn.','此階已吞服滿 {cap} 顆。請將 {cap} 顆合成 1 顆更高階的靈珠。','此阶已吞服满 {cap} 颗。请将 {cap} 颗合成 1 颗更高阶的灵珠。'],
 ['pl.max','Đã đạt giới hạn hiện tại của hệ này.','此系已達目前上限。','此系已达目前上限。'],
 ['sx.hp','Máu','生命','生命'],['sx.dmg','Sát thương mỗi đòn','每次攻擊傷害','每次攻击伤害'],['sx.spd','Tốc độ đánh','攻擊速度','攻击速度'],
 ['sx.spd.v','{n} đòn/giây','{n} 次／秒','{n} 次／秒'],['sx.red','Giảm sát thương nhận','減傷','减伤'],
 ['sx.qi','Hấp thu linh khí','靈氣吸收','灵气吸收'],['sx.qi.v','{n}/giây','{n}／秒','{n}／秒'],['sx.qitotal','Linh khí đã hấp thu','累計靈氣','累计灵气'],
 ['sx.roots','Ngũ hành','五行','五行'],['sx.pearls','Châu đã nuốt (bậc 1·2·3)','已吞靈珠（1·2·3 階）','已吞灵珠（1·2·3 阶）'],
 ['sx.pets','Linh thú','靈獸','灵兽'],['sx.none','Chưa có','暫無','暂无'],['sx.kills','Quái đã hạ','擊殺妖獸','击杀妖兽'],['sx.lt','Linh Thạch','靈石','灵石'],
 ['toast.tame','Thuần hóa thành công! {name} đã theo bạn.','馴服成功！{name}已跟隨你。','驯服成功！{name}已跟随你。'],
 ['toast.pearl','Nhận được {name}','獲得{name}','获得{name}'],
 ['auto.btn','TỰ ĐỘNG','自動','自动'],['auto.btn.on','ĐANG CHẠY','運行中','运行中'],
 ['toast.auto.on','Tự động săn trong vùng quanh đây ({r} ô).','自動狩獵此處周圍（{r} 格）。','自动狩猎此处周围（{r} 格）。'],
 ['toast.auto.off','Đã tắt tự động.','已關閉自動。','已关闭自动。'],
 ['toast.auto.low','Máu thấp — tự động đã tắt.','生命過低，已關閉自動。','生命过低，已关闭自动。'],
 ['itemdesc.nl','{name}: nguyên liệu hệ {el}. Sử dụng: luyện hóa +{pts} điểm {el} cho Linh Căn. Rã: nhận {ls} Linh Thạch.','{name}：{el}系材料。使用：煉化 +{pts} 點{el}行。分解：得 {ls} 靈石。','{name}：{el}系材料。使用：炼化 +{pts} 点{el}行。分解：得 {ls} 灵石。']
];
var add={vi:{},'zh-Hant':{},'zh-Hans':{}};
S.forEach(function(r){if(r[0]==='itemdesc.nl')return;for(var k=0;k<3;k++)add[LG[k]][r[0]]=r[k+1];});
var tpl=S[S.length-1];
RES.forEach(function(r){
  var e=EL.filter(function(x){return x.id===r.el;})[0];
  for(var k=0;k<3;k++){
    add[LG[k]]['item.'+r.item]=NAMES[r.id][k];
    add[LG[k]]['itemdesc.'+r.item]=tpl[k+1].replace(/\{name\}/g,NAMES[r.id][k]).replace(/\{el\}/g,e.n[k]).replace(/\{pts\}/g,r.pts).replace(/\{ls\}/g,r.ls);
  }
});
EL.forEach(function(e){for(var k=0;k<3;k++)add[LG[k]]['el.'+e.id]=e.n[k];});
/* tên & mô tả ngọc */
var PDESC=[ '{name}: linh châu hệ {el}, kết tinh từ yêu thú. Sử dụng (nuốt): {eff}. Mỗi bậc chỉ nuốt tối đa {cap} viên; đủ {cap} viên thì hợp nhất {cap} viên thành 1 viên bậc cao hơn. Rã: {ls} Linh Thạch.',
 '{name}：{el}系靈珠，由妖獸凝結而成。使用（吞服）：{eff}。每階最多吞服 {cap} 顆；滿 {cap} 顆後須將 {cap} 顆合成 1 顆更高階靈珠。分解：得 {ls} 靈石。',
 '{name}：{el}系灵珠，由妖兽凝结而成。使用（吞服）：{eff}。每阶最多吞服 {cap} 颗；满 {cap} 颗后须将 {cap} 颗合成 1 颗更高阶灵珠。分解：得 {ls} 灵石。' ];
EL.forEach(function(e){for(var t=1;t<=PT;t++){var id=pearlId(e.id,t);
  for(var k=0;k<3;k++){
    var nm=PEARL[e.id].n[k]+(k===0?' ':'')+PSUF[t-1][k];
    add[LG[k]]['item.'+id]=nm;
    add[LG[k]]['itemdesc.'+id]=PDESC[k].replace(/\{name\}/g,nm).replace(/\{el\}/g,e.n[k]).replace(/\{eff\}/g,EFF[e.id][k]).replace(/\{cap\}/g,PCAP).replace(/\{ls\}/g,PDEC[t-1]);
    add[LG[k]]['eff.'+e.id]=EFF[e.id][k];
  }}});
WEAPONS.forEach(function(w){
  var e=EL.filter(function(x){return x.id===w.el;})[0];
  for(var k=0;k<3;k++){
    add[LG[k]]['item.'+w.id]=w.n[k];
    add[LG[k]]['itemdesc.'+w.id]=[ '{name}: vũ khí {tier} hệ {el}. Cuộn Giản chỉ tạo ra hình dáng; chỉ số do Thức Tỉnh mở ngẫu nhiên. Rã: {ls} Linh Thạch.',
      '{name}：{tier}，{el}系武器。卷簡只鍛造外形；屬性由覺醒隨機開啟。分解：靈石 {ls}。','{name}：{tier}，{el}系武器。卷简只锻造外形；属性由觉醒随机开启。分解：灵石 {ls}。'][k]
      .replace(/\{name\}/g,w.n[k]).replace(/\{tier\}/g,WTIER[w.tier-1][k]).replace(/\{el\}/g,e.n[k]).replace(/\{atk\}/g,w.atk).replace(/\{ls\}/g,WLS[w.tier]);
  }});
OUTFITS.forEach(function(o){var e=EL.filter(function(x){return x.id===o.el;})[0];
  for(var k=0;k<3;k++){add[LG[k]]['item.'+o.id]=o.n[k];
    add[LG[k]]['itemdesc.'+o.id]=['{name}: {part} hệ {el}. Chỉ số ngẫu nhiên mở dần qua Thức Tỉnh (cần nguyên liệu). Mặc/tháo riêng từng món; rã: 10 Linh Thạch.','{name}：{el}系{part}。隨機屬性透過覺醒逐條開啟（需材料）。可單獨穿脫；分解：靈石 10。','{name}：{el}系{part}。随机属性通过觉醒逐条开启（需材料）。可单独穿脱；分解：灵石 10。'][k]
      .replace(/\{name\}/g,o.n[k]).replace(/\{el\}/g,e.n[k]).replace(/\{part\}/g,PARTN[o.part][k]);}});
MONS.forEach(function(m){for(var k=0;k<3;k++)add[LG[k]]['monster.'+m.id]=m.n[k];});
MOUNTS.forEach(function(m){var e=EL.filter(function(x){return x.id===m.el;})[0];
  for(var k=0;k<3;k++){add[LG[k]]['item.'+m.id]=m.n[k];
    add[LG[k]]['itemdesc.'+m.id]=['{name}: linh thú hệ {el}, biết bay. Chạy nhanh ×{run}, bay ×{fly}; bay thì bỏ qua địa hình nhưng không đánh được và cũng không bị đánh. Có nút LƯỚT.',
      '{name}：{el}系靈獸，會飛。奔跑 ×{run}，飛行 ×{fly}；飛行時無視地形，但無法攻擊也不會被攻擊。可使用衝刺。','{name}：{el}系灵兽，会飞。奔跑 ×{run}，飞行 ×{fly}；飞行时无视地形，但无法攻击也不会被攻击。可使用冲刺。'][k]
      .replace(/\{name\}/g,m.n[k]).replace(/\{el\}/g,e.n[k]).replace(/\{run\}/g,String(m.spd).replace('.',k?'.':',')).replace(/\{fly\}/g,String(m.fspd).replace('.',k?'.':','));}});
WTIER.forEach(function(t,i){for(var k=0;k<3;k++)add[LG[k]]['wtier.'+(i+1)]=t[k];});
for(var k=0;k<3;k++)I18N.add(LG[k],add[LG[k]]);
window.TTData={EL:EL,RES:RES,byItem:byItem,byId:byId,PEARL:PEARL,PCAP:PCAP,PFUSE:PFUSE,PT:PT,pearlId:pearlId,byPearl:byPearl,MONS:MONS,MOUNTS:MOUNTS,byMount:byMount,OUTFITS:OUTFITS,SLOT:SLOT,STATS:STATS,STU:STU,RAR:RAR,rarOf:rarOf,rollVal:rollVal,PARTN:PARTN,byOutfit:byOutfit,REALM:REALM,WEAPONS:WEAPONS,byWeapon:byWeapon,ICO:ICO,WTIER:WTIER,catOf:catOf,BAG:BAG,AFF:AFF,BASE:BASE,DAN:DAN,RECIPES:RECIPES,NEED:NEED,HITS:HITS,PTS:PTS,RESPAWN:300000,misc:MISC};
})();
