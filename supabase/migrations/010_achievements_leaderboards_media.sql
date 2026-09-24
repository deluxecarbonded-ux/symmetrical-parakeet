-- Durable public identities, achievements, leaderboards, and profile media.
-- This migration never reads auth.users.email and never seeds users or activity.

begin;

-- ---------------------------------------------------------------------------
-- 1. Collision-safe public username backfill and identity synchronization
-- ---------------------------------------------------------------------------

create unique index if not exists profiles_username_lower_unique
  on public.profiles (lower(username))
  where username is not null;

-- Block concurrent profile creation while names and the two legacy handle
-- columns are synchronized. Any concurrent signup resumes after this commit.
lock table public.profiles in share row exclusive mode;
lock table public.single_player_profiles in share row exclusive mode;
lock table public.multiplayer_profiles in share row exclusive mode;
lock table public.multiplayer_players in share row exclusive mode;

update public.profiles
set username = lower(btrim(username))
where username is not null
  and username <> lower(btrim(username));

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_username_normalized_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_username_normalized_check
      check (username is null or username = lower(username));
  end if;
end;
$$;

create temporary table profile_username_backfill (
  profile_id uuid primary key,
  base_username text not null,
  final_username text
) on commit drop;

insert into pg_temp.profile_username_backfill (profile_id, base_username, final_username)
with candidates as (
  select
    profile.id as profile_id,
    case
      -- Existing public usernames are authoritative and are merely normalized.
      when profile.username is not null then lower(btrim(profile.username))
      -- New public names may use explicit auth metadata, but never the email.
      when char_length(metadata_username) between 3 and 24
        and metadata_username = btrim(metadata_username)
        and metadata_username !~ '[[:space:][:cntrl:]@:/]'
        then metadata_username
      when char_length(metadata_display_name) between 3 and 24
        and metadata_display_name = btrim(metadata_display_name)
        and metadata_display_name !~ '[[:space:][:cntrl:]@:/]'
        then metadata_display_name
      else 'player-' || substr(replace(profile.id::text, '-', ''), 1, 12)
    end as base_username,
    profile.username is null as needs_backfill
  from public.profiles as profile
  left join auth.users as auth_user on auth_user.id = profile.id
  cross join lateral (
    select
      nullif(lower(btrim(coalesce(auth_user.raw_user_meta_data->>'username', ''))), '') as metadata_username,
      nullif(lower(btrim(coalesce(auth_user.raw_user_meta_data->>'display_name', ''))), '') as metadata_display_name
  ) as metadata
)
select
  candidate.profile_id,
  candidate.base_username,
  case when candidate.needs_backfill then null else candidate.base_username end as final_username
from candidates as candidate;

-- Resolve every generated duplicate against both already assigned names and
-- all existing names. Sequential numeric suffixes make retries deterministic.
do $$
declare
  candidate_row record;
  candidate_username text;
  candidate_suffix text;
  assigned boolean;
  attempt integer;
begin
  for candidate_row in
    select backfill.profile_id, backfill.base_username
    from pg_temp.profile_username_backfill as backfill
    join public.profiles as profile on profile.id = backfill.profile_id
    where profile.username is null
    order by profile.created_at, profile.id
  loop
    assigned := false;
    candidate_username := candidate_row.base_username;

    for attempt in 1..1000000 loop
      if attempt > 1 then
        candidate_suffix := '-' || attempt::text;
        candidate_username := left(
          candidate_row.base_username,
          greatest(1, 24 - char_length(candidate_suffix))
        ) || candidate_suffix;
      end if;

      if not exists (
        select 1
        from pg_temp.profile_username_backfill as assigned_name
        where lower(assigned_name.final_username) = lower(candidate_username)
      ) then
        assigned := true;
        exit;
      end if;
    end loop;

    if not assigned then
      raise exception 'Could not allocate a unique public username';
    end if;

    update pg_temp.profile_username_backfill
    set final_username = candidate_username
    where profile_id = candidate_row.profile_id;
  end loop;
end;
$$;

update public.profiles as profile
set
  username = backfill.final_username,
  display_name = backfill.final_username
from pg_temp.profile_username_backfill as backfill
where backfill.profile_id = profile.id
  and (
    profile.username is distinct from backfill.final_username
    or profile.display_name is distinct from backfill.final_username
  );

alter table public.profiles
  alter column username set not null;

-- Clear first so legacy handles that were assigned to the wrong profile cannot
-- collide while the synchronized values are written back.
update public.single_player_profiles
set handle = null
where handle is not null;

update public.multiplayer_profiles
set handle = null
where handle is not null;

