-- Server-authoritative game actions and private-data grants.
-- The browser may render safe puzzle metadata, but rewards and economy changes go through RPCs.

create or replace function public.update_profile_display_name(p_display_name text)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid := auth.uid();
  v_profile public.profiles;
begin
  if v_profile_id is null then raise exception 'Authentication required'; end if;
  if char_length(trim(p_display_name)) < 1 or char_length(trim(p_display_name)) > 40 then
    raise exception 'Invalid display name';
  end if;
  update public.profiles
  set display_name = trim(p_display_name)
  where id = v_profile_id
  returning * into v_profile;
  return v_profile;
end;
$$;

create or replace function public.submit_single_answer(
  p_difficulty public.difficulty,
  p_level smallint,
  p_answer text,
  p_attempts integer,
  p_time_ms integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid := auth.uid();
  v_puzzle public.content_puzzles;
  v_correct boolean;
  v_already_completed boolean := false;
  v_score integer;
  v_reward integer := 0;
  v_balance bigint;
begin
  if v_profile_id is null then raise exception 'Authentication required'; end if;
  if p_level < 1 or p_level > 30 then raise exception 'Invalid level'; end if;

  select * into v_puzzle
  from public.content_puzzles
  where difficulty = p_difficulty and level = p_level and active
  for share;

  if v_puzzle.id is null then
    return jsonb_build_object('correct', false, 'reason', 'puzzle_not_found');
  end if;

  v_correct := case
    when v_puzzle.answer_type = 'digits'
      then regexp_replace(coalesce(p_answer, ''), '[^0-9]', '', 'g') = v_puzzle.answer_code
    else lower(trim(p_answer)) = lower(trim(v_puzzle.answer_code))
  end;
  if not v_correct then
    insert into public.single_player_progress(
      profile_id, difficulty, level, completed, best_score, attempts, best_time_ms
    )
    values (
      v_profile_id, p_difficulty, p_level, false, 0, greatest(1, p_attempts), greatest(0, p_time_ms)
    )
    on conflict (profile_id, difficulty, level) do update set
      attempts = public.single_player_progress.attempts + excluded.attempts,
      best_time_ms = least(
        coalesce(public.single_player_progress.best_time_ms, excluded.best_time_ms),
        excluded.best_time_ms
      );
    return jsonb_build_object('correct', false, 'reason', 'incorrect');
  end if;

  perform 1 from public.profiles where id = v_profile_id for update;
  select exists (
    select 1 from public.single_player_progress
    where profile_id = v_profile_id and difficulty = p_difficulty and level = p_level and completed
  ) into v_already_completed;

  v_score := greatest(10, 400 - least(20, greatest(1, p_attempts)) * 20 - least(240, greatest(0, p_time_ms) / 1000 / 12));
  insert into public.single_player_progress(
    profile_id, difficulty, level, completed, best_score, attempts, best_time_ms, solved_at
  )
  values (
    v_profile_id, p_difficulty, p_level, true, v_score,
    greatest(1, p_attempts), greatest(0, p_time_ms), now()
  )
  on conflict (profile_id, difficulty, level) do update set
    completed = true,
    best_score = greatest(public.single_player_progress.best_score, excluded.best_score),
    attempts = public.single_player_progress.attempts + excluded.attempts,
    best_time_ms = least(
      coalesce(public.single_player_progress.best_time_ms, excluded.best_time_ms),
      excluded.best_time_ms
    ),
    solved_at = coalesce(public.single_player_progress.solved_at, excluded.solved_at);

  if not v_already_completed then
    v_reward := greatest(1, least(500, v_score / 10));
    update public.single_player_profiles
    set total_score = total_score + v_score, codes_cracked = codes_cracked + 1
    where profile_id = v_profile_id;
    insert into public.single_player_wallets(profile_id, balance, lifetime_earned)
    values (v_profile_id, v_reward, v_reward)
    on conflict (profile_id) do update set
      balance = public.single_player_wallets.balance + excluded.balance,
      lifetime_earned = public.single_player_wallets.lifetime_earned + excluded.lifetime_earned;
    insert into public.wallet_transactions(profile_id, scope, amount, reason, reference_id)
    values (v_profile_id, 'single', v_reward, 'single_win', p_level::text);
    insert into public.game_events(profile_id, scope, event_type, payload)
    values (
      v_profile_id,
      'single',
      'level_cleared',
      jsonb_build_object('difficulty', p_difficulty, 'level', p_level, 'score', v_score)
    );
  end if;

  select balance into v_balance from public.single_player_wallets where profile_id = v_profile_id;
  return jsonb_build_object(
    'correct', true,
    'score', v_score,
    'reward', v_reward,
    'balance', coalesce(v_balance, 0),
    'already_completed', v_already_completed
  );
end;
$$;

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
    upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 6)),
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

