-- Time-attack answers advance the shared round immediately; the client never needs a refresh.
create or replace function public.submit_multiplayer_answer(p_room_id uuid, p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid := auth.uid();
  v_room public.multiplayer_rooms;
  v_round public.multiplayer_rounds;
  v_puzzle_code text;
  v_correct boolean;
  v_gained integer;
  v_next_round smallint;
  v_next_puzzle public.content_puzzles;
begin
  if v_profile_id is null or not exists (select 1 from public.multiplayer_players where room_id = p_room_id and profile_id = v_profile_id) then raise exception 'Join the room first'; end if;
  select * into v_room from public.multiplayer_rooms where id = p_room_id and status = 'playing' for update;
  if v_room.id is null then raise exception 'Room is not accepting answers'; end if;
  select * into v_round from public.multiplayer_rounds where room_id = p_room_id and round_number = v_room.current_round;
  if v_round.puzzle_id is null then raise exception 'Round puzzle is not ready'; end if;
  select answer_code into v_puzzle_code from public.content_puzzles where id = v_round.puzzle_id and active;
  v_correct := p_code = v_puzzle_code;
  insert into public.multiplayer_answers(room_id, round_number, profile_id, submitted_code, is_correct) values (p_room_id, v_room.current_round, v_profile_id, p_code, v_correct);
  if not v_correct then return jsonb_build_object('correct', false, 'round', v_room.current_round); end if;
  v_gained := greatest(20, 100 - v_room.current_round * 3);
  update public.multiplayer_players set score = score + v_gained, codes_cracked = codes_cracked + 1 where room_id = p_room_id and profile_id = v_profile_id;
  if v_room.mode = 'first_to_crack' then
    update public.multiplayer_rounds set winner_profile_id = v_profile_id where room_id = p_room_id and round_number = v_room.current_round;
    if v_room.current_round + 1 >= v_room.rounds then update public.multiplayer_rooms set status = 'finished', finished_at = now() where id = p_room_id;
    else update public.multiplayer_rooms set status = 'round_won' where id = p_room_id; end if;
  else
    v_next_round := v_room.current_round + 1;
    if v_next_round >= v_room.rounds then
      update public.multiplayer_rooms set status = 'finished', finished_at = now(), deadline_at = null where id = p_room_id;
    else
      select * into v_next_puzzle from public.content_puzzles where active and (v_room.category = 'random' or category = v_room.category) order by random() limit 1;
      update public.multiplayer_rooms set status = 'playing', current_round = v_next_round, deadline_at = now() + interval '60 seconds' where id = p_room_id;
      insert into public.multiplayer_rounds(room_id, round_number, category, puzzle_id) values (p_room_id, v_next_round, coalesce(v_next_puzzle.category, 'Logic'), v_next_puzzle.id) on conflict (room_id, round_number) do update set category = excluded.category, puzzle_id = excluded.puzzle_id, winner_profile_id = null, started_at = now();
    end if;
  end if;
  return jsonb_build_object('correct', true, 'gained', v_gained, 'round', v_room.current_round);
end;
$$;