insert into public.single_player_profiles (profile_id, handle)
select profile.id, backfill.final_username
from public.profiles as profile
join pg_temp.profile_username_backfill as backfill on backfill.profile_id = profile.id
on conflict (profile_id) do update
set handle = excluded.handle;

insert into public.multiplayer_profiles (profile_id, handle)
select profile.id, backfill.final_username
from public.profiles as profile
join pg_temp.profile_username_backfill as backfill on backfill.profile_id = profile.id
on conflict (profile_id) do update
set handle = excluded.handle;

-- Multiplayer display names are snapshots, so synchronize existing snapshots
-- as well as the canonical profile name.
update public.multiplayer_players as player
set display_name = profile.username
from public.profiles as profile
where profile.id = player.profile_id
  and player.display_name is distinct from profile.username;

-- Future signups also receive a normalized, non-email-derived public name.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_username text;
  v_base_username text;
  v_candidate text;
  v_display_candidate text;
  v_locale text;
  v_attempt integer := 0;
  v_generated boolean;
begin
  v_username := nullif(lower(btrim(coalesce(new.raw_user_meta_data->>'username', ''))), '');
  v_generated := v_username is null;

  if v_username is not null
     and (
       char_length(v_username) < 3
       or char_length(v_username) > 24
       or v_username <> btrim(v_username)
       or v_username ~ '[[:space:][:cntrl:]]'
     ) then
    raise exception 'Invalid username';
  end if;

  if v_username is null then
    v_display_candidate := nullif(
      lower(btrim(coalesce(new.raw_user_meta_data->>'display_name', ''))),
      ''
    );
    if v_display_candidate is not null
       and char_length(v_display_candidate) between 3 and 24
       and v_display_candidate !~ '[[:space:][:cntrl:]@:/]' then
      v_username := v_display_candidate;
    else
      v_username := 'player-' || substr(replace(new.id::text, '-', ''), 1, 12);
    end if;
  end if;

  v_locale := left(coalesce(nullif(btrim(new.raw_user_meta_data->>'locale'), ''), 'en'), 12);
  if char_length(v_locale) not between 2 and 12 then
    v_locale := 'en';
  end if;

  if v_generated then
    v_base_username := v_username;
    loop
      v_attempt := v_attempt + 1;
      if v_attempt = 1 then
        v_candidate := v_base_username;
      else
        v_candidate := left(
          v_base_username,
          greatest(1, 24 - char_length('-' || v_attempt::text))
        ) || '-' || v_attempt::text;
      end if;

      begin
        insert into public.profiles (id, display_name, username, locale)
        values (new.id, v_candidate, v_candidate, v_locale)
        on conflict (id) do nothing;
        exit;
      exception when unique_violation then
        if v_attempt >= 1000000 then
          raise exception 'Could not allocate a unique public username';
        end if;
      end;
    end loop;
  else
    insert into public.profiles (id, display_name, username, locale)
    values (new.id, v_username, v_username, v_locale)
    on conflict (id) do nothing;
  end if;

  insert into public.single_player_profiles (profile_id, handle)
  values (new.id, (select username from public.profiles where id = new.id))
  on conflict (profile_id) do update
  set handle = excluded.handle;

  insert into public.multiplayer_profiles (profile_id, handle)
  values (new.id, (select username from public.profiles where id = new.id))
  on conflict (profile_id) do update
  set handle = excluded.handle;

  insert into public.single_player_wallets (profile_id)
  values (new.id)
  on conflict (profile_id) do nothing;

  insert into public.multiplayer_wallets (profile_id)
  values (new.id)
  on conflict (profile_id) do nothing;

  return new;
end;
$$;

create or replace function public.update_profile_username(p_username text)
returns public.profiles
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile_id uuid := auth.uid();
  v_username text;
  v_updated public.profiles;
begin
  if v_profile_id is null then
    raise exception 'Authentication required';
  end if;

  v_username := lower(btrim(coalesce(p_username, '')));
  if char_length(v_username) < 3
     or char_length(v_username) > 24
     or v_username = ''
     or v_username ~ '[[:space:][:cntrl:]]' then
    raise exception 'Invalid username';
  end if;

  if exists (
    select 1
    from public.profiles
    where lower(username) = v_username
      and id <> v_profile_id
  ) then
    raise exception 'Username already taken';
  end if;

  update public.profiles
  set username = v_username,
      display_name = v_username
  where id = v_profile_id
  returning * into v_updated;
  if v_updated.id is null then
    raise exception 'Profile not found';
  end if;

  update public.single_player_profiles
  set handle = v_username
  where profile_id = v_profile_id;

  update public.multiplayer_profiles
  set handle = v_username
  where profile_id = v_profile_id;

  update public.multiplayer_players
  set display_name = v_username
  where profile_id = v_profile_id;

  return v_updated;