create or replace function public.join_multiplayer_room(p_code text)
returns public.multiplayer_rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid := auth.uid();
  v_room public.multiplayer_rooms;
  v_player_count integer;
begin
  if v_profile_id is null then raise exception 'Authentication required'; end if;
  select * into v_room
  from public.multiplayer_rooms
  where code = upper(trim(p_code)) and status = 'lobby'
  for update;
  if v_room.id is null then raise exception 'Room not found or already started'; end if;
  select count(*) into v_player_count
  from public.multiplayer_players where room_id = v_room.id;
  if v_player_count >= 4 and not exists (
    select 1 from public.multiplayer_players where room_id = v_room.id and profile_id = v_profile_id
  ) then raise exception 'Room is full'; end if;
  insert into public.multiplayer_players(room_id, profile_id, display_name)
  select v_room.id, v_profile_id, display_name
  from public.profiles where id = v_profile_id
  on conflict (room_id, profile_id) do nothing;
  return v_room;
end;
$$;

create or replace function public.set_player_ready(p_room_id uuid, p_ready boolean)
returns public.multiplayer_players
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid := auth.uid();
  v_player public.multiplayer_players;
begin
  if v_profile_id is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.multiplayer_rooms where id = p_room_id and status = 'lobby') then
    raise exception 'Room is not accepting readiness';
  end if;
  update public.multiplayer_players
  set ready = coalesce(p_ready, false)
  where room_id = p_room_id and profile_id = v_profile_id
  returning * into v_player;
  if v_player.room_id is null then raise exception 'Join the room first'; end if;
  return v_player;
end;
$$;

create or replace function public.get_multiplayer_room_state(p_room_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_profile_id uuid := auth.uid();
  v_room public.multiplayer_rooms;
  v_players jsonb;
  v_round jsonb;
begin
  if v_profile_id is null then raise exception 'Authentication required'; end if;
  select * into v_room from public.multiplayer_rooms where id = p_room_id;
  if v_room.id is null or not exists (
    select 1 from public.multiplayer_players where room_id = p_room_id and profile_id = v_profile_id
  ) then raise exception 'Room not found'; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', player.profile_id,
    'name', player.display_name,
    'ready', player.ready,
    'score', player.score,
    'codes', player.codes_cracked,
    'joinedAt', player.joined_at
  ) order by player.joined_at), '[]'::jsonb)
  into v_players
  from public.multiplayer_players player
  where player.room_id = p_room_id;

  select jsonb_build_object(
    'roundNumber', rnd.round_number,
    'category', rnd.category,
    'puzzleId', rnd.puzzle_id,
    'puzzle', (
      select jsonb_build_object(
        'difficulty', puzzle.difficulty,
        'level', puzzle.level,
        'category', puzzle.category,
        'prompt', puzzle.prompt,
        'clueLines', puzzle.clue_lines,
        'answerType', puzzle.answer_type,
        'points', puzzle.points
      )
      from public.content_puzzles puzzle
      where puzzle.id = rnd.puzzle_id
    )
  )
  into v_round
  from public.multiplayer_rounds rnd
  where rnd.room_id = p_room_id and rnd.round_number = v_room.current_round;

  return jsonb_build_object('room', to_jsonb(v_room), 'players', v_players, 'round', v_round);
end;
$$;

