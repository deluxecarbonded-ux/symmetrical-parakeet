-- Preserve the round winner in the safe room snapshot used by the client after
-- content-puzzle SELECT was restricted.
begin;

create or replace function public.get_multiplayer_room_state(p_room_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile_id uuid := auth.uid();
  v_room public.multiplayer_rooms;
  v_players jsonb;
  v_round jsonb;
begin
  if v_profile_id is null then
    raise exception 'Authentication required';
  end if;
  select * into v_room
  from public.multiplayer_rooms
  where id = p_room_id;
  if v_room.id is null or not exists (
    select 1
    from public.multiplayer_players
    where room_id = p_room_id and profile_id = v_profile_id
  ) then
    raise exception 'Room not found';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', player.profile_id,
        'username', player.username,
        'name', player.display_name,
        'display_name', player.display_name,
        'avatar_url', player.avatar_url,
        'avatar_bucket', player.avatar_bucket,
        'avatar_media_type', player.avatar_media_type,
        'ready', player.ready,
        'score', player.score,
        'codes', player.codes_cracked,
        'joinedAt', player.joined_at
      ) order by player.joined_at
    ),
    '[]'::jsonb
  )
  into v_players
  from public.multiplayer_players as player
  where player.room_id = p_room_id;

  select jsonb_build_object(
    'roundNumber', rnd.round_number,
    'category', rnd.category,
    'puzzleId', rnd.puzzle_id,
    'winnerProfileId', rnd.winner_profile_id,
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
      from public.content_puzzles as puzzle
      where puzzle.id = rnd.puzzle_id
    )
  )
  into v_round
  from public.multiplayer_rounds as rnd
  where rnd.room_id = p_room_id
    and rnd.round_number = v_room.current_round;

  return jsonb_build_object(
    'room', to_jsonb(v_room),
    'players', v_players,
    'round', v_round
  );
end;
$$;

revoke execute on function public.get_multiplayer_room_state(uuid)
  from public, anon;
grant execute on function public.get_multiplayer_room_state(uuid)
  to authenticated;

commit;