end;
$$;

-- Add media metadata before projecting it into room snapshots.
alter table public.profiles
  add column if not exists avatar_bucket text,
  add column if not exists avatar_media_type text;

-- Keep room-time identity snapshots aligned with the canonical profile without
-- exposing the private profiles table to room members.
alter table public.multiplayer_players
  add column if not exists username text,
  add column if not exists avatar_url text,
  add column if not exists avatar_bucket text,
  add column if not exists avatar_media_type text;

update public.multiplayer_players as player
set username = profile.username,
    avatar_url = profile.avatar_url,
    avatar_bucket = profile.avatar_bucket,
    avatar_media_type = profile.avatar_media_type
from public.profiles as profile
where profile.id = player.profile_id
  and (
    player.username is distinct from profile.username
    or player.avatar_url is distinct from profile.avatar_url
    or player.avatar_bucket is distinct from profile.avatar_bucket
    or player.avatar_media_type is distinct from profile.avatar_media_type
  );

create or replace function public.sync_multiplayer_player_identity()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  select profile.username,
         profile.display_name,
         profile.avatar_url,
         profile.avatar_bucket,
         profile.avatar_media_type
  into new.username,
       new.display_name,
       new.avatar_url,
       new.avatar_bucket,
       new.avatar_media_type
  from public.profiles as profile
  where profile.id = new.profile_id;
  if new.username is null then
    raise exception 'Profile not found';
  end if;
  return new;
end;
$$;

drop trigger if exists multiplayer_player_identity_snapshot on public.multiplayer_players;
create trigger multiplayer_player_identity_snapshot
before insert or update of profile_id, username, display_name, avatar_url, avatar_bucket, avatar_media_type
on public.multiplayer_players
for each row execute function public.sync_multiplayer_player_identity();

create or replace function public.sync_profile_identity_to_room_players()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.multiplayer_players
  set username = new.username,
      display_name = new.display_name,
      avatar_url = new.avatar_url,
      avatar_bucket = new.avatar_bucket,
      avatar_media_type = new.avatar_media_type
  where profile_id = new.id;
  return new;
end;
$$;

drop trigger if exists profile_identity_room_snapshot on public.profiles;
create trigger profile_identity_room_snapshot
after update of username, display_name, avatar_url, avatar_bucket, avatar_media_type
on public.profiles
for each row execute function public.sync_profile_identity_to_room_players();

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

-- ---------------------------------------------------------------------------
-- 2. Achievement definitions and durable per-user progress
-- ---------------------------------------------------------------------------

create table if not exists public.achievement_definitions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  scope public.game_scope not null,
  metric text not null,
  target bigint not null check (target > 0),
  title_key text not null,
  description_key text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint achievement_definitions_metric_lowercase_check
    check (metric = lower(metric)),
  constraint achievement_definitions_scope_metric_check
    check (
      (
        scope = 'single'
        and metric in ('levels', 'codes', 'accuracy', 'speed', 'inventory', 'wallet', 'score')
      )
      or (
        scope = 'multi'
        and metric in ('matches', 'wins', 'win_rate', 'codes', 'accuracy', 'speed', 'inventory', 'wallet', 'score')
      )
    )
);

create table if not exists public.user_achievements (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  achievement_id uuid not null references public.achievement_definitions(id) on delete cascade,
  progress bigint not null default 0 check (progress >= 0),
  unlocked boolean not null default false,
  progressed_at timestamptz,
  unlocked_at timestamptz,
  last_evaluated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (profile_id, achievement_id),
  constraint user_achievements_progress_timestamp_check
    check (
      (progress = 0 and progressed_at is null)
      or (progress > 0 and progressed_at is not null)
    ),
  constraint user_achievements_unlock_timestamp_check
    check (
      (unlocked and unlocked_at is not null)
      or (not unlocked and unlocked_at is null)
    ),
  constraint user_achievements_unlocked_progress_check
    check (not unlocked or progress > 0)
);

create index if not exists achievement_definitions_scope_active_idx
  on public.achievement_definitions (scope, sort_order, key)
  where is_active;

create index if not exists user_achievements_achievement_idx
  on public.user_achievements (achievement_id);

create index if not exists multiplayer_answers_profile_stats_idx
  on public.multiplayer_answers (profile_id, is_correct, round_number);
create index if not exists single_profiles_leaderboard_score_idx
  on public.single_player_profiles (total_score desc, codes_cracked desc);
create index if not exists multi_profiles_leaderboard_wins_idx
  on public.multiplayer_profiles (duels_won desc, duels_played desc);

