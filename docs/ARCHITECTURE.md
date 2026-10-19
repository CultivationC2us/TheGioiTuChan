# Kiến trúc hiện tại và kế hoạch tách module

> Phạm vi: kiểm kê tĩnh từ repository `main`; tài liệu này không thay đổi logic game, dữ liệu người chơi, schema hoặc cấu hình triển khai.

## 1. Hiện trạng đã xác minh

- Game là ứng dụng web được đóng gói thành một file HTML lớn ở root: `index.html` (khoảng 2.9 MB).
- Mã nguồn chính nằm dưới `src/nw/`; `src/nw/build.py` tạo `src/nw/game.html` và đồng thời ghi `index.html`. Vì vậy **không sửa trực tiếp `index.html`**; sửa nguồn rồi build.
- `src/nw/game_tpl.html` là template HTML/JS chính; nhiều module JavaScript được nhúng vào bundle qua build.
- Có các module nghiệp vụ: `auth.js`, `bag.js`, `hud.js`, `i18n.js`, `kie.js`, `mnt.js`, `mon2.js`, `npc.js`, `outfit.js`, `res.js`, `settings.js`, `skill.js`.
- Có phiên bản song song/legacy như `bag_new.js`, `bag_old.js`, `hud_new.js`, `hud_oldbase.js`. Chưa xóa file nào vì cần xác minh module nào được build và module nào còn được tham chiếu.
- Asset và công cụ tạo asset đang xen kẽ theo nhóm: `assets/`, `it/`, `kie/`, `lib/`, `mnt/`, `mon/`, `outfit/`, `pix/`, `res/`, `res2/`, `ui/`.
- Backend có các file SQL ở root: `supabase_leaderboard.sql`, `supabase_saves.sql`, `supabase_trucco_patch.sql`; có workflow GitHub Actions cho CI và thao tác Supabase an toàn.
- Có nhiều bài kiểm tra trong `src/nw/test_*.py`, nhưng cấu trúc hiện tại chưa chia rõ thành các gói test theo domain.

## 2. Ranh giới module mục tiêu

| Miền | Trách nhiệm | Nguồn hiện tại liên quan | Đích đề xuất (từng bước) |
|---|---|---|---|
| Nền tảng / dữ liệu | model nhân vật, trạng thái, lưu/khôi phục, cấu hình dữ liệu | `auth.js`, phần trạng thái trong `game_tpl.html`, SQL saves | `src/nw/core/`, `src/nw/data/` |
| Tài khoản & đồng bộ | đăng nhập, phiên, save cloud, leaderboard | `auth.js`, SQL, workflow Supabase | `src/nw/platform/` |
| Túi đồ & trang bị | vật phẩm, kho, trang bị, vật liệu, đan dược, công pháp | `bag.js`, `bag_new.js`, `bag_old.js`, `it/`, `outfit.js` | `src/nw/systems/inventory/` |
| Gameplay | chiến đấu, quái, kỹ năng, tu luyện, đột phá, NPC, tài nguyên | `skill.js`, `mon2.js`, `npc.js`, `res.js`, `kie.js`, logic trong template | `src/nw/systems/{combat,monsters,cultivation,world}/` |
| Giao diện | HUD, menu, bản đồ nhỏ, thiết lập, bản địa hóa | `hud.js`, `settings.js`, `i18n.js`, `pix/`, `ui/` | `src/nw/ui/` |
| Nghệ thuật / asset | sprite, atlas, metadata, hiệu ứng, âm thanh, map tiles | các thư mục asset và extractor hiện có | `assets/{characters,monsters,items,ui,effects,world,audio}/` (ưu tiên giữ đường dẫn nguồn cho đến khi build được cập nhật) |
| Build & kiểm thử | build bundle, kiểm tra hợp đồng, kiểm tra hồi quy | `build.py`, `test_*.py`, `.github/workflows/game-ci.yml` | `tools/`, `tests/{unit,integration}/`, CI |

Các đường dẫn đích trên là **đích kiến trúc**, không phải tuyên bố rằng việc di chuyển đã hoàn tất.

## 3. Quy tắc phụ thuộc

