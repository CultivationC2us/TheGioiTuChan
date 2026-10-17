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
 {id:'da_linh',     el:'tho', tier:3,kind:'ore', sc:.8333}
];
var HITS={1:3,2:4,3:5}, PTS={1:5,2:15,3:40}, LS={1:1,2:3,3:8}, NEED=100;
var MISC={'Thủy Long Châu':{dec:20},'lt':{dec:0}};
var NAMES={ /* vi, zh-Hant, zh-Hans */
 cay_coi:['Linh Mộc','靈木','灵木'], cay_cao:['Đào Hoa Mộc','桃花木','桃花木'], tre:['Linh Trúc','靈竹','灵竹'],
 thao_duoc:['Linh Sâm','靈參','灵参'], da:['Thanh Ngọc Thạch','青玉石','青玉石'],
 go_dac_biet:['Bích Thủy Mộc','碧水木','碧水木'], co_linh_chi:['Thủy Linh Thảo','水靈草','水灵草'],
 hoa_linh:['Hỏa Linh Hoa','火靈花','火灵花'], nam_linh_chi:['Xích Linh Chi','赤靈芝','赤灵芝'],
 quang_kim:['Kim Tinh Quặng','金精礦','金精矿'], thao_quy:['Linh Liên','靈蓮','灵莲'],
 thuoc_hiem:['U Tử Thảo','幽紫草','幽紫草'], linh_thach:['Tử Linh Thạch','紫靈石','紫灵石'],
 da_linh:['Địa Linh Thạch','地靈石','地灵石']
};
var LG=['vi','zh-Hant','zh-Hans'];
var byItem={},byId={},i;
for(i=0;i<RES.length;i++){var r=RES[i];r.item='nl.'+r.id;r.hits=HITS[r.tier];r.pts=PTS[r.tier];r.ls=LS[r.tier];byItem[r.item]=r;byId[r.id]=r;}

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
 ['cul.rate','Mỗi giây hấp thu +1, mọi lúc mọi nơi','每秒吸收 +1，隨時隨地','每秒吸收 +1，随时随地'],
 ['toast.refine','Luyện hóa: +{n} {el}','煉化：+{n} {el}','炼化：+{n} {el}'],
 ['toast.refine0','Không còn nguyên liệu hệ {el}','沒有{el}系材料了','没有{el}系材料了'],
 ['toast.awake','Linh Căn thức tỉnh! Linh khí bắt đầu tụ về mỗi giây.','靈根覺醒！靈氣開始每秒匯聚。','灵根觉醒！灵气开始每秒汇聚。'],
 ['toast.hit','{name} {n}/{m}','{name} {n}/{m}','{name} {n}/{m}'],
 ['hud.qi','Linh khí {n}','靈氣 {n}','灵气 {n}'],
 ['j.roots','Ngũ hành','五行','五行'],
 ['j.qi','Linh khí','靈氣','灵气'],
 ['j.asleep','chưa thức tỉnh','未覺醒','未觉醒'],
 ['act.drop','Vứt','丟棄','丢弃'],['act.dec','Rã thành Linh Thạch (+{n})','分解成靈石（+{n}）','分解成灵石（+{n}）'],['act.use','Sử dụng','使用','使用'],
 ['toast.drop','Đã vứt {name} (biến mất sau 1 phút)','已丟棄{name}（1 分鐘後消失）','已丢弃{name}（1 分钟后消失）'],
 ['toast.dec','Rã {name} → +{n} Linh Thạch','分解{name} → 靈石 +{n}','分解{name} → 灵石 +{n}'],
 ['toast.full','Hệ {el} đã đầy','{el}行已滿','{el}行已满'],
 ['item.lt','Linh Thạch','靈石','灵石'],
 ['itemdesc.lt','Tinh hoa linh khí kết tinh, tiền tệ của giới tu tiên. Chưa có công dụng khác.','靈氣結晶，修仙界的通用貨幣。暫無其他用途。','灵气结晶，修仙界的通用货币。暂无其他用途。'],
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
for(var k=0;k<3;k++)I18N.add(LG[k],add[LG[k]]);
window.TTData={EL:EL,RES:RES,byItem:byItem,byId:byId,NEED:NEED,HITS:HITS,PTS:PTS,RESPAWN:300000,misc:MISC};
})();