drop trigger if exists achievement_definitions_updated_at on public.achievement_definitions;
create trigger achievement_definitions_updated_at
before update on public.achievement_definitions
for each row execute function public.set_updated_at();

drop trigger if exists user_achievements_updated_at on public.user_achievements;
create trigger user_achievements_updated_at
before update on public.user_achievements
for each row execute function public.set_updated_at();

insert into public.achievement_definitions (
  key,
  scope,
  metric,
  target,
  title_key,
  description_key,
  sort_order,
  is_active
)
values
  ('single.first_crack', 'single', 'levels', 1,
   'achievements.single.first_crack.title', 'achievements.single.first_crack.description', 10, true),
  ('single.codebreaker', 'single', 'levels', 10,
   'achievements.single.codebreaker.title', 'achievements.single.codebreaker.description', 20, true),
  ('single.finisher', 'single', 'levels', 30,
   'achievements.single.finisher.title', 'achievements.single.finisher.description', 30, true),
  ('single.completionist', 'single', 'levels', 90,
   'achievements.single.completionist.title', 'achievements.single.completionist.description', 40, true),
  ('single.code_hunter', 'single', 'codes', 25,
   'achievements.single.code_hunter.title', 'achievements.single.code_hunter.description', 50, true),
  ('single.sharp_shooter', 'single', 'accuracy', 80,
   'achievements.single.sharp_shooter.title', 'achievements.single.sharp_shooter.description', 60, true),
  ('single.quick_thinker', 'single', 'speed', 1,
   'achievements.single.quick_thinker.title', 'achievements.single.quick_thinker.description', 70, true),
  ('single.speed_demon', 'single', 'speed', 10,
   'achievements.single.speed_demon.title', 'achievements.single.speed_demon.description', 80, true),
  ('single.collector', 'single', 'inventory', 3,
   'achievements.single.collector.title', 'achievements.single.collector.description', 90, true),
  ('single.treasurer', 'single', 'wallet', 500,
   'achievements.single.treasurer.title', 'achievements.single.treasurer.description', 100, true),
  ('single.high_scorer', 'single', 'score', 10000,
   'achievements.single.high_scorer.title', 'achievements.single.high_scorer.description', 110, true),
  ('multi.first_match', 'multi', 'matches', 1,
   'achievements.multi.first_match.title', 'achievements.multi.first_match.description', 10, true),
  ('multi.regular', 'multi', 'matches', 25,
   'achievements.multi.regular.title', 'achievements.multi.regular.description', 20, true),
  ('multi.first_win', 'multi', 'wins', 1,
   'achievements.multi.first_win.title', 'achievements.multi.first_win.description', 30, true),
  ('multi.champion', 'multi', 'wins', 10,
   'achievements.multi.champion.title', 'achievements.multi.champion.description', 40, true),
  ('multi.code_hunter', 'multi', 'codes', 25,
   'achievements.multi.code_hunter.title', 'achievements.multi.code_hunter.description', 50, true),
  ('multi.sharp_shooter', 'multi', 'accuracy', 75,
   'achievements.multi.sharp_shooter.title', 'achievements.multi.sharp_shooter.description', 60, true),
  ('multi.elite', 'multi', 'accuracy', 90,
   'achievements.multi.elite.title', 'achievements.multi.elite.description', 70, true),
  ('multi.high_scorer', 'multi', 'score', 1000,
   'achievements.multi.high_scorer.title', 'achievements.multi.high_scorer.description', 80, true),
  ('multi.score_machine', 'multi', 'score', 5000,
   'achievements.multi.score_machine.title', 'achievements.multi.score_machine.description', 90, true),
  ('multi.collector', 'multi', 'inventory', 3,
   'achievements.multi.collector.title', 'achievements.multi.collector.description', 100, true),
  ('multi.treasurer', 'multi', 'wallet', 300,
   'achievements.multi.treasurer.title', 'achievements.multi.treasurer.description', 110, true)
on conflict (key) do update
set
  scope = excluded.scope,
  metric = excluded.metric,
  target = excluded.target,
  title_key = excluded.title_key,
  description_key = excluded.description_key,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();