1. `game_tpl.html` chỉ nên làm composition/bootstrap và giữ phần runtime chưa tách; không tiếp tục thêm hệ thống lớn trực tiếp vào template.
2. Hệ thống gameplay không gọi trực tiếp DOM UI ngoài qua adapter; UI hiển thị trạng thái và phát lệnh, không tự định nghĩa quy tắc chiến đấu/tu luyện.
3. Định nghĩa vật phẩm và dữ liệu cấu hình nên tách khỏi thao tác túi đồ; ID vật phẩm phải ổn định để không làm hỏng save.
4. Client không được xem là nguồn tin cậy cho điểm leaderboard, phần thưởng hoặc tài sản có giá trị. Các thay đổi bảo mật backend phải kiểm tra tương thích trước khi áp dụng lên Supabase đang dùng.
5. Asset metadata là hợp đồng giữa extractor, runtime và build. Không đổi tên ID/đường dẫn hàng loạt nếu chưa có kiểm tra bundle.
6. `index.html` là artifact build; không chỉnh thủ công và không dùng nó làm nguồn chuẩn.

## 4. Cách chia việc và nhánh

Dùng nhánh theo **nhiệm vụ có PR**, không giữ nhiều nhánh subsystem vĩnh viễn. Cấu trúc thư mục tạo ranh giới lâu dài; nhánh tách biệt để cô lập thay đổi và kiểm tra trước khi nhập.

- ChatGPT/backend: `codex/*`, `ops/*`, `security/*`; tập trung Supabase, auth/save/leaderboard, CI và kiểm tra.
- Claude/gameplay/art: nhánh riêng như `claude/gameplay-<task>` hoặc `claude/assets-<task>`; tập trung gameplay và asset.
- Không để hai bên cùng sửa `game_tpl.html`, `build.py` hoặc cùng module trong một thời điểm nếu tránh được.
- Mỗi PR ghi rõ file chạm tới, hành vi thay đổi, kiểm thử chạy được và ảnh hưởng save/schema. Không merge chỉ vì code đã commit.

## 5. Lộ trình an toàn

### Giai đoạn A — kiểm kê (đang thực hiện)
- [x] Ghi nhận cây thư mục, entrypoint, build và các nhóm module/asset.
- [x] Ghi nhận vùng legacy cần xác minh trước khi xóa.
- [ ] Lập sơ đồ phụ thuộc thực tế giữa template và các module.
- [ ] Xác định module nào build thật sự nhúng vào bundle, module nào chỉ là bản cũ/công cụ.

### Giai đoạn B — khóa hành vi hiện có
- Tạo smoke/regression checks cho build, đăng nhập, save/load, túi đồ, chiến đấu, tu luyện, tài nguyên và localization.
- Chụp baseline bundle và xác minh đường build sạch tái lập được.
- Giữ nguyên API lưu dữ liệu và ID vật phẩm trong đợt refactor đầu.

### Giai đoạn C — tách từng lát nhỏ
1. Tách dữ liệu/cấu hình thuần khỏi logic giao diện.
2. Tách inventory/item definitions trước, giữ adapter tương thích với giao diện hiện tại.
3. Tách combat/monster/skill và cultivation theo hợp đồng dữ liệu rõ ràng.
4. Tách UI/HUD và asset manifest.
5. Dọn bản legacy chỉ sau khi có bằng chứng không còn được tham chiếu và tests xanh.

### Giai đoạn D — backend và phát hành
- Xác minh schema/policies/triggers hiện tại bằng chẩn đoán chỉ đọc.
- Chuẩn hóa migrations và kiểm tra bảo mật trong staging/PR.
- Chỉ áp dụng SQL production sau khi so sánh schema thật, xác nhận tương thích và có kế hoạch rollback.

## 6. Điều chưa được kết luận

- Chưa xác nhận bằng runtime tracing chính xác tất cả module nào đang được dùng.
- Chưa chạy build/test từ môi trường sạch trong thao tác kiểm kê này.
- Chưa thay đổi code gameplay, asset, schema Supabase hay dữ liệu người chơi.
- Chưa xác nhận các file legacy an toàn để xóa.
