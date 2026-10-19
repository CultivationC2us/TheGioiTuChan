-- Thế Giới Tu Chân: bảng lưu tiến trình Supabase.
-- Chạy trong Supabase Dashboard -> SQL Editor. Có thể chạy lại an toàn.
create table if not exists public.saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  version integer not null default 1 check (version > 0),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.saves enable row level security;

drop policy if exists saves_read_own on public.saves;
drop policy if exists saves_insert_own on public.saves;
drop policy if exists saves_update_own on public.saves;

create policy saves_read_own
  on public.saves for select to authenticated
  using (auth.uid() = user_id);

create policy saves_insert_own
  on public.saves for insert to authenticated
  with check (auth.uid() = user_id);

create policy saves_update_own
  on public.saves for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update on public.saves to authenticated;
