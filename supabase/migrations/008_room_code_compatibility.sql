-- Use the always-available UUID generator for room codes on Supabase Postgres.
create or replace function public.create_multiplayer_room(p_mode public.multiplayer_mode, p_rounds smallint, p_category text)
returns public.multiplayer_rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid := auth.uid();
  v_category text := case when p_category = 'All' then 'random' else p_category end;
  v_room public.multiplayer_rooms;
begin
  if v_profile_id is null then raise exception 'Authentication required'; end if;
  if v_category <> 'random' and v_category not in ('Math','Logic','Riddle','Science','Trivia') then
    raise exception 'Invalid category';
  end if;
  insert into public.multiplayer_rooms(code, host_profile_id, mode, category, rounds)
  values (
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6)),
    v_profile_id,
    p_mode,
    v_category,
    greatest(1, least(30, p_rounds))
  )
  returning * into v_room;
  insert into public.multiplayer_players(room_id, profile_id, display_name, ready)
  select v_room.id, v_profile_id, display_name, true
  from public.profiles where id = v_profile_id;
  return v_room;
end;
$$;

revoke execute on function public.create_multiplayer_room(public.multiplayer_mode, smallint, text) from public, anon;
grant execute on function public.create_multiplayer_room(public.multiplayer_mode, smallint, text) to authenticated;