create or replace function public.reset_user_progress()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile_id uuid := auth.uid();
begin
  if v_profile_id is null then
    raise exception 'Authentication required';
  end if;
  delete from public.single_player_progress where profile_id = v_profile_id;
  delete from public.single_player_inventory where profile_id = v_profile_id;
  delete from public.multiplayer_inventory where profile_id = v_profile_id;
  delete from public.shop_purchases where profile_id = v_profile_id;
  delete from public.wallet_transactions where profile_id = v_profile_id;
  delete from public.game_events where profile_id = v_profile_id;
  delete from public.multiplayer_answers where profile_id = v_profile_id;
  delete from public.user_achievements where profile_id = v_profile_id;
  update public.single_player_wallets
    set balance = 0, lifetime_earned = 0
    where profile_id = v_profile_id;
  update public.multiplayer_wallets
    set balance = 0, lifetime_earned = 0
    where profile_id = v_profile_id;
  update public.single_player_profiles
    set total_score = 0, codes_cracked = 0
    where profile_id = v_profile_id;
  update public.multiplayer_profiles
    set duels_played = 0, duels_won = 0
    where profile_id = v_profile_id;
  return jsonb_build_object('reset', true);
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Authoritative, scope-isolated gameplay metrics
-- ---------------------------------------------------------------------------

-- Metric units:
--   levels       = completed persisted solo difficulty/level rows
--   codes        = authoritative solo code aggregate or correct multiplayer answers
--   accuracy     = integer percent from persisted attempts/answers
--   speed        = solo completions at or under 30 seconds
--   inventory    = owned items in the matching scope only
--   wallet       = matching wallet lifetime_earned (not spendable balance)
--   score        = matching authoritative score aggregate/derived answer score
--   matches/wins = matching multiplayer profile aggregates
create or replace function public.get_gameplay_metric(
  p_profile_id uuid,
  p_scope public.game_scope,
  p_metric text
)
returns bigint
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_metric text := lower(trim(coalesce(p_metric, '')));
  v_value bigint;
  v_completed bigint;
  v_attempts bigint;
  v_correct bigint;
  v_total bigint;
begin
  if p_profile_id is null or p_scope is null then
    raise exception 'Invalid gameplay metric request';
  end if;

  if p_scope = 'single' then
    if v_metric = 'levels' then
      select count(*)::bigint
      into v_value
      from public.single_player_progress
      where profile_id = p_profile_id and completed;
      return v_value;
    elsif v_metric = 'codes' then
      select coalesce(max(codes_cracked), 0)::bigint
      into v_value
      from public.single_player_profiles
      where profile_id = p_profile_id;
      return v_value;
    elsif v_metric = 'accuracy' then
      select
        count(*) filter (where completed)::bigint,
        coalesce(sum(attempts), 0)::bigint
      into v_completed, v_attempts
      from public.single_player_progress
      where profile_id = p_profile_id;

      v_attempts := greatest(v_attempts, v_completed);
      if v_attempts = 0 then
        return 0;
      end if;
      return least(100::bigint, (v_completed * 100::bigint) / v_attempts);
    elsif v_metric = 'speed' then
      select count(*)::bigint
      into v_value
      from public.single_player_progress
      where profile_id = p_profile_id
        and completed
        and best_time_ms between 0 and 30000;
      return v_value;
    elsif v_metric = 'inventory' then
      select count(*)::bigint
      into v_value
      from public.single_player_inventory
      where profile_id = p_profile_id;
      return v_value;
    elsif v_metric = 'wallet' then
      select coalesce(max(lifetime_earned), 0)::bigint
      into v_value
      from public.single_player_wallets
      where profile_id = p_profile_id;
      return v_value;
    elsif v_metric = 'score' then
      select coalesce(max(total_score), 0)::bigint
      into v_value
      from public.single_player_profiles
      where profile_id = p_profile_id;
      return v_value;
    end if;
  else
    if v_metric = 'matches' then
      select coalesce(max(duels_played), 0)::bigint
      into v_value
      from public.multiplayer_profiles
      where profile_id = p_profile_id;
      return v_value;
    elsif v_metric = 'wins' then
      select coalesce(max(duels_won), 0)::bigint
      into v_value
      from public.multiplayer_profiles
      where profile_id = p_profile_id;
      return v_value;
    elsif v_metric = 'win_rate' then
      select
        case
          when coalesce(max(duels_played), 0) = 0 then 0
          else least(
            100::bigint,
            (max(duels_won) * 100) / max(duels_played)
          )
        end
      into v_value
      from public.multiplayer_profiles
      where profile_id = p_profile_id;
      return v_value;
    elsif v_metric = 'codes' then
      select count(*)::bigint
      into v_value
      from public.multiplayer_answers
      where profile_id = p_profile_id and is_correct;
      return v_value;
    elsif v_metric = 'accuracy' then
      select
        count(*) filter (where is_correct)::bigint,
        count(*)::bigint
      into v_correct, v_total
      from public.multiplayer_answers
      where profile_id = p_profile_id;

      if v_total = 0 then
        return 0;
      end if;
      return least(100::bigint, (v_correct * 100::bigint) / v_total);
    elsif v_metric = 'speed' then
      select count(*)::bigint
      into v_value
      from public.multiplayer_answers
      where profile_id = p_profile_id
        and is_correct
        and response_ms between 0 and 10000;
      return v_value;
    elsif v_metric = 'inventory' then
      select count(*)::bigint
      into v_value
      from public.multiplayer_inventory
      where profile_id = p_profile_id;
      return v_value;
    elsif v_metric = 'wallet' then
      select coalesce(max(lifetime_earned), 0)::bigint
      into v_value
      from public.multiplayer_wallets
      where profile_id = p_profile_id;
      return v_value;
    elsif v_metric = 'score' then
      -- The server-awarded multiplayer value is durable even if a player later
      -- leaves the room and its multiplayer_players snapshot is removed.
      select coalesce(
        sum(greatest(20, 100 - (answer.round_number::integer * 3))::bigint),
        0::bigint
      )
      into v_value
      from public.multiplayer_answers as answer
      where answer.profile_id = p_profile_id and answer.is_correct;
      return v_value;
    end if;
  end if;

  raise exception 'Unsupported gameplay metric';
