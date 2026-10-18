-- BẢN VÁ: cho phép bảng xếp hạng ghi cảnh giới Trúc Cơ (realm 11-13). Dán toàn bộ vào Supabase → SQL Editor → Run. Chạy nhiều lần không sao.
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
