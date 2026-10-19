# Thế Giới Tu Chân

Game tu tiên thế giới mở, pixel 2D, một file HTML duy nhất.

- Chơi: mở `index.html` (hoặc link GitHub Pages của repo này).
- Mã nguồn dựng lại game: thư mục `src/` (`nw/game_tpl.html` + `nw/build.py` + `nw/assets`).
- Điều khiển: joystick trái + nút ĐÁNH (điện thoại); WASD + Space/J (máy tính).


## Dành cho phát triển và phát hành

### Dựng lại bản game

Cần Python 3.10+ và checkout đầy đủ repository. Từ bất kỳ thư mục làm việc nào, chạy:

```bash
python src/nw/build.py
```

Lệnh này tạo `src/nw/game.html` (bản dùng cho kiểm thử) và cập nhật `index.html` ở thư mục gốc (bản GitHub Pages đang phục vụ). Sau khi thay đổi được đưa vào `main`, GitHub Actions sẽ tự dựng lại và commit bundle `index.html`.

### Cơ sở dữ liệu Supabase

Trong Supabase Dashboard → SQL Editor, chạy theo thứ tự:

1. `supabase_saves.sql` — tạo bảng save và chính sách RLS để mỗi tài khoản chỉ đọc/ghi tiến trình của mình.
2. `supabase_leaderboard.sql` — tạo bảng xếp hạng và lịch sử, đồng thời chuẩn hóa số liệu phía máy chủ.

Nếu trước đây đã chạy SQL cũ, chạy lại `supabase_leaderboard.sql` sau khi cập nhật để thay thế trigger. Không đưa secret/service_role key vào mã game; chỉ dùng publishable key phía client.

### Kiểm tra

CI dựng lại bundle, kiểm tra cú pháp Python và chạy bài kiểm thử đăng nhập/lưu tiến trình bằng Playwright Chromium. Trước khi phát hành, cần xác nhận cấu hình Supabase thực tế và kiểm tra trên điện thoại thật.
