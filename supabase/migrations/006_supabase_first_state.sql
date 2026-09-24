-- Supabase-first application state: preferences, hydration, and authenticated mutations.
alter table public.profiles
  add column if not exists preferences jsonb not null default '{}'::jsonb;

create or replace function public.get_app_state()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'profile', (
      select to_jsonb(p)
      from public.profiles p
      where p.id = auth.uid()
    ),
    'single_profile', (
      select to_jsonb(sp)
      from public.single_player_profiles sp
      where sp.profile_id = auth.uid()
    ),
    'multiplayer_profile', (
      select to_jsonb(mp)
      from public.multiplayer_profiles mp
      where mp.profile_id = auth.uid()
    ),
    'single_progress', coalesce((
      select jsonb_agg(to_jsonb(row) order by row.difficulty, row.level)
      from public.single_player_progress row
      where row.profile_id = auth.uid()
    ), '[]'::jsonb),
    'single_wallet', (
      select to_jsonb(wallet)
      from public.single_player_wallets wallet
      where wallet.profile_id = auth.uid()
    ),
    'multiplayer_wallet', (
      select to_jsonb(wallet)
      from public.multiplayer_wallets wallet
      where wallet.profile_id = auth.uid()
    ),
    'single_inventory', coalesce((
      select jsonb_agg(to_jsonb(item) order by item.acquired_at)
      from public.single_player_inventory item
      where item.profile_id = auth.uid()
    ), '[]'::jsonb),
    'multiplayer_inventory', coalesce((
      select jsonb_agg(to_jsonb(item) order by item.acquired_at)
      from public.multiplayer_inventory item
      where item.profile_id = auth.uid()
    ), '[]'::jsonb),
    'activity', coalesce((
      select jsonb_agg(to_jsonb(event) order by event.created_at desc)
      from (
        select id, scope, event_type, payload, created_at
        from public.game_events
        where profile_id = auth.uid()
        order by created_at desc
        limit 20
      ) event
    ), '[]'::jsonb)
  );
$$;

create or replace function public.update_user_preferences(p_preferences jsonb)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_profile public.profiles;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_preferences ? 'theme' and p_preferences->>'theme' not in ('light', 'dark') then
    raise exception 'Invalid theme preference';
  end if;
  if p_preferences ? 'locale' and p_preferences->>'locale' not in ('en','ar','fr','es','de','pt','it','nl','ru','tr','ja','ko','zh','hi','id','ur') then
    raise exception 'Invalid locale preference';
  end if;
  if p_preferences ? 'sound' and jsonb_typeof(p_preferences->'sound') <> 'boolean' then
    raise exception 'Invalid sound preference';
  end if;
  if p_preferences ? 'reduceMotion' and jsonb_typeof(p_preferences->'reduceMotion') <> 'boolean' then
    raise exception 'Invalid motion preference';
  end if;
  update public.profiles
  set preferences = coalesce(p_preferences, '{}'::jsonb),
      locale = coalesce(p_preferences->>'locale', locale)
  where id = auth.uid()
  returning * into updated_profile;
  if updated_profile.id is null then raise exception 'Profile not found'; end if;
  return updated_profile;
end;
$$;

create or replace function public.equip_shop_item(p_scope public.game_scope, p_item_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid := auth.uid();
begin
  if v_profile_id is null then raise exception 'Authentication required'; end if;
  if p_scope = 'single' then
    if not exists (select 1 from public.single_player_inventory where profile_id = v_profile_id and item_id = p_item_id) then
      raise exception 'Item is not owned';
    end if;
    update public.single_player_inventory set equipped = (item_id = p_item_id) where profile_id = v_profile_id;
  else
    if not exists (select 1 from public.multiplayer_inventory where profile_id = v_profile_id and item_id = p_item_id) then
      raise exception 'Item is not owned';
    end if;
    update public.multiplayer_inventory set equipped = (item_id = p_item_id) where profile_id = v_profile_id;
  end if;
  return jsonb_build_object('scope', p_scope, 'item_id', p_item_id, 'equipped', true);
end;
$$;

create or replace function public.leave_multiplayer_room(p_room_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid := auth.uid();
  v_host_id uuid;
begin
  if v_profile_id is null then raise exception 'Authentication required'; end if;
  select host_profile_id into v_host_id from public.multiplayer_rooms where id = p_room_id;
  delete from public.multiplayer_players
  where room_id = p_room_id and profile_id = v_profile_id;
  if v_host_id = v_profile_id then
    update public.multiplayer_rooms set status = 'cancelled' where id = p_room_id and status = 'lobby';
  end if;
  return found;
end;
$$;

grant execute on function public.get_app_state() to authenticated;
grant execute on function public.update_user_preferences(jsonb) to authenticated;
grant execute on function public.equip_shop_item(public.game_scope, text) to authenticated;
create or replace function public.reset_user_progress()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid := auth.uid();
begin
  if v_profile_id is null then raise exception 'Authentication required'; end if;
  delete from public.single_player_progress where profile_id = v_profile_id;
  delete from public.single_player_inventory where profile_id = v_profile_id;
  delete from public.multiplayer_inventory where profile_id = v_profile_id;
  delete from public.shop_purchases where profile_id = v_profile_id;
  delete from public.wallet_transactions where profile_id = v_profile_id;
  delete from public.game_events where profile_id = v_profile_id;
  update public.single_player_wallets set balance = 0, lifetime_earned = 0 where profile_id = v_profile_id;
  update public.multiplayer_wallets set balance = 0, lifetime_earned = 0 where profile_id = v_profile_id;
  update public.single_player_profiles set total_score = 0, codes_cracked = 0 where profile_id = v_profile_id;
  update public.multiplayer_profiles set duels_played = 0, duels_won = 0 where profile_id = v_profile_id;
  return jsonb_build_object('reset', true);
end;
$$;

grant execute on function public.leave_multiplayer_room(uuid) to authenticated;
grant execute on function public.reset_user_progress() to authenticated;
