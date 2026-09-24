-- A safe global invalidation signal keeps leaderboards live without exposing
-- private player rows or answer-bearing tables to every client.
begin;

create table if not exists public.leaderboard_revision (
  id boolean primary key default true check (id),
  revision bigint not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now()
);

insert into public.leaderboard_revision (id, revision)
values (true, 0)
on conflict (id) do nothing;

alter table public.leaderboard_revision enable row level security;
drop policy if exists leaderboard_revision_read on public.leaderboard_revision;
create policy leaderboard_revision_read
on public.leaderboard_revision
for select to anon, authenticated
using (true);
revoke insert, update, delete on public.leaderboard_revision from anon, authenticated;
grant select on public.leaderboard_revision to anon, authenticated;

alter table public.leaderboard_revision replica identity full;
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'leaderboard_revision'
  ) then
    alter publication supabase_realtime add table public.leaderboard_revision;
  end if;
end;
$$;

create or replace function public.bump_leaderboard_revision()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.leaderboard_revision
  set revision = revision + 1,
      updated_at = now()
  where id = true;
  return null;
end;
$$;

drop trigger if exists leaderboard_revision_profiles on public.profiles;
create trigger leaderboard_revision_profiles
after insert or update or delete on public.profiles
for each statement execute function public.bump_leaderboard_revision();

drop trigger if exists leaderboard_revision_single_profiles on public.single_player_profiles;
create trigger leaderboard_revision_single_profiles
after insert or update or delete on public.single_player_profiles
for each statement execute function public.bump_leaderboard_revision();

drop trigger if exists leaderboard_revision_multi_profiles on public.multiplayer_profiles;
create trigger leaderboard_revision_multi_profiles
after insert or update or delete on public.multiplayer_profiles
for each statement execute function public.bump_leaderboard_revision();

drop trigger if exists leaderboard_revision_single_progress on public.single_player_progress;
create trigger leaderboard_revision_single_progress
after insert or update or delete on public.single_player_progress
for each statement execute function public.bump_leaderboard_revision();

drop trigger if exists leaderboard_revision_multi_answers on public.multiplayer_answers;
create trigger leaderboard_revision_multi_answers
after insert or update or delete on public.multiplayer_answers
for each statement execute function public.bump_leaderboard_revision();

drop trigger if exists leaderboard_revision_multi_players on public.multiplayer_players;
create trigger leaderboard_revision_multi_players
after insert or update or delete on public.multiplayer_players
for each statement execute function public.bump_leaderboard_revision();

drop trigger if exists leaderboard_revision_single_wallet on public.single_player_wallets;
create trigger leaderboard_revision_single_wallet
after insert or update or delete on public.single_player_wallets
for each statement execute function public.bump_leaderboard_revision();

drop trigger if exists leaderboard_revision_multi_wallet on public.multiplayer_wallets;
create trigger leaderboard_revision_multi_wallet
after insert or update or delete on public.multiplayer_wallets
for each statement execute function public.bump_leaderboard_revision();

drop trigger if exists leaderboard_revision_single_inventory on public.single_player_inventory;
create trigger leaderboard_revision_single_inventory
after insert or update or delete on public.single_player_inventory
for each statement execute function public.bump_leaderboard_revision();

drop trigger if exists leaderboard_revision_multi_inventory on public.multiplayer_inventory;
create trigger leaderboard_revision_multi_inventory
after insert or update or delete on public.multiplayer_inventory
for each statement execute function public.bump_leaderboard_revision();

revoke execute on function public.bump_leaderboard_revision() from public, anon, authenticated;
grant execute on function public.bump_leaderboard_revision() to service_role;

commit;
