-- BẢN VÁ: cho phép bảng xếp hạng ghi cảnh giới Trúc Cơ (realm 11-13). Dán toàn bộ vào Supabase → SQL Editor → Run. Chạy nhiều lần không sao.
create or replace function public.lb_guard() returns trigger
language plpgsql
security definer
set search_path = public
as $lb_guard$
declare
  dt numeric;
  max_k bigint;
  max_q bigint;
  dk bigint;
  dq bigint;
  susp boolean := false;
  why text := '';
begin
  new.pid := 'TC-' || upper(substr(replace(new.user_id::text, '-', ''), 1, 6));
  new.realm := least(13, greatest(1, coalesce(new.realm, 1)));
  new.qi_total := greatest(0, coalesce(new.qi_total, 0));
  new.kills := greatest(0, coalesce(new.kills, 0));

  if tg_op = 'INSERT' then
    -- Các ngưỡng này chỉ giới hạn số liệu khởi tạo; không phải trần tiến trình lâu dài.
    if new.kills > 20000 or new.qi_total > 2000000 then
      susp := true;
      why := 'giá trị khởi tạo vượt ngưỡng; đã giới hạn';
      new.kills := least(new.kills, 20000);
      new.qi_total := least(new.qi_total, 2000000);
    end if;
    new.flags := case when susp then 1 else 0 end;
    new.flag_note := nullif(why, '');
    dt := null;
    dk := new.kills;
    dq := new.qi_total;
  else
    dt := greatest(extract(epoch from (now() - old.updated_at)), 1);
    -- Không cho tụt chỉ số và giới hạn tốc độ tăng giữa hai lần ghi.
    new.qi_total := greatest(new.qi_total, old.qi_total);
    new.kills := greatest(new.kills, old.kills);
    new.realm := greatest(new.realm, old.realm);
    max_k := floor(dt * 4 + 25);
    max_q := floor(dt * 5 + 4000);
    dk := new.kills::bigint - old.kills::bigint;
    dq := new.qi_total - old.qi_total;

    if dk > max_k then
      susp := true;
      why := why || format('kills +%s > %s; ', dk, max_k);
      new.kills := (old.kills::bigint + max_k)::int;
      dk := max_k;
    end if;
    if dq > max_q then
      susp := true;
      why := why || format('qi +%s > %s; ', dq, max_q);
      new.qi_total := old.qi_total + max_q;
      dq := max_q;
    end if;
    if new.realm - old.realm > 2 then
      susp := true;
      why := why || 'realm jump; ';
      new.realm := old.realm + 2;
    end if;

    -- Không tin flags/flag_note do client gửi lên.
    new.flags := old.flags + case when susp then 1 else 0 end;
    new.flag_note := case when susp then left(why, 200) else old.flag_note end;
  end if;

  -- Điểm luôn được tính ở server sau khi đã chuẩn hóa số liệu.
  new.score := new.qi_total + new.kills::bigint * 10;
  new.updated_at := now();

  if tg_op = 'INSERT' or dk <> 0 or dq <> 0 or susp then
    insert into public.lb_history
      (user_id, name, pid, realm, qi_total, kills, score, d_sec, d_qi, d_kills, suspicious, note)
    values
      (new.user_id, new.name, new.pid, new.realm, new.qi_total, new.kills,
       new.score, dt, dq, dk, susp, nullif(why, ''));
  end if;
  return new;
end $lb_guard$;