create or replace function public.purchase_shop_item(p_scope public.game_scope, p_item_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid := auth.uid();
  v_item public.shop_items;
  v_balance bigint;
begin
  if v_profile_id is null then raise exception 'Authentication required'; end if;
  select * into v_item from public.shop_items
  where id = p_item_id and scope = p_scope and active
  for update;
  if v_item.id is null then raise exception 'Item not found'; end if;
  if p_scope = 'single' then
    if exists (select 1 from public.single_player_inventory where profile_id = v_profile_id and item_id = p_item_id) then
      raise exception 'Already owned';
    end if;
    select coalesce(balance, 0) into v_balance from public.single_player_wallets
    where profile_id = v_profile_id for update;
    if v_balance < v_item.price then raise exception 'Insufficient solo balance'; end if;
    update public.single_player_wallets set balance = balance - v_item.price where profile_id = v_profile_id;
    insert into public.single_player_inventory(profile_id, item_id) values (v_profile_id, p_item_id);
  else
    if exists (select 1 from public.multiplayer_inventory where profile_id = v_profile_id and item_id = p_item_id) then
      raise exception 'Already owned';
    end if;
    select coalesce(balance, 0) into v_balance from public.multiplayer_wallets
    where profile_id = v_profile_id for update;
    if v_balance < v_item.price then raise exception 'Insufficient duel balance'; end if;
    update public.multiplayer_wallets set balance = balance - v_item.price where profile_id = v_profile_id;
    insert into public.multiplayer_inventory(profile_id, item_id) values (v_profile_id, p_item_id);
  end if;
  insert into public.shop_purchases(profile_id, scope, item_id, amount)
  values (v_profile_id, p_scope, p_item_id, v_item.price);
  insert into public.wallet_transactions(profile_id, scope, amount, reason, reference_id)
  values (v_profile_id, p_scope, -v_item.price, 'shop_purchase', p_item_id);
  return jsonb_build_object('item_id', p_item_id, 'scope', p_scope, 'amount', v_item.price);
end;
$$;

create or replace function public.finalize_expired_multiplayer_rooms()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.multiplayer_rooms
  set status = 'finished', deadline_at = null, finished_at = coalesce(finished_at, now())
  where status = 'playing' and deadline_at is not null and deadline_at <= now();
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create or replace function public.record_finished_multiplayer_match_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'finished' and old.status is distinct from 'finished' then
    insert into public.game_events(profile_id, scope, event_type, payload)
    select player.profile_id,
           'multi',
           'match_finished',
           jsonb_build_object('roomId', new.id)
    from public.multiplayer_players player
    where player.room_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists multiplayer_match_event on public.multiplayer_rooms;
create trigger multiplayer_match_event
after update of status on public.multiplayer_rooms
for each row execute function public.record_finished_multiplayer_match_event();

create or replace function public.submit_multiplayer_answer_localized(
  p_room_id uuid,
  p_answer text,
  p_locale text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid := auth.uid();
  v_room public.multiplayer_rooms;
  v_round public.multiplayer_rounds;
  v_puzzle public.content_puzzles;
  v_expected_answer text;
  v_normalized_submitted text;
  v_normalized_expected text;
  v_correct boolean;
  v_gained integer;
  v_next_round smallint;
  v_next_puzzle public.content_puzzles;
begin
  if v_profile_id is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.multiplayer_players where room_id = p_room_id and profile_id = v_profile_id) then
    raise exception 'Join the room first';
  end if;

  select * into v_room
  from public.multiplayer_rooms
  where id = p_room_id and status = 'playing'
  for update;
  if v_room.id is null then raise exception 'Room is not accepting answers'; end if;
  if v_room.deadline_at is not null and v_room.deadline_at <= now() then
    update public.multiplayer_rooms
    set status = 'finished', deadline_at = null, finished_at = coalesce(finished_at, now())
    where id = p_room_id;
    return jsonb_build_object('correct', false, 'expired', true, 'round', v_room.current_round);
  end if;

  select * into v_round
  from public.multiplayer_rounds
  where room_id = p_room_id and round_number = v_room.current_round;
  if v_round.puzzle_id is null then raise exception 'Round puzzle is not ready'; end if;
  select * into v_puzzle from public.content_puzzles where id = v_round.puzzle_id and active;
  if v_puzzle.id is null then raise exception 'Round puzzle is not ready'; end if;

  v_normalized_submitted := lower(regexp_replace(trim(coalesce(p_answer, '')), '[^[:alnum:]]', '', 'g'));
  if v_puzzle.answer_type = 'digits' then
    v_correct := regexp_replace(coalesce(p_answer, ''), '[^0-9]', '', 'g') = v_puzzle.answer_code;
  else
    select e.value into v_expected_answer
    from public.translation_entries e
    join public.translation_catalogs c on c.id = e.catalog_id
    where c.locale = lower(trim(coalesce(p_locale, 'en')))
      and e.key = v_puzzle.answer_key
      and c.is_enabled;
    v_expected_answer := coalesce(v_expected_answer, v_puzzle.answer_code);
    v_normalized_expected := lower(regexp_replace(trim(v_expected_answer), '[^[:alnum:]]', '', 'g'));
    v_correct := v_normalized_submitted = v_normalized_expected;
  end if;

  insert into public.multiplayer_answers(room_id, round_number, profile_id, submitted_code, is_correct)
  values (p_room_id, v_room.current_round, v_profile_id, left(coalesce(p_answer, ''), 64), v_correct);
  if not v_correct then
    return jsonb_build_object('correct', false, 'round', v_room.current_round);
  end if;

  v_gained := greatest(20, 100 - v_room.current_round * 3);
  update public.multiplayer_players
  set score = score + v_gained, codes_cracked = codes_cracked + 1
  where room_id = p_room_id and profile_id = v_profile_id;
  insert into public.game_events(profile_id, scope, event_type, payload)
  values (
    v_profile_id,
    'multi',
    'round_cleared',
    jsonb_build_object('roomId', p_room_id, 'round', v_room.current_round, 'score', v_gained)
  );

  if v_room.mode = 'first_to_crack' then
    update public.multiplayer_rounds
    set winner_profile_id = v_profile_id
    where room_id = p_room_id and round_number = v_room.current_round;
    if v_room.current_round + 1 >= v_room.rounds then
      update public.multiplayer_rooms
      set status = 'finished', finished_at = now()
      where id = p_room_id;
    else
      update public.multiplayer_rooms set status = 'round_won' where id = p_room_id;
    end if;
  else
    v_next_round := v_room.current_round + 1;
    if v_next_round >= v_room.rounds then
      update public.multiplayer_rooms
      set status = 'finished', finished_at = now(), deadline_at = null
      where id = p_room_id;
    else
      select * into v_next_puzzle
      from public.content_puzzles
      where active and (v_room.category = 'random' or category = v_room.category)
      order by random()
      limit 1;
      if v_next_puzzle.id is null then raise exception 'No active puzzle is available'; end if;
      update public.multiplayer_rooms
      set status = 'playing', current_round = v_next_round, deadline_at = now() + interval '60 seconds'
      where id = p_room_id;
      insert into public.multiplayer_rounds(room_id, round_number, category, puzzle_id)
      values (p_room_id, v_next_round, v_next_puzzle.category, v_next_puzzle.id)
      on conflict (room_id, round_number) do update set
        category = excluded.category,
        puzzle_id = excluded.puzzle_id,
        winner_profile_id = null,
        started_at = now();
    end if;
  end if;
  return jsonb_build_object(
    'correct', true,
    'gained', v_gained,
    'round', v_room.current_round,
    'answer', v_expected_answer
  );
end;
$$;

create or replace function public.submit_single_answer_localized(
  p_difficulty public.difficulty,
  p_level smallint,
  p_answer text,
  p_locale text,
  p_attempts integer,
  p_time_ms integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid := auth.uid();
  v_puzzle public.content_puzzles;
  v_canonical_answer text;
begin
  if v_profile_id is null then raise exception 'Authentication required'; end if;
  select * into v_puzzle
  from public.content_puzzles
  where difficulty = p_difficulty and level = p_level and active;
  if v_puzzle.id is null then return jsonb_build_object('correct', false, 'reason', 'puzzle_not_found'); end if;
  v_canonical_answer := p_answer;
  if v_puzzle.answer_type = 'letters' then
    select e.value into v_canonical_answer
    from public.translation_entries e
    join public.translation_catalogs c on c.id = e.catalog_id
    where c.locale = lower(trim(coalesce(p_locale, 'en')))
      and e.key = v_puzzle.answer_key
      and c.is_enabled;
    v_canonical_answer := coalesce(v_canonical_answer, v_puzzle.answer_code);
  end if;
  return public.submit_single_answer(
    p_difficulty,
    p_level,
    v_canonical_answer,
    p_attempts,
    p_time_ms
  );
end;
$$;

-- Only safe reads are available to the browser. All writes go through the functions above.
revoke all on table public.profiles from anon, authenticated;
revoke all on table public.single_player_profiles from anon, authenticated;
revoke all on table public.multiplayer_profiles from anon, authenticated;
revoke all on table public.single_player_progress from anon, authenticated;
revoke all on table public.single_player_wallets from anon, authenticated;
revoke all on table public.multiplayer_wallets from anon, authenticated;
revoke all on table public.single_player_inventory from anon, authenticated;
revoke all on table public.multiplayer_inventory from anon, authenticated;
revoke all on table public.shop_purchases from anon, authenticated;
revoke all on table public.wallet_transactions from anon, authenticated;
revoke all on table public.game_events from anon, authenticated;
revoke all on table public.multiplayer_rooms from anon, authenticated;
revoke all on table public.multiplayer_players from anon, authenticated;
revoke all on table public.multiplayer_rounds from anon, authenticated;
revoke all on table public.multiplayer_answers from anon, authenticated;
revoke all on table public.shop_items from anon, authenticated;
revoke all on table public.translation_catalogs from anon, authenticated;
revoke all on table public.translation_entries from anon, authenticated;
revoke all on table public.content_puzzles from anon, authenticated;

grant select on table public.profiles, public.single_player_profiles, public.multiplayer_profiles,
  public.single_player_progress, public.single_player_wallets, public.multiplayer_wallets,
  public.single_player_inventory, public.multiplayer_inventory, public.shop_purchases,
  public.wallet_transactions, public.game_events, public.multiplayer_rooms,
  public.multiplayer_players, public.multiplayer_rounds, public.multiplayer_answers
  to authenticated;
grant select on table public.shop_items, public.translation_catalogs
  to anon, authenticated;
grant select (id, difficulty, level, category, prompt, clue_lines, answer_type, points, active, created_at)
  on public.content_puzzles to authenticated;

drop policy if exists profiles_select_self on public.profiles;
drop policy if exists profiles_update_self on public.profiles;
drop policy if exists single_profile_all_self on public.single_player_profiles;
drop policy if exists multi_profile_all_self on public.multiplayer_profiles;
drop policy if exists single_progress_all_self on public.single_player_progress;
drop policy if exists single_wallet_all_self on public.single_player_wallets;
drop policy if exists multi_wallet_all_self on public.multiplayer_wallets;
drop policy if exists single_inventory_all_self on public.single_player_inventory;
drop policy if exists multi_inventory_all_self on public.multiplayer_inventory;
drop policy if exists purchases_all_self on public.shop_purchases;
drop policy if exists rooms_host_insert on public.multiplayer_rooms;
drop policy if exists rooms_host_update on public.multiplayer_rooms;
drop policy if exists room_players_self_insert on public.multiplayer_players;
drop policy if exists room_players_self_update on public.multiplayer_players;
drop policy if exists answers_self_insert on public.multiplayer_answers;
drop policy if exists answers_member_read on public.multiplayer_answers;
drop policy if exists rooms_member_read on public.multiplayer_rooms;
drop policy if exists room_players_member_read on public.multiplayer_players;
drop policy if exists rounds_member_read on public.multiplayer_rounds;
drop policy if exists wallet_tx_self_read on public.wallet_transactions;
drop policy if exists events_self_read on public.game_events;
drop policy if exists translation_catalog_public_read on public.translation_catalogs;
drop policy if exists shop_catalog_read on public.shop_items;
drop policy if exists puzzles_authenticated_read on public.content_puzzles;

create policy profiles_select_self on public.profiles for select to authenticated using (id = auth.uid());
create policy single_profile_select_self on public.single_player_profiles for select to authenticated using (profile_id = auth.uid());
create policy multi_profile_select_self on public.multiplayer_profiles for select to authenticated using (profile_id = auth.uid());
create policy single_progress_select_self on public.single_player_progress for select to authenticated using (profile_id = auth.uid());
create policy single_wallet_select_self on public.single_player_wallets for select to authenticated using (profile_id = auth.uid());
create policy multi_wallet_select_self on public.multiplayer_wallets for select to authenticated using (profile_id = auth.uid());
create policy single_inventory_select_self on public.single_player_inventory for select to authenticated using (profile_id = auth.uid());
create policy multi_inventory_select_self on public.multiplayer_inventory for select to authenticated using (profile_id = auth.uid());
create policy purchases_select_self on public.shop_purchases for select to authenticated using (profile_id = auth.uid());
create policy rooms_member_read on public.multiplayer_rooms for select to authenticated using (public.is_room_member(id) or host_profile_id = auth.uid());
create policy room_players_member_read on public.multiplayer_players for select to authenticated using (public.is_room_member(room_id) or profile_id = auth.uid());
create policy rounds_member_read on public.multiplayer_rounds for select to authenticated using (public.is_room_member(room_id));
create policy answers_self_read on public.multiplayer_answers for select to authenticated using (profile_id = auth.uid());
create policy wallet_tx_self_read on public.wallet_transactions for select to authenticated using (profile_id = auth.uid());
create policy events_self_read on public.game_events for select to authenticated using (profile_id = auth.uid());
create policy translation_catalog_public_read on public.translation_catalogs for select to anon, authenticated using (is_enabled);
create policy shop_catalog_read on public.shop_items for select to anon, authenticated using (active);
create policy puzzles_authenticated_read on public.content_puzzles for select to authenticated using (active);

revoke execute on function public.get_app_state() from public, anon;
revoke execute on function public.update_user_preferences(jsonb) from public, anon;
revoke execute on function public.equip_shop_item(public.game_scope, text) from public, anon;
revoke execute on function public.leave_multiplayer_room(uuid) from public, anon;
revoke execute on function public.reset_user_progress() from public, anon;
revoke execute on function public.set_player_ready(uuid, boolean) from public, anon;
revoke execute on function public.get_multiplayer_room_state(uuid) from public, anon;
revoke execute on function public.update_profile_display_name(text) from public, anon;
revoke execute on function public.submit_single_answer(public.difficulty, smallint, text, integer, integer) from public, anon;
revoke execute on function public.reward_single_win(public.difficulty, smallint, integer, integer, integer) from public, anon, authenticated;
revoke execute on function public.submit_single_answer_localized(public.difficulty, smallint, text, text, integer, integer) from public, anon;
revoke execute on function public.create_multiplayer_room(public.multiplayer_mode, smallint, text) from public, anon;
revoke execute on function public.join_multiplayer_room(text) from public, anon;
revoke execute on function public.start_multiplayer_room(uuid) from public, anon;
revoke execute on function public.advance_multiplayer_room(uuid) from public, anon;
revoke execute on function public.submit_multiplayer_answer(uuid, text) from public, anon;
revoke execute on function public.submit_multiplayer_answer_localized(uuid, text, text) from public, anon;
revoke execute on function public.purchase_shop_item(public.game_scope, text) from public, anon;
grant execute on function public.update_profile_display_name(text) to authenticated;
grant execute on function public.submit_single_answer(public.difficulty, smallint, text, integer, integer) to authenticated;
grant execute on function public.submit_single_answer_localized(public.difficulty, smallint, text, text, integer, integer) to authenticated;
grant execute on function public.create_multiplayer_room(public.multiplayer_mode, smallint, text) to authenticated;
grant execute on function public.join_multiplayer_room(text) to authenticated;
grant execute on function public.start_multiplayer_room(uuid) to authenticated;
grant execute on function public.advance_multiplayer_room(uuid) to authenticated;
grant execute on function public.submit_multiplayer_answer(uuid, text) to authenticated;
grant execute on function public.submit_multiplayer_answer_localized(uuid, text, text) to authenticated;
grant execute on function public.purchase_shop_item(public.game_scope, text) to authenticated;
grant execute on function public.set_player_ready(uuid, boolean) to authenticated;
grant execute on function public.get_multiplayer_room_state(uuid) to authenticated;
grant execute on function public.get_app_state() to authenticated;
grant execute on function public.update_user_preferences(jsonb) to authenticated;
grant execute on function public.equip_shop_item(public.game_scope, text) to authenticated;
grant execute on function public.leave_multiplayer_room(uuid) to authenticated;
grant execute on function public.reset_user_progress() to authenticated;
revoke execute on function public.finalize_expired_multiplayer_rooms() from public, anon, authenticated;
grant execute on function public.finalize_expired_multiplayer_rooms() to service_role;
