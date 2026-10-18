-- ============================================================
-- BẢNG XẾP HẠNG + NHẬT KÝ LỊCH SỬ (chạy 1 lần trong Supabase → SQL Editor)
-- Ai cũng ĐỌC được bảng xếp hạng; mỗi người chỉ GHI được dòng của mình.
-- Trigger phía server tự tính điểm, tự chặn số liệu tăng bất thường (hack/bug) và ghi lịch sử mỗi lần đổi.
-- Điểm = qi_total (tổng tu vi tích luỹ) + 10 × kills (số quái đã giết).
-- ============================================================
create table if not exists public.leaderboard(
  user_id    uuid primary key references auth.users(id) on delete cascade,
  name       text   not null,
  pid        text   not null,                 -- ID hiển thị: TC-XXXXXX (6 ký tự đầu của user_id)
  realm      int    not null default 1,
  qi_total   bigint not null default 0,
  kills      int    not null default 0,
  score      bigint not null default 0,
  flags      int    not null default 0,       -- số lần bị nghi bất thường
  flag_note  text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists lb_score_idx on public.leaderboard(score desc);
create index if not exists lb_qi_idx    on public.leaderboard(qi_total desc);
create index if not exists lb_kills_idx on public.leaderboard(kills desc);

create table if not exists public.lb_history(
  id         bigserial primary key,
  user_id    uuid not null,
  name       text,
  pid        text,
  ts         timestamptz not null default now(),
  realm      int, qi_total bigint, kills int, score bigint,
  d_sec      numeric,                         -- giây kể từ lần cập nhật trước
  d_qi       bigint, d_kills int,             -- mức tăng so với lần trước (sau khi chặn)
  suspicious boolean not null default false,
  note       text
);
create index if not exists lbh_user_idx on public.lb_history(user_id, ts desc);
create index if not exists lbh_susp_idx on public.lb_history(suspicious, ts desc);

alter table public.leaderboard enable row level security;
alter table public.lb_history  enable row level security;
drop policy if exists lb_read   on public.leaderboard;
drop policy if exists lb_ins    on public.leaderboard;
drop policy if exists lb_upd    on public.leaderboard;
drop policy if exists lbh_own   on public.lb_history;
create policy lb_read on public.leaderboard for select using (true);
create policy lb_ins  on public.leaderboard for insert to authenticated with check (auth.uid() = user_id);
create policy lb_upd  on public.leaderboard for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy lbh_own on public.lb_history  for select to authenticated using (auth.uid() = user_id);
-- (chủ game xem toàn bộ lịch sử trong Table Editor / SQL Editor — vai trò postgres bỏ qua RLS)

create or replace function public.lb_guard() returns trigger language plpgsql security definer set search_path=public as $$
declare dt numeric; max_k int; max_q bigint; dk int; dq bigint; susp boolean:=false; why text:='';
begin
  new.pid := 'TC-' || upper(substr(replace(new.user_id::text,'-',''),1,6));
  new.realm    := least(13, greatest(1, coalesce(new.realm,1)));   -- 1..10 Luyện Khí tầng · 11/12/13 = Trúc Cơ sơ/trung/hậu kỳ
  new.qi_total := greatest(0, coalesce(new.qi_total,0));
  new.kills    := greatest(0, coalesce(new.kills,0));
  if tg_op = 'UPDATE' then
    dt := greatest(extract(epoch from (now() - old.updated_at)), 1);
    -- không cho tụt (chống save cũ ghi đè) và chặn tăng quá nhanh
    new.qi_total := greatest(new.qi_total, old.qi_total);
    new.kills    := greatest(new.kills,    old.kills);
    new.realm    := greatest(new.realm,    old.realm);
    max_k := (dt * 4 + 25)::int;            -- tối đa ~4 quái/giây + 25 dự phòng
    max_q := (dt * 5 + 4000)::bigint;       -- tối đa ~5 tu vi/giây + 4000 (ăn đan dồn)
    dk := new.kills - old.kills;  dq := new.qi_total - old.qi_total;
    if dk > max_k then susp := true; why := why || format('kills +%s > %s; ', dk, max_k); new.kills := old.kills + max_k; dk := max_k; end if;
    if dq > max_q then susp := true; why := why || format('qi +%s > %s; ', dq, max_q); new.qi_total := old.qi_total + max_q; dq := max_q; end if;
    if new.realm - old.realm > 2 then susp := true; why := why || 'realm jump; '; new.realm := old.realm + 2; end if;
    if susp then new.flags := old.flags + 1; new.flag_note := left(why, 200); else new.flags := old.flags; new.flag_note := old.flag_note; end if;
  else
    dt := null; dk := new.kills; dq := new.qi_total;
    if new.kills > 20000 or new.qi_total > 2000000 then susp := true; why := 'giá trị khởi tạo quá lớn'; new.flags := 1; new.flag_note := why; end if;
  end if;
  new.score := new.qi_total + new.kills::bigint * 10;
  new.updated_at := now();
  if tg_op = 'INSERT' or dk <> 0 or dq <> 0 or susp then
    insert into public.lb_history(user_id,name,pid,realm,qi_total,kills,score,d_sec,d_qi,d_kills,suspicious,note)
    values(new.user_id,new.name,new.pid,new.realm,new.qi_total,new.kills,new.score,dt,dq,dk,susp,nullif(why,''));
  end if;
  return new;
end $$;
drop trigger if exists lb_guard_t on public.leaderboard;
create trigger lb_guard_t before insert or update on public.leaderboard for each row execute function public.lb_guard();

-- Xem nhanh những người bị nghi:
--   select pid,name,flags,flag_note,realm,kills,qi_total,updated_at from leaderboard where flags>0 order by flags desc;
-- Xem lịch sử 1 người theo ID:
--   select ts,realm,qi_total,kills,d_sec,d_qi,d_kills,suspicious,note from lb_history where pid='TC-ABC123' order by ts desc;
