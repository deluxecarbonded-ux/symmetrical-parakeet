-- Exotic: production-oriented schema for separated solo and multiplayer data.
-- This migration intentionally contains no demo users, rooms, purchases, or shop rows.
create extension if not exists pgcrypto;

create type public.game_scope as enum ('single', 'multi');
create type public.difficulty as enum ('easy', 'medium', 'hard');
create type public.multiplayer_mode as enum ('first_to_crack', 'time_attack');
create type public.room_status as enum ('lobby', 'playing', 'round_won', 'finished', 'cancelled');
create type public.purchase_status as enum ('pending', 'completed', 'refunded');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  avatar_url text,
  locale text not null default 'en' check (char_length(locale) between 2 and 12),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.single_player_profiles (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  handle text unique,
  current_difficulty public.difficulty not null default 'easy',
  total_score bigint not null default 0 check (total_score >= 0),
  codes_cracked integer not null default 0 check (codes_cracked >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.multiplayer_profiles (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  handle text unique,
  duels_won integer not null default 0 check (duels_won >= 0),
  duels_played integer not null default 0 check (duels_played >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.single_player_progress (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  difficulty public.difficulty not null,
  level smallint not null check (level between 1 and 30),
  completed boolean not null default false,
  best_score integer not null default 0 check (best_score >= 0),
  attempts integer not null default 0 check (attempts >= 0),
  best_time_ms integer check (best_time_ms is null or best_time_ms >= 0),
  solved_at timestamptz,
  primary key (profile_id, difficulty, level)
);

create table public.single_player_wallets (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  balance bigint not null default 0 check (balance >= 0),
  lifetime_earned bigint not null default 0 check (lifetime_earned >= 0),
  updated_at timestamptz not null default now()
);

create table public.multiplayer_wallets (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  balance bigint not null default 0 check (balance >= 0),
  lifetime_earned bigint not null default 0 check (lifetime_earned >= 0),
  updated_at timestamptz not null default now()
);

create table public.content_puzzles (
  id uuid primary key default gen_random_uuid(),
  difficulty public.difficulty not null,
  level smallint not null check (level between 1 and 30),
  category text not null check (category in ('Math', 'Logic', 'Riddle', 'Science', 'Trivia')),
  prompt text not null,
  clue_lines jsonb not null default '[]'::jsonb,
  answer_code text not null check (char_length(answer_code) between 1 and 64),
  answer_type text not null default 'digits' check (answer_type in ('digits', 'letters')),
  answer_key text,
  points integer not null default 40 check (points > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (difficulty, level)
);

create table public.shop_items (
  id text primary key,
  scope public.game_scope not null,
  name text not null,
  description text not null,
  price integer not null check (price > 0),
  item_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (id, scope)
);

create table public.single_player_inventory (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  item_id text not null references public.shop_items(id) on delete restrict,
  equipped boolean not null default false,
  acquired_at timestamptz not null default now(),
  primary key (profile_id, item_id)
);

create table public.multiplayer_inventory (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  item_id text not null references public.shop_items(id) on delete restrict,
  equipped boolean not null default false,
  acquired_at timestamptz not null default now(),
  primary key (profile_id, item_id)
);

create table public.shop_purchases (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  scope public.game_scope not null,
  item_id text not null references public.shop_items(id) on delete restrict,
  amount integer not null check (amount > 0),
  status public.purchase_status not null default 'completed',
  created_at timestamptz not null default now()
);

create table public.multiplayer_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9]{6}$'),
  host_profile_id uuid not null references public.profiles(id) on delete cascade,
  mode public.multiplayer_mode not null default 'first_to_crack',
  category text not null default 'random' check (category in ('random', 'Math', 'Logic', 'Riddle', 'Science', 'Trivia')),
  rounds smallint not null default 5 check (rounds between 1 and 30),
  status public.room_status not null default 'lobby',
  current_round smallint not null default 0 check (current_round >= 0),
  started_at timestamptz,
  deadline_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.multiplayer_players (
  room_id uuid not null references public.multiplayer_rooms(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  ready boolean not null default false,
  score integer not null default 0 check (score >= 0),
  codes_cracked integer not null default 0 check (codes_cracked >= 0),
  joined_at timestamptz not null default now(),
  primary key (room_id, profile_id)
);

create table public.multiplayer_rounds (
  room_id uuid not null references public.multiplayer_rooms(id) on delete cascade,
  round_number smallint not null check (round_number >= 0),
  category text not null,
  puzzle_id uuid references public.content_puzzles(id) on delete set null,
  started_at timestamptz not null default now(),
  winner_profile_id uuid references public.profiles(id) on delete set null,
  unique (room_id, round_number)
);

create table public.multiplayer_answers (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.multiplayer_rooms(id) on delete cascade,
  round_number smallint not null,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  submitted_code text not null check (char_length(submitted_code) between 1 and 64),
  is_correct boolean not null default false,
  response_ms integer check (response_ms is null or response_ms >= 0),
  created_at timestamptz not null default now()
);

create table public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  scope public.game_scope not null,
  amount integer not null,
  reason text not null,
  reference_id text,
  created_at timestamptz not null default now()
);

create table public.game_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  scope public.game_scope not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.translation_catalogs (
  id uuid primary key default gen_random_uuid(),
  locale text not null unique check (char_length(locale) between 2 and 12),
  label text not null,
  direction text not null default 'ltr' check (direction in ('ltr', 'rtl')),
  is_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.translation_entries (
  catalog_id uuid not null references public.translation_catalogs(id) on delete cascade,
  key text not null,
  value text not null,
  primary key (catalog_id, key)
);

create index single_progress_profile_idx on public.single_player_progress(profile_id, difficulty, level);
create index room_status_idx on public.multiplayer_rooms(status, created_at desc);
create index room_players_profile_idx on public.multiplayer_players(profile_id, joined_at desc);
create index answers_room_round_idx on public.multiplayer_answers(room_id, round_number, created_at);
create index events_profile_idx on public.game_events(profile_id, created_at desc);
create index translations_key_idx on public.translation_entries(key);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger single_profiles_updated_at before update on public.single_player_profiles for each row execute function public.set_updated_at();
create trigger multi_profiles_updated_at before update on public.multiplayer_profiles for each row execute function public.set_updated_at();
create trigger single_wallet_updated_at before update on public.single_player_wallets for each row execute function public.set_updated_at();
create trigger multi_wallet_updated_at before update on public.multiplayer_wallets for each row execute function public.set_updated_at();
create trigger room_updated_at before update on public.multiplayer_rooms for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, locale)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1), 'Player'), coalesce(new.raw_user_meta_data->>'locale', 'en'))
  on conflict (id) do nothing;
  insert into public.single_player_profiles (profile_id) values (new.id) on conflict do nothing;
  insert into public.multiplayer_profiles (profile_id) values (new.id) on conflict do nothing;
  insert into public.single_player_wallets (profile_id) values (new.id) on conflict do nothing;
  insert into public.multiplayer_wallets (profile_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.is_room_member(target_room uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.multiplayer_players where room_id = target_room and profile_id = auth.uid());
$$;

create or replace function public.is_room_host(target_room uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.multiplayer_rooms where id = target_room and host_profile_id = auth.uid());
$$;

create or replace function public.reward_single_win(p_difficulty public.difficulty, p_level smallint, p_score integer, p_attempts integer, p_time_ms integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  reward integer := greatest(1, p_score / 10);
  profile_id uuid := auth.uid();
begin
  if profile_id is null then raise exception 'Authentication required'; end if;
  if p_level < 1 or p_level > 30 then raise exception 'Invalid level'; end if;

  insert into public.single_player_progress(profile_id, difficulty, level, completed, best_score, attempts, best_time_ms, solved_at)
  values (profile_id, p_difficulty, p_level, true, greatest(0, p_score), greatest(0, p_attempts), greatest(0, p_time_ms), now())
  on conflict (profile_id, difficulty, level) do update set completed = true,
    best_score = greatest(public.single_player_progress.best_score, excluded.best_score),
    attempts = public.single_player_progress.attempts + excluded.attempts,
    best_time_ms = least(coalesce(public.single_player_progress.best_time_ms, excluded.best_time_ms), excluded.best_time_ms),
    solved_at = coalesce(public.single_player_progress.solved_at, excluded.solved_at);

  insert into public.single_player_wallets(profile_id, balance, lifetime_earned)
  values (profile_id, reward, reward)
  on conflict (profile_id) do update set balance = public.single_player_wallets.balance + reward, lifetime_earned = public.single_player_wallets.lifetime_earned + reward;
  insert into public.wallet_transactions(profile_id, scope, amount, reason, reference_id) values (profile_id, 'single', reward, 'single_win', p_level::text);
  insert into public.game_events(profile_id, scope, event_type, payload) values (profile_id, 'single', 'level_cleared', jsonb_build_object('difficulty', p_difficulty, 'level', p_level, 'score', p_score));
  return jsonb_build_object('reward', reward, 'balance', (select balance from public.single_player_wallets where profile_id = profile_id));
end;
$$;

create or replace function public.create_multiplayer_room(p_mode public.multiplayer_mode, p_rounds smallint, p_category text)
returns public.multiplayer_rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_id uuid := auth.uid();
  new_room public.multiplayer_rooms;
begin
  if profile_id is null then raise exception 'Authentication required'; end if;
  insert into public.multiplayer_rooms(code, host_profile_id, mode, category, rounds)
  values (upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6)), profile_id, p_mode, p_category, greatest(1, least(30, p_rounds)))
  returning * into new_room;
  insert into public.multiplayer_players(room_id, profile_id, display_name, ready)
  select new_room.id, profile_id, display_name, true from public.profiles where id = profile_id;
  return new_room;
end;
$$;

create or replace function public.join_multiplayer_room(p_code text)
returns public.multiplayer_rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_id uuid := auth.uid();
  target public.multiplayer_rooms;
  player_count integer;
begin
  if profile_id is null then raise exception 'Authentication required'; end if;
  select * into target from public.multiplayer_rooms where code = upper(trim(p_code)) and status = 'lobby' for update;
  if target.id is null then raise exception 'Room not found or already started'; end if;
  select count(*) into player_count from public.multiplayer_players where room_id = target.id;
  if player_count >= 4 and not exists (select 1 from public.multiplayer_players where room_id = target.id and profile_id = profile_id) then raise exception 'Room is full'; end if;
  insert into public.multiplayer_players(room_id, profile_id, display_name)
  select target.id, profile_id, display_name from public.profiles where id = profile_id
  on conflict (room_id, profile_id) do nothing;
  return target;
end;
$$;

create or replace function public.start_multiplayer_room(p_room_id uuid)
returns public.multiplayer_rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.multiplayer_rooms;
  profile_id uuid := auth.uid();
begin
  if profile_id is null or not exists (select 1 from public.multiplayer_rooms where id = p_room_id and host_profile_id = profile_id) then raise exception 'Host permission required'; end if;
  if (select count(*) from public.multiplayer_players where room_id = p_room_id and ready) < 2 then raise exception 'At least two ready players required'; end if;
  update public.multiplayer_rooms set status = 'playing', current_round = 0, started_at = now(), deadline_at = case when mode = 'time_attack' then now() + interval '60 seconds' else null end where id = p_room_id returning * into target;
  insert into public.multiplayer_rounds(room_id, round_number, category) values (p_room_id, 0, case when target.category = 'random' then 'Logic' else target.category end) on conflict do nothing;
  return target;
end;
$$;

create or replace function public.submit_multiplayer_answer(p_room_id uuid, p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_id uuid := auth.uid();
  target public.multiplayer_rooms;
  round_row public.multiplayer_rounds;
  puzzle_code text;
  is_correct boolean;
  gained integer;
begin
  if profile_id is null or not exists (select 1 from public.multiplayer_players where room_id = p_room_id and profile_id = profile_id) then raise exception 'Join the room first'; end if;
  select * into target from public.multiplayer_rooms where id = p_room_id and status in ('playing', 'round_won') for update;
  if target.id is null then raise exception 'Room is not accepting answers'; end if;
  select * into round_row from public.multiplayer_rounds where room_id = p_room_id and round_number = target.current_round;
  if round_row.puzzle_id is null then raise exception 'Round puzzle is not ready'; end if;
  select answer_code into puzzle_code from public.content_puzzles where id = round_row.puzzle_id and active;
  is_correct := p_code = puzzle_code;
  insert into public.multiplayer_answers(room_id, round_number, profile_id, submitted_code, is_correct) values (p_room_id, target.current_round, profile_id, p_code, is_correct);
  if not is_correct then return jsonb_build_object('correct', false, 'round', target.current_round); end if;
  gained := greatest(20, 100 - target.current_round * 3);
  update public.multiplayer_players set score = score + gained, codes_cracked = codes_cracked + 1 where room_id = p_room_id and profile_id = profile_id;
  if target.mode = 'first_to_crack' then
    update public.multiplayer_rounds set winner_profile_id = profile_id where room_id = p_room_id and round_number = target.current_round;
    if target.current_round + 1 >= target.rounds then update public.multiplayer_rooms set status = 'finished', finished_at = now() where id = p_room_id;
    else update public.multiplayer_rooms set status = 'round_won' where id = p_room_id; end if;
  end if;
  return jsonb_build_object('correct', true, 'gained', gained, 'round', target.current_round);
end;
$$;

create or replace function public.purchase_shop_item(p_scope public.game_scope, p_item_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_id uuid := auth.uid();
  item public.shop_items;
  wallet_balance bigint;
begin
  if profile_id is null then raise exception 'Authentication required'; end if;
  select * into item from public.shop_items where id = p_item_id and scope = p_scope and active for update;
  if item.id is null then raise exception 'Item not found'; end if;
  if p_scope = 'single' then
    if exists (select 1 from public.single_player_inventory where profile_id = profile_id and item_id = p_item_id) then raise exception 'Already owned'; end if;
    select balance into wallet_balance from public.single_player_wallets where profile_id = profile_id for update;
    if wallet_balance < item.price then raise exception 'Insufficient solo balance'; end if;
    update public.single_player_wallets set balance = balance - item.price where profile_id = profile_id;
    insert into public.single_player_inventory(profile_id, item_id) values (profile_id, p_item_id);
  else
    if exists (select 1 from public.multiplayer_inventory where profile_id = profile_id and item_id = p_item_id) then raise exception 'Already owned'; end if;
    select balance into wallet_balance from public.multiplayer_wallets where profile_id = profile_id for update;
    if wallet_balance < item.price then raise exception 'Insufficient duel balance'; end if;
    update public.multiplayer_wallets set balance = balance - item.price where profile_id = profile_id;
    insert into public.multiplayer_inventory(profile_id, item_id) values (profile_id, p_item_id);
  end if;
  insert into public.shop_purchases(profile_id, scope, item_id, amount) values (profile_id, p_scope, p_item_id, item.price);
  insert into public.wallet_transactions(profile_id, scope, amount, reason, reference_id) values (profile_id, p_scope, -item.price, 'shop_purchase', p_item_id);
  return jsonb_build_object('item_id', p_item_id, 'scope', p_scope, 'amount', item.price);
end;
$$;

-- Realtime is intentionally limited to room state, player state, answers, and events.
alter table public.multiplayer_rooms replica identity full;
alter table public.multiplayer_players replica identity full;
alter table public.multiplayer_rounds replica identity full;
alter publication supabase_realtime add table public.multiplayer_rooms;
alter publication supabase_realtime add table public.multiplayer_players;
alter publication supabase_realtime add table public.multiplayer_rounds;
alter publication supabase_realtime add table public.multiplayer_answers;
alter publication supabase_realtime add table public.game_events;

alter table public.profiles enable row level security;
alter table public.single_player_profiles enable row level security;
alter table public.multiplayer_profiles enable row level security;
alter table public.single_player_progress enable row level security;
alter table public.single_player_wallets enable row level security;
alter table public.multiplayer_wallets enable row level security;
alter table public.content_puzzles enable row level security;
alter table public.shop_items enable row level security;
alter table public.single_player_inventory enable row level security;
alter table public.multiplayer_inventory enable row level security;
alter table public.shop_purchases enable row level security;
alter table public.multiplayer_rooms enable row level security;
alter table public.multiplayer_players enable row level security;
alter table public.multiplayer_rounds enable row level security;
alter table public.multiplayer_answers enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.game_events enable row level security;
alter table public.translation_catalogs enable row level security;
alter table public.translation_entries enable row level security;

create policy profiles_select_self on public.profiles for select using (id = auth.uid());
create policy profiles_update_self on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy single_profile_all_self on public.single_player_profiles for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy multi_profile_all_self on public.multiplayer_profiles for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy single_progress_all_self on public.single_player_progress for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy single_wallet_all_self on public.single_player_wallets for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy multi_wallet_all_self on public.multiplayer_wallets for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy puzzles_authenticated_read on public.content_puzzles for select to authenticated using (active);
create policy shop_catalog_read on public.shop_items for select using (active);
create policy single_inventory_all_self on public.single_player_inventory for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy multi_inventory_all_self on public.multiplayer_inventory for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy purchases_all_self on public.shop_purchases for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy rooms_member_read on public.multiplayer_rooms for select using (public.is_room_member(id) or host_profile_id = auth.uid());
create policy rooms_host_insert on public.multiplayer_rooms for insert with check (host_profile_id = auth.uid());
create policy rooms_host_update on public.multiplayer_rooms for update using (host_profile_id = auth.uid()) with check (host_profile_id = auth.uid());
create policy room_players_member_read on public.multiplayer_players for select using (public.is_room_member(room_id) or profile_id = auth.uid());
create policy room_players_self_insert on public.multiplayer_players for insert with check (profile_id = auth.uid());
create policy room_players_self_update on public.multiplayer_players for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy rounds_member_read on public.multiplayer_rounds for select using (public.is_room_member(room_id));
create policy answers_member_read on public.multiplayer_answers for select using (public.is_room_member(room_id));
create policy answers_self_insert on public.multiplayer_answers for insert with check (profile_id = auth.uid() and public.is_room_member(room_id));
create policy wallet_tx_self_read on public.wallet_transactions for select using (profile_id = auth.uid());
create policy events_self_read on public.game_events for select using (profile_id = auth.uid());
create policy translation_catalog_public_read on public.translation_catalogs for select using (is_enabled);
create policy translation_entries_public_read on public.translation_entries for select using (exists (select 1 from public.translation_catalogs where id = catalog_id and is_enabled));

-- Never expose answer_code to a game client; only server-side game functions may read it.
revoke select (answer_code) on public.content_puzzles from anon, authenticated;

grant execute on function public.reward_single_win(public.difficulty, smallint, integer, integer, integer) to authenticated;
grant execute on function public.create_multiplayer_room(public.multiplayer_mode, smallint, text) to authenticated;
grant execute on function public.join_multiplayer_room(text) to authenticated;
grant execute on function public.start_multiplayer_room(uuid) to authenticated;
grant execute on function public.submit_multiplayer_answer(uuid, text) to authenticated;
grant execute on function public.purchase_shop_item(public.game_scope, text) to authenticated;