end;
$$;

create or replace function public.get_achievements(p_scope public.game_scope)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile_id uuid := auth.uid();
begin
  if v_profile_id is null then
    raise exception 'Authentication required';
  end if;

  with evaluated as (
    select
      definition.id as achievement_id,
      definition.target,
      least(
        definition.target,
        greatest(0::bigint, coalesce(measured.metric_value, 0::bigint))
      ) as progress,
      coalesce(measured.metric_value, 0::bigint) >= definition.target as unlocked
    from public.achievement_definitions as definition
    cross join lateral public.get_gameplay_metric(
      v_profile_id,
      definition.scope,
      definition.metric
    ) as measured(metric_value)
    where definition.scope = p_scope
      and definition.is_active
  )
  insert into public.user_achievements as current_achievement (
    profile_id,
    achievement_id,
    progress,
    unlocked,
    progressed_at,
    unlocked_at,
    last_evaluated_at
  )
  select
    v_profile_id,
    evaluated.achievement_id,
    evaluated.progress,
    evaluated.unlocked,
    case
      when evaluated.progress > 0 then now()
      else null
    end,
    case when evaluated.unlocked then now() else null end,
    now()
  from evaluated
  on conflict (profile_id, achievement_id) do update
  set
    progress = greatest(current_achievement.progress, excluded.progress),
    unlocked = current_achievement.unlocked or excluded.unlocked,
    progressed_at = case
      when excluded.progress > current_achievement.progress
        then coalesce(excluded.progressed_at, now())
      else current_achievement.progressed_at
    end,
    unlocked_at = coalesce(
      current_achievement.unlocked_at,
      case when excluded.unlocked then now() else null end
    ),
    last_evaluated_at = now(),
    updated_at = now();

  return coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'key', definition.key,
          'scope', definition.scope,
          'metric', definition.metric,
          'title_key', definition.title_key,
          'description_key', definition.description_key,
          'progress', current_achievement.progress,
          'target', definition.target,
          'unlocked', current_achievement.unlocked,
          'progressed_at', current_achievement.progressed_at,
          'unlocked_at', current_achievement.unlocked_at,
          'last_evaluated_at', current_achievement.last_evaluated_at
        )
        order by definition.sort_order, definition.key
      )
      from public.achievement_definitions as definition
      join public.user_achievements as current_achievement
        on current_achievement.achievement_id = definition.id
      where definition.scope = p_scope
        and definition.is_active
        and current_achievement.profile_id = v_profile_id
    ),
    '[]'::jsonb
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Safe leaderboard RPC
-- ---------------------------------------------------------------------------

