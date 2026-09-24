-- Hardened game actions. Kept separate so the first migration remains easy to audit.
create or replace function public.reward_single_win(p_difficulty public.difficulty, p_level smallint, p_score integer, p_attempts integer, p_time_ms integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid := auth.uid();
  v_reward integer := greatest(1, least(500, p_score / 10));
  v_balance bigint;
begin
  if v_profile_id is null then raise exception 'Authentication required'; end if;
  if p_level < 1 or p_level > 30 then raise exception 'Invalid level'; end if;
  insert into public.single_player_progress(profile_id, difficulty, level, completed, best_score, attempts, best_time_ms, solved_at)
  values (v_profile_id, p_difficulty, p_level, true, greatest(0, p_score), greatest(0, p_attempts), greatest(0, p_time_ms), now())
  on conflict (profile_id, difficulty, level) do update set
    completed = true,
    best_score = greatest(public.single_player_progress.best_score, excluded.best_score),
    attempts = public.single_player_progress.attempts + excluded.attempts,
    best_time_ms = least(coalesce(public.single_player_progress.best_time_ms, excluded.best_time_ms), excluded.best_time_ms),
    solved_at = coalesce(public.single_player_progress.solved_at, excluded.solved_at);
  update public.single_player_profiles set total_score = total_score + greatest(0, p_score), codes_cracked = codes_cracked + 1 where profile_id = v_profile_id;
  insert into public.single_player_wallets(profile_id, balance, lifetime_earned)
  values (v_profile_id, v_reward, v_reward)
  on conflict (profile_id) do update set balance = public.single_player_wallets.balance + excluded.balance, lifetime_earned = public.single_player_wallets.lifetime_earned + excluded.lifetime_earned;
  insert into public.wallet_transactions(profile_id, scope, amount, reason, reference_id)
  values (v_profile_id, 'single', v_reward, 'single_win', p_level::text);
  insert into public.game_events(profile_id, scope, event_type, payload)
  values (v_profile_id, 'single', 'level_cleared', jsonb_build_object('difficulty', p_difficulty, 'level', p_level, 'score', p_score));
  select balance into v_balance from public.single_player_wallets where profile_id = v_profile_id;
  return jsonb_build_object('reward', v_reward, 'balance', v_balance);
end;
$$;

create or replace function public.start_multiplayer_room(p_room_id uuid)
returns public.multiplayer_rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid := auth.uid();
  v_room public.multiplayer_rooms;
begin
  if v_profile_id is null or not exists (select 1 from public.multiplayer_rooms where id = p_room_id and host_profile_id = v_profile_id) then raise exception 'Host permission required'; end if;
  if (select count(*) from public.multiplayer_players where room_id = p_room_id and ready) < 2 then raise exception 'At least two ready players required'; end if;
  update public.multiplayer_rooms set status = 'playing', current_round = 0, started_at = now(), deadline_at = case when mode = 'time_attack' then now() + interval '60 seconds' else null end where id = p_room_id returning * into v_room;
  insert into public.multiplayer_rounds(room_id, round_number, category, puzzle_id)
  select v_room.id, 0, case when v_room.category = 'random' then p.category else v_room.category end, p.id
  from public.content_puzzles p
  where p.active and (v_room.category = 'random' or p.category = v_room.category)
  order by p.difficulty, p.level
  limit 1
  on conflict (room_id, round_number) do update set puzzle_id = excluded.puzzle_id, category = excluded.category, winner_profile_id = null, started_at = now();
  return v_room;
end;
$$;

create or replace function public.advance_multiplayer_room(p_room_id uuid)
returns public.multiplayer_rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid := auth.uid();
  v_room public.multiplayer_rooms;
  v_puzzle public.content_puzzles;
begin
  if v_profile_id is null or not exists (select 1 from public.multiplayer_rooms where id = p_room_id and host_profile_id = v_profile_id) then raise exception 'Host permission required'; end if;
  select * into v_room from public.multiplayer_rooms where id = p_room_id for update;
  if v_room.status <> 'round_won' then raise exception 'Round is not ready to advance'; end if;
  if v_room.current_round + 1 >= v_room.rounds then
    update public.multiplayer_rooms set status = 'finished', finished_at = now(), deadline_at = null where id = p_room_id returning * into v_room;
    return v_room;
  end if;
  select * into v_puzzle from public.content_puzzles where active and (v_room.category = 'random' or category = v_room.category) order by random() limit 1;
  update public.multiplayer_rooms set status = 'playing', current_round = current_round + 1, deadline_at = case when mode = 'time_attack' then now() + interval '60 seconds' else null end where id = p_room_id returning * into v_room;
  insert into public.multiplayer_rounds(room_id, round_number, category, puzzle_id)
  values (p_room_id, v_room.current_round, coalesce(v_puzzle.category, 'Logic'), v_puzzle.id)
  on conflict (room_id, round_number) do update set category = excluded.category, puzzle_id = excluded.puzzle_id, winner_profile_id = null, started_at = now();
  return v_room;
end;
$$;

grant execute on function public.advance_multiplayer_room(uuid) to authenticated;
