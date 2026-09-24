-- Harden real multiplayer metrics after the feature migration: response time
-- comes from the server round clock, duplicate correct answers are idempotent,
-- and an expired all-zero room cannot award a winner.
begin;

create index if not exists multiplayer_answers_one_correct_per_round_idx
  on public.multiplayer_answers (room_id, round_number, profile_id)
  where is_correct;

create or replace function public.sync_finished_multiplayer_match()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  winner_id uuid;
begin
  if new.status = 'finished' and old.status is distinct from 'finished' then
    update public.multiplayer_profiles as mp
    set duels_played = mp.duels_played + 1
    where mp.profile_id in (
      select profile_id
      from public.multiplayer_players
      where room_id = new.id
    );

    select player.profile_id
    into winner_id
    from public.multiplayer_players as player
    where player.room_id = new.id
      and player.score > 0
    order by player.score desc, player.joined_at asc
    limit 1;

    if winner_id is not null then
      update public.multiplayer_profiles
      set duels_won = duels_won + 1
      where profile_id = winner_id;
      update public.multiplayer_wallets
      set balance = balance + 30, lifetime_earned = lifetime_earned + 30
      where profile_id = winner_id;
      insert into public.wallet_transactions(
        profile_id, scope, amount, reason, reference_id
      )
      values (winner_id, 'multi', 30, 'duel_win', new.id::text);
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.submit_multiplayer_answer_localized(
  p_room_id uuid,
  p_answer text,
  p_locale text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
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
  v_response_ms integer;
begin
  if v_profile_id is null then
    raise exception 'Authentication required';
  end if;
  if not exists (
    select 1
    from public.multiplayer_players
    where room_id = p_room_id and profile_id = v_profile_id
  ) then
    raise exception 'Join the room first';
  end if;

  select * into v_room
  from public.multiplayer_rooms
  where id = p_room_id and status = 'playing'
  for update;
  if v_room.id is null then
    raise exception 'Room is not accepting answers';
  end if;
  if v_room.deadline_at is not null and v_room.deadline_at <= now() then
    update public.multiplayer_rooms
    set status = 'finished', deadline_at = null, finished_at = coalesce(finished_at, now())
    where id = p_room_id;
    return jsonb_build_object(
      'correct', false, 'expired', true, 'round', v_room.current_round
    );
  end if;

  select * into v_round
  from public.multiplayer_rounds
  where room_id = p_room_id and round_number = v_room.current_round;
  if v_round.puzzle_id is null then
    raise exception 'Round puzzle is not ready';
  end if;
  select * into v_puzzle
  from public.content_puzzles
  where id = v_round.puzzle_id and active;
  if v_puzzle.id is null then
    raise exception 'Round puzzle is not ready';
  end if;

  v_response_ms := greatest(
    0,
    least(
      600000,
      floor(extract(epoch from (now() - coalesce(v_round.started_at, now()))) * 1000)::integer
    )
  );

  if exists (
    select 1
    from public.multiplayer_answers
    where room_id = p_room_id
      and round_number = v_room.current_round
      and profile_id = v_profile_id
      and is_correct
  ) then
    return jsonb_build_object(
      'correct', true,
      'already_correct', true,
      'round', v_room.current_round,
      'response_ms', v_response_ms
    );
  end if;

  v_normalized_submitted := lower(
    regexp_replace(trim(coalesce(p_answer, '')), '[^[:alnum:]]', '', 'g')
  );
  if v_puzzle.answer_type = 'digits' then
    v_correct := regexp_replace(coalesce(p_answer, ''), '[^0-9]', '', 'g') = v_puzzle.answer_code;
  else
    select e.value into v_expected_answer
    from public.translation_entries as e
    join public.translation_catalogs as c on c.id = e.catalog_id
    where c.locale = lower(trim(coalesce(p_locale, 'en')))
      and e.key = v_puzzle.answer_key
      and c.is_enabled;
    v_expected_answer := coalesce(v_expected_answer, v_puzzle.answer_code);
    v_normalized_expected := lower(
      regexp_replace(trim(v_expected_answer), '[^[:alnum:]]', '', 'g')
    );
    v_correct := v_normalized_submitted = v_normalized_expected;
  end if;

  insert into public.multiplayer_answers(
    room_id, round_number, profile_id, submitted_code, is_correct, response_ms
  )
  values (
    p_room_id,
    v_room.current_round,
    v_profile_id,
    left(coalesce(p_answer, ''), 64),
    v_correct,
    v_response_ms
  );
  if not v_correct then
    return jsonb_build_object(
      'correct', false,
      'round', v_room.current_round,
      'response_ms', v_response_ms
    );
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
    jsonb_build_object(
      'roomId', p_room_id,
      'round', v_room.current_round,
      'score', v_gained,
      'response_ms', v_response_ms
    )
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
      update public.multiplayer_rooms
      set status = 'round_won'
      where id = p_room_id;
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
      if v_next_puzzle.id is null then
        raise exception 'No active puzzle is available';
      end if;
      update public.multiplayer_rooms
      set status = 'playing',
          current_round = v_next_round,
          deadline_at = now() + interval '60 seconds'
      where id = p_room_id;
      insert into public.multiplayer_rounds(
        room_id, round_number, category, puzzle_id
      )
      values (p_room_id, v_next_round, v_next_puzzle.category, v_next_puzzle.id)
      on conflict (room_id, round_number) do update
      set category = excluded.category,
          puzzle_id = excluded.puzzle_id,
          winner_profile_id = null,
          started_at = now();
    end if;
  end if;

  return jsonb_build_object(
    'correct', true,
    'gained', v_gained,
    'round', v_room.current_round,
    'response_ms', v_response_ms,
    'answer', v_expected_answer
  );
end;
$$;

revoke execute on function public.submit_multiplayer_answer_localized(uuid, text, text)
  from public, anon;
grant execute on function public.submit_multiplayer_answer_localized(uuid, text, text)
  to authenticated;

commit;