create or replace function public.get_leaderboard(
  p_scope public.game_scope,
  p_metric text,
  p_limit integer default 100
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_metric text := lower(trim(coalesce(p_metric, '')));
  v_limit integer := least(100, greatest(1, coalesce(p_limit, 100)));
begin
  if p_scope is null then
    raise exception 'Invalid leaderboard scope';
  end if;

  if not (
    (
      p_scope = 'single'
      and v_metric in ('levels', 'codes', 'accuracy', 'speed', 'inventory', 'wallet', 'score')
    )
    or (
      p_scope = 'multi'
      and v_metric in ('matches', 'wins', 'win_rate', 'codes', 'accuracy', 'speed', 'inventory', 'wallet', 'score')
    )
  ) then
    raise exception 'Unsupported leaderboard metric';
  end if;

  return (
    with raw_profiles as (
      select
        profile.id as profile_id,
        coalesce(profile.username, profile.display_name, 'Player') as username,
        profile.avatar_bucket,
        profile.avatar_url,
        profile.avatar_media_type,
        coalesce(profile.id = (select auth.uid()), false) as is_current_user
      from public.profiles as profile
    ),
    computed as (
      select
        raw_profiles.*,
        case
          when raw_profiles.avatar_bucket in ('avatars', 'profile-media')
            and raw_profiles.avatar_url ~ '^[A-Za-z0-9._/-]+$'
            and char_length(raw_profiles.avatar_url) between 1 and 512
            and raw_profiles.avatar_url !~ '[[:cntrl:]]'
            and raw_profiles.avatar_url !~ '(^|/)\.\.?(/|$)'
            and split_part(raw_profiles.avatar_url, '/', 1) = raw_profiles.profile_id::text
            then raw_profiles.avatar_url
          else null
        end as avatar_path,
        raw_profiles.avatar_media_type,
        public.get_gameplay_metric(
          raw_profiles.profile_id,
          p_scope,
          v_metric
        ) as metric_value
      from raw_profiles
    ),
    ranked as (
      select
        row_number() over (
          order by metric_value desc, username asc, profile_id asc
        ) as rank,
        username,
        avatar_path,
        avatar_bucket,
        avatar_media_type,
        metric_value,
        is_current_user
      from computed
      where metric_value > 0 or is_current_user
    )
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'rank', ranked.rank,
          'username', ranked.username,
          'avatar_url', ranked.avatar_path,
          'avatar_path', ranked.avatar_path,
          'avatar_bucket', case
            when ranked.avatar_path is not null then ranked.avatar_bucket
            else null
          end,
          'avatar_media_type', case
            when ranked.avatar_path is not null then ranked.avatar_media_type
            else null
          end,
          'metric', v_metric,
          'value', ranked.metric_value,
          'is_current_user', ranked.is_current_user
        )
        order by ranked.rank
      ),
      '[]'::jsonb
    )
    from ranked
    where ranked.rank <= v_limit
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Profile media metadata, storage buckets, and upload verification
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists avatar_bucket text,
  add column if not exists avatar_media_type text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_avatar_bucket_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_avatar_bucket_check
      check (avatar_bucket is null or avatar_bucket in ('avatars', 'profile-media'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_avatar_media_type_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_avatar_media_type_check
      check (
        avatar_media_type is null
        or (
          avatar_media_type = lower(avatar_media_type)
          and (
            avatar_media_type like 'image/%'
            or avatar_media_type like 'video/%'
          )
        )
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_avatar_bucket_media_compatibility_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_avatar_bucket_media_compatibility_check
      check (
        avatar_bucket is null
        or avatar_media_type is null
        or (avatar_bucket = 'avatars' and avatar_media_type like 'image/%')
        or (avatar_bucket = 'profile-media' and avatar_media_type like 'video/%')
      );
  end if;
end;
$$;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values
  (
    'avatars',
    'avatars',
    true,
    26214400,
    null::text[]
  ),
  (
    'profile-media',
    'profile-media',
    true,
    26214400,
    null::text[]
  )
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists public_profile_media_read on storage.objects;
create policy public_profile_media_read
on storage.objects
for select
to public
using (bucket_id in ('avatars', 'profile-media'));

drop policy if exists authenticated_insert_own_profile_media on storage.objects;
create policy authenticated_insert_own_profile_media
on storage.objects
for insert
to authenticated
with check (
  bucket_id in ('avatars', 'profile-media')
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and name !~ '(^|/)\.\.?(/|$)'
  and name !~ '[[:cntrl:]]'
  and (
    lower(coalesce(metadata->>'mimetype', metadata->>'contentType', '')) like 'image/%'
    or lower(coalesce(metadata->>'mimetype', metadata->>'contentType', '')) like 'video/%'
  )
);

drop policy if exists authenticated_update_own_profile_media on storage.objects;
create policy authenticated_update_own_profile_media
on storage.objects
for update
to authenticated
using (
  bucket_id in ('avatars', 'profile-media')
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id in ('avatars', 'profile-media')
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and name !~ '(^|/)\.\.?(/|$)'
  and name !~ '[[:cntrl:]]'
  and (
    lower(coalesce(metadata->>'mimetype', metadata->>'contentType', '')) like 'image/%'
    or lower(coalesce(metadata->>'mimetype', metadata->>'contentType', '')) like 'video/%'
  )
);

drop policy if exists authenticated_delete_own_profile_media on storage.objects;
create policy authenticated_delete_own_profile_media
on storage.objects
for delete
to authenticated
using (
  bucket_id in ('avatars', 'profile-media')
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create or replace function public.update_profile_avatar(
  p_bucket text,
  p_path text,
  p_mime_type text
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile_id uuid := auth.uid();
  v_bucket text := lower(trim(coalesce(p_bucket, '')));
  v_path text := btrim(coalesce(p_path, ''));
  v_mime_type text := lower(trim(coalesce(p_mime_type, '')));
  v_object_metadata jsonb;
  v_object_size bigint;
  v_result jsonb;
begin
  if v_profile_id is null then
    raise exception 'Authentication required';
  end if;

  if v_bucket not in ('avatars', 'profile-media') then
    raise exception 'Invalid media bucket';
  end if;

  if char_length(v_path) between 1 and 512
     and v_path ~ '^[A-Za-z0-9._/-]+$'
     and v_path !~ '[[:cntrl:]]'
     and v_path !~ '(^|/)\.\.?(/|$)'
     and split_part(v_path, '/', 1) = v_profile_id::text then
    null;
  else
    raise exception 'Media path must be inside the authenticated user folder';
  end if;

  if v_mime_type not like 'image/%' and v_mime_type not like 'video/%' then
    raise exception 'Unsupported media MIME type';
  end if;

  if (v_bucket = 'avatars' and v_mime_type not like 'image/%')
     or (v_bucket = 'profile-media' and v_mime_type not like 'video/%') then
    raise exception 'Media MIME type does not match the bucket';
  end if;

  select object.metadata
  into v_object_metadata
  from storage.objects as object
  where object.bucket_id = v_bucket
    and object.name = v_path
  limit 1
  for share;

  if v_object_metadata is null then
    raise exception 'Uploaded media object was not found';
  end if;

  if lower(coalesce(
    v_object_metadata->>'mimetype',
    v_object_metadata->>'contentType',
    ''
  )) <> v_mime_type then
    raise exception 'Uploaded media MIME type does not match';
  end if;

  if v_object_metadata ? 'size' then
    if v_object_metadata->>'size' !~ '^[0-9]+$' then
      raise exception 'Invalid uploaded media size';
    end if;
    v_object_size := (v_object_metadata->>'size')::bigint;
    if v_object_size <= 0 or v_object_size > 26214400 then
      raise exception 'Profile media must be between 1 byte and 25MB';
    end if;
  end if;

  update public.profiles
  set
    avatar_url = v_path,
    avatar_bucket = v_bucket,
    avatar_media_type = v_mime_type
  where id = v_profile_id
  returning jsonb_build_object(
    'avatar_url', avatar_url,
    'avatar_bucket', avatar_bucket,
    'avatar_media_type', avatar_media_type
  ) into v_result;

  if v_result is null then
    raise exception 'Profile not found';
  end if;

  return v_result;
end;
$$;

-- get_app_state needs no replacement: its to_jsonb(profile) automatically
-- includes the new safe media columns. Achievement state remains explicit via
-- get_achievements(scope), avoiding a large state payload.

-- ---------------------------------------------------------------------------
-- 6. RLS and least-privilege RPC/table grants
-- ---------------------------------------------------------------------------

alter table public.achievement_definitions enable row level security;
alter table public.user_achievements enable row level security;

drop policy if exists achievement_definitions_public_read on public.achievement_definitions;
create policy achievement_definitions_public_read
on public.achievement_definitions
for select
to anon, authenticated
using (is_active);

drop policy if exists user_achievements_select_self on public.user_achievements;
create policy user_achievements_select_self
on public.user_achievements
for select
to authenticated
using (profile_id = (select auth.uid()));

revoke all on table public.achievement_definitions, public.user_achievements
  from anon, authenticated;
grant select on table public.achievement_definitions to anon, authenticated;
grant select on table public.user_achievements to authenticated;

revoke all on function public.update_profile_username(text)
  from public, anon;
revoke execute on function public.update_profile_display_name(text)
  from anon, authenticated;
revoke all on function public.get_gameplay_metric(uuid, public.game_scope, text)
  from public, anon, authenticated;
revoke all on function public.get_achievements(public.game_scope)
  from public, anon, authenticated;
revoke all on function public.get_leaderboard(public.game_scope, text, integer)
  from public, anon;
revoke all on function public.update_profile_avatar(text, text, text)
  from public, anon, authenticated;

grant execute on function public.update_profile_username(text)
  to authenticated;
grant execute on function public.get_achievements(public.game_scope)
  to authenticated;
grant execute on function public.get_leaderboard(public.game_scope, text, integer)
  to authenticated;
grant execute on function public.update_profile_avatar(text, text, text)
  to authenticated;

commit;
